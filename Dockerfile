# Estágio 1: Builder (permanece o mesmo)
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Production (com as modificações)
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# --- NOVAS INSTRUÇÕES ---
# Copia o nosso novo script de entrypoint para dentro do container
COPY entrypoint.sh .

# Dá permissão de execução para o script
RUN chmod +x entrypoint.sh
# --- FIM DAS NOVAS INSTRUÇÕES ---

EXPOSE 3000

# Define o nosso script como o PONTO DE ENTRADA do container
ENTRYPOINT ["./entrypoint.sh"]

# Define o COMANDO PADRÃO que será passado para o entrypoint
# O entrypoint irá executar isso com 'exec "$@"'
CMD ["node", "dist/app.js"]