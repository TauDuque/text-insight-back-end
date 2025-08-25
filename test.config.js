// Configuração para testes
process.env.NODE_ENV = "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://test:test@localhost:5432/text_insight_test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379/1";
process.env.JWT_SECRET =
  process.env.JWT_SECRET || "test_jwt_secret_key_for_testing_only";
process.env.FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
