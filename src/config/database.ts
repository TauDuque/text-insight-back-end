import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Função para conectar ao banco
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Banco de dados conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco:", error);
    process.exit(1);
  }
}

// Função para desconectar do banco
export async function disconnectDatabase() {
  await prisma.$disconnect();
}
