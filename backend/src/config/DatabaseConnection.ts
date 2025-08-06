import { PrismaClient } from '@prisma/client';

export class DatabaseConnection {
  private static instance: PrismaClient | null = null;

  private constructor() {}

  static getInstance(): PrismaClient {
    if (this.instance === null) {
      this.instance = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      });
    }
    return this.instance;
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      const client = this.getInstance();
      await client.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Erro na conexão com banco de dados:', error);
      return false;
    }
  }
}
