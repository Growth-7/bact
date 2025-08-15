import { type Request, type Response } from 'express';
import { google } from 'googleapis';
import axios from 'axios';
import { prisma } from '../config/DatabaseConnection.js';
import stream from 'stream';

// const prisma = DatabaseConnection.getInstance();

// (As funções processPrivateKeyForAuth, driveCredentials, auth, drive, validateAndProcessFolderId, PARENT_FOLDER_ID, getOrCreateFolder, e bufferToBase64 permanecem as mesmas)

// ... (cole aqui as funções auxiliares inalteradas)
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

function validateAndProcessFolderId(folderId: string): string {
  if (!folderId) {
    throw new Error('A variável GOOGLE_DRIVE_FOLDER_ID não está definida.');
  }

  let processedId = folderId.trim();
  
  if (processedId.startsWith('"') && processedId.endsWith('"')) {
    processedId = processedId.slice(1, -1);
  }
  if (processedId.startsWith("'") && processedId.endsWith("'")) {
    processedId = processedId.slice(1, -1);
  }

  if (processedId.includes('=')) {
    const parts = processedId.split('=');
    if (parts.length === 2 && parts[0] === parts[1]) {
      console.log('⚠️  ID da pasta estava duplicado, usando primeira parte');
      processedId = parts[0];
    }
  }

  if (processedId.length < 10 || processedId.includes(' ')) {
    throw new Error(`ID da pasta do Google Drive tem formato inválido: "${processedId}"`);
  }

  console.log('✅ ID da pasta do Google Drive validado:', processedId);
  return processedId;
}

const PARENT_FOLDER_ID = validateAndProcessFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID || '');

async function getOrCreateFolder(name: string, parentId: string): Promise<string> {
  console.log(`🔍 Procurando/criando pasta: "${name}" na pasta pai: "${parentId}"`);
  
  if (!name || !parentId) {
    throw new Error(`Parâmetros inválidos para getOrCreateFolder: name="${name}", parentId="${parentId}"`);
  }

  try {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${name}' and '${parentId}' in parents and trashed=false`;
    console.log(`🔍 Query do Google Drive: ${query}`);
    
    const { data } = await drive.files.list({ 
      q: query, 
      fields: 'files(id)', 
      supportsAllDrives: true, 
      includeItemsFromAllDrives: true 
    });
    
    if (data.files && data.files.length > 0) {
      const foundId = data.files[0]?.id || '';
      console.log(`✅ Pasta encontrada: "${name}" com ID: ${foundId}`);
      return foundId;
    }
    
    console.log(`📁 Pasta não encontrada, criando nova pasta: "${name}"`);
    const fileMetadata = { name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] };
    const { data: newFolder } = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id',
      supportsAllDrives: true,
    });
    
    const newId = newFolder.id!;
    console.log(`✅ Nova pasta criada: "${name}" com ID: ${newId}`);
    return newId;
    
  } catch (error) {
    console.error(`❌ Erro ao processar pasta "${name}" na pasta pai "${parentId}":`, error);
    
    if (error instanceof Error && error.message.includes('File not found')) {
      throw new Error(`A pasta pai com ID "${parentId}" não foi encontrada ou não é acessível.`);
    }
    
    throw error;
  }
}

function bufferToBase64(buffer: Buffer): string {
  return buffer.toString('base64');
}

// Retry simples em caso de 5xx (ex.: 502 Bitrix)
async function postWithRetry(url: string, data: any, attempts = 3): Promise<any> {
  let lastErr: any = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await axios.post(url, data, { timeout: 15000 });
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      if (status && status < 500) break; // não retry em 4xx
      await new Promise(r => setTimeout(r, 800 * (i + 1)));
    }
  }
  throw lastErr;
}

async function processSubmissionAsync(submissionId: string, body: any, files: Express.Multer.File[]): Promise<void> {
    const { submissionType, documentType, idFamilia, idRequerente, bitrixUserId, nomeFamilia, nomeRequerente, documentNature, documentoVinculado } = body;

    try {
        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: 'PROCESSING', statusDetails: 'Iniciando processamento...' },
        });

        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: 'UPLOADING_FILES', statusDetails: 'Criando pastas e enviando arquivos para o Google Drive...' },
        });

        const familiaFolderId = idFamilia ? await getOrCreateFolder(idFamilia, PARENT_FOLDER_ID) : PARENT_FOLDER_ID;

        let targetFolderId: string;
        if (submissionType === 'familia') {
            targetFolderId = await getOrCreateFolder(documentType, familiaFolderId);
        } else {
            const requerenteFolderId = idRequerente ? await getOrCreateFolder(idRequerente, familiaFolderId) : familiaFolderId;
            if (documentNature === 'Traduzido') {
                targetFolderId = await getOrCreateFolder('Traduzidos', requerenteFolderId);
            } else if (documentNature === 'Apostilado') {
                targetFolderId = await getOrCreateFolder('Apostilamentos', requerenteFolderId);
            } else {
                targetFolderId = requerenteFolderId;
            }
        }

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

        await prisma.submission.update({
            where: { id: submissionId },
            data: { fileUrls: uploadedFileUrls },
        });

        await prisma.submission.update({
            where: { id: submissionId },
            data: { status: 'CREATING_DEAL', statusDetails: 'Enviando informações para o CRM...' },
        });

        const BITRIX_WEBHOOK_URL = process.env.BITRIX_WEBHOOK_URL;
        if (!BITRIX_WEBHOOK_URL) throw new Error("Webhook do Bitrix24 não configurado.");

        const bitrixDealTitle = `${documentType} - ${submissionType === 'familia' ? nomeFamilia : nomeRequerente || nomeFamilia}`;

        const approxBytes = bitrixFiles.reduce((acc, f) => acc + (f.data?.length || 0), 0) * 0.75; // base64 -> bytes (~)
        const MAX_BYTES = Number(process.env.BITRIX_MAX_ATTACH_BYTES || 3_000_000); // ~3MB por segurança
        const shouldOmitAttachments = approxBytes > MAX_BYTES;

        const fields: any = {
          title: bitrixDealTitle,
          ufCrm48IdFamilia: String(idFamilia || ""),
          ufCrm48_IdRequerente: String(idRequerente || ""),
          ufCrm48LinkDrive: uploadedFileUrls,
          ufCrm48IdUsuario: Number(bitrixUserId),
        };
        if (documentNature === 'Traduzido') {
          fields.ufCrm48DocumentoTraduzido = bitrixFiles.map(f => [f.filename, f.data]);
        } else if (documentNature === 'Apostilado') {
          fields.ufCrm48DocumentoApostilado = bitrixFiles.map(f => [f.filename, f.data]);
        } else if (!shouldOmitAttachments) {
          fields.ufCrm48DocumentoScaneado = bitrixFiles.map(f => [f.filename, f.data]);
        } else {
          fields.ufCrm48DocumentoScaneado = [];
        }

        const webhookBase = BITRIX_WEBHOOK_URL.endsWith('/') ? BITRIX_WEBHOOK_URL : `${BITRIX_WEBHOOK_URL}/`;
        let bitrixDealId: string | null = null;
        let bitrixResponse;
        let wasUpdated = false;

        // 1. Tenta encontrar um card existente no Bitrix pelo ID do Requerente e Título
        console.log(`Buscando card existente no Bitrix para o requerente: ${idRequerente} e título: ${bitrixDealTitle}`);
        const listData = {
            entityTypeId: 1132,
            filter: {
                ufCrm48_IdRequerente: idRequerente,
                title: bitrixDealTitle,
            },
            select: ["id"]
        };
        const listResponse = await postWithRetry(`${webhookBase}crm.item.list.json`, listData);
        const existingItems = listResponse?.data?.result?.items;

        if (existingItems && existingItems.length > 0) {
            bitrixDealId = existingItems[0].id;
            console.log(`Card encontrado no Bitrix. ID: ${bitrixDealId}. Atualizando...`);
            wasUpdated = true;

            const updateData = {
                entityTypeId: 1132,
                id: bitrixDealId,
                fields,
            };
            bitrixResponse = await postWithRetry(`${webhookBase}crm.item.update.json`, updateData);
        } else {
            console.log('Nenhum card correspondente encontrado. Criando um novo card no Bitrix...');
            const createData = {
                entityTypeId: 1132,
                fields,
            };
            bitrixResponse = await postWithRetry(`${webhookBase}crm.item.add.json`, createData);
            bitrixDealId = bitrixResponse?.data?.result?.item?.id || bitrixResponse?.data?.result?.id || null;
        }

        const statusDetails = wasUpdated
            ? 'Concluído: o card existente no Bitrix24 foi atualizado com sucesso.'
            : 'Concluído: um novo card foi criado no Bitrix24.';

        await prisma.submission.update({
            where: { id: submissionId },
          data: {
              bitrixDealId: bitrixDealId ? String(bitrixDealId) : undefined,
              status: 'COMPLETED',
              statusDetails,
          },
        });

    } catch (error: any) {
        console.error(`[Processamento Assíncrono] Erro na submissão ${submissionId}:`, error);
        const errorMessage = error.response?.data?.error_description || error.message || 'Erro desconhecido';
        await prisma.submission.update({
            where: { id: submissionId },
            data: {
                status: 'FAILED',
                statusDetails: `Falha no processamento: ${errorMessage}`,
            },
        });
    }
}

export const handleSubmission = async (req: Request, res: Response) => {
    const { userId, location, submissionType, documentType, nomeFamilia, idFamilia, documentoVinculado, documentNature } = req.body;
    let { nomeRequerente, idRequerente } = req.body;

    if (!userId) {
        return res.status(400).json({ success: false, message: 'ID do usuário é obrigatório.' });
    }
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado.' });
    }

    // Se o tipo for 'familia', anula os dados do requerente
    if (submissionType === 'familia') {
        nomeRequerente = null;
        idRequerente = null;
    }

    try {
        const submission = await prisma.submission.create({
            data: {
                userId,
                location,
                submissionType,
                documentType: documentType || '',
                nomeFamilia: nomeFamilia || '',
                idFamilia: idFamilia || '',
                nomeRequerente,
                idRequerente,
                documentoVinculado,
                documentNature,
                fileUrls: [],
                status: 'PENDING',
                statusDetails: 'Aguardando início do processamento.',
            },
        });

        processSubmissionAsync(submission.id, req.body, files);

        res.status(202).json({
            success: true,
            message: 'Submissão recebida e está sendo processada.',
            submissionId: submission.id,
        });

    } catch (error) {
        console.error('Erro ao iniciar a submissão:', error);
        res.status(500).json({ success: false, message: 'Erro ao iniciar o processo de submissão.' });
    }
};

export const getSubmissionStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const submission = await prisma.submission.findUnique({
            where: { id },
            select: {
                id: true,
                status: true,
                statusDetails: true,
                bitrixDealId: true,
                fileUrls: true,
            },
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submissão não encontrada.' });
        }

        res.status(200).json({ success: true, data: submission });

    } catch (error) {
        console.error(`Erro ao buscar status da submissão ${id}:`, error);
        res.status(500).json({ success: false, message: 'Erro ao consultar o status da submissão.' });
    }
};

export const listFamilySubmissions = async (req: Request, res: Response) => {
    const { familyId } = req.params;
    try {
        // Tenta consulta case-insensitive via Prisma
        try {
            const submissions = await prisma.submission.findMany({
                where: {
                    status: 'COMPLETED',
                    idFamilia: { equals: familyId, mode: 'insensitive' as any },
                },
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    location: true,
                    submissionType: true,
                    documentType: true,
                    nomeFamilia: true,
                    idFamilia: true,
                    nomeRequerente: true,
                    idRequerente: true,
                    fileUrls: true,
                    createdAt: true,
                },
            });

            const mapped = submissions.map((s) => ({
                id: s.id,
                location: s.location as any,
                submissionType: s.submissionType as any,
                documentType: s.documentType,
                nomeFamilia: s.nomeFamilia || undefined,
                idFamilia: s.idFamilia || undefined,
                nomeRequerente: s.nomeRequerente || undefined,
                idRequerente: s.idRequerente || undefined,
                files: [],
                fileUrls: s.fileUrls,
                uploadDate: s.createdAt,
                category: s.submissionType === 'familia' ? 'family' : 'requester',
            }));

            return res.status(200).json({ success: true, data: mapped });
        } catch (e) {
            // Fallback: consulta RAW com LOWER/ILIKE
            const rows: any[] = await prisma.$queryRaw`
              SELECT "id", "location", "submissionType", "documentType", "nomeFamilia", "idFamilia", "nomeRequerente", "idRequerente", "fileUrls", "createdAt"
              FROM "Submission"
              WHERE LOWER("idFamilia") = LOWER(${familyId}) AND "status" = 'COMPLETED'
              ORDER BY "createdAt" DESC
            `;
            const mapped = rows.map((s: any) => ({
                id: s.id,
                location: s.location as any,
                submissionType: s.submissionType as any,
                documentType: s.documentType,
                nomeFamilia: s.nomeFamilia || undefined,
                idFamilia: s.idFamilia || undefined,
                nomeRequerente: s.nomeRequerente || undefined,
                idRequerente: s.idRequerente || undefined,
                files: [],
                fileUrls: s.fileUrls,
                uploadDate: s.createdAt,
                category: s.submissionType === 'familia' ? 'family' : 'requester',
            }));
            return res.status(200).json({ success: true, data: mapped });
        }
    } catch (error) {
        console.error('Erro ao listar submissões da família:', error);
        return res.status(500).json({ success: false, message: 'Erro ao listar submissões.' });
    }
};

export const getUserSubmissionStats = async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Parâmetro userId é obrigatório.' });
    }
    try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        const [total, today] = await Promise.all([
            prisma.submission.count({ where: { userId } }),
            prisma.submission.count({ where: { userId, createdAt: { gte: start, lte: end } } })
        ]);

        return res.status(200).json({ success: true, total, today });
    } catch (error) {
        console.error('Erro ao buscar estatísticas de envios do usuário:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar estatísticas.' });
    }
};

export const getUserWeeklyActivity = async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'Parâmetro userId é obrigatório.' });
    }
    try {
        // Últimos 7 dias incluindo hoje
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const rows: Array<{ day: Date; count: number }> = await prisma.$queryRaw`
          SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
          FROM "Submission"
          WHERE "userId" = ${userId} AND "createdAt" >= ${sevenDaysAgo}
          GROUP BY day
          ORDER BY day ASC
        `;

        // Normalizar para 7 pontos
        const map = new Map<string, number>();
        rows.forEach(r => map.set(new Date(r.day).toISOString().slice(0,10), r.count));
        const result: Array<{ day: string; count: number }> = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(sevenDaysAgo.getDate() + i);
            const key = d.toISOString().slice(0,10);
            result.push({ day: key, count: map.get(key) || 0 });
        }
        return res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Erro ao buscar atividade semanal:', error);
        return res.status(500).json({ success: false, message: 'Erro ao buscar atividade semanal.' });
    }
};

export const listUserFamilies = async (req: Request, res: Response) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ success: false, message: 'userId é obrigatório.' });
  try {
    const rows: Array<{ idFamilia: string | null; nomeFamilia: string | null; lastAt: Date; total: number }>
      = await prisma.$queryRaw`
        SELECT COALESCE("idFamilia", '') AS "idFamilia",
               COALESCE("nomeFamilia", '') AS "nomeFamilia",
               MAX("createdAt") AS "lastAt",
               COUNT(*)::int AS total
        FROM "Submission"
        WHERE "userId" = ${userId} AND COALESCE("idFamilia", '') <> ''
        GROUP BY COALESCE("idFamilia", ''), COALESCE("nomeFamilia", '')
        ORDER BY MAX("createdAt") DESC
      `;
    const data = rows.map(r => ({
      id: r.idFamilia || '',
      name: r.nomeFamilia && r.nomeFamilia.trim().length > 0 ? r.nomeFamilia : (r.idFamilia || ''),
      lastAt: r.lastAt,
      total: Number(r.total || 0),
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Erro ao listar famílias do usuário:', error);
    return res.status(500).json({ success: false, message: 'Erro ao listar famílias do usuário.' });
  }
};

export const markFamilyCompleted = async (req: Request, res: Response) => {
    const { familyId } = req.params;
    const { userId, familyName } = req.body as { userId?: string; familyName?: string };
    if (!familyId || !userId) {
        return res.status(400).json({ success: false, message: 'familyId e userId são obrigatórios.' });
    }
    try {
        const submission = await prisma.submission.create({
            data: {
                userId,
                location: 'alphaville',
                submissionType: 'familia',
                documentType: 'FAMILY_COMPLETED',
                nomeFamilia: familyName || '',
                idFamilia: familyId,
                nomeRequerente: null as any,
                idRequerente: null as any,
                fileUrls: [],
                status: 'COMPLETED',
                statusDetails: 'Família concluída manualmente.',
            },
        });
        return res.status(201).json({ success: true, id: submission.id });
    } catch (error) {
        console.error('Erro ao marcar família como concluída:', error);
        return res.status(500).json({ success: false, message: 'Erro ao marcar família como concluída.' });
    }
};

export const getUserSummary = async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: 'userId é obrigatório.' });
    try {
        const todayStart = new Date(); todayStart.setHours(0,0,0,0);
        const todayEnd = new Date(); todayEnd.setHours(23,59,59,999);

        const [totalSubmissions, todayCount] = await Promise.all([
            prisma.submission.count({ where: { userId } }),
            prisma.submission.count({ where: { userId, createdAt: { gte: todayStart, lte: todayEnd } } })
        ]);

        // Últimos 60 dias de atividade por dia
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 59);
        sixtyDaysAgo.setHours(0,0,0,0);
        const dailyRows: Array<{ day: Date; count: number }> = await prisma.$queryRaw`
          SELECT date_trunc('day', "createdAt") AS day, COUNT(*)::int AS count
          FROM "Submission"
          WHERE "userId" = ${userId} AND "createdAt" >= ${sixtyDaysAgo}
          GROUP BY day
          ORDER BY day ASC
        `;
        const dayMap = new Map<string, number>();
        dailyRows.forEach(r => dayMap.set(new Date(r.day).toISOString().slice(0,10), r.count));
        const todayKey = new Date().toISOString().slice(0,10);
        // weeklyData (últimos 7 dias)
        const weeklyData: Array<{ date: string; count: number }> = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate()-i); d.setHours(0,0,0,0);
            const k = d.toISOString().slice(0,10);
            weeklyData.push({ date: k, count: dayMap.get(k) || 0 });
        }
        // streaks (REMOVIDO - AGORA USAMOS APENAS CADENCE/HORA)
        const currentStreak = 0; 
        const longestStreak = 0;

        // Ranking com janela e posição exata + vizinhança (BASEADO EM HOJE)
        const [{ count: totalUsers }]: Array<{ count: number }> = await prisma.$queryRaw`
          SELECT COUNT(*)::int AS count FROM (
            SELECT "userId" FROM "Submission" 
            WHERE "createdAt" >= ${todayStart} AND "createdAt" <= ${todayEnd}
            GROUP BY "userId"
          ) t
        `;
        const neighbors: Array<{ id: string; username: string; total: number; r: number }> = await prisma.$queryRaw`
          WITH agg AS (
            SELECT u."id", u."username", COUNT(s.*)::int AS total
            FROM "Submission" s JOIN "User" u ON u."id" = s."userId"
            WHERE s."createdAt" >= ${todayStart} AND s."createdAt" <= ${todayEnd}
            GROUP BY u."id", u."username"
          ), ranked AS (
            SELECT id, username, total, (RANK() OVER (ORDER BY total DESC))::int AS r FROM agg
          ), me AS (
            SELECT r AS my_rank FROM ranked WHERE id = ${userId}
          )
          SELECT ranked.* FROM ranked, me WHERE ranked.r BETWEEN me.my_rank - 2 AND me.my_rank + 2 ORDER BY ranked.r ASC
        `;
        const my = neighbors.find(n => n.id === userId);
        const rank = my ? my.r : 0;
        const aroundRank = neighbors.map(n => ({
          id: n.id,
          username: n.username,
          totalSubmissions: n.total,
          rank: n.r,
          todayCount: 0,
          currentStreak: 0,
        }));

        // Top 3 geral (BASEADO EM HOJE)
        const topRows: Array<{ id: string; username: string; total: number }> = await prisma.$queryRaw`
          WITH agg AS (
            SELECT u."id", u."username", COUNT(s.*)::int AS total
            FROM "Submission" s JOIN "User" u ON u."id" = s."userId"
            WHERE s."createdAt" >= ${todayStart} AND s."createdAt" <= ${todayEnd}
            GROUP BY u."id", u."username"
          )
          SELECT * FROM agg ORDER BY total DESC LIMIT 3
        `;
        const topRank = topRows.map((r, idx) => ({
          id: r.id,
          username: r.username,
          totalSubmissions: r.total,
          rank: idx + 1,
          todayCount: 0,
          currentStreak: 0,
        }));

        // Daily goal fixo conforme solicitação
        const dailyGoal = 336;

        // Cadência por hora (Ofensiva baseada em consistência)
        // Horário de turno fixo (10:00-19:00 BRT) com ajuste de fuso horário.
        const SHIFT_START_HOUR_BRT = 10;
        const SHIFT_DURATION_HOURS = 9;
        const BRT_OFFSET_HOURS = -3;

        const now = new Date(); // Data/hora atual em UTC

        // Calcula o início e fim do turno em UTC
        const shiftStart = new Date(now);
        shiftStart.setUTCHours(SHIFT_START_HOUR_BRT - BRT_OFFSET_HOURS, 0, 0, 0);

        // Se a hora atual em UTC for antes do início do turno em UTC, o turno é do dia anterior.
        if (now < shiftStart) {
          shiftStart.setUTCDate(shiftStart.getUTCDate() - 1);
        }
        
        const shiftEnd = new Date(shiftStart);
        shiftEnd.setUTCHours(shiftStart.getUTCHours() + SHIFT_DURATION_HOURS);

        const withinShift = now >= shiftStart && now <= shiftEnd;
        
        let hoursElapsed = 0;
        if (withinShift) {
          hoursElapsed = Math.floor((now.getTime() - shiftStart.getTime()) / (1000 * 60 * 60)) + 1;
        }

        const perHourTarget = SHIFT_DURATION_HOURS > 0 ? dailyGoal / SHIFT_DURATION_HOURS : dailyGoal;
        const cumulativeExpected = Math.max(0, Math.min(dailyGoal, perHourTarget * hoursElapsed));

        // Contagem por hora da janela de trabalho
        let hourlyCounts: Array<{ hour: Date; count: number }> = [];
        if (withinShift) {
          hourlyCounts = await prisma.$queryRaw<Array<{ hour: Date; count: number }>>`
            SELECT date_trunc('hour', "createdAt") AS hour, COUNT(*)::int AS count
            FROM "Submission"
            WHERE "userId" = ${userId}
              AND "createdAt" >= ${shiftStart}
              AND "createdAt" <= ${shiftEnd}
            GROUP BY hour
            ORDER BY hour ASC
          `;
        }
        const hourToCount = new Map<string, number>();
        hourlyCounts.forEach(r => hourToCount.set(new Date(r.hour).toISOString(), r.count));
        const hourlySeries: number[] = [];
        for (let i = 0; i < SHIFT_DURATION_HOURS; i++) {
          const h = new Date(shiftStart);
          h.setUTCHours(shiftStart.getUTCHours() + i);
          const key = h.toISOString();
          hourlySeries.push(hourToCount.get(key) || 0);
        }
        // Streak/hora: consecutivo de horas mais recentes atendendo >= 90% da meta/h
        const threshold = Math.ceil(perHourTarget * 0.9);
        let cadenceStreakHours = 0;
        if (hoursElapsed > 0) {
          for (let i = hoursElapsed - 1; i >= 0; i--) {
            if (hourlySeries[i] >= threshold) cadenceStreakHours += 1;
            else break;
          }
        }
        const pacingDen = Math.max(1, Math.floor(cumulativeExpected));
        const pacingRatio = pacingDen > 0 ? Number((todayCount / pacingDen).toFixed(3)) : 0;
        let pacingStatus: 'ahead' | 'onTrack' | 'behind' | 'farBehind' = 'onTrack';
        if (pacingRatio >= 1.05) pacingStatus = 'ahead';
        else if (pacingRatio >= 0.9) pacingStatus = 'onTrack';
        else if (pacingRatio >= 0.6) pacingStatus = 'behind';
        else pacingStatus = 'farBehind';

        // Leaderboard (top N) (BASEADO EM HOJE)
        const leaderboardRows: Array<{ id: string; username: string; total: number; r: number }> = await prisma.$queryRaw`
          WITH agg AS (
            SELECT u."id", u."username", COUNT(s.*)::int AS total
            FROM "Submission" s JOIN "User" u ON u."id" = s."userId"
            WHERE s."createdAt" >= ${todayStart} AND s."createdAt" <= ${todayEnd}
            GROUP BY u."id", u."username"
          ), ranked AS (
            SELECT id, username, total, (RANK() OVER (ORDER BY total DESC))::int AS r FROM agg
          )
          SELECT * FROM ranked ORDER BY r ASC LIMIT 50
        `;

        // Últimas famílias do usuário (até 6 distintas)
        const recentFamiliesRows: Array<{ idFamilia: string; nomeFamilia: string | null; lastAt: Date }> = await prisma.$queryRaw`
          SELECT DISTINCT ON (LOWER("idFamilia")) "idFamilia", "nomeFamilia", MAX("createdAt") as "lastAt"
          FROM "Submission"
          WHERE "userId" = ${userId} AND COALESCE("idFamilia", '') <> ''
          GROUP BY LOWER("idFamilia"), "idFamilia", "nomeFamilia"
          ORDER BY LOWER("idFamilia"), MAX("createdAt") DESC
          LIMIT 6
        `;

        const payload = {
          totalSubmissions: Number(totalSubmissions) || 0,
          todayCount: Number(todayCount) || 0,
          currentStreak: Number(currentStreak) || 0, // MANTIDO POR COMPATIBILIDADE, MAS ZERADO
          longestStreak: Number(longestStreak) || 0, // MANTIDO POR COMPATIBILIDADE, MAS ZERADO
          dailyGoal: Number(dailyGoal) || 0,
          weeklyData: weeklyData.map(d => ({ date: d.date, count: Number(d.count) || 0 })),
          totalUsers: Number(totalUsers) || 0,
          rank: Number(rank) || 0,
          recentFamilies: recentFamiliesRows.map(r => ({
            id: r.idFamilia,
            name: r.nomeFamilia || r.idFamilia,
            lastAt: r.lastAt,
          })),
          // Cadência/hora
          perHourTarget: Number(perHourTarget) || 0,
          hoursElapsed: Number(hoursElapsed) || 0,
          cumulativeExpected: Math.floor(cumulativeExpected),
          hourlySeries: hourlySeries.map(n => Number(n) || 0),
          cadenceStreakHours: Number(cadenceStreakHours) || 0,
          pacingRatio: Number(pacingRatio) || 0,
          pacingStatus,
          aroundRank: aroundRank.map(r => ({
            id: r.id,
            username: r.username,
            totalSubmissions: Number((r as any).totalSubmissions ?? 0),
            rank: Number((r as any).rank ?? 0),
            todayCount: Number((r as any).todayCount ?? 0),
            currentStreak: Number((r as any).currentStreak ?? 0),
          })),
          topRank: topRank.map(r => ({
            id: r.id,
            username: r.username,
            totalSubmissions: Number(r.totalSubmissions || 0),
            rank: Number(r.rank || 0),
            todayCount: 0,
            currentStreak: 0,
          })),
          leaderboard: leaderboardRows.map(r => ({
            id: r.id,
            username: r.username,
            totalSubmissions: Number(r.total || 0),
            rank: Number(r.r || 0),
            todayCount: 0,
            currentStreak: 0,
          })),
        };
        return res.status(200).json({ success: true, data: payload });
    } catch (error) {
        console.error('Erro no summary do usuário:', error);
        return res.status(500).json({ success: false, message: 'Erro ao montar resumo.' });
    }
};

export const updateDailyGoal = async (req: Request, res: Response) => {
    // Meta fixa de 336/dia, não altera em produção
    return res.status(200).json({ success: true });
};