// apps/web/src/components/ProtectedRoute.tsx
import type React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { status } = useAuth();

  if (status === "loading") return <div className="app-loading">loading...</div>;
  if (status !== "authed") return <Navigate to="/login" replace />;
  return children;
}
