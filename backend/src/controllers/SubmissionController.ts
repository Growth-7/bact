import { type Request, type Response } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { DatabaseConnection } from '../config/DatabaseConnection.js';
import { GoogleDriveService, GoogleDriveFileData } from '../services/GoogleDriveService.js';
import stream from 'stream';

const prisma = DatabaseConnection.getInstance();

// Função para processar chave privada com tratamento robusto de escape
function processPrivateKeyForAuth(privateKeyEnv: string): string {
  if (!privateKeyEnv) {
    throw new Error('A variável GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não está definida.');
  }

  let processedKey = privateKeyEnv;
  console.log('🔍 [SubmissionController] Processando chave privada. Tamanho:', processedKey.length);

  // Remove aspas se estiverem presentes
  if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
    processedKey = processedKey.slice(1, -1);
    console.log('✅ [SubmissionController] Removidas aspas duplas');
  }
  if (processedKey.startsWith("'") && processedKey.endsWith("'")) {
    processedKey = processedKey.slice(1, -1);
    console.log('✅ [SubmissionController] Removidas aspas simples');
  }

  // Tenta detectar se é Base64 (comum no Coolify/Docker)
  if (!processedKey.includes('-----BEGIN') && processedKey.length > 100 && /^[A-Za-z0-9+/=]+$/.test(processedKey)) {
    console.log('🔍 [SubmissionController] Detectado possível formato Base64, tentando decodificar...');
    try {
      const decoded = Buffer.from(processedKey, 'base64').toString('utf-8');
      if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
        processedKey = decoded;
        console.log('✅ [SubmissionController] Chave decodificada de Base64 com sucesso');
      }
    } catch (error) {
      console.log('⚠️  [SubmissionController] Falha ao decodificar Base64, continuando...');
    }
  }

  // Tenta diferentes formatos de escape para compatibilidade entre ambientes
  if (processedKey.includes('\\\\n')) {
    // Formato com escape duplo (comum em variáveis de ambiente)
    processedKey = processedKey.replace(/\\\\n/g, '\n');
    console.log('✅ [SubmissionController] Convertido \\\\n para quebras de linha');
  } else if (processedKey.includes('\\n')) {
    // Formato com escape simples
    processedKey = processedKey.replace(/\\n/g, '\n');
    console.log('✅ [SubmissionController] Convertido \\n para quebras de linha');
  }
  
  // Se ainda não tem quebras de linha mas tem espaços, pode estar mal formatado
  if (!processedKey.includes('\n') && processedKey.length > 100) {
    console.log('🔍 [SubmissionController] Chave sem quebras de linha, tentando reformatar...');
    
    // Tenta reformatar assumindo que espaços foram usados no lugar de \n
    if (processedKey.includes('-----BEGIN PRIVATE KEY----- ') && processedKey.includes(' -----END PRIVATE KEY-----')) {
      console.log('✅ [SubmissionController] Detectado formato com espaços, reformatando...');
      const parts = processedKey.split(' ');
      let reformatted = '';
      for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '-----BEGIN' && parts[i + 1] === 'PRIVATE' && parts[i + 2] === 'KEY-----') {
          reformatted += '-----BEGIN PRIVATE KEY-----\n';
          i += 2;
        } else if (parts[i] === '-----END' && parts[i + 1] === 'PRIVATE' && parts[i + 2] === 'KEY-----') {
          reformatted += '-----END PRIVATE KEY-----';
          i += 2;
        } else if (parts[i] && parts[i].length > 0) {
          reformatted += parts[i] + '\n';
        }
      }
      processedKey = reformatted;
      console.log('✅ [SubmissionController] Chave reformatada com sucesso');
    }
  }

  // Validação final
  if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    console.error('❌ [SubmissionController] Chave inválida. Primeiros 100 chars:', processedKey.substring(0, 100));
    throw new Error('Chave privada tem formato inválido. Deve começar com -----BEGIN PRIVATE KEY-----');
  }

  if (!processedKey.includes('-----END PRIVATE KEY-----')) {
    console.error('❌ [SubmissionController] Chave inválida. Últimos 100 chars:', processedKey.substring(processedKey.length - 100));
    throw new Error('Chave privada tem formato inválido. Deve terminar com -----END PRIVATE KEY-----');
  }

  // Remove espaços extras e normaliza quebras de linha
  processedKey = processedKey
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');

  console.log('✅ [SubmissionController] Chave processada com sucesso. Linhas:', processedKey.split('\n').length);
  return processedKey;
}

const driveCredentials = {
  type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
  project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: processPrivateKeyForAuth(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ''),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
  token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
};

const auth = new google.auth.GoogleAuth({
  credentials: driveCredentials,
  scopes: ['https://www.googleapis.com/auth/drive'],
});
const drive = google.drive({ version: 'v3', auth });
const PARENT_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
  const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
  const { data } = await drive.files.list({ q: query, fields: 'files(id)', supportsAllDrives: true, includeItemsFromAllDrives: true });
  if (data.files && data.files.length > 0) {
    return data.files[0]?.id || '';
  }
  const fileMetadata = { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
  const { data: newFolder } = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
    supportsAllDrives: true,
  });
  return newFolder.id!;
}

function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

export const handleSubmission = async (req: Request, res: Response) => {
  try {
    const { location, submissionType, documentType, nomeFamilia, idFamilia, nomeRequerente, idRequerente, userId, bitrixUserId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;
    if (!BITRIX_WEBHOOK_URL) {
      console.error("ERRO: A variável de ambiente BITRIX_WEBHOOK_URL não está definida.");
      return res.status(500).json({ success: false, message: 'Erro de configuração do servidor: Webhook do Bitrix24 não encontrado.' });
    }

    const familiaFolderId = idFamilia ? await getOrCreateFolder(idFamilia, PARENT_FOLDER_ID) : PARENT_FOLDER_ID;
    const targetFolderId = submissionType === 'requerente' && idRequerente ? await getOrCreateFolder(idRequerente, familiaFolderId) : familiaFolderId;

    const uploadedFileUrls: string[] = [];
    const bitrixFiles: { filename: string; data: string }[] = [];

    for (const file of files) {
      const bufferStream = new stream.PassThrough();
      bufferStream.end(file.buffer);
      const { data: uploadedFile } = await drive.files.create({
        requestBody: { name: file.originalname, parents: [targetFolderId] },
        media: { mimeType: file.mimetype, body: bufferStream },
        fields: 'webViewLink',
        supportsAllDrives: true,
      });
      if (uploadedFile.webViewLink) {
        uploadedFileUrls.push(uploadedFile.webViewLink);
      }
      bitrixFiles.push({ filename: file.originalname, data: bufferToBase64(file.buffer) });
    }

    const bitrixDealTitle = `${documentType} - ${nomeFamilia || nomeRequerente}`;
    if (!bitrixUserId) {
      throw new Error('ID do usuário do Bitrix24 é obrigatório');
    }
    if (!idFamilia) {
      throw new Error('ID da família é obrigatório');
    }
    if (!bitrixFiles.length) {
      throw new Error('Nenhum arquivo foi processado corretamente');
    }
    if (!uploadedFileUrls.length) {
      throw new Error('Nenhum arquivo foi enviado para o Google Drive');
    }

    const bitrixData = {
      entityTypeId: 1132,
      fields: {
        title: bitrixDealTitle,
        ufCrm48IdFamilia: String(idFamilia || ""),
        ufCrm48IdRequerente: String(idRequerente || ""),
        ufCrm48LinkDrive: uploadedFileUrls,
        ufCrm48IdUsuario: Number(bitrixUserId),
        ufCrm48DocumentoScaneado: bitrixFiles.map(file => [
          file.filename,
          file.data
        ])
      }
    };

    const bitrixResponse = await axios.post(`${BITRIX_WEBHOOK_URL}crm.item.add.json`, bitrixData);
    
    const bitrixDealId = bitrixResponse.data.result.item.id;

    const submission = await prisma.submission.create({
      data: {
        location,
        submissionType,
        documentType: documentType || '',
        nomeFamilia: nomeFamilia || '',
        idFamilia: idFamilia || '',
        nomeRequerente,
        idRequerente,
        fileUrls: uploadedFileUrls,
        bitrixDealId: bitrixDealId.toString(),
        userId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Submissão processada com sucesso!',
      submissionId: submission.id,
      bitrixDealId,
      driveLinks: uploadedFileUrls,
    });
  } catch (error) {
    console.error('Erro detalhado na submissão:', error);
    let errorMessage = 'Erro desconhecido';
    if (axios.isAxiosError(error)) {
      errorMessage = JSON.stringify(error.response?.data) || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: errorMessage });
  }
};