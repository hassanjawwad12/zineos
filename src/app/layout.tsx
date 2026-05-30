import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

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
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
