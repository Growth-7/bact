import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import { authenticate, isAdmin } from '../middleware/AuthMiddleware.js';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', (req, res) => authController.login(req, res));
authRoutes.post('/register', (req, res) => authController.register(req, res));
authRoutes.post('/validate-ids', (req, res) => authController.validateIds(req, res));
authRoutes.get('/family-members/:familyId', (req, res) => authController.getFamilyMembers(req, res));
authRoutes.get('/families/search', (req, res) => authController.searchFamilies(req, res));
authRoutes.post('/requerente', (req, res) => authController.addRequerente(req, res));
authRoutes.post('/family', (req, res) => authController.addFamily(req, res));
authRoutes.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
authRoutes.post('/reset-password', (req, res) => authController.resetPassword(req, res));

// Rotas de administração de usuários
authRoutes.get('/users/pending', authenticate, isAdmin, (req, res) => authController.getPendingUsers(req, res));
authRoutes.get('/users', authenticate, isAdmin, (req, res) => authController.getAllUsers(req, res));
authRoutes.put('/users/:id/status', authenticate, isAdmin, (req, res) => authController.updateUserStatus(req, res));


export default authRoutes;
