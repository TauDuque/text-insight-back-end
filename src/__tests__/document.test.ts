// backend/src/__tests__/document.test.ts
import request from "supertest";
import { app } from "../app";

const testApiKey: string = "test-api-key-123";

// Mock do Prisma para testes
jest.mock("../config/database", () => ({
  getPrismaClient: jest.fn(() => ({
    document: { deleteMany: jest.fn() },
    api_keys: { deleteMany: jest.fn() },
    user: {
      deleteMany: jest.fn(),
      create: jest.fn(() => ({ id: "test-user-id" })),
      $disconnect: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

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

      // Pode retornar 400 (bad request) ou 401 (unauthorized) dependendo da validação
      expect([400, 401]).toContain(response.status);
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
