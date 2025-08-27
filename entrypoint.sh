#!/bin/sh

# O comando 'set -e' garante que o script irá parar imediatamente se qualquer comando falhar.
set -e

echo "--- Executando entrypoint.sh ---"

echo "--- Gerando Prisma Client ---"
# Executa o prisma generate. Sabemos que isso funciona.
npx prisma generate

echo "--- Iniciando a aplicação ---"
# O comando 'exec "$@"' é uma prática padrão.
# Ele substitui o processo do shell pelo comando que foi passado para o script,
# que no nosso caso será "node dist/app.js".
# Isso garante que a aplicação Node.js seja o processo principal do container.
exec "$@"