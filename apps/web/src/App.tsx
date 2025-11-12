import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedLayout } from "@/components/common/ProtectedLayout";
import { PublicLayout } from "@/components/common/PublicLayout";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { KiteRedirectPage } from "@/pages/KiteRedirectPage";
import { WatchlistPage } from "@/pages/WatchlistPage";

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/redirect" element={<KiteRedirectPage />} />
          </Route>
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
