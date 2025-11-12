import { Navigate, Outlet, useLocation } from "react-router-dom";

import { AppNav } from "./AppNav";
import { useAuth } from "@/context/AuthContext";

export function ProtectedLayout() {
  const { token } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <AppNav />
      <Outlet />
    </div>
  );
}
