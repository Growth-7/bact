import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import authRoutes from './routes/AuthRoutes.js';
import { handleSubmission } from './controllers/SubmissionController.js';
import { FileUploadMiddleware } from './middleware/FileUploadMiddleware.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upload middleware
const upload = FileUploadMiddleware.create();

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'BACT Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

app.post(
  '/api/submissions',
  upload.array('files', FileUploadMiddleware.MAX_FILES), // Aceita múltiplos arquivos
  handleSubmission
);

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    let errorMessage = 'Ocorreu um erro durante o upload do arquivo.';
    if (error.code === 'LIMIT_FILE_SIZE') {
      errorMessage = `Arquivo muito grande. O tamanho máximo permitido é ${process.env.MAX_FILE_SIZE_MB || 50}MB.`;
    } else if (error.code === 'LIMIT_FILE_COUNT') {
      errorMessage = `Muitos arquivos. O número máximo permitido é ${FileUploadMiddleware.MAX_FILES}.`;
    } else if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      errorMessage = 'Tipo de arquivo não esperado.';
    }
    return res.status(400).json({
      success: false,
      message: errorMessage,
      error: error.code,
    });
  }

  console.error('Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor',
    error: error.message
  });
});

// Só inicia o servidor se não estiver no ambiente Vercel
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`🚀 Servidor BACT rodando na porta ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/`);
  });
}

export default app;
