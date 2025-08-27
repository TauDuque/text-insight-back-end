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

# Copia apenas o necessário do estágio de build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copia e prepara o nosso script de inicialização
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

# O ENTRYPOINT agora aponta para o nosso script.
# O comando que ele executa virá do railway.json
ENTRYPOINT ["./entrypoint.sh"]