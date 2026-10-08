import type { Metadata, Viewport } from "next";
import { Inter, Poppins, Noto_Sans_Kannada } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

// Kannada glyphs: Poppins/Inter have none, so load Noto Sans Kannada.
const notoKannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-kn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dr. Solanki Eye Hospital — Feedback",
  description: "Out-Patient feedback form for Dr. Solanki Eye Hospital.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e5bb8",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} ${notoKannada.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  );
}
