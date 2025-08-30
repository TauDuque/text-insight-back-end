export const APP_CONSTANTS = {
  // Configurações da aplicação
  APP_NAME: "Document Processing API",
  APP_VERSION: "2.0.0",

  // Configurações de segurança
  JWT_EXPIRES_IN: "24h",
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,

  // Configurações de API
  API_PREFIX: "/api",
  DEFAULT_PORT: 3001,

  // Configurações de validação
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Mensagens de erro
  ERROR_MESSAGES: {
    INVALID_EMAIL: "Email inválido",
    PASSWORD_TOO_SHORT: "A senha deve ter pelo menos 6 caracteres",
    NAME_TOO_SHORT: "Nome deve ter pelo menos 2 caracteres",
    EMAIL_IN_USE: "Email já está em uso",
    INVALID_CREDENTIALS: "Credenciais inválidas",
    TOKEN_REQUIRED: "Token de acesso requerido",
    INVALID_TOKEN: "Token inválido",
    API_KEY_REQUIRED: "API Key requerida",
    INVALID_API_KEY: "API Key inválida",
    USER_NOT_FOUND: "Usuário não encontrado",
    INTERNAL_ERROR: "Erro interno do servidor",
  },

  // Mensagens de sucesso
  SUCCESS_MESSAGES: {
    USER_CREATED: "Usuário criado com sucesso",
    LOGIN_SUCCESS: "Login realizado com sucesso",
    API_KEY_CREATED: "API Key criada com sucesso",
    OPERATION_SUCCESS: "Operação realizada com sucesso",
  },
} as const;
