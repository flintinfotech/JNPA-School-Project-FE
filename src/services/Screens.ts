import { adminNavItems, isAdminNavGroup, type AdminNavLink } from "../config/adminNav";

// ===========================
// Reads the screens the admin assigned to the current user
// (saved to localStorage at login time as: [{ screenName: "Dashboard" }, ...])
// ===========================
export const getAllowedScreenNames = (): string[] => {
    try {
        const allowedScreens = JSON.parse(localStorage.getItem("screens") || "[]");
        if (!Array.isArray(allowedScreens)) return [];
        return allowedScreens
            .map((item: any) => (item?.screenName || "").toLowerCase())
            .filter(Boolean);
    } catch {
        return [];
    }
};

// Flattens adminNavItems (which may contain grouped children) into one
// simple list of { label, path } entries, since that's what both the
// Sidebar and the route guard need to work with.
const flattenNavLinks = (): AdminNavLink[] => {
    const links: AdminNavLink[] = [];
    adminNavItems.forEach((item) => {
        if (isAdminNavGroup(item)) {
            links.push(...item.children);
        } else {
            links.push(item);
        }
    });
    return links;
};

export const flatAdminNavLinks = flattenNavLinks();

// Finds which nav entry (screen) a given URL path belongs to. Falls back to
// a "starts with" match so dynamic routes like /student-profile/:studentId
// still resolve to their "Student Profile" screen.
export const findScreenForPath = (pathname: string): AdminNavLink | undefined => {
    return (
        flatAdminNavLinks.find((link) => link.path === pathname) ||
        flatAdminNavLinks.find(
            (link) => link.path !== "/" && pathname.startsWith(link.path)
        )
    );
};

// True if the current user is allowed to view this path. Paths that don't
// map to any known screen are left alone (not blocked) — this guard is
// only meant to enforce admin-assigned screens, not act as a generic 404.
export const isScreenAllowed = (pathname: string): boolean => {
    const screen = findScreenForPath(pathname);
    if (!screen) return true;
    return getAllowedScreenNames().includes(screen.label.toLowerCase());
};

// Returns the path of the first screen (in adminNavItems order) that this
// user IS allowed to see, or null if none are assigned at all.
export const firstAllowedPath = (): string | null => {
    const allowed = getAllowedScreenNames();
    const match = flatAdminNavLinks.find((link) =>
        allowed.includes(link.label.toLowerCase())
    );
    return match ? match.path : null;
};