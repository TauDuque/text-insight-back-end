#!/bin/sh
set -e

echo "--- [Entrypoint] Executando Prisma Generate (em runtime) ---"
npx prisma generate

echo "--- [Entrypoint] Iniciando a aplicação Node.js ---"
# O comando 'exec' inicia a aplicação.
exec node dist/app.js