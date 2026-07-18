"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

export const ThemeToggle: React.FC = () => {
	const { resolvedTheme, setTheme } = useTheme();

	const isDark = resolvedTheme === "dark";

	return (
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			className="rounded-full border border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
			onClick={() => setTheme(isDark ? "light" : "dark")}
			aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
		>
			<span className="sr-only">
				{isDark ? "Switch to light mode" : "Switch to dark mode"}
			</span>
			<Sun className="size-4 rotate-0 scale-100 transition-transform duration-300 [transition-timing-function:var(--ease-snap)] dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute size-4 rotate-90 scale-0 transition-transform duration-300 [transition-timing-function:var(--ease-snap)] dark:rotate-0 dark:scale-100" />
		</Button>
	);
};

