#!/usr/bin/env sh

# Colors — refined palette (no-op if not a TTY)
BRIGHT_GREEN='\033[1;32m'
BRIGHT_RED='\033[1;31m'
BRIGHT_YELLOW='\033[1;33m'
BRIGHT_CYAN='\033[1;36m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

if [ -t 1 ]; then
  OK="${BRIGHT_GREEN}✓${NC}"
  FAIL="${BRIGHT_RED}✗${NC}"
  WARN="${BRIGHT_YELLOW}⚠${NC}"
  TITLE="${BOLD}\033[1;97m"
  MUTED="${DIM}"
  CMD="${BRIGHT_CYAN}"
  R="\033[0m"
else
  OK="✓"
  FAIL="✗"
  WARN="⚠"
  TITLE=""
  MUTED=""
  CMD=""
  NC=""
  R=""
fi

# Header
echo ""
echo "${MUTED}  ┌─────────────────────────┐${NC}"
echo "${MUTED}  │${NC}    ${TITLE}pre-commit checks${R}    ${MUTED}│${NC}"
echo "${MUTED}  └─────────────────────────┘${NC}"
echo ""

# Checklist
if bun run lint > /tmp/husky-lint.log 2>&1; then
  echo "    ${OK}  Lint"
  LINT_OK=1
else
  echo "    ${FAIL}  Lint"
  LINT_OK=0
fi

if bun run test > /tmp/husky-test.log 2>&1; then
  echo "    ${OK}  Test"
  TEST_OK=1
else
  echo "    ${FAIL}  Test"
  TEST_OK=0
fi

echo ""

# Lint one-liner + command
if [ -s /tmp/husky-lint.log ]; then
  if [ "$LINT_OK" = 0 ]; then
    echo "  ${FAIL}  ${TITLE}Lint reported errors.${R}"
  else
    echo "  ${WARN}  ${TITLE}Lint reported warnings.${R}"
  fi
  echo "  ${MUTED}→ Run ${CMD}bun run lint${NC}${MUTED} for details${NC}"
  echo ""
fi

# Test failure one-liner + command
if [ "$TEST_OK" = 0 ]; then
  echo "  ${FAIL}  ${TITLE}Test failed.${R}"
  echo "  ${MUTED}→ Run ${CMD}bun run test${NC}${MUTED} for details${NC}"
  echo ""
fi

# Footer
if [ "$LINT_OK" = 0 ] || [ "$TEST_OK" = 0 ]; then
  echo "  ${BRIGHT_RED}${BOLD}Commit aborted.${NC}"
  echo ""
  exit 1
fi

echo "  ${BRIGHT_GREEN}${BOLD}All checks passed.${NC}"
echo ""
exit 0
