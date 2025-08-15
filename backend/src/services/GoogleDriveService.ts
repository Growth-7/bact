import { google } from 'googleapis';
import { Readable } from 'stream';

export class GoogleDriveUploadResult {
  constructor(
    private readonly fileId: string,
    private readonly webViewLink: string
  ) {}

  getFileId(): string {
    return this.fileId;
  }

  getWebViewLink(): string {
    return this.webViewLink;
  }
}

export class GoogleDriveFileData {
  constructor(
    private readonly fileName: string,
    private readonly mimeType: string,
    private readonly buffer: Buffer
  ) {}

  getFileName(): string {
    return this.fileName;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getBuffer(): Buffer {
    return this.buffer;
  }
}

export class GoogleDriveService {
  private readonly folderId: string;
  private readonly auth: any;

  constructor() {
    this.folderId = this.validateAndProcessFolderId(process.env.GOOGLE_DRIVE_FOLDER_ID || '');
    const credentials = this.buildGoogleCredentials();

    this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive']
    });
  }

  async shareFolderWithUser(email: string): Promise<void> {
    const drive = google.drive({ version: 'v3', auth: this.auth });

    console.log(`[DEBUG] Tentando compartilhar a pasta com ID: "[${this.folderId}]"`);

    try {
      await drive.permissions.create({
        fileId: this.folderId, // Usa o ID da pasta validado no construtor
        supportsAllDrives: true,
        requestBody: {
          role: 'writer',
          type: 'user',
          emailAddress: email,
        },
        fields: 'id',
      });
      console.log(`Convite enviado para ${email} para a pasta ${this.folderId}`);
    } catch (error) {
      console.error(`Erro ao compartilhar a pasta ${this.folderId} com ${email}:`, error);
      if (error instanceof Error) {
        throw new Error(`Erro ao enviar convite do Google Drive: ${error.message}`);
      }
      throw new Error(`Erro desconhecido ao enviar convite do Google Drive: ${error}`);
    }
  }

  async uploadFile(fileData: GoogleDriveFileData): Promise<GoogleDriveUploadResult> {
    const drive = google.drive({ version: 'v3', auth: this.auth });

    const fileMetadata = {
      name: fileData.getFileName(),
      parents: [this.folderId]
    };

    const media = {
      mimeType: fileData.getMimeType(),
      body: this.createReadableStream(fileData.getBuffer())
    };

    try {
      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,webViewLink',
        supportsAllDrives: true
      });

      return this.createUploadResult(response);
    } catch (error) {
      console.error('Erro detalhado do Google Drive:', error);
      if (error instanceof Error) {
        throw new Error(`Erro ao fazer upload para Google Drive: ${error.message}`);
      }
      throw new Error(`Erro desconhecido ao fazer upload para Google Drive: ${error}`);
    }
  }

  private buildGoogleCredentials(): any {
    const privateKey = this.processPrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '');
    
    const credentials = {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL
    };

    this.validateCredentials(credentials);
    return credentials;
  }

  private processPrivateKey(privateKeyEnv: string): string {
    if (!privateKeyEnv) {
      throw new Error('A variável GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não está definida.');
    }

    let processedKey = privateKeyEnv;
    console.log('🔍 Processando chave privada. Tamanho original:', processedKey.length);

    // Remove aspas se estiverem presentes
    if (processedKey.startsWith('"') && processedKey.endsWith('"')) {
      processedKey = processedKey.slice(1, -1);
      console.log('✅ Removidas aspas duplas');
    }
    if (processedKey.startsWith("'") && processedKey.endsWith("'")) {
      processedKey = processedKey.slice(1, -1);
      console.log('✅ Removidas aspas simples');
    }

    // Tenta detectar se é Base64 (comum no Coolify/Docker)
    if (!processedKey.includes('-----BEGIN') && processedKey.length > 100 && /^[A-Za-z0-9+/=]+$/.test(processedKey)) {
      console.log('🔍 Detectado possível formato Base64, tentando decodificar...');
      try {
        const decoded = Buffer.from(processedKey, 'base64').toString('utf-8');
        if (decoded.includes('-----BEGIN PRIVATE KEY-----')) {
          processedKey = decoded;
          console.log('✅ Chave decodificada de Base64 com sucesso');
        }
      } catch (error) {
        console.log('⚠️  Falha ao decodificar Base64, continuando com formato original');
      }
    }

    // Tenta diferentes formatos de escape para compatibilidade entre ambientes
    if (processedKey.includes('\\\\n')) {
      // Formato com escape duplo (comum em variáveis de ambiente)
      processedKey = processedKey.replace(/\\\\n/g, '\n');
      console.log('✅ Convertido \\\\n para quebras de linha');
    } else if (processedKey.includes('\\n')) {
      // Formato com escape simples
      processedKey = processedKey.replace(/\\n/g, '\n');
      console.log('✅ Convertido \\n para quebras de linha');
    }
    
    // Se ainda não tem quebras de linha mas tem espaços, pode estar mal formatado
    if (!processedKey.includes('\n') && processedKey.length > 100) {
      console.log('🔍 Chave sem quebras de linha, tentando reformatar...');
      
      // Tenta reformatar assumindo que espaços foram usados no lugar de \n
      if (processedKey.includes('-----BEGIN PRIVATE KEY----- ') && processedKey.includes(' -----END PRIVATE KEY-----')) {
        console.log('✅ Detectado formato com espaços, reformatando...');
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
        console.log('✅ Chave reformatada com sucesso');
      }
    }

    // Garante que a chave tem o formato correto
    if (!processedKey.includes('-----BEGIN PRIVATE KEY-----')) {
      console.error('❌ Chave privada inválida. Primeiros 100 chars:', processedKey.substring(0, 100));
      console.error('❌ Contém BEGIN:', processedKey.includes('BEGIN'));
      console.error('❌ Contém PRIVATE:', processedKey.includes('PRIVATE'));
      console.error('❌ Tamanho total:', processedKey.length);
      throw new Error('Chave privada do Google Service Account tem formato inválido. Deve começar com -----BEGIN PRIVATE KEY-----');
    }

    if (!processedKey.includes('-----END PRIVATE KEY-----')) {
      console.error('❌ Chave privada inválida. Últimos 100 chars:', processedKey.substring(processedKey.length - 100));
      throw new Error('Chave privada do Google Service Account tem formato inválido. Deve terminar com -----END PRIVATE KEY-----');
    }

    // Remove espaços extras e normaliza quebras de linha
    processedKey = processedKey
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');

    console.log('✅ Chave processada com sucesso. Linhas:', processedKey.split('\n').length);
    return processedKey;
  }

  private validateCredentials(credentials: any): void {
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id', 'auth_uri', 'token_uri'
    ];

    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos obrigatórios do Google Service Account não definidos: ${missingFields.join(', ')}`);
    }

    console.log('✅ Todas as credenciais do Google Service Account estão definidas');
  }

  private createReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  private createUploadResult(response: any): GoogleDriveUploadResult {
    const fileId = response.data.id;
    const webViewLink = response.data.webViewLink;
    
    if (!fileId || !webViewLink) {
      throw new Error('Resposta inválida do Google Drive');
    }

    return new GoogleDriveUploadResult(fileId, webViewLink);
  }

  private validateAndProcessFolderId(folderId: string): string {
    if (!folderId) {
      throw new Error('A variável GOOGLE_DRIVE_FOLDER_ID não está definida.');
    }

    // Remove espaços e caracteres inválidos
    let processedId = folderId.trim();
    
    // Remove aspas se estiverem presentes
    if (processedId.startsWith('"') && processedId.endsWith('"')) {
      processedId = processedId.slice(1, -1);
    }
    if (processedId.startsWith("'") && processedId.endsWith("'")) {
      processedId = processedId.slice(1, -1);
    }

    // Remove um ponto final, que pode ser um erro de cópia
    if (processedId.endsWith('.')) {
      processedId = processedId.slice(0, -1);
    }

    // Verificar se não está duplicado (problema comum em variáveis de ambiente)
    if (processedId.includes('=')) {
      const parts = processedId.split('=');
      if (parts.length === 2 && parts[0] === parts[1]) {
        console.log('⚠️  [GoogleDriveService] ID da pasta estava duplicado, usando primeira parte');
        processedId = parts[0];
      }
    }

    // Validar formato básico do Google Drive ID
    if (processedId.length < 10 || processedId.includes(' ')) {
      throw new Error(`ID da pasta do Google Drive tem formato inválido: "${processedId}"`);
    }

    console.log('✅ [GoogleDriveService] ID da pasta do Google Drive validado:', processedId);
    return processedId;
  }
}