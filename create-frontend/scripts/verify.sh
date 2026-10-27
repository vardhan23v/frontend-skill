#!/usr/bin/env sh
# Run the project's own checks and print a verification summary.
#
# Usage: scripts/verify.sh [--install] [--skip-e2e] [project-dir]
#
# Run it from the skill's scripts/ directory, or copy it into the project. The project directory
# defaults to the current directory, so `sh <skill>/scripts/verify.sh --install <project>` works too.
#
#   --install    install dependencies first (npm ci, pnpm/yarn/bun equivalent)
#   --skip-e2e   do not run Playwright, even when a config exists
#   project-dir  defaults to the current directory
#
# The script never invents a result: a check that is not defined is reported as "not defined",
# and a check that could not run is reported as skipped. Exit code 0 means every check that ran
# passed; 1 means a check failed.
set -u

# Verification is non-interactive. Tell test runners not to enter watch mode.
CI="${CI:-1}"
export CI

install=0
e2e=1
dir='.'

for arg in "$@"; do
  case "$arg" in
    --install) install=1 ;;
    --skip-e2e) e2e=0 ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    --*) echo "unknown option: $arg" >&2; exit 2 ;;
    *) dir="$arg" ;;
  esac
done

if [ ! -d "$dir" ]; then
  echo "not a directory: $dir" >&2
  exit 2
fi
cd "$dir" || exit 2

if [ ! -f package.json ]; then
  echo "No package.json in $dir."
  echo "For plain HTML or another non-Node project, run the browser, visual and accessibility checks in SKILL.md step 10."
  exit 1
fi

manager='npm'
if [ -f pnpm-lock.yaml ]; then
  manager='pnpm'
elif [ -f yarn.lock ]; then
  manager='yarn'
elif [ -f bun.lock ] || [ -f bun.lockb ]; then
  manager='bun'
elif [ -f package-lock.json ]; then
  manager='npm'
fi

pm_install() {
  case "$manager" in
    npm)
      if [ -f package-lock.json ]; then npm ci; else npm install; fi
      ;;
    pnpm) pnpm install --frozen-lockfile ;;
    yarn)
      if yarn --version | grep -q '^1\.'; then
        yarn install --frozen-lockfile
      else
        yarn install --immutable
      fi
      ;;
    bun) bun install --frozen-lockfile ;;
  esac
}

pm_run() {
  case "$manager" in
    npm) npm run "$1" ;;
    pnpm) pnpm run "$1" ;;
    yarn) yarn run "$1" ;;
    bun) bun run "$1" ;;
  esac
}

pm_exec() {
  case "$manager" in
    npm) npx "$@" ;;
    pnpm) pnpm exec "$@" ;;
    yarn) yarn "$@" ;;
    bun) bunx "$@" ;;
  esac
}

has_script() {
  node -e 'const p = require("./package.json"); process.exit(p.scripts && p.scripts[process.argv[1]] ? 0 : 1)' "$1" >/dev/null 2>&1
}

summary=''
failures=0

record() {
  name=$1
  status=$2
  summary="$summary
- $name: $status"
  case "$status" in
    pass|covered*|skipped*|not\ defined|not\ configured|not\ run*) ;;
    *) failures=$((failures + 1)) ;;
  esac
}

check_script() {
  name=$1
  script=$2
  if has_script "$script"; then
    printf '\n==> %s (%s)\n' "$name" "$script"
    if pm_run "$script"; then record "$name" 'pass'; else record "$name" 'FAIL'; fi
  else
    printf '\n==> %s: no "%s" script, skipped\n' "$name" "$script"
    record "$name" 'not defined'
  fi
}

if [ "$install" = 1 ]; then
  printf '==> install (%s)\n' "$manager"
  if pm_install; then
    record 'Install' 'pass'
  else
    record 'Install' 'FAIL'
    printf '\nVERIFY SUMMARY%s\n\nResult: FAIL\n' "$summary"
    exit 1
  fi
else
  if [ -d node_modules ]; then
    record 'Install' 'not run (use --install)'
  else
    record 'Install' 'skipped (node_modules missing; use --install)'
  fi
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  if git diff --check >/dev/null 2>&1 && git diff --cached --check >/dev/null 2>&1; then
    record 'Whitespace' 'pass'
  else
    printf '\n==> Whitespace errors in the diff\n'
    git diff --check || true
    git diff --cached --check || true
    record 'Whitespace' 'FAIL'
  fi
fi

if [ -f .nvmrc ]; then
  want=$(tr -d '[:space:]' < .nvmrc)
  have=$(node -v 2>/dev/null | sed 's/^v//')
  case "$want" in
    v*) want=${want#v} ;;
  esac
  case "$have" in
    "$want"*) ;;
    *) echo "warning: Node $have is running; .nvmrc asks for $want" >&2 ;;
  esac
fi

check_script 'Lint' 'lint'
check_script 'Format' 'format:check'
check_script 'Types' 'typecheck'
check_script 'Tests' 'test'
check_script 'Build' 'build'

test_command=$(node -p "((require('./package.json').scripts || {}).test) || ''" 2>/dev/null || true)
case "$test_command" in
  *playwright*) e2e_covered=1 ;;
  *) e2e_covered=0 ;;
esac

if [ "$e2e" = 1 ]; then
  if [ "$e2e_covered" = 1 ]; then
    record 'E2E' 'covered by the test script'
  elif [ -e playwright.config.js ] || [ -e playwright.config.ts ] || [ -e playwright.config.mjs ] || [ -e playwright.config.cjs ]; then
    if [ -x node_modules/.bin/playwright ] || [ -x node_modules/.bin/playwright-core ]; then
      printf '\n==> End-to-end and visual tests (playwright)\n'
      if pm_exec playwright test; then record 'E2E' 'pass'; else record 'E2E' 'FAIL'; fi
    else
      printf '\n==> End-to-end: Playwright config found but @playwright/test is not installed, skipped\n'
      record 'E2E' 'skipped (not installed)'
    fi
  else
    record 'E2E' 'not configured'
  fi
else
  record 'E2E' 'skipped (--skip-e2e)'
fi

printf '\nVERIFY SUMMARY%s\n' "$summary"
if [ "$failures" -eq 0 ]; then
  printf '\nResult: PASS\n'
  exit 0
fi
printf '\nResult: FAIL (%s check(s))\n' "$failures"
exit 1
