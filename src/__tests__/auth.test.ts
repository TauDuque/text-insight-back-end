// backend/src/__tests__/auth.test.ts
import request from "supertest";
import { app } from "../app"; // Importa a instância do app Express
import { getPrismaClient } from "../config/database";

// Limpa o banco de dados antes de cada teste para garantir isolamento
beforeEach(async () => {
  const prisma = getPrismaClient();
  await prisma.document.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();
});

// Desconecta do Prisma após todos os testes
afterAll(async () => {
  const prisma = getPrismaClient();
  await prisma.$disconnect();
});

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
    expect(response.body.data).toHaveProperty("apiKey");

    // Verifica se o usuário foi criado no banco
    const dbUser = await getPrismaClient().user.findUnique({
      where: { email: userData.email },
    });
    expect(dbUser).not.toBeNull();
  });

  it("should return status 400 if email is already in use", async () => {
    // Cria um usuário primeiro
    await getPrismaClient().user.create({
      data: {
        name: "Existing User",
        email: "existing@example.com",
        password: "HashedPass123", // Senha já hasheada para teste
      },
    });

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
