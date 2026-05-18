---
id: production-deployment-playbook
title: Production Deployment Playbook
sidebar_label: Deployment Playbook
---

# Production Deployment Playbook: docs.printprice.pro

This playbook defines the standardized, safe, and production-validated workflow for deploying the PrintPrice OS Docusaurus documentation to the live environment at `docs.printprice.pro`.

:::important
**PACKAGE MANAGER & ALIAS COMPATIBILITY**:
The repository contains a `yarn.lock` file because it was built and structured using **Yarn**. Modern Docusaurus versions use npm package aliases (e.g. `"react-loadable": "npm:@docusaurus/react-loadable@6.0.0"`). 
*   **The Issue**: If the production environment is running **npm v6.x** (or below), running `npm install` or `npm ci` will fail because npm v6 does not support package aliases. This causes the error: `No matching version found for react-loadable@6.0.0`.
*   **The Solution**: We must build the site using **Yarn**. Since the server may not have Yarn installed globally (or lacks sudo privileges), the deployment script leverages **Node.js Corepack** (pre-bundled with Node 16.9+) to locally generate and run a standard Yarn executable shim without root access.
:::

---

## 1. Known Build Issues & Workarounds

### A. Docusaurus spawn yarn ENOENT
If `yarn.lock` is present in the repository, Docusaurus detects it and attempts to check the Yarn version by running `yarn --version`. If Yarn is not in the system's `PATH`, the build fails immediately with `spawn yarn ENOENT`.
*   **Fix**: The deployment script uses Corepack to generate a local `yarn` binary and adds it to the active shell's `PATH` variable before building, ensuring Docusaurus finds it perfectly.

### B. Mermaid SSG Rendering Error
During the static site generation (SSG) step of the Docusaurus build process, the compilation can crash if Mermaid diagrams are rendered.
*   **Symptom**: The build terminates with `Hook useColorMode is called outside the <ColorModeProvider>`. This is caused by Docusaurus 3.9.2 pre-rendering raw markdown pages containing ` ```mermaid ` blocks.
*   **Fix**: Before compiling, we programmatically convert all Markdown/MDX code fences from ` ```mermaid ` to ` ```text `. This bypasses the rendering crash while keeping the diagrams readable in plain text.

---

## 2. Safe Production Deployment Flow

Below is the verified, safe, and production-ready script. It automates backups, generates local Yarn shims using Corepack, handles lockfile-based deterministic installation, runs the Mermaid SSG hotfix, and deploys with zero live-site downtime.

```bash
set -e

export REPO_URL="https://github.com/drleuman/printprice-docs.git"
export DOCS_ROOT="/var/www/vhosts/printprice.pro/docs.printprice.pro"
export BACKUP_ROOT="/var/www/vhosts/printprice.pro/backups"
export BUILD_ROOT="/var/www/vhosts/printprice.pro/builds"
export TS="$(date +%Y%m%d-%H%M%S)"
export BUILD_DIR="$BUILD_ROOT/printprice-docs-$TS"

echo "=== BACKUP CURRENT SITE ==="
mkdir -p "$BACKUP_ROOT/docs-$TS"
rsync -a --exclude='.git' "$DOCS_ROOT/" "$BACKUP_ROOT/docs-$TS/"

echo "=== CLONE DOCS REPO ==="
mkdir -p "$BUILD_ROOT"
git clone "$REPO_URL" "$BUILD_DIR"
cd "$BUILD_DIR"

echo "=== REPO STATE ==="
git status
git rev-parse --abbrev-ref HEAD
git rev-parse HEAD

echo "=== ENABLE LOCAL YARN VIA COREPACK ==="
mkdir -p "$BUILD_DIR/bin"
corepack enable --install-directory "$BUILD_DIR/bin"
export PATH="$BUILD_DIR/bin:$PATH"

echo "=== INSTALL DEPENDENCIES WITH YARN ==="
yarn install --frozen-lockfile

echo "=== TEMPORARY MERMAID SSG HOTFIX ==="
grep -RIn "^\`\`\`mermaid" docs src 2>/dev/null || true
find docs src -type f \( -name "*.md" -o -name "*.mdx" \) -print0 2>/dev/null \
  | xargs -0 perl -0pi -e 's/```mermaid/```text/g'
grep -RIn "^\`\`\`mermaid" docs src 2>/dev/null || true

echo "=== BUILD DOCUSAURUS ==="
yarn build

echo "=== VERIFY BUILD ==="
test -f build/index.html

echo "=== DEPLOY BUILD ==="
rsync -a --delete --exclude='.git' "$BUILD_DIR/build/" "$DOCS_ROOT/"
cd "$DOCS_ROOT"
touch .nojekyll

echo "=== VERIFY HTTP ==="
curl -I https://docs.printprice.pro/
curl -s https://docs.printprice.pro/ | head -20
```

---

## 3. Rollback Instructions

If the verification step fails or any critical client issues occur, execute a rollback to restore the previous live state immediately:

```bash
export DOCS_ROOT="/var/www/vhosts/printprice.pro/docs.printprice.pro"
export BACKUP_DIR="/var/www/vhosts/printprice.pro/backups/docs-REPLACE_TIMESTAMP"

test -d "$BACKUP_DIR"
rsync -a --delete "$BACKUP_DIR/" "$DOCS_ROOT/"
curl -I https://docs.printprice.pro/
```

---

## 4. Deployment Acceptance Criteria

The deployment is considered fully valid and complete only if:
1. **Dependency Installation**: `yarn install --frozen-lockfile` succeeds cleanly using the Node Corepack-provided Yarn binary.
2. **Docusaurus compilation**: `yarn build` completes with an exit code of `0`.
3. **Build Target Verification**: The compiled file `build/index.html` exists and is populated.
4. **Synchronization**: `rsync` completes cleanly and syncs all pre-rendered HTML/JS/CSS assets to `$DOCS_ROOT`.
5. **Core HTTP Response**: Requesting `https://docs.printprice.pro/` returns a `200 OK` status.
6. **Route Integrity**: Crucial preflight architectural contract URLs resolve successfully with `200 OK` status and no 404 redirections.
