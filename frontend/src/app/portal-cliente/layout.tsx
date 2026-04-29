"use client";

import { ClienteAuthProvider } from "@/contexts/ClienteAuthContext";

export default function PortalClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClienteAuthProvider>{children}</ClienteAuthProvider>;
}

