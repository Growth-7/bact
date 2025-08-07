import { Router } from 'express';
import { handleSubmission, getSubmissionStatus } from '../controllers/SubmissionController.js';
import { FileUploadMiddleware } from '../middleware/FileUploadMiddleware.js';

const submissionRoutes = Router();
const upload = FileUploadMiddleware.create();

// Rota para criar uma nova submissão
submissionRoutes.post('/', upload.array('files', FileUploadMiddleware.MAX_FILES), handleSubmission);

// Rota para obter o status de uma submissão
submissionRoutes.get('/:id/status', getSubmissionStatus);

export default submissionRoutes;

