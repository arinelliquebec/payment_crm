import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FormProvider } from "@/contexts/FormContext";
import { AtividadeProvider } from "@/contexts/AtividadeContext";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arrighi Advogados - CRM",
  description:
    "Sistema de Gestão de Relacionamento com Cliente para Arrighi Advogados",
  keywords: ["CRM", "Advogados", "Gestão", "Clientes", "Jurídico"],
  authors: [{ name: "Arrighi Advogados" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <AuthProvider>
          <AtividadeProvider>
            <FormProvider>{children}</FormProvider>
          </AtividadeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
