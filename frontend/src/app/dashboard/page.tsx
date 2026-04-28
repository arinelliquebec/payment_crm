// src/app/dashboard/page.tsx
"use client";

import MainLayout from "@/components/MainLayout";
import Dashboard from "@/components/Dashboard";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <Dashboard />
      </MainLayout>
    </ProtectedRoute>
  );
}
