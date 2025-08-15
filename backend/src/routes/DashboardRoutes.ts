import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { authenticate, isAdmin } from '../middleware/AuthMiddleware.js';

const dashboardRoutes = Router();
const dashboardController = new DashboardController();

dashboardRoutes.get('/stats', authenticate, isAdmin, (req, res) => dashboardController.getStats(req, res));

export default dashboardRoutes;
