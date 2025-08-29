import { PrismaClient } from "@prisma/client";

// ✅ NO RAILWAY, AS VARIÁVEIS SÃO INJETADAS DIRETAMENTE NO process.env
// NÃO PRECISAMOS DE dotenv.config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Função para obter instância do Prisma (COMPLETAMENTE lazy)
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // ✅ VERIFICAR SE DATABASE_URL ESTÁ DEFINIDA
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não está definida no ambiente");
    }

    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return globalForPrisma.prisma;
}

// ✅ NÃO EXPORTAR prisma DIRETAMENTE - isso causa inicialização imediata!
// export const prisma = getPrismaClient(); ← REMOVIDO!

// ✅ REMOVIDO: globalForPrisma.prisma = prisma; (causava erro)

// Função para conectar ao banco
export async function connectDatabase() {
  try {
    // ✅ VERIFICAR VARIÁVEIS ANTES DE CONECTAR
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL não está definida no ambiente");
    }

    const prisma = getPrismaClient(); // ← Inicializar AQUI
    await prisma.$connect();
    console.log("✅ Banco de dados conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco:", error);
    process.exit(1);
  }
}

// Função para desconectar do banco
export async function disconnectDatabase() {
  const prisma = getPrismaClient(); // ← Obter instância AQUI
  await prisma.$disconnect();
}

// ✅ EXPORTAR APENAS A FUNÇÃO, NÃO A INSTÂNCIA
export { getPrismaClient };
