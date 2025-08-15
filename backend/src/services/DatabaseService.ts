import { PrismaClient, type User, type Submission, type SubmissionStatus } from '@prisma/client';
import { DatabaseConnection } from '../config/DatabaseConnection.js';
import { SubmissionData } from '../models/SubmissionData.js';
import { prisma } from '../config/DatabaseConnection.js';

export class DatabaseCreateResult {
  constructor(
    private readonly submissionId: string,
    private readonly success: boolean
  ) {}

  getSubmissionId(): string {
    return this.submissionId;
  }

  isSuccess(): boolean {
    return this.success;
  }
}

export class DatabaseService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = DatabaseConnection.getInstance();
  }

  async createUser(username: string, passwordHash: string, bitrixId: string): Promise<User> {
    try {
      const existingUser = await this.findUserByUsername(username);
      if (existingUser) {
        return existingUser;
      }

      const newUser = await this.prisma.user.create({
        data: {
          username: username,
          password: passwordHash,
          user_id_bitrix24: bitrixId
        }
      });

      return newUser;
    } catch (error) {
      throw new Error(`Erro ao criar usuário: ${error}`);
    }
  }

  async createSubmission(
    userId: string,
    submissionData: SubmissionData
  ): Promise<DatabaseCreateResult> {
    try {
      const submission = await this.prisma.submission.create({
        data: {
          location: submissionData.getLocation(),
          submissionType: submissionData.getSubmissionType(),
          documentType: submissionData.getDocumentType(),
          fileUrls: submissionData.getFileUrls(),
          bitrixDealId: submissionData.getBitrixDealId(),
          status: submissionData.getStatus() as SubmissionStatus, // Type assertion
          userId: userId,
          nomeFamilia: submissionData.getNomeFamilia(),
          idFamilia: submissionData.getIdFamilia(),
          nomeRequerente: submissionData.getNomeRequerente(),
          idRequerente: submissionData.getIdRequerente()
        }
      });

      return new DatabaseCreateResult(submission.id, true);
    } catch (error) {
      throw new Error(`Erro ao criar submissão: ${error}`);
    }
  }

  async updateSubmissionBitrixId(
    submissionId: string,
    bitrixDealId: string
  ): Promise<void> {
    try {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { bitrixDealId: bitrixDealId }
      });
    } catch (error) {
      throw new Error(`Erro ao atualizar ID do Bitrix: ${error}`);
    }
  }

  async updateSubmissionStatus(
    submissionId: string,
    status: SubmissionStatus // Alterado de string para SubmissionStatus
  ): Promise<void> {
    try {
      await this.prisma.submission.update({
        where: { id: submissionId },
        data: { status: status }
      });
    } catch (error) {
      throw new Error(`Erro ao atualizar status da submissão: ${error}`);
    }
  }

  async findSubmissionById(submissionId: string): Promise<Submission | null> {
    try {
      return await this.prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          user: true
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar submissão: ${error}`);
    }
  }

  async findSubmissionsByUserId(userId: string): Promise<Submission[]> {
    try {
      return await this.prisma.submission.findMany({
        where: { userId: userId },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } catch (error) {
      throw new Error(`Erro ao buscar submissões do usuário: ${error}`);
    }
  }

  private async findUserByUsername(username: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { username: username }
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Retorna o ranking de usuários baseado no número total de submissões.
   */
  async getUserRanking() {
    return prisma.$queryRaw`
      SELECT
        u.username,
        u.id as "userId",
        COUNT(s.id)::int as "submissionCount"
      FROM "User" u
      LEFT JOIN "Submission" s ON u.id = s."userId"
      GROUP BY u.id, u.username
      ORDER BY "submissionCount" DESC;
    `;
  }

  /**
   * Retorna a contagem de submissões por dia nos últimos N dias.
   * @param days O número de dias para olhar para trás.
   */
  async getSubmissionsLastNDays(days: number = 7) {
    return prisma.$queryRaw`
      SELECT
        DATE(s."createdAt")::date as date,
        COUNT(s.id)::int as count
      FROM "Submission" s
      WHERE s."createdAt" >= NOW() - (INTERVAL '1 day' * ${days})
      GROUP BY DATE(s."createdAt")
      ORDER BY date ASC;
    `;
  }

  /**
   * Retorna a atividade mais recente dos usuários.
   */
  async getRecentUserActivity() {
    return prisma.$queryRaw`
      WITH LastSubmission AS (
        SELECT
          s."userId",
          MAX(s."createdAt") as "lastActivity"
        FROM "Submission" s
        GROUP BY s."userId"
      )
      SELECT
        u.username,
        u.id as "userId",
        ls."lastActivity"
      FROM "User" u
      JOIN LastSubmission ls ON u.id = ls."userId"
      ORDER BY ls."lastActivity" DESC
      LIMIT 10;
    `;
  }
}
