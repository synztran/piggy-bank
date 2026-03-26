import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "HaJa Piggy Bank",
  description: "Where your savings don't melt away.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e1a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={`${inter.variable} font-sans`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
