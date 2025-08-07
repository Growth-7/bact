import multer from 'multer';

export class FileUploadMiddleware {
  private static readonly ALLOWED_MIME_TYPES = ['application/pdf'];
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  static readonly MAX_FILES = 20;

  static create() {
    const storage = multer.memoryStorage();
    
    return multer({
      storage: storage,
      limits: {
        fileSize: this.MAX_FILE_SIZE,
        files: this.MAX_FILES,
      },
      fileFilter: this.validateFile.bind(this),
    });
  }

  private static validateFile(req: any, file: Express.Multer.File, callback: multer.FileFilterCallback): void {
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      callback(new Error('Tipo de arquivo não permitido. Apenas PDFs são aceitos.'));
      return;
    }
    callback(null, true);
  }
}
