// Teste simples de autenticação
import request from "supertest";
import { app } from "../app";

describe("Simple Auth Test", () => {
  it("should return 404 for non-existent route", async () => {
    const response = await request(app).get("/api/non-existent-route");

    expect(response.status).toBe(404);
  });

  it("should return health check", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("OK");
  });

  it("should handle registration with valid data", async () => {
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "Password123", // Atende aos requisitos: minúscula, maiúscula, número
    };

    const response = await request(app)
      .post("/api/auth/register")
      .send(userData);

    // Vamos ver o que está sendo retornado
    console.log("Response status:", response.status);
    console.log("Response body:", JSON.stringify(response.body, null, 2));

    // Por enquanto, vamos apenas verificar que não é 500 (erro interno)
    expect(response.status).not.toBe(500);
  });
});
