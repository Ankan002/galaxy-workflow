#!/usr/bin/env sh

# Colors (standard ANSI for broad compatibility)
GREEN='\033[1;32m'
RED='\033[1;31m'
AMBER='\033[1;33m'
CYAN='\033[1;36m'
GRAY='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Cursor control
CR='\r'
CLEAR_LINE='\033[2K'

if [ -t 1 ]; then
  OK="${GREEN}●${NC}"
  FAIL="${RED}●${NC}"
  WARN="${AMBER}◆${NC}"
  TITLE="${BOLD}"
  SEP="${GRAY}"
  CMD="${CYAN}"
  ACCENT="${GRAY}"
  USE_SPINNER=1
else
  OK="●"
  FAIL="●"
  WARN="◆"
  TITLE=""
  SEP=""
  CMD=""
  ACCENT=""
  NC=""
  USE_SPINNER=0
fi

# Run a check with spinner; prints result line and returns exit code.
# Usage: run_check "Label" "command" "logfile"
run_check() {
  label="$1"
  cmd="$2"
  logfile="$3"
  if [ "$USE_SPINNER" = 1 ]; then
    eval "$cmd" > "$logfile" 2>&1 &
    pid=$!
    while kill -0 "$pid" 2>/dev/null; do
      for c in ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏; do
        kill -0 "$pid" 2>/dev/null || break
        printf "%s  ${GRAY}%s${NC}  %s  ${GRAY}(running...)${NC}   " "$CR" "$c" "$label"
        sleep 0.1
      done
    done
    wait "$pid"
    exit_code=$?
    printf "%s%s" "$CR" "$CLEAR_LINE"
  else
    eval "$cmd" > "$logfile" 2>&1
    exit_code=$?
  fi
  if [ "$exit_code" = 0 ]; then
    echo "  ${OK} ${GREEN}${label}${NC}      ${SEP}passed${NC}"
  else
    echo "  ${FAIL} ${RED}${label}${NC}      ${SEP}failed${NC}"
  fi
  return "$exit_code"
}

echo ""
echo "  ${ACCENT}·····························${NC}"
echo "  ${TITLE}  pre-commit checks${NC}"
echo "  ${ACCENT}·····························${NC}"
echo ""

# 1. Lint (with spinner)
run_check "Lint" "bun run lint" /tmp/husky-lint.log
LINT_OK=$?

# 2. Test (with spinner)
run_check "Test" "bun run test" /tmp/husky-test.log
TEST_OK=$?

echo ""

# On lint failure: show errors in a readable way
if [ "$LINT_OK" != 0 ] && [ -s /tmp/husky-lint.log ]; then
  echo "  ${RED}${TITLE}Lint failed:${NC}"
  echo "  ${ACCENT}──────────────────────${NC}"
  sed 's/^/    /' /tmp/husky-lint.log
  echo ""
  echo "  ${SEP}→ Run ${CMD}bun run lint${NC} ${SEP}for full output${NC}"
  echo ""
fi

# Lint passed but had warnings: one-liner + command
if [ "$LINT_OK" = 0 ] && [ -s /tmp/husky-lint.log ]; then
  echo "  ${SEP}${WARN} Lint reported warnings.${NC}"
  echo "  ${SEP}→ Run ${CMD}bun run lint${NC} ${SEP}for details${NC}"
  echo ""
fi

# On test failure: show errors
if [ "$TEST_OK" != 0 ] && [ -s /tmp/husky-test.log ]; then
  echo "  ${RED}${TITLE}Test failed:${NC}"
  echo "  ${ACCENT}──────────────────────${NC}"
  sed 's/^/    /' /tmp/husky-test.log
  echo ""
  echo "  ${SEP}→ Run ${CMD}bun run test${NC} ${SEP}for full output${NC}"
  echo ""
fi

if [ "$LINT_OK" != 0 ] || [ "$TEST_OK" != 0 ]; then
  echo "  ${RED}${TITLE}Commit aborted.${NC}"
  echo ""
  exit 1
fi

echo "  ${GREEN}${TITLE}All checks passed.${NC}"
echo ""
exit 0
