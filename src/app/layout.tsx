import type { Metadata } from "next";
import {
	Archivo_Black,
	Space_Grotesk,
	Space_Mono,
	Tiro_Devanagari_Hindi,
} from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { DesktopOnlyGate } from "@/components/elements";
import {
	AuthProvider,
	MotionProvider,
	QueryProvider,
	ThemeProvider,
} from "@/components/providers";
import { SidebarProvider } from "@/components/ui";
import { Analytics } from "@vercel/analytics/next";

const archivoBlack = Archivo_Black({
	variable: "--font-archivo-black",
	subsets: ["latin"],
	weight: "400",
});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
	variable: "--font-space-mono",
	subsets: ["latin"],
	weight: ["400", "700"],
});

const tiroDevanagari = Tiro_Devanagari_Hindi({
	variable: "--font-tiro-devanagari",
	subsets: ["latin", "devanagari"],
	weight: "400",
});

export const metadata: Metadata = {
	metadataBase: new URL("https://aakriti.app"),
	title: {
		default: "aakriti — weave AI workflows",
		template: "%s · aakriti",
	},
	description:
		"aakriti (आकृति) is a visual AI workflow builder. Drag nodes onto an infinite canvas, wire them together, and run text, image, video, and LLM pipelines in the cloud.",
	applicationName: "aakriti",
	authors: [{ name: "Ankan Bhattacharya" }],
	keywords: [
		"aakriti",
		"AI workflow builder",
		"visual workflow",
		"node editor",
		"LLM pipelines",
		"generative AI",
		"React Flow",
	],
	openGraph: {
		type: "website",
		url: "https://aakriti.app",
		siteName: "aakriti",
		title: "aakriti — weave AI workflows",
		description:
			"A visual AI workflow builder. Drag nodes onto an infinite canvas, wire them together, and run AI pipelines in the cloud.",
	},
	twitter: {
		card: "summary_large_image",
		title: "aakriti — weave AI workflows",
		description:
			"A visual AI workflow builder. Wire nodes on an infinite canvas and run AI pipelines in the cloud.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<AuthProvider>
			<html lang="en" suppressHydrationWarning>
				<body
					className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${spaceMono.variable} ${tiroDevanagari.variable} antialiased`}
				>
					<MotionProvider>
						<ThemeProvider>
							<QueryProvider>
								<SidebarProvider>
									<DesktopOnlyGate>{children}</DesktopOnlyGate>
									<Toaster />
								</SidebarProvider>
							</QueryProvider>
						</ThemeProvider>
					</MotionProvider>
					<Analytics />
				</body>
			</html>
		</AuthProvider>
	);
}
