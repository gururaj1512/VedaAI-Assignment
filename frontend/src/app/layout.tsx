import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist_Mono } from "next/font/google";
import "./globals.css";

const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VedaAI - AI Assessment Creator",
  description: "Create, structure, and generate publication-quality question papers and answer keys with Gemini AI in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolageGrotesque.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className={`${bricolageGrotesque.className} min-h-full flex flex-col`}>{children}</body>
    </html>
  );
}
