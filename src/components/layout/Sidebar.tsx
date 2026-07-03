import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Building2 } from "lucide-react";
import { adminNavItems } from "../../config/adminNav";

interface Props {
  isOpen: boolean;      // mobile off-canvas state
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`fixed md:static z-40 top-0 left-0 h-full bg-white shadow-lg
          flex flex-col
          w-64 ${expanded ? "md:w-64" : "md:w-20"}
          transition-transform md:transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-12 flex items-center gap-2 border-b border-gray-100 px-4 shrink-0 justify-start md:justify-center">
          <Building2 size={22} className="shrink-0" />
          <span
            className={`font-semibold whitespace-nowrap overflow-hidden
              opacity-100 max-w-[160px]
              md:transition-all md:duration-200
              ${expanded ? "md:opacity-100 md:max-w-[160px] md:ml-0" : "md:opacity-0 md:max-w-0"}`}
          >
            JNPV School
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {adminNavItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={onClose}
              title={!expanded ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                justify-start md:justify-center
                ${isActive
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-600 hover:bg-gray-100"
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span
                className={`whitespace-nowrap overflow-hidden
                  opacity-100 max-w-[160px]
                  md:transition-all md:duration-200
                  ${expanded ? "md:opacity-100 md:max-w-[160px]" : "md:opacity-0 md:max-w-0"}`}
              >
                {label}
              </span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}