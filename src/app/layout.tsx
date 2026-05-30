import type { Metadata } from "next";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ZINEOS — Y2K collage studio",
  description:
    "A maximalist Y2K collage studio that boots like a haunted operating system. Build holographic zines from live GIPHY stickers, then export or share them.",
  applicationName: "ZINEOS",
  openGraph: {
    title: "ZINEOS — Y2K collage studio",
    description:
      "Build holographic zines from live GIPHY stickers in a haunted retro OS, then export a PNG or share the scene as a link.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZINEOS — Y2K collage studio",
    description:
      "A maximalist Y2K collage studio that boots like a haunted operating system.",
  },
};

export const viewport = {
  themeColor: "#5a6cb0",
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
