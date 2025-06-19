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
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/images/logo-256x256.png', sizes: '256x256', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo-256x256.png', sizes: '256x256' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'DropReel | Video Reel Presentations',
    description: 'Turn your Dropbox videos into sleek, interactive presentation reels',
    images: [
      {
        url: '/images/logo-256x256.png',
        width: 256,
        height: 256,
        alt: 'DropReel Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DropReel | Video Reel Presentations',
    description: 'Turn your Dropbox videos into sleek, interactive presentation reels',
    images: ['/images/logo-256x256.png'],
  },
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="64x64" href="/images/logo-64x64.png" />
        <link rel="icon" type="image/png" sizes="256x256" href="/images/logo-256x256.png" />
        <link rel="apple-touch-icon" sizes="256x256" href="/images/logo-256x256.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className={`${jetbrainsMono.variable} font-mono bg-white text-black antialiased`}>
        {children}
      </body>
    </html>
  );
}