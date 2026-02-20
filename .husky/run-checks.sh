#!/usr/bin/env sh

# Colors (no-op if not a TTY)
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Use plain text if not a TTY (e.g. in some editors or CI)
if [ -t 1 ]; then
  OK="${GREEN}✓${NC}"
  FAIL="${RED}✗${NC}"
  WARN="${YELLOW}⚠${NC}"
  TITLE="${BOLD}"
  SEP="${DIM}"
  CMD="${CYAN}"
else
  OK="✓"
  FAIL="✗"
  WARN="⚠"
  TITLE=""
  SEP=""
  CMD=""
  NC=""
fi

echo ""
echo "${TITLE}  pre-commit checks${NC}"
echo "${SEP}  ─────────────────────${NC}"
echo ""

# 1. Lint
if bun run lint > /tmp/husky-lint.log 2>&1; then
  echo "  ${OK}  Lint${NC}"
  LINT_OK=1
else
  echo "  ${FAIL}  Lint${NC}"
  LINT_OK=0
fi

# 2. Test
if bun run test > /tmp/husky-test.log 2>&1; then
  echo "  ${OK}  Test${NC}"
  TEST_OK=1
else
  echo "  ${FAIL}  Test${NC}"
  TEST_OK=0
fi

echo "${SEP}  ─────────────────────${NC}"
echo ""

# Lint: one-liner + command for verbose output (no full dump)
if [ -s /tmp/husky-lint.log ]; then
  if [ "$LINT_OK" = 0 ]; then
    echo "  ${FAIL}  ${TITLE}Lint reported errors.${NC}"
  else
    echo "  ${WARN}  ${TITLE}Lint reported warnings.${NC}"
  fi
  echo "  ${SEP}Run ${CMD}bun run lint${NC}${SEP} for verbose output.${NC}"
  echo ""
fi

if [ "$TEST_OK" = 0 ]; then
  echo "  ${FAIL}  ${TITLE}Test failed.${NC}"
  echo "  ${SEP}Run ${CMD}bun run test${NC}${SEP} for verbose output.${NC}"
  echo ""
fi

if [ "$LINT_OK" = 0 ] || [ "$TEST_OK" = 0 ]; then
  echo "  ${RED}${TITLE}Commit aborted.${NC}"
  echo ""
  exit 1
fi

echo "  ${GREEN}${TITLE}All checks passed.${NC}"
echo ""
exit 0
