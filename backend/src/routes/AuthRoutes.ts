import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.post('/register', (req, res) => authController.register(req, res));
authRoutes.post('/validate-ids', (req, res) => authController.validateIds(req, res));
authRoutes.get('/family-members/:familyId', (req, res) => authController.getFamilyMembers(req, res));

export default authRoutes;
