import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CoValidator — AI Startup Due Diligence",
  description: "8-phase autonomous startup audit powered by AI. Validate your idea against real market data, competitor analysis, and failure simulations before you build.",
  keywords: ["startup validation", "due diligence", "AI audit", "idea validator", "market analysis"],
  openGraph: {
    title: "CoValidator — AI Startup Due Diligence",
    description: "The Silicon Valley Blitz-Auditor. Full 8-phase autonomous simulation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
