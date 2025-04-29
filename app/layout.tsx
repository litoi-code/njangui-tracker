import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ThemeProviderWrapper from "@/components/ThemeProviderWrapper";
import Layout from "@/components/Layout";
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
          <Layout>
            {children}
          </Layout>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
