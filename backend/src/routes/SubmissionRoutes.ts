import { Router } from 'express';
import { handleSubmission, getSubmissionStatus, listFamilySubmissions, getUserSubmissionStats, getUserWeeklyActivity, markFamilyCompleted, getUserSummary, updateDailyGoal } from '../controllers/SubmissionController.js';
import { FileUploadMiddleware } from '../middleware/FileUploadMiddleware.js';

const submissionRoutes = Router();
const upload = FileUploadMiddleware.create();

// Rota para criar uma nova submissão
submissionRoutes.post('/', upload.array('files', FileUploadMiddleware.MAX_FILES), handleSubmission);

// Rota para obter o status de uma submissão
submissionRoutes.get('/:id/status', getSubmissionStatus);

// Rota para listar submissões por família
submissionRoutes.get('/family/:familyId', listFamilySubmissions);

// Estatísticas por usuário
submissionRoutes.get('/user/:userId/stats', getUserSubmissionStats);
submissionRoutes.get('/user/:userId/weekly', getUserWeeklyActivity);
submissionRoutes.post('/family/:familyId/complete', markFamilyCompleted);
submissionRoutes.get('/user/:userId/summary', getUserSummary);
submissionRoutes.patch('/user/:userId/daily-goal', updateDailyGoal);

export default submissionRoutes;

