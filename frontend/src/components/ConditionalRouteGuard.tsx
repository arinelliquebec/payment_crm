"use client";

import { usePathname } from "next/navigation";
import RouteGuard from "./RouteGuard";

interface ConditionalRouteGuardProps {
  children: React.ReactNode;
}

export default function ConditionalRouteGuard({
  children,
}: ConditionalRouteGuardProps) {
  const pathname = usePathname();

  // Páginas que não precisam de proteção
  const publicPages = ["/login", "/cadastro"];

  if (publicPages.includes(pathname)) {
    return <>{children}</>;
  }

  return <RouteGuard>{children}</RouteGuard>;
}
