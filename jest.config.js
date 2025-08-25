// backend/jest.config.js
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"], // Onde procurar por arquivos de teste
  verbose: true,
  forceExit: true,
  clearMocks: true,
};
