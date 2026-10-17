#!/usr/bin/env bash
# ==============================================================================
# Instala o atalho do JARVIS no menu de aplicativos do Linux (~/.local/share/applications)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_SRC="$DIR/docs/jarvis-icon.svg"
DESKTOP_DIR="$HOME/.local/share/applications"
ICON_DIR="$HOME/.local/share/icons/hicolor/scalable/apps"

mkdir -p "$DESKTOP_DIR"
mkdir -p "$ICON_DIR"

# Copia ícone
cp "$ICON_SRC" "$ICON_DIR/jarvis.svg"

# Cria arquivo .desktop
DESKTOP_FILE="$DESKTOP_DIR/jarvis.desktop"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Type=Application
Name=JARVIS Copilot
Comment=Obsidian AI Copilot Local & Autônomo
Exec="$DIR/jarvis.sh"
Icon=jarvis
Terminal=true
Categories=Utility;Development;Office;
StartupNotify=true
EOF

chmod +x "$DESKTOP_FILE"

echo "[JARVIS] Atalho instalado com sucesso!"
echo "O JARVIS agora aparece no menu de aplicativos do seu sistema operacional."
