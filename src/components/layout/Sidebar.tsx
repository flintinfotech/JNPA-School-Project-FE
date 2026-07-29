import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Building2, ChevronDown } from "lucide-react";
import { adminNavItems, isAdminNavGroup } from "../../config/adminNav";

interface Props {
  isOpen: boolean; // mobile off-canvas state
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: Props) {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();


  const allowedScreens = JSON.parse(
  localStorage.getItem("screens") || "[]"
);

const screenNames = allowedScreens.map((item: any) =>
  item.screenName.toLowerCase()
);
  // Tracks which dropdown groups are open, keyed by group label.
  // A group auto-opens if the current route matches one of its children.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    adminNavItems.forEach((item) => {
      if (isAdminNavGroup(item)) {
        initial[item.label] = item.children.some(
          (child) => child.path === location.pathname
        );
      }
    });
    return initial;
  });

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => {
      const isCurrentlyOpen = prev[label];

      // Accordion behavior: closing all groups first, then opening
      // only the clicked one (unless it was already open, in which
      // case we just close it).
      const allClosed: Record<string, boolean> = {};
      adminNavItems.forEach((item) => {
        if (isAdminNavGroup(item)) {
          allClosed[item.label] = false;
        }
      });

      return {
        ...allClosed,
        [label]: !isCurrentlyOpen,
      };
    });
  };

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
        className={`fixed md:static z-40 top-0 left-0 h-full bg-[#FFF7ED] shadow-lg
          flex flex-col
          w-64 ${expanded ? "md:w-64" : "md:w-20"}
          transition-transform md:transition-all duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="h-12 flex items-center gap-2 border-b border-gray-300 px-4 shrink-0 justify-start md:justify-center">
          <Building2 size={22} className="shrink-0 text-red-500" />
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
          {adminNavItems
  .map((item) => {
    if (isAdminNavGroup(item)) {
      return {
        ...item,
        children: item.children.filter((child) =>
          screenNames.includes(child.label.toLowerCase())
        ),
      };
    }

    return item;
  })
  .filter((item) => {
    if (isAdminNavGroup(item)) {
      return item.children.length > 0;
    }

    return screenNames.includes(item.label.toLowerCase());
  })
  .map((item) => {
            // ============================
            // Collapsible Group
            // ============================
            if (isAdminNavGroup(item)) {
              const Icon = item.icon;
              const isOpenGroup = openGroups[item.label];
              const hasIcon = Boolean(Icon);
              const isChildActive = item.children.some(
                (child) => child.path === location.pathname
              );

              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    title={!expanded ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      justify-start md:justify-center
                      ${
                        isChildActive
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {hasIcon && <Icon size={18} className="shrink-0" />}

                    <span
                      className={`flex-1 text-left whitespace-nowrap overflow-hidden
                        opacity-100 max-w-[160px]
                        md:transition-all md:duration-200
                        ${expanded ? "md:opacity-100 md:max-w-[160px]" : "md:opacity-0 md:max-w-0"}`}
                    >
                      {item.label}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform duration-200
                        ${isOpenGroup ? "rotate-180" : "rotate-0"}
                        ${expanded ? "opacity-100 max-w-[16px]" : "md:opacity-0 md:max-w-0 md:overflow-hidden"}`}
                    />
                  </button>

                  {/* Group children (dropdown) */}
                  <div
                    className={`overflow-hidden transition-all duration-200 ease-in-out
                      ${isOpenGroup && expanded ? "max-h-96 opacity-100 mt-1" : "max-h-0 opacity-0"}`}
                  >
                    <div className="pl-4 space-y-1">
                      {item.children.map(({ label, path, icon: ChildIcon }) => (
                        <NavLink
                          key={path}
                          to={path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                            ${
                              isActive
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-100"
                            }`
                          }
                        >
                          <ChildIcon size={16} className="shrink-0" />
                          <span className="whitespace-nowrap overflow-hidden">
                            {label}
                          </span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            // ============================
            // Flat Nav Link
            // ============================
            const { label, path, icon: Icon } = item;

            return (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                title={!expanded ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                  justify-start md:justify-center
                  ${
                    isActive
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
            );
          })}
        </nav>
      </aside>
    </>
  );
}