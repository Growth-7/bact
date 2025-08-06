import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/AuthRoutes';
import { handleSubmission } from './controllers/SubmissionController';
import { FileUploadMiddleware } from './middleware/FileUploadMiddleware';

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
app.get('/', (req, res) => {
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
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
