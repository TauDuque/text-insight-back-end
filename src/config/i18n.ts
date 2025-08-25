export type Language = "pt" | "es" | "en";

export interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

export const translations: Translations = {
  // Títulos e cabeçalhos
  "app.title": {
    pt: "TextInsight API",
    es: "TextInsight API",
    en: "TextInsight API",
  },
  "app.subtitle": {
    pt: "Análise Inteligente de Texto",
    es: "Análisis Inteligente de Texto",
    en: "Intelligent Text Analysis",
  },

  // Navegação
  "nav.dashboard": {
    pt: "Dashboard",
    es: "Panel de Control",
    en: "Dashboard",
  },
  "nav.analysis": {
    pt: "Análise",
    es: "Análisis",
    en: "Analysis",
  },
  "nav.history": {
    pt: "Histórico",
    es: "Historial",
    en: "History",
  },
  "nav.stats": {
    pt: "Estatísticas",
    es: "Estadísticas",
    en: "Statistics",
  },
  "nav.apiKeys": {
    pt: "Chaves API",
    es: "Claves API",
    en: "API Keys",
  },

  // Formulários
  "form.name": {
    pt: "Nome completo",
    es: "Nombre completo",
    en: "Full name",
  },
  "form.email": {
    pt: "Email",
    es: "Correo electrónico",
    en: "Email",
  },
  "form.password": {
    pt: "Senha",
    es: "Contraseña",
    en: "Password",
  },
  "form.confirmPassword": {
    pt: "Confirmar senha",
    es: "Confirmar contraseña",
    en: "Confirm password",
  },
  "form.submit": {
    pt: "Enviar",
    es: "Enviar",
    en: "Submit",
  },
  "form.cancel": {
    pt: "Cancelar",
    es: "Cancelar",
    en: "Cancel",
  },

  // Validações
  "validation.required": {
    pt: "Campo obrigatório",
    es: "Campo obligatorio",
    en: "Required field",
  },
  "validation.email.invalid": {
    pt: "Email inválido",
    es: "Email inválido",
    en: "Invalid email",
  },
  "validation.password.required": {
    pt: "Senha é obrigatória",
    es: "La contraseña es obligatoria",
    en: "Password is required",
  },
  "validation.password.minLength": {
    pt: "Senha deve ter pelo menos 6 caracteres",
    es: "La contraseña debe tener al menos 6 caracteres",
    en: "Password must have at least 6 characters",
  },
  "validation.password.lowercase": {
    pt: "Senha deve conter pelo menos uma letra minúscula",
    es: "La contraseña debe contener al menos una letra minúscula",
    en: "Password must contain at least one lowercase letter",
  },
  "validation.password.uppercase": {
    pt: "Senha deve conter pelo menos uma letra maiúscula",
    es: "La contraseña debe contener al menos una letra mayúscula",
    en: "Password must contain at least one uppercase letter",
  },
  "validation.password.number": {
    pt: "Senha deve conter pelo menos um número",
    es: "La contraseña debe contener al menos un número",
    en: "Password must contain at least one number",
  },
  "validation.text.string": {
    pt: "Texto deve ser uma string",
    es: "El texto debe ser una cadena",
    en: "Text must be a string",
  },
  "validation.text.length": {
    pt: "Texto deve ter entre 1 e 50.000 caracteres",
    es: "El texto debe tener entre 1 y 50.000 caracteres",
    en: "Text must have between 1 and 50,000 characters",
  },
  "validation.text.empty": {
    pt: "Texto não pode estar vazio",
    es: "El texto no puede estar vacío",
    en: "Text cannot be empty",
  },
  "validation.analysisId.uuid": {
    pt: "ID da análise deve ser um UUID válido",
    es: "El ID del análisis debe ser un UUID válido",
    en: "Analysis ID must be a valid UUID",
  },
  "validation.pagination.page": {
    pt: "Página deve ser um número inteiro maior que 0",
    es: "La página debe ser un número entero mayor que 0",
    en: "Page must be an integer greater than 0",
  },
  "validation.pagination.limit": {
    pt: "Limite deve ser um número entre 1 e 100",
    es: "El límite debe ser un número entre 1 y 100",
    en: "Limit must be a number between 1 and 100",
  },
  "validation.name.string": {
    pt: "Nome deve ser uma string",
    es: "El nombre debe ser una cadena",
    en: "Name must be a string",
  },
  "validation.name.length": {
    pt: "Nome deve ter entre 2 e 100 caracteres",
    es: "El nombre debe tener entre 2 y 100 caracteres",
    en: "Name must have between 2 and 100 characters",
  },
  "validation.name.empty": {
    pt: "Nome não pode estar vazio",
    es: "El nombre no puede estar vacío",
    en: "Name cannot be empty",
  },
  "validation.multipleErrors": {
    pt: "Dados inválidos. Verifique os campos abaixo:",
    es: "Datos inválidos. Verifique los campos a continuación:",
    en: "Invalid data. Check the fields below:",
  },

  // Análise de texto
  "analysis.title": {
    pt: "Analisar Texto",
    es: "Analizar Texto",
    en: "Analyze Text",
  },
  "analysis.placeholder": {
    pt: "Digite ou cole o texto que deseja analisar...",
    es: "Escriba o pegue el texto que desea analizar...",
    en: "Type or paste the text you want to analyze...",
  },
  "analysis.submit": {
    pt: "Analisar",
    es: "Analizar",
    en: "Analyze",
  },
  "analysis.processing": {
    pt: "Processando...",
    es: "Procesando...",
    en: "Processing...",
  },
  "analysis.details": {
    pt: "Detalhes da Análise",
    es: "Detalles del Análisis",
    en: "Analysis Details",
  },
  "analysis.back": {
    pt: "Voltar à Análise",
    es: "Volver al Análisis",
    en: "Back to Analysis",
  },
  "analysis.createdAt": {
    pt: "Criada em",
    es: "Creada en",
    en: "Created at",
  },
  "analysis.results": {
    pt: "Resultados da Análise",
    es: "Resultados del Análisis",
    en: "Analysis Results",
  },
  "analysis.status": {
    pt: "Status",
    es: "Estado",
    en: "Status",
  },
  "analysis.error": {
    pt: "Erro",
    es: "Error",
    en: "Error",
  },
  "analysis.notFound": {
    pt: "Análise não encontrada",
    es: "Análisis no encontrado",
    en: "Analysis not found",
  },

  // Resultados da análise
  "results.basic.title": {
    pt: "Análise Básica",
    es: "Análisis Básico",
    en: "Basic Analysis",
  },
  "results.linguistic.title": {
    pt: "Análise Linguística",
    es: "Análisis Lingüístico",
    en: "Linguistic Analysis",
  },
  "results.advanced.title": {
    pt: "Análise Avançada",
    es: "Análisis Avanzado",
    en: "Advanced Analysis",
  },

  // Métricas
  "metrics.characters": {
    pt: "Caracteres",
    es: "Caracteres",
    en: "Characters",
  },
  "metrics.words": {
    pt: "Palavras",
    es: "Palabras",
    en: "Words",
  },
  "metrics.sentences": {
    pt: "Frases",
    es: "Oraciones",
    en: "Sentences",
  },
  "metrics.paragraphs": {
    pt: "Parágrafos",
    es: "Párrafos",
    en: "Paragraphs",
  },
  "metrics.sentiment": {
    pt: "Sentimento",
    es: "Sentimiento",
    en: "Sentiment",
  },
  "metrics.readability": {
    pt: "Legibilidade",
    es: "Legibilidad",
    en: "Readability",
  },

  // Sentimentos
  "sentiment.positive": {
    pt: "Positivo",
    es: "Positivo",
    en: "Positive",
  },
  "sentiment.negative": {
    pt: "Negativo",
    es: "Negativo",
    en: "Negative",
  },
  "sentiment.neutral": {
    pt: "Neutro",
    es: "Neutral",
    en: "Neutral",
  },

  // Dificuldade de leitura
  "readability.veryEasy": {
    pt: "Muito fácil",
    es: "Muy fácil",
    en: "Very easy",
  },
  "readability.easy": {
    pt: "Fácil",
    es: "Fácil",
    en: "Easy",
  },
  "readability.fairlyEasy": {
    pt: "Bastante fácil",
    es: "Bastante fácil",
    en: "Fairly easy",
  },
  "readability.standard": {
    pt: "Padrão",
    es: "Estándar",
    en: "Standard",
  },
  "readability.fairlyDifficult": {
    pt: "Bastante difícil",
    es: "Bastante difícil",
    en: "Fairly difficult",
  },
  "readability.difficult": {
    pt: "Difícil",
    es: "Difícil",
    en: "Difficult",
  },
  "readability.veryDifficult": {
    pt: "Muito difícil",
    es: "Muy difícil",
    en: "Very difficult",
  },

  // Estados
  "status.pending": {
    pt: "Pendente",
    es: "Pendiente",
    en: "Pending",
  },
  "status.processing": {
    pt: "Processando",
    es: "Procesando",
    en: "Processing",
  },
  "status.completed": {
    pt: "Concluído",
    es: "Completado",
    en: "Completed",
  },
  "status.failed": {
    pt: "Falhou",
    es: "Falló",
    en: "Failed",
  },

  // Mensagens
  "messages.success": {
    pt: "Sucesso!",
    es: "¡Éxito!",
    en: "Success!",
  },
  "messages.error": {
    pt: "Erro!",
    es: "¡Error!",
    en: "Error!",
  },
  "messages.warning": {
    pt: "Aviso!",
    es: "¡Advertencia!",
    en: "Warning!",
  },
  "messages.info": {
    pt: "Informação",
    es: "Información",
    en: "Information",
  },
  "messages.copied": {
    pt: "Resultados copiados!",
    es: "¡Resultados copiados!",
    en: "Results copied!",
  },
  "messages.downloaded": {
    pt: "Arquivo baixado!",
    es: "¡Archivo descargado!",
    en: "File downloaded!",
  },
  "messages.copyError": {
    pt: "Erro ao copiar",
    es: "Error al copiar",
    en: "Error copying",
  },
  "messages.downloadError": {
    pt: "Erro ao baixar arquivo",
    es: "Error al descargar archivo",
    en: "Error downloading file",
  },

  // Botões
  "button.retry": {
    pt: "Tentar novamente",
    es: "Intentar de nuevo",
    en: "Retry",
  },
  "button.copy": {
    pt: "Copiar",
    es: "Copiar",
    en: "Copy",
  },
  "button.download": {
    pt: "Baixar",
    es: "Descargar",
    en: "Download",
  },
  "button.back": {
    pt: "Voltar",
    es: "Volver",
    en: "Back",
  },
  "button.close": {
    pt: "Fechar",
    es: "Cerrar",
    en: "Close",
  },

  // Autenticação
  "auth.login": {
    pt: "Entrar",
    es: "Iniciar Sesión",
    en: "Login",
  },
  "auth.register": {
    pt: "Cadastre-se",
    es: "Registrarse",
    en: "Register",
  },
  "auth.loggingIn": {
    pt: "Entrando...",
    es: "Iniciando sesión...",
    en: "Logging in...",
  },
  "auth.loginSubtitle": {
    pt: "Faça login na sua conta",
    es: "Inicia sesión en tu cuenta",
    en: "Sign in to your account",
  },
  "auth.noAccount": {
    pt: "Não tem conta?",
    es: "¿No tienes cuenta?",
    en: "Don't have an account?",
  },
  "auth.loginError": {
    pt: "Erro ao fazer login",
    es: "Error al iniciar sesión",
    en: "Error logging in",
  },

  // Seleção de idioma
  "language.pt": {
    pt: "Português",
    es: "Portugués",
    en: "Portuguese",
  },
  "language.es": {
    pt: "Espanhol",
    es: "Español",
    en: "Spanish",
  },
  "language.en": {
    pt: "Inglês",
    es: "Inglés",
    en: "English",
  },
  "language.select": {
    pt: "Selecionar idioma",
    es: "Seleccionar idioma",
    en: "Select language",
  },
};

export const getTranslation = (key: string, language: Language): string => {
  return translations[key]?.[language] || key;
};

export const getDefaultLanguage = (): Language => "pt";

export const getSupportedLanguages = (): Language[] => ["pt", "es", "en"];
