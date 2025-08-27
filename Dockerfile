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

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 3000

# Define o nosso script como o ponto de entrada
ENTRYPOINT ["./entrypoint.sh"]

# Define o comando PADRÃO que o entrypoint irá executar
CMD ["node", "dist/app.js"]