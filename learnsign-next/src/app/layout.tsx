import type { Metadata } from "next";
import { Poppins, Fredoka } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
});

// Rounded, friendly display font for headings — kid-appropriate.
const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "LearnSign — Learn Indian Sign Language",
    template: "%s · LearnSign",
  },
  description:
    "Interactive, AI-powered platform for learning Indian Sign Language (ISL).",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${fredoka.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
