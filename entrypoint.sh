#!/bin/sh
set -e

echo "--- [Entrypoint] Iniciando configuração do ambiente ---"

# Construindo a DATABASE_URL a partir de variáveis separadas
# Formato: postgresql://username:password@host:port/database
if [ -n "$DB_USERNAME" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ] && [ -n "$DB_NAME" ]; then
    echo "--- [Entrypoint] Usando variáveis separadas do banco ---"
    export DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "--- [Entrypoint] DATABASE_URL construída: postgresql://${DB_USERNAME}:***@${DB_HOST}:${DB_PORT}/${DB_NAME} ---"
elif [ -n "$DATABASE_URL" ]; then
    echo "--- [Entrypoint] Usando DATABASE_URL completa ---"
else
    echo "--- [Entrypoint] ERRO: Nenhuma variável de banco encontrada ---"
    echo "--- [Entrypoint] DB_USERNAME: $DB_USERNAME ---"
    echo "--- [Entrypoint] DB_HOST: $DB_HOST ---"
    echo "--- [Entrypoint] DB_PORT: $DB_PORT ---"
    echo "--- [Entrypoint] DB_NAME: $DB_NAME ---"
    echo "--- [Entrypoint] DATABASE_URL: $DATABASE_URL ---"
    exit 1
fi

# Verificar se REDIS_URL está definida
if [ -z "$REDIS_URL" ]; then
    echo "--- [Entrypoint] ERRO: REDIS_URL não definida ---"
    exit 1
fi

# Verificar se JWT_SECRET está definida
if [ -z "$JWT_SECRET" ]; then
    echo "--- [Entrypoint] ERRO: JWT_SECRET não definida ---"
    exit 1
fi

echo "--- [Entrypoint] Todas as variáveis de ambiente verificadas ---"
echo "--- [Entrypoint] DATABASE_URL: $DATABASE_URL ---"
echo "--- [Entrypoint] REDIS_URL: $REDIS_URL ---"
echo "--- [Entrypoint] JWT_SECRET: $JWT_SECRET ---"

echo "--- [Entrypoint] Executando Prisma Generate ---"
npx prisma generate

echo "--- [Entrypoint] Iniciando aplicação Node.js ---"
exec node dist/app.js