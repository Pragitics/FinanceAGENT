import { Outlet } from "react-router-dom";

import { AppNav } from "./AppNav";

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <Outlet />
    </div>
  );
}
