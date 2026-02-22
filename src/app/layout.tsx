import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { AuthProvider, QueryProvider } from "@/components/providers";
import { SidebarProvider } from "@/components/ui";

const dmSans = DM_Sans({
	variable: "--font-dm-sans",
	subsets: ["latin"],
});

const dmMono = DM_Mono({
	variable: "--font-dm-mono",
	subsets: ["latin"],
	weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
	title: "Galaxy AI x Weavy",
	description:
		"Weavy's functionality clone for simple Artistic AI workflow! This project is primarily built for interview assignment operations for Galaxy AI",
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
					className={`${dmSans.variable} ${dmMono.variable} antialiased`}
				>
					<QueryProvider>
						<SidebarProvider>
							{children}
							<Toaster />
						</SidebarProvider>
					</QueryProvider>
				</body>
			</html>
		</AuthProvider>
	);
}
