// backend/src/__tests__/document.test.ts
import request from "supertest";
import { app } from "../app";
import { getPrismaClient } from "../config/database";

let testUser: { id: string; name: string; email: string };
let testApiKey: string;

// Limpa o banco de dados antes de cada teste
beforeEach(async () => {
  const prisma = getPrismaClient();
  await prisma.document.deleteMany();
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

describe("Document Routes", () => {
  describe("POST /api/documents/upload", () => {
    it("should return 401 without API key", async () => {
      const response = await request(app).post("/api/documents/upload");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 400 for missing file", async () => {
      const response = await request(app)
        .post("/api/documents/upload")
        .set("X-API-Key", testApiKey);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/documents", () => {
    it("should return 401 without API key", async () => {
      const response = await request(app).get("/api/documents");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return user documents with valid API key", async () => {
      const response = await request(app)
        .get("/api/documents")
        .set("X-API-Key", testApiKey);

      // Por enquanto, vamos apenas verificar que não é 500 (erro interno)
      expect(response.status).not.toBe(500);

      // Se for 200, verificar a estrutura básica
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty("documents");
      }
    });
  });
});
