import { PrismaClient } from "@prisma/client";

// ✅ NO RAILWAY, AS VARIÁVEIS SÃO INJETADAS DIRETAMENTE NO process.env
// NÃO PRECISAMOS DE dotenv.config()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// ✅ FUNÇÃO PARA CONSTRUIR DATABASE_URL A PARTIR DE VARIÁVEIS SEPARADAS
function buildDatabaseUrl(): string {
  // ✅ TENTAR DATABASE_URL COMPLETA PRIMEIRO (fallback)
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // ✅ CONSTRUIR A PARTIR DE VARIÁVEIS SEPARADAS
  const username = process.env.DB_USERNAME;
  const password = process.env.DB_PASSWORD;
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT;
  const database = process.env.DB_NAME;

  if (username && password && host && port && database) {
    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  // ✅ ERRO SE NENHUMA CONFIGURAÇÃO ESTIVER DISPONÍVEL
  throw new Error(
    "Configuração de banco não encontrada. Configure DATABASE_URL ou as variáveis DB_USERNAME, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME"
  );
}

// Função para obter instância do Prisma (COMPLETAMENTE lazy)
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    // ✅ CONSTRUIR DATABASE_URL DINAMICAMENTE
    const databaseUrl = buildDatabaseUrl();

    globalForPrisma.prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
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
    // ✅ CONSTRUIR DATABASE_URL DINAMICAMENTE
    const databaseUrl = buildDatabaseUrl();
    console.log(
      `🗄️ Conectando ao banco: ${databaseUrl.replace(/:[^:@]*@/, ":***@")}`
    );

    const prisma = getPrismaClient(); // ← Inicializar AQUI
    await prisma.$connect();
    console.log("✅ Banco de dados conectado");
  } catch (error) {
    console.error("❌ Erro ao conectar com o banco:", error);
    // ✅ NÃO PARAR A APLICAÇÃO - apenas logar o erro
    throw error;
  }
}

// Função para desconectar do banco
export async function disconnectDatabase() {
  const prisma = getPrismaClient(); // ← Obter instância AQUI
  await prisma.$disconnect();
}

// ✅ EXPORTAR APENAS A FUNÇÃO, NÃO A INSTÂNCIA
export { getPrismaClient };
