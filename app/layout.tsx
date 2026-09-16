import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "THE SHOWDOWN — 4 Teams. 1 Board. 1 Winner.", description: "Ekvity office showdown. Live board." };
export const viewport: Viewport = { themeColor: "#120a2a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}