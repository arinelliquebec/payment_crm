import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { FormProvider } from "@/contexts/FormContext";
import { AtividadeProvider } from "@/contexts/AtividadeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { QueryProvider } from "@/core/providers/QueryProvider";
import ConditionalRouteGuard from "@/components/ConditionalRouteGuard";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import ThemeRegistry from "@/components/ThemeRegistry";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arrighi Advogados - CRM",
  description:
    "Sistema de Gestão de Relacionamento com Cliente para Arrighi Advogados",
  keywords: ["CRM", "Advogados", "Gestão", "Clientes", "Jurídico"],
  authors: [{ name: "Arrighi Advogados" }],
  icons: {
    icon: "/arrighi.jpeg",
    shortcut: "/arrighi.jpeg",
    apple: "/arrighi.jpeg",
  },
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
        className={`${inter.variable} ${plusJakartaSans.variable} h-full antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <AtividadeProvider>
                <FormProvider>
                  <ConditionalRouteGuard>
                    <ThemeRegistry>
                      <Analytics />
                      {children}
                    </ThemeRegistry>
                  </ConditionalRouteGuard>
                </FormProvider>
              </AtividadeProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
