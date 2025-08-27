#!/bin/sh
set -e

echo "--- [DIAGNÓSTICO FINAL] ---"
echo " "
echo "--- 1. Listando todos os arquivos (incluindo ocultos) no diretório /app ---"
ls -la /app
echo " "

echo "--- 2. Verificando o conteúdo do arquivo .env, se ele existir ---"
if [ -f ".env" ]; then
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "!!! ALERTA: ARQUIVO .ENV ENCONTRADO NO DEPLOY !!!"
  echo "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!"
  echo "Conteúdo do .env:"
  cat .env
else
  echo "--- Info: Arquivo .env não foi encontrado. ---"
fi
echo " "

echo "--- 3. Imprimindo todas as variáveis de ambiente disponíveis para o SHELL ---"
printenv
echo " "

echo "--- Fim do diagnóstico. O script será interrompido para análise. ---"
# A linha abaixo força o deploy a 'falhar' de propósito depois de imprimir tudo,
# para que possamos ler os logs com calma.
exit 1