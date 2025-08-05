import multer from 'multer';

export class FileUploadMiddleware {
  private static readonly ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  static create() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage: storage,
      limits: {
        fileSize: this.MAX_FILE_SIZE
      },
      fileFilter: this.validateFile
    });
  }

  private static validateFile(req: any, file: Express.Multer.File, callback: multer.FileFilterCallback): void {
    if (!file) {
      callback(new Error('Arquivo é obrigatório'));
      return;
    }

    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(new Error('Tipo de arquivo não permitido'));
      return;
    }

    callback(null, true);
  }
}