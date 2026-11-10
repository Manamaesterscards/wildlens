import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Literata } from "next/font/google";
import "./globals.css";

const serif = Literata({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "WildLens — Animal Identifier",
  description: "Point your camera at any animal to get instant field guide details and range maps.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eef0e6" },
    { media: "(prefers-color-scheme: dark)", color: "#121a15" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
