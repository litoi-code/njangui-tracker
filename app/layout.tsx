import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NavBar from "../components/NavBar";
import ThemeProviderWrapper from "@/components/ThemeProviderWrapper";
import "./globals.css";
import "./dark-mode-fixes.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Njangui Tracker - Internal Lending",
  description: "Manage internal lending between accounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProviderWrapper>
          <NavBar />
          <main className="container mx-auto px-4 py-6 bg-background text-foreground min-h-screen transition-colors duration-200">
            {children}
          </main>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
