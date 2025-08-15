import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { ipWhitelistAuth } from './middleware/IpWhitelistMiddleware.js';
import multer from 'multer';
import authRoutes from './routes/AuthRoutes.js';
import submissionRoutes from './routes/SubmissionRoutes.js'; // Importar as novas rotas
import dashboardRoutes from './routes/DashboardRoutes.js';
import ipFilterRoutes from './routes/IpFilterRoutes.js'; // Importar rotas de filtro de IP
import { FileUploadMiddleware } from './middleware/FileUploadMiddleware.js';

const app = express();
app.set('trust proxy', true);
const port = process.env.PORT || 3333;

// Middleware
app.use(ipWhitelistAuth);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'BACT Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/submissions', submissionRoutes); // Usar as rotas de submissão
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/security', ipFilterRoutes); // Usar rotas de filtro de IP

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

// Inicia o servidor quando não estiver em ambiente serverless (Vercel)
// Em Docker/produção, NODE_ENV=production e precisamos iniciar o servidor.
if (process.env.VERCEL !== '1') {
  app.listen(port, () => {
    console.log(`🚀 Servidor BACT rodando na porta ${port}`);
    console.log(`🔗 Health check: http://localhost:${port}/`);
  });
}

export default app;
