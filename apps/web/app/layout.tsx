import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"]
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "Gestor Personal",
  description: "Dashboard personal para tareas, hábitos, finanzas y ahorro"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`}>{children}</body>
    </html>
  );
}

