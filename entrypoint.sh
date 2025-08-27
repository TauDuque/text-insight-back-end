#!/bin/sh
set -e

echo "--- [Entrypoint] Executando Prisma Generate (sabemos que funciona) ---"
npx prisma generate

echo "--- [Entrypoint] Iniciando a aplicação Node.js com CONEXÃO SEPARADA do banco ---"

# Construindo a DATABASE_URL a partir de variáveis separadas
# Formato: postgresql://username:password@host:port/database
if [ -n "$DB_USERNAME" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
    echo "--- [Entrypoint] Usando variáveis separadas do banco ---"
    export DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "--- [Entrypoint] DATABASE_URL construída: postgresql://${DB_USERNAME}:***@${DB_HOST}:${DB_PORT}/${DB_NAME} ---"
else
    echo "--- [Entrypoint] Usando DATABASE_URL completa (fallback) ---"
fi

# Iniciando a aplicação com todas as variáveis necessárias
exec node dist/app.js