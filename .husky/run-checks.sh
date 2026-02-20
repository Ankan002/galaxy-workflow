#!/usr/bin/env sh

# Colors (standard ANSI for broad compatibility)
GREEN='\033[1;32m'
RED='\033[1;31m'
AMBER='\033[1;33m'
CYAN='\033[1;36m'
GRAY='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

if [ -t 1 ]; then
  OK="${GREEN}●${NC}"
  FAIL="${RED}●${NC}"
  WARN="${AMBER}◆${NC}"
  TITLE="${BOLD}"
  SEP="${GRAY}"
  CMD="${CYAN}"
  ACCENT="${GRAY}"
else
  OK="●"
  FAIL="●"
  WARN="◆"
  TITLE=""
  SEP=""
  CMD=""
  ACCENT=""
  NC=""
fi

echo ""
echo "  ${ACCENT}·····························${NC}"
echo "  ${TITLE}  pre-commit checks${NC}"
echo "  ${ACCENT}·····························${NC}"
echo ""

# 1. Lint
if bun run lint > /tmp/husky-lint.log 2>&1; then
  echo "  ${OK} ${GREEN}Lint${NC}      ${SEP}passed${NC}"
  LINT_OK=1
else
  echo "  ${FAIL} ${RED}Lint${NC}      ${SEP}failed${NC}"
  LINT_OK=0
fi

# 2. Test
if bun run test > /tmp/husky-test.log 2>&1; then
  echo "  ${OK} ${GREEN}Test${NC}      ${SEP}passed${NC}"
  TEST_OK=1
else
  echo "  ${FAIL} ${RED}Test${NC}      ${SEP}failed${NC}"
  TEST_OK=0
fi

echo ""

# Lint: one-liner + command for verbose output
if [ -s /tmp/husky-lint.log ]; then
  if [ "$LINT_OK" = 0 ]; then
    echo "  ${SEP}${WARN} Lint reported errors.${NC}"
  else
    echo "  ${SEP}${WARN} Lint reported warnings.${NC}"
  fi
  echo "  ${SEP}→ Run ${CMD}bun run lint${NC} ${SEP}for details${NC}"
  echo ""
fi

if [ "$TEST_OK" = 0 ]; then
  echo "  ${SEP}${FAIL} Test failed.${NC}"
  echo "  ${SEP}→ Run ${CMD}bun run test${NC} ${SEP}for details${NC}"
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
