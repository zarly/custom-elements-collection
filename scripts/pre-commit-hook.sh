#!/usr/bin/env bash
# Pre-commit hook entry point — installed by simple-git-hooks.
# Source nvm so pnpm is available in the minimal hook environment, then
# run sync-meta-dates and stage any auto-updated meta files.
#
# Set SKIP_SIMPLE_GIT_HOOKS=1 to bypass entirely (debugging).
set -e

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "[pre-commit] pnpm not on PATH after sourcing nvm — install pnpm or set SKIP_SIMPLE_GIT_HOOKS=1 to bypass." >&2
  exit 1
fi

pnpm sync-meta-dates
git add src/**/*.meta.json src/meta/content-hashes.json 2>/dev/null || true
