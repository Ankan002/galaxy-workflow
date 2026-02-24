import inquirer from "inquirer";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { serverUtilsRegistry } from "../utils/server";

const { logger } = serverUtilsRegistry;

const getDevScript = (tunnelUrl: string) => {
	return `
#!/usr/bin/env bash

set -e

# ANSI colors: \\033[0m = reset, \\033[1;36m = bold cyan, etc.
C_RESET="\\033[0m"
C_DEV="\\033[1;36m"      # bold cyan for [dev]
C_TUNNEL="\\033[1;35m"   # bold magenta for [tunnel]
C_STUDIO="\\033[1;32m"   # bold green for [studio]
C_TRIGGER="\\033[1;33m"  # bold yellow for [trigger]
C_SCRIPT="\\033[90m"     # dim gray for [dev.sh]

LOG_PREFIX_DEV="\${C_DEV}[dev]\${C_RESET}"
LOG_PREFIX_TUNNEL="\${C_TUNNEL}[tunnel]\${C_RESET}"
LOG_PREFIX_STUDIO="\${C_STUDIO}[studio]\${C_RESET}"
LOG_PREFIX_TRIGGER="\${C_TRIGGER}[trigger]\${C_RESET}"

# Same as package.json "tunnel" script (ngrok)
TUNNEL_URL="${tunnelUrl}"
TUNNEL_CMD="ngrok http --url=\${TUNNEL_URL} 3000"

# Same as package.json "db:studio" script (bunx uses project's prisma)
STUDIO_CMD="bunx prisma studio"

TRIGGER_CMD="bun run dev:trigger"

cleanup() {
  [ -n "\${CLEANUP_DONE:-}" ] && return
  CLEANUP_DONE=1
  echo ""
  echo -e "\${C_SCRIPT}[dev.sh]\${C_RESET} Shutting down..."
  [ -n "\${DEV_PID:-}" ] && { pkill -P $DEV_PID 2>/dev/null; kill $DEV_PID 2>/dev/null; } || true
  [ -n "\${TUNNEL_PID:-}" ] && { pkill -P $TUNNEL_PID 2>/dev/null; kill $TUNNEL_PID 2>/dev/null; } || true
  [ -n "\${STUDIO_PID:-}" ] && { pkill -P $STUDIO_PID 2>/dev/null; kill $STUDIO_PID 2>/dev/null; } || true
  [ -n "\${TRIGGER_PID:-}" ] && { pkill -P $TRIGGER_PID 2>/dev/null; kill $TRIGGER_PID 2>/dev/null; } || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo -e "\${C_SCRIPT}[dev.sh]\${C_RESET} Starting dev server, tunnel, Trigger.dev, and Prisma Studio in parallel..."
echo -e "\${C_SCRIPT}[dev.sh]\${C_RESET} Tunnel URL: https://\${TUNNEL_URL}"
echo ""

( bun dev 2>&1 | while IFS= read -r line; do echo -e "$LOG_PREFIX_DEV $line"; done ) &
DEV_PID=$!

( $TUNNEL_CMD 2>&1 | while IFS= read -r line; do echo -e "$LOG_PREFIX_TUNNEL $line"; done ) &
TUNNEL_PID=$!

( $TRIGGER_CMD 2>&1 | while IFS= read -r line; do echo -e "$LOG_PREFIX_TRIGGER $line"; done ) &
TRIGGER_PID=$!

( $STUDIO_CMD 2>&1 | while IFS= read -r line; do echo -e "$LOG_PREFIX_STUDIO $line"; done ) &
STUDIO_PID=$!

echo -e "\${C_SCRIPT}[dev.sh]\${C_RESET} dev PID: $DEV_PID | tunnel PID: $TUNNEL_PID | trigger PID: $TRIGGER_PID | studio PID: $STUDIO_PID"
echo -e "\${C_SCRIPT}[dev.sh]\${C_RESET} Press Ctrl+C to stop all"
echo ""

wait
`.trimStart();
};

async function main() {
	logger.info("Setup dev script — generate dev.sh with tunnel URL");

	const answers = await inquirer.prompt<{ tunnelUrl: string }>([
		{
			type: "input",
			name: "tunnelUrl",
			message:
				"Ngrok tunnel URL (e.g. monarch-adequate-subtly.ngrok-free.app):",
			default: "monarch-adequate-subtly.ngrok-free.app",
			validate: (input: string) => {
				const trimmed = input.trim();
				if (!trimmed) return "Tunnel URL is required";
				if (
					!/^[\w.-]+\.ngrok-free\.app$/i.test(trimmed) &&
					!/^[\w.-]+$/i.test(trimmed)
				) {
					return "Enter a valid subdomain (e.g. my-app.ngrok-free.app or just the subdomain)";
				}
				return true;
			},
		},
	]);

	const tunnelUrl = answers.tunnelUrl
		.trim()
		.replace(/^https?:\/\//, "")
		.replace(/\/$/, "");
	const outPath = path.join(process.cwd(), "dev.sh");
	const script = getDevScript(tunnelUrl);

	try {
		await writeFile(outPath, script, { mode: 0o755 });
		logger.info(`Wrote dev.sh (tunnel URL: ${tunnelUrl})`);
		logger.http("Run with: ./dev.sh");
	} catch (err) {
		logger.error("Failed to write dev.sh");
		logger.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}
}

main();
