# --- Estágio 1: Build ---
# Usamos uma imagem Node.js completa para ter acesso a todas as ferramentas de build.
# Usar uma versão específica como a 18 é uma boa prática para garantir consistência.
FROM node:18 AS builder

# Define o diretório de trabalho dentro do container.
WORKDIR /app

# Copia os arquivos de gerenciamento de pacotes.
COPY package*.json ./

# Instala TODAS as dependências, incluindo as de desenvolvimento (como typescript e prisma),
# que são necessárias para o build.
RUN npm install

# Copia todo o resto do código-fonte para o container.
COPY . .

# --- O PASSO CRÍTICO QUE ESTAVA FALTANDO ---
# Gera o Prisma Client customizado com base no seu schema.prisma.
# Isso precisa acontecer ANTES de compilar o TypeScript.
RUN npx prisma generate

# Compila o código TypeScript para JavaScript, colocando o resultado na pasta /dist.
RUN npm run build

# --- Estágio 2: Produção ---
# Começamos com uma imagem "alpine" limpa e leve para a imagem final.
# Isso reduz drasticamente o tamanho da imagem e a superfície de ataque.
FROM node:18-alpine

WORKDIR /app

# Copia apenas os arquivos de gerenciamento de pacotes novamente.
COPY package*.json ./

# Instala SOMENTE as dependências de produção.
# O --omit=dev garante que pacotes como typescript, jest, etc., não sejam incluídos.
RUN npm install --omit=dev

# Copia os artefatos do build (o código JavaScript compilado e o Prisma Client gerado)
# do estágio de "builder" para a imagem final.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Documenta que a aplicação dentro do container escuta na porta 3001.
# Esta linha está em harmonia com a configuração do seu fly.toml.
EXPOSE 3001

# O comando que será executado quando o container iniciar.
# Ele roda a aplicação a partir do código JavaScript compilado.
CMD ["node", "dist/index.js"]