// backend/src/__tests__/auth.test.ts
import request from "supertest";
import { app } from "../app"; // Importa a instância do app Express

// Mock do Prisma para testes
jest.mock("../config/database", () => ({
  getPrismaClient: jest.fn(() => ({
    document: { deleteMany: jest.fn() },
    api_keys: { deleteMany: jest.fn() },
    user: {
      deleteMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  })),
}));

describe("Auth Routes - POST /api/auth/register", () => {
  it("should register a new user successfully and return status 201", async () => {
    const userData = {
      name: "Test User",
      email: "newuser@example.com",
      password: "Password123",
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(userData);

    // Verifica a resposta da API
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data).toHaveProperty("token");

    // Verifica se o usuário foi criado no banco (mockado)
    expect(response.body.data.user).toBeDefined();
  });

  it("should return status 400 if email is already in use", async () => {
    // Cria um usuário primeiro (mockado)
    // O teste será baseado na resposta da API

    // Tenta registrar com o mesmo email
    const response = await request(app).post("/api/auth/register").send({
      name: "Another User",
      email: "existing@example.com",
      password: "AnotherPass123",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Email já está em uso");
  });
});
