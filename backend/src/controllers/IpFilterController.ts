import { Request, Response } from 'express';
import { prisma } from '../config/DatabaseConnection.js';

class IpFilterController {
  public async logBlockedIp(req: Request, res: Response): Promise<void> {
    const { ipAddress } = req.body;

    if (!ipAddress) {
      res.status(400).json({ success: false, message: 'Endereço IP é obrigatório.' });
      return;
    }

    try {
      await prisma.blockedIp.create({
        data: {
          ipAddress,
        },
      });
      res.status(201).json({ success: true, message: 'IP bloqueado registrado com sucesso.' });
    } catch (error) {
      console.error('Erro ao registrar IP bloqueado:', error);
      res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }
}

export default new IpFilterController();
