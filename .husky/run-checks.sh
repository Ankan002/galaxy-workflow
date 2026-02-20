#!/usr/bin/env sh

# Rich color palette (no-op if not a TTY)
GREEN='\033[1;32m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
CYAN='\033[1;36m'
BLUE='\033[1;34m'
MAGENTA='\033[1;35m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

if [ -t 1 ]; then
  OK="${GREEN}✓${NC}"
  FAIL="${RED}✗${NC}"
  WARN="${YELLOW}⚠${NC}"
  TITLE="${BOLD}\033[1;97m"
  MUTED="${DIM}"
  CMD="${CYAN}"
  ACCENT="${BLUE}"
  BOX="${CYAN}"
  R="\033[0m"
else
  OK="✓"
  FAIL="✗"
  WARN="⚠"
  TITLE=""
  MUTED=""
  CMD=""
  ACCENT=""
  BOX=""
  NC=""
  R=""
fi

# Header with colored box
echo ""
echo "${BOX}  ╭─────────────────────────╮${NC}"
echo "${BOX}  │${NC}    ${TITLE}pre-commit checks${R}    ${BOX}│${NC}"
echo "${BOX}  ╰─────────────────────────╯${NC}"
echo ""

# Checklist with colored labels
if bun run lint > /tmp/husky-lint.log 2>&1; then
  echo "    ${OK}  ${ACCENT}Lint${NC}   ${GREEN}passed${NC}"
  LINT_OK=1
else
  echo "    ${FAIL}  ${ACCENT}Lint${NC}   ${RED}failed${NC}"
  LINT_OK=0
fi

if bun run test > /tmp/husky-test.log 2>&1; then
  echo "    ${OK}  ${ACCENT}Test${NC}   ${GREEN}passed${NC}"
  TEST_OK=1
else
  echo "    ${FAIL}  ${ACCENT}Test${NC}   ${RED}failed${NC}"
  TEST_OK=0
fi

echo ""

# Lint one-liner + command
if [ -s /tmp/husky-lint.log ]; then
  if [ "$LINT_OK" = 0 ]; then
    echo "  ${FAIL} ${RED}Lint reported errors.${NC}"
  else
    echo "  ${WARN} ${YELLOW}Lint reported warnings.${NC}"
  fi
  echo "  ${MUTED}  → ${NC}Run ${CMD}bun run lint${NC} ${MUTED}for details${NC}"
  echo ""
fi

# Test failure one-liner + command
if [ "$TEST_OK" = 0 ]; then
  echo "  ${FAIL} ${RED}Test failed.${NC}"
  echo "  ${MUTED}  → ${NC}Run ${CMD}bun run test${NC} ${MUTED}for details${NC}"
  echo ""
fi

# Footer with colored result
if [ "$LINT_OK" = 0 ] || [ "$TEST_OK" = 0 ]; then
  echo "  ${RED}╭─────────────────────────╮${NC}"
  echo "  ${RED}│${NC}  ${BOLD}${RED}Commit aborted.${NC}${RED}       │${NC}"
  echo "  ${RED}╰─────────────────────────╯${NC}"
  echo ""
  exit 1
fi

echo "  ${GREEN}╭─────────────────────────╮${NC}"
echo "  ${GREEN}│${NC}  ${BOLD}${GREEN}All checks passed.${NC}${GREEN}    │${NC}"
echo "  ${GREEN}╰─────────────────────────╯${NC}"
echo ""
exit 0
