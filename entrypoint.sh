#!/bin/sh
set -e

echo "========================================================"
echo "=========== INICIANDO DIAGNÓSTICO DO AMBIENTE =========="
echo "========================================================"

echo "\n--- 1. Variáveis de Ambiente visíveis para o Shell (comando 'printenv') ---"
# Este comando vai listar TODAS as variáveis de ambiente que a Railway injetou no container.
# PRECISAMOS ver DATABASE_URL, REDIS_URL e NODE_ENV aqui.
printenv

echo "\n--- 2. Verificando o que o Node.js vê DIRETAMENTE ---"
# Vamos pedir para o próprio Node.js imprimir suas variáveis, ANTES de rodar nossa aplicação.
# Isso nos dirá se o problema está na passagem do Shell para o Node.
node -e "console.log('--- Conteúdo de process.env visto por um processo Node.js limpo ---', process.env);"

echo "\n--- 3. Executando Prisma Generate (que já sabemos que funciona) ---"
npx prisma generate

echo "\n--- 4. Iniciando a aplicação (que sabemos que falha) ---"
# Agora, executamos o comando original.
exec "$@"