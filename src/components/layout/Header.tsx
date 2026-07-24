import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LogOut, Menu, UserCircle } from "lucide-react";
import { adminNavItems, isAdminNavGroup } from "../../config/adminNav";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function Header({ onLogout, onMenuClick }: Props) {
  const location = useLocation();

  // Flatten links (including group children) so we can find the title
  // regardless of whether the current route is a flat link or nested
  // inside a collapsible group like "Administrator".
  const current = adminNavItems
    .flatMap((item) => (isAdminNavGroup(item) ? item.children : [item]))
    .find((link) => link.path === location.pathname);

  const { user } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-12 flex items-center justify-between px-4 md:px-6 bg-[#cb4e38] shadow-sm relative z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-gray-600">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-white">
          {current?.label ?? "Dashboard"}
        </h1>
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex items-center justify-center rounded-full hover:bg-gray-400 p-0.5 transition-colors"
        >
          <UserCircle size={30} className="text-white" />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50">
            <div className="px-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">
                {user?.username ?? "User"}
              </p>
            </div>
            <button
              onClick={() => {
                setProfileOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 mt-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}