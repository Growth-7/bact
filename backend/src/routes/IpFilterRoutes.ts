import { Router } from 'express';
import IpFilterController from '../controllers/IpFilterController';

const router = Router();

router.post('/log-blocked-ip', IpFilterController.logBlockedIp);

export default router;
