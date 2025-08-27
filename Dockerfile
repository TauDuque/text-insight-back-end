# Estágio 1: Builder - Onde construímos o código
# Usamos uma imagem completa do Node para ter todas as ferramentas de build
FROM node:18 AS builder

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package*.json ./

# Instala TODAS as dependências, incluindo as de desenvolvimento (necessárias para o build e prisma)
RUN npm install

# Copia todo o resto do código da sua aplicação
COPY . .

# Executa o build do TypeScript, transformando .ts em .js no diretório /dist
RUN npm run build


# Estágio 2: Production - A imagem final, leve e otimizada
# Usamos uma imagem 'slim' ou 'alpine' para um container final menor e mais seguro
FROM node:18-alpine

WORKDIR /app

# Copia as dependências de produção do estágio 'builder'
COPY --from=builder /app/node_modules ./node_modules

# Copia o código JavaScript compilado do estágio 'builder'
COPY --from=builder /app/dist ./dist

# Copia o schema do Prisma. Isso é essencial para o 'prisma generate'
COPY --from=builder /app/prisma ./prisma

# Expõe a porta em que sua aplicação roda (ajuste se for diferente)
EXPOSE 3000

# ESTA É A LINHA MAIS IMPORTANTE - O COMANDO DE START
# 1. Executa 'prisma generate' PRIMEIRO. Neste ponto, as variáveis da Railway JÁ ESTÃO DISPONÍVEIS.
# 2. Em seguida, inicia o servidor Node.js forçando o NODE_ENV=production.
# Usamos 'sh -c' para poder executar múltiplos comandos em sequência.
CMD ["sh", "-c", "npx prisma generate && NODE_ENV=production node dist/app.js"]