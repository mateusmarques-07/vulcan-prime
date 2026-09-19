import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vulcan Prime - Comandas",
  description: "Sistema de comandas e controle de salão do Vulcan Prime",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="min-h-full bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}
