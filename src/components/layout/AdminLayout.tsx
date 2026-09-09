import { useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { isScreenAllowed, firstAllowedPath } from "../../services/Screens";

interface Props {
  isAuthenticated: boolean;
  onLogout: () => void;
}

export default function AdminLayout({ isAuthenticated, onLogout }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (!isAuthenticated) {
    const isParent = localStorage.getItem("isParent") === "true";
    return <Navigate to={isParent ? "/parent-login" : "/login"} replace />;
  }

  // 🛠️ FIX — Clicking "Student Homework" (or any screen other than Student
  // Profile) as a parent silently bounced straight back to
  // /student-profile, with no API call ever firing.
  //
  // Root cause: this used to hard-lock every parent to paths starting with
  // "/student-profile" — completely regardless of what "screens" the
  // backend actually returned for that user at login:
  //
  //   const isParent = localStorage.getItem("isParent") === "true";
  //   if (isParent && !location.pathname.startsWith("/student-profile")) {
  //     return <Navigate to="/student-profile" replace />;
  //   }
  //
  // This check ran on every render, BEFORE the screen-level
  // isScreenAllowed() check below (which was also skipped for parents via
  // `!isParent &&`). So even after fixing useAuth.ts to store the real
  // backend-assigned screens, and even with "Student Homework" showing up
  // correctly in the Sidebar, navigating to /student-homework as a parent
  // would immediately get redirected back to /student-profile by THIS
  // block — the StudentHomework component never got a chance to mount, so
  // it never had a chance to call its API either.
  //
  // Fix: drop the parent-only hardcoded lock, and let isScreenAllowed()
  // (which already reads the same localStorage "screens" list for both
  // parents and staff/admin) be the single source of truth for what paths
  // any logged-in user — parent or not — can reach.
  if (!isScreenAllowed(location.pathname)) {
    const fallback = firstAllowedPath();

    if (fallback && fallback !== location.pathname) {
      return <Navigate to={fallback} replace />;
    }

    // No accessible screens at all (or the fallback is itself blocked) —
    // show a friendly message instead of looping redirects.
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            You don't have access to any screens yet. Please contact your
            administrator to get the right screens assigned to your account.
          </p>
          <button
            onClick={onLogout}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            Log out
          </button>
        </div>
      </div>
    );
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