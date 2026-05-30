import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ZINEOS — Y2K collage studio",
  description:
    "A maximalist Y2K collage studio that boots like a haunted operating system. Build holographic zines from live GIPHY stickers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
