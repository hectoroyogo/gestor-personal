import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";

import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"]
});

const syne = Syne({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"]
});

export const metadata: Metadata = {
  title: "Nexus - Gestor Personal",
  description: "Dashboard personal para tareas, hábitos, finanzas y ahorro"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark">
      <body className={`${jakarta.variable} ${syne.variable}`}>{children}</body>
    </html>
  );
}
