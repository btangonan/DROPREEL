import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "DropReel | Video Reel Presentations",
  description: "Turn your Dropbox videos into sleek, interactive presentation reels",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/dropreel-logo.svg" type="image/svg+xml" />
      </head>
      <body className={`${jetbrainsMono.variable} font-mono bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}