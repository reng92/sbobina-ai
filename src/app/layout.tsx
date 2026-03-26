import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SbobinaAI",
  description: "Trascrivi lezioni universitarie gratis con Whisper",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={inter.variable}>
      <body style={{ margin: 0, padding: 0, fontFamily: "var(--font-inter, system-ui, sans-serif)" }}>
        {children}
      </body>
    </html>
  );
}
