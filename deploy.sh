#!/bin/bash
# PrintPrice Docs - Automated Production Deploy Script
# Usage: ./deploy.sh

# Exit immediately if a command exits with a non-zero status
set -e

# Set paths with sensible production defaults
export REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DOCS_ROOT="/var/www/vhosts/printprice.pro/docs.printprice.pro"
export BACKUP_ROOT="/var/www/vhosts/printprice.pro/backups"
export TS="$(date +%Y%m%d-%H%M%S)"

echo "========================================="
echo "  PrintPrice Docs - Production Deploy"
echo "  Timestamp: $TS"
echo "  Repo Directory: $REPO_DIR"
echo "  Document Root:  $DOCS_ROOT"
echo "========================================="

# 1. Respaldo de la versión en vivo actual
if [ -d "$DOCS_ROOT" ] && [ "$(ls -A "$DOCS_ROOT")" ]; then
  echo "=== 1. CREANDO RESPALDO DE SEGURIDAD ==="
  mkdir -p "$BACKUP_ROOT/docs-$TS"
  rsync -a --exclude='.git' "$DOCS_ROOT/" "$BACKUP_ROOT/docs-$TS/"
  echo "Respaldo creado en: $BACKUP_ROOT/docs-$TS"
else
  echo "=== 1. DOCUMENT ROOT VACÍO O INEXISTENTE (SE SALTA EL RESPALDO) ==="
fi

# 2. Habilitar Yarn local a través de Corepack
echo "=== 2. HABILITANDO YARN LOCAL (COREPACK) ==="
mkdir -p "$REPO_DIR/bin"
corepack enable --install-directory "$REPO_DIR/bin"
export PATH="$REPO_DIR/bin:$PATH"
echo "Yarn version: $(yarn --version)"

# 3. Instalar dependencias
echo "=== 3. INSTALANDO DEPENDENCIAS CON YARN ==="
yarn install --frozen-lockfile

# 4. Hotfix de Mermaid para evitar fallos de SSG
echo "=== 4. APLICANDO HOTFIX DE DIALOGRAMAS DE MERMAID ==="
find docs src -type f \( -name "*.md" -o -name "*.mdx" \) -print0 2>/dev/null \
  | xargs -0 perl -0pi -e 's/```mermaid/```text/g'

# 5. Compilar Docusaurus
echo "=== 5. COMPILANDO EL SITIO (YARN BUILD) ==="
yarn build

# 6. Validar que el build sea exitoso
if [ -f "$REPO_DIR/build/index.html" ]; then
  echo "=== 6. COMPILACIÓN EXITOSA, PREPARANDO TRANSFERENCIA ==="
else
  echo "ERROR: No se encontró build/index.html tras la compilación."
  exit 1
fi

# 7. Sincronizar en caliente al Document Root de Plesk
echo "=== 7. MIGRANDO ARCHIVOS COMPILADOS A PRODUCCIÓN ==="
rsync -a --delete --exclude='.git' "$REPO_DIR/build/" "$DOCS_ROOT/"
cd "$DOCS_ROOT"
touch .nojekyll

echo "========================================="
echo "  ¡DESPLIEGUE COMPLETADO CON TOTAL ÉXITO!"
echo "  URL: https://docs.printprice.pro/"
echo "========================================="
