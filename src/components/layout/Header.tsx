import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, UserCircle, User } from "lucide-react";
import { adminNavItems, isAdminNavGroup } from "../../config/adminNav";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function Header({ onLogout, onMenuClick }: Props) {
  const location = useLocation();
  const navigate = useNavigate();

  // Flatten links (including group children) so we can find the title
  // regardless of whether the current route is a flat link or nested
  // inside a collapsible group like "Administrator".
  const current = adminNavItems
    .flatMap((item) => (isAdminNavGroup(item) ? item.children : [item]))
    .find((link) => link.path === location.pathname);

  const { user } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
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

  // Mount/unmount the dropdown with a slight delay so the exit animation can play
  useEffect(() => {
    if (profileOpen) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => setShouldRender(false), 150);
      return () => clearTimeout(timeout);
    }
  }, [profileOpen]);

  const displayName = user?.firstName
  ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
  : user?.userName ?? "User";

  const handleProfileClick = () => {
    setProfileOpen(false);
    navigate("/profile");
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 md:px-6 bg-[#cb4e38] shadow-sm relative z-20">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="md:hidden text-gray-600">
          <Menu size={22} />
        </button>
        <h1 className="text-lg font-semibold text-white">
          {current?.label ?? "Profile"}
        </h1>
      </div>

      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex items-center justify-center rounded-full hover:bg-white/20 p-0.5 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <UserCircle size={30} className="text-white" />
        </button>

        {shouldRender && (
          <div
            className={`absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-3 z-50 origin-top-right transition-all duration-150 ease-out ${
              profileOpen
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-95 -translate-y-1"
            }`}
          >
            <div className="px-4 pb-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-800">
                {displayName}
              </p>
            </div>

            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-2 px-4 py-2 mt-2 text-sm text-blue-500 hover:bg-blue-50 transition-colors"
            >
              <User size={16} />
              Profile
            </button>

            <button
              onClick={() => {
                setProfileOpen(false);
                onLogout();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
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