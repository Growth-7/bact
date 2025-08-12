import { PrismaClient } from '@prisma/client';

// Este objeto global garante que não haverá múltiplas instâncias do PrismaClient em desenvolvimento com hot-reloading.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export class DatabaseConnection {
  static getInstance(): PrismaClient {
    return prisma;
  }

  static async disconnect(): Promise<void> {
    await prisma.$disconnect();
  }

  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Erro na conexão com banco de dados:', error);
      return false;
    }
  }
}
