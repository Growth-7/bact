import { type Request, type Response } from 'express';
import { DatabaseService } from '../services/DatabaseService.js';

export class DashboardController {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async getStats(req: Request, res: Response): Promise<Response> {
    try {
      const [ranking, submissionsLast7Days, recentActivity] = await Promise.all([
        this.databaseService.getUserRanking(),
        this.databaseService.getSubmissionsLastNDays(7),
        this.databaseService.getRecentUserActivity(),
      ]);

      // Aqui você poderia adicionar a lógica de meta, se necessário

      return res.status(200).json({
        success: true,
        data: {
          ranking,
          submissionsLast7Days,
          recentActivity,
        },
      });

    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
  }
}
