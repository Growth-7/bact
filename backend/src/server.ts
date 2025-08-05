import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SubmissionController } from './controllers/SubmissionController';
import authRoutes from './routes/AuthRoutes';
import { FileUploadMiddleware } from './middleware/FileUploadMiddleware';
import { DatabaseConnection } from './config/DatabaseConnection';

dotenv.config();

const app = express();
const port = process.env.PORT || 3333;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Controllers
const submissionController = new SubmissionController();

// Upload middleware
const upload = FileUploadMiddleware.create();

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'BACT Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Database health check
app.get('/health/database', async (req, res) => {
  try {
    const isConnected = await DatabaseConnection.testConnection();
    res.json({
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      database: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.post('/api/submissions', 
  upload.single('file'), 
  (req, res) => submissionController.handleSubmission(req, res)
);

app.get('/api/submissions/user/:userId', 
  (req, res) => submissionController.getSubmissionsByUser(req, res)
);

app.get('/api/submissions/:submissionId', 
  (req, res) => submissionController.getSubmissionById(req, res)
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Recebido SIGTERM, encerrando graciosamente...');
  await DatabaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Recebido SIGINT, encerrando graciosamente...');
  await DatabaseConnection.disconnect();
  process.exit(0);
});

app.listen(port, () => {
  console.log(`🚀 Servidor BACT rodando na porta ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`🗄️  Database check: http://localhost:${port}/health/database`);
});
