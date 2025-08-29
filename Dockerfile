# Dockerfile otimizado para produção
# Reduz significativamente o tamanho da imagem e consumo de recursos

# Usar Node.js Alpine para imagem menor
FROM node:18-alpine AS builder

# Instalar dependências necessárias para compilação
RUN apk add --no-cache python3 make g++

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências (rimraf e copyfiles agora estão em dependencies)
RUN npm ci --only=production && npm cache clean --force

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Compilar TypeScript
RUN npm run build

# Remover dependências de desenvolvimento
RUN rm -rf node_modules
RUN npm ci --only=production && npm cache clean --force

# Imagem de produção
FROM node:18-alpine AS production

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Instalar apenas dependências necessárias para runtime
RUN apk add --no-cache dumb-init

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos compilados e dependências
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/entrypoint.sh ./

# Tornar entrypoint executável
RUN chmod +x entrypoint.sh

# Configurações de segurança
RUN chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Configurações de produção
ENV NODE_ENV=production
# Railway não permite flags customizadas de NODE_OPTIONS
# ENV NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size"

# Expor porta
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Usar entrypoint para configurar variáveis de ambiente
CMD ["./entrypoint.sh"]
