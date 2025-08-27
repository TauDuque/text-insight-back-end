# Estágio 1: Builder
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Production
FROM node:18-alpine
WORKDIR /app

# --- INÍCIO DAS MUDANÇAS CRUCIAIS ---

# 1. Declare os argumentos que esperamos receber durante o build.
# A Railway vai procurar por esses ARGs e injetar as variáveis correspondentes.
ARG DATABASE_URL
ARG REDIS_URL
ARG NODE_ENV=production # Definimos um valor padrão para o NODE_ENV

# 2. Use a instrução ENV para "gravar" os valores dos ARGs no ambiente final do container.
# Agora, quando o container iniciar, essas variáveis ESTARÃO disponíveis para o entrypoint e para a aplicação.
ENV DATABASE_URL=$DATABASE_URL
ENV REDIS_URL=$REDIS_URL
ENV NODE_ENV=$NODE_ENV

# --- FIM DAS MUDANÇAS CRUCIAIS ---

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/app.js"]