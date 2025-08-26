# Estágio 1: Build da Aplicação
# Usamos uma imagem Node com a versão que você está usando (ex: 18)
FROM node:18-alpine AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos de manifesto de pacotes
COPY package*.json ./

# Instala as dependências de produção
RUN npm install --only=production

# Copia todo o código-fonte da aplicação
COPY . .

# Compila o TypeScript para JavaScript
RUN npm run build

# Estágio 2: Imagem Final de Produção
# Usamos uma imagem limpa e leve para a versão final
FROM node:18-alpine

WORKDIR /usr/src/app

# Copia os arquivos de manifesto novamente
COPY package*.json ./

# Instala apenas as dependências de produção
RUN npm install --only=production

# Copia os artefatos de build do estágio anterior
COPY --from=builder /usr/src/app/dist ./dist

# Expõe a porta que a aplicação usará
EXPOSE 3001

# Define o comando para iniciar a aplicação
CMD [ "node", "dist/app.js" ]
