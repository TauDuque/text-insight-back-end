#!/bin/sh
set -e

echo "--- [Entrypoint] Executando Prisma Generate (sabemos que funciona) ---"
npx prisma generate

echo "--- [Entrypoint] Iniciando a aplicação Node.js com INJEÇÃO EXPLÍCITA de variáveis ---"

# Esta é a mudança crucial.
# Em vez de apenas 'exec node ...', nós prefixamos o comando
# com as variáveis de ambiente que queremos garantir que ele receba.
# O shell pega os valores das variáveis que ele já possui ($DATABASE_URL, etc.)
# e os atribui especificamente para o processo 'node' que está sendo iniciado.
# Isso ignora qualquer problema de herança ou limpeza que possa estar ocorrendo.

exec DATABASE_URL=$DATABASE_URL REDIS_URL=$REDIS_URL NODE_ENV=$NODE_ENV node dist/app.js