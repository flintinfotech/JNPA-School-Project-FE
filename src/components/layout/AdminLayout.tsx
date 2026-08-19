import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminLayout({ isAuthenticated, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isParent = localStorage.getItem("isParent") === "true";
  if (isParent && !location.pathname.startsWith("/student-profile")) {
    return <Navigate to="/student-profile" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onLogout={onLogout} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet context={{ onLogout }} />   {/* 👈 add context here */}
        </main>
      </div>
    </div>
  );
}