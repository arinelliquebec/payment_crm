// src/app/dashboard/page.tsx
"use client";

import MainLayout from "@/components/MainLayout";
import DashboardMUI from "@/components/DashboardMUI";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardMUI />
      </MainLayout>
    </ProtectedRoute>
  );
}
