
import { LuUsers } from "react-icons/lu";
import { PiStudent } from "react-icons/pi";

export interface AdminNavItem {
  label: string;      // shown in sidebar AND as header title
  path: string;       // flat route, e.g. "/users"
  icon: any;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Users", path: "/users", icon: LuUsers },
  { label: "Students", path: "/students", icon: PiStudent },
];