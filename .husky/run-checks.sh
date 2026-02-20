#!/usr/bin/env sh

# Colors (no-op if not a TTY)
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# Use plain text if not a TTY (e.g. in some editors or CI)
if [ -t 1 ]; then
  OK="${GREEN}✓${NC}"
  FAIL="${RED}✗${NC}"
  TITLE="${BOLD}"
else
  OK="✓"
  FAIL="✗"
  TITLE=""
  NC=""
fi

echo ""
echo "${TITLE}  pre-commit checks${NC}"
echo "  ─────────────────────"
echo ""

# 1. Lint
if bun run lint > /tmp/husky-lint.log 2>&1; then
  echo "  ${OK}  Lint"
  LINT_OK=1
else
  echo "  ${FAIL}  Lint"
  LINT_OK=0
fi

# 2. Test
if bun run test > /tmp/husky-test.log 2>&1; then
  echo "  ${OK}  Test"
  TEST_OK=1
else
  echo "  ${FAIL}  Test"
  TEST_OK=0
fi

echo "  ─────────────────────"
echo ""

if [ "$LINT_OK" = 0 ]; then
  echo "  Lint failed:"
  echo ""
  sed 's/^/    /' /tmp/husky-lint.log
  echo ""
fi

if [ "$TEST_OK" = 0 ]; then
  echo "  Test failed:"
  echo ""
  sed 's/^/    /' /tmp/husky-test.log
  echo ""
fi

if [ "$LINT_OK" = 0 ] || [ "$TEST_OK" = 0 ]; then
  echo "  ${TITLE}Commit aborted.${NC}"
  echo ""
  exit 1
fi

echo "  ${TITLE}All checks passed.${NC}"
echo ""
exit 0
