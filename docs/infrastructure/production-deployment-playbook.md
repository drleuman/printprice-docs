---
id: production-deployment-playbook
title: Production Deployment Playbook
sidebar_label: Deployment Playbook
---

# Production Deployment Playbook: docs.printprice.pro

This playbook defines the standardized, safe, and production-validated workflow for deploying the PrintPrice OS Docusaurus documentation to the live environment at `docs.printprice.pro`.

:::important
**REPRODUCIBILITY RECOMMENDATION**:
The repository currently does not include a `package-lock.json` file. Because of this, reproducible and deterministic builds using `npm ci` will fail on the production server. Until a `package-lock.json` is generated and committed to the repository, all production deployments **must use `npm install`** as a fallback. 
It is highly recommended to commit a `package-lock.json` file to the repository as soon as possible to enable faster, locked, and safer deployments.
:::

---

## 1. Known Build Issue: Mermaid SSG Rendering Error

### Problem
During the static site generation (SSG) step of the Docusaurus build process, the compilation can crash if Mermaid diagrams are rendered.

### Symptom
The build process terminates with the following error messages:
```text
Docusaurus static site generation failed
Hook useColorMode is called outside the <ColorModeProvider>
```
This is caused by Docusaurus 3.9.2 attempting to compile `useColorMode` (which is invoked inside Docusaurus's Mermaid theme components) outside of the active React context during pre-rendering of raw Markdown pages containing ` ```mermaid ` blocks.

### Temporary Production Workaround
An emergency production-safe workaround is configured in our build workflow. Before running the compiler, we programmatically convert all Markdown/MDX code fences from ` ```mermaid ` to ` ```text `. This bypasses the rendering crash while preserving the diagrams in legible ASCII/text format.

### Permanent Solution
Either:
1. Remove active Mermaid rendering plugins from `docusaurus.config.ts` and keep all diagrams as standard text/ASCII, or
2. Configure Docusaurus Mermaid themes properly to ensure static generation does not call client-only hooks in a pre-rendering context.

---

## 2. Safe Production Deployment Flow

Below is the verified, safe, and production-ready script. It automates backups, performs timestamped parallel builds to avoid live-site downtime, handles lockfile checks, and runs the Mermaid SSG hotfix.

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

echo "=== INSTALL DEPENDENCIES ==="
if [ -f package-lock.json ]; then
  npm ci
else
  echo "No package-lock.json found. Falling back to npm install."
  npm install
fi

echo "=== TEMPORARY MERMAID SSG HOTFIX ==="
grep -RIn "^\`\`\`mermaid" docs src 2>/dev/null || true
find docs src -type f \( -name "*.md" -o -name "*.mdx" \) -print0 2>/dev/null \
  | xargs -0 perl -0pi -e 's/```mermaid/```text/g'
grep -RIn "^\`\`\`mermaid" docs src 2>/dev/null || true

echo "=== BUILD DOCUSAURUS ==="
npm run build

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
1. **Dependency Installation**: `npm install` (or `npm ci` if `package-lock.json` is present) succeeds without critical package resolution failures.
2. **Docusaurus compilation**: `npm run build` completes with an exit code of `0`.
3. **Build Target Verification**: The compiled file `build/index.html` exists and is populated.
4. **Synchronization**: `rsync` completes cleanly and syncs all pre-rendered HTML/JS/CSS assets to `$DOCS_ROOT`.
5. **Core HTTP Response**: Requesting `https://docs.printprice.pro/` returns a `200 OK` status.
6. **Route Integrity**: Crucial preflight architectural contract URLs resolve successfully with `200 OK` status and no 404 redirections.
