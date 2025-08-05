import type { Request, Response } from 'express';
const { google } = require('googleapis');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const stream = require('stream');

const prisma = new PrismaClient();

// Garante que todas as credenciais necessárias estão presentes
const driveCredentials = {
  type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || '',
  project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID || '',
  private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID || '',
  private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL || '',
  client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID || '',
  auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI || '',
  token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI || '',
  auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL || '',
  client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL || '',
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

const handleSubmission = async (req: Request, res: Response) => {
  try {
    const { location, submissionType, documentType, nomeFamilia, idFamilia, nomeRequerente, idRequerente, userId, bitrixUserId } = req.body;
    
    // Validate userId
      if (!userId) {
      return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório.' });
    }

    // Check if user exists
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

    // --- Validação de Variáveis de Ambiente ---
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
    // Validação dos campos obrigatórios
    if (!bitrixUserId) {
      throw new Error('ID do usuário do Bitrix24 é obrigatório');
    }

    if (!idFamilia) {
      throw new Error('ID da família é obrigatório');
    }

    // Verifica se há arquivos convertidos
    if (!bitrixFiles.length) {
      throw new Error('Nenhum arquivo foi processado corretamente');
    }

    // Verifica se há URLs do Drive
    if (!uploadedFileUrls.length) {
      throw new Error('Nenhum arquivo foi enviado para o Google Drive');
    }

    // Log dos dados antes do envio
    console.log('Dados a serem enviados para o Bitrix24:', {
      idFamilia,
      idRequerente,
      bitrixUserId,
      uploadedFileUrls,
      bitrixFiles: bitrixFiles.length
    });

    // Prepara os dados com aspas duplas
    const bitrixData = {
      entityTypeId: 1132,
      fields: {
        title: bitrixDealTitle,
        // String type
        ufCrm48IdFamilia: String(idFamilia || ""),
        // String type
        ufCrm48IdRequerente: String(idRequerente || ""),
        // URL type, multiple
        ufCrm48LinkDrive: uploadedFileUrls,
        // Employee type
        ufCrm48IdUsuario: Number(bitrixUserId),
        // File type, multiple - formato específico do Bitrix24 para arquivos
        // Formato correto para múltiplos arquivos: [["nome_arquivo", "conteudo_base64"], ...]
        ufCrm48DocumentoScaneado: bitrixFiles.map(file => [
          file.filename,  // nome do arquivo
          file.data      // conteúdo em base64
        ])
      }
    };

    // Log da requisição para o Bitrix24
    console.log('Requisição para o Bitrix24:', {
      url: `${BITRIX_WEBHOOK_URL}crm.item.add.json`,
      entityTypeId: bitrixData.entityTypeId,
      fields: {
        ...bitrixData.fields,
        ufCrm48DocumentoScaneado: bitrixFiles.map(file => ({
          name: file.filename,
          size: Buffer.from(file.data, "base64").length + " bytes",
          format: "[nome_arquivo, conteudo_base64]"
        })),
        ufCrm48LinkDrive: uploadedFileUrls
      }
    });

    // Faz a requisição para o Bitrix24
    const bitrixResponse = await axios.post(`${BITRIX_WEBHOOK_URL}crm.item.add.json`, bitrixData);
    
    // Log da resposta do Bitrix24
    console.log('Resposta do Bitrix24:', {
      status: bitrixResponse.status,
      data: bitrixResponse.data
    });

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
      errorMessage = error.response?.data || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    res.status(500).json({ success: false, message: 'Erro interno do servidor.', error: errorMessage });
  }
};

module.exports = { handleSubmission };
