#!/usr/bin/env bash
# ==============================================================================
# JARVIS Launcher (Linux / macOS)
# Inicia o daemon do JARVIS e abre a interface web no navegador padrão.
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Verifica se node e npm estão instalados
if ! command -v node >/dev/null 2>&1; then
  echo "[ERRO] Node.js não foi encontrado. Instale o Node.js v18+ para executar o JARVIS."
  exit 1
fi

# Verifica se as dependências foram instaladas
if [ ! -d "node_modules" ]; then
  echo "[JARVIS] Primeira inicialização detectada. Instalando dependências..."
  npm install
fi

# Verifica se o build da web existe, caso contrário executa build
if [ ! -d "packages/web/dist" ]; then
  echo "[JARVIS] Gerando bundle da Web UI..."
  npm run build:web
fi

echo "================================================="
echo "        🚀 INICIANDO JARVIS COPILOT              "
echo "================================================="
echo "O daemon iniciará e o seu navegador abrirá em breve."
echo "Para encerrar, feche esta janela ou aperte Ctrl+C."
echo "================================================="

npm run start
