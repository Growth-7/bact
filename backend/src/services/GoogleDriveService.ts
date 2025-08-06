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
    this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    if (!this.folderId) {
      throw new Error('A variável de ambiente GOOGLE_DRIVE_FOLDER_ID não está definida.');
    }

    const credentials = {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL
    };

    this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
    });
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
        fields: 'id,webViewLink'
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
}

