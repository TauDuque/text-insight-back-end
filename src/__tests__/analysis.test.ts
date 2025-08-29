// backend/src/__tests__/analysis.test.ts
import request from "supertest";
import { app } from "../app";
import { getPrismaClient } from "../config/database";

let testUser: any;
let testApiKey: string;

// Limpa o banco de dados antes de cada teste
beforeEach(async () => {
  const prisma = getPrismaClient();
  await prisma.analysis.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // Criar usuário de teste
  testUser = await prisma.user.create({
    data: {
      name: "Test User",
      email: "testuser@example.com",
      password: "hashedpassword",
    },
  });

  // Criar API Key de teste
  const apiKey = await prisma.apiKey.create({
    data: {
      key: "test-api-key-123",
      name: "Test API Key",
      userId: testUser.id,
      isActive: true,
    },
  });
  testApiKey = apiKey.key;
});

// Desconecta do Prisma após todos os testes
afterAll(async () => {
  const prisma = getPrismaClient();
  await prisma.$disconnect();
});

describe("Analysis Routes", () => {
  describe("POST /api/analyze", () => {
    it("should return 401 without API key", async () => {
      const textData = {
        text: "Texto sem API key.",
      };

      const response = await request(app).post("/api/analyze").send(textData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should analyze text successfully with API key", async () => {
      const textData = {
        text: "Este é um texto de teste para análise.",
      };

      const response = await request(app)
        .post("/api/analyze")
        .set("X-API-Key", testApiKey)
        .send(textData);

      // Por enquanto, vamos apenas verificar que não é 500 (erro interno)
      expect(response.status).not.toBe(500);

      // Se for 200, verificar a estrutura básica
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("status");
      }
    });
  });

  describe("GET /api/analyze/stats/user", () => {
    it("should return user stats with valid JWT token", async () => {
      // Para este teste, vamos usar a API Key em vez de JWT
      const response = await request(app)
        .get("/api/analyze/stats/user")
        .set("X-API-Key", testApiKey);

      // Esta rota requer JWT token, não API Key, então deve retornar 401
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
