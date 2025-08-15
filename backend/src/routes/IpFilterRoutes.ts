import { Router } from 'express';
import IpFilterController from '../controllers/IpFilterController.js';

const router = Router();

router.post('/log-blocked-ip', IpFilterController.logBlockedIp);

export default router;
