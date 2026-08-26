import { LuUsers } from "react-icons/lu";
import { MdOutlineSubject ,MdDashboard} from "react-icons/md";
import { MdAssignment } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { CgWebsite } from "react-icons/cg";
import { BsCash, BsFillClipboard2DataFill } from "react-icons/bs";
import { MdAssignmentTurnedIn } from "react-icons/md";
import { GrCircleInformation } from "react-icons/gr";
import { RiMedalLine } from "react-icons/ri";
import { SlCalender } from "react-icons/sl";
import {
  PiBookOpenText,
  PiCalendarBlank,
  PiClipboardText,
  PiGraduationCap,
  PiStudent,
  PiStudentFill,
} from "react-icons/pi";


import { MdClass } from "react-icons/md";

import { ImProfile } from "react-icons/im";
import { Label } from "recharts";

// A single flat/clickable nav link
export interface AdminNavLink {
  label: string; // shown in sidebar AND as header title
  path: string; // flat route, e.g. "/users"
  icon: any;
  hideInSidebar?: boolean;
}

// A collapsible group of nav links (e.g. "Administrator" -> Users, Employee Details)
export interface AdminNavGroup {
  label: string; // group header label, e.g. "Administrator"
  icon?: any; // optional group header icon
  children: AdminNavLink[];
}

export type AdminNavEntry = AdminNavLink | AdminNavGroup;

// Type guard used by the Sidebar to tell links apart from groups
export const isAdminNavGroup = (
  entry: AdminNavEntry
): entry is AdminNavGroup => {
  return (entry as AdminNavGroup).children !== undefined;
};

export const adminNavItems: AdminNavEntry[] = [
   {
    label:"Dashboard",
    path: "/dashboard",
    icon: MdDashboard,
  },
  
  {
  label: "Administrator",
  icon: MdOutlineAdminPanelSettings,
  children: [
    
    { label: "Employee Details", path: "/update-user", icon: ImProfile },
    { label: "Users", path: "/users", icon: LuUsers },
    { label: "Students", path: "/students", icon: PiStudent },
    { label: "Admission Inquiry", path:"/admission-inquiry",icon:GrCircleInformation},
  ],
},

  {
    label: "Masters",
    icon: BsFillClipboard2DataFill,
    children: [
      { label: "Subject Master", path: "/subjects-master", icon: MdOutlineSubject },
      { label: "Class Master", path: "/class-master", icon: MdClass },     
    ],
  },
    {
    label: "Website Module",
    icon: CgWebsite,
    children: [
  { label: "Academics Screen", path: "/academics-admin", icon: PiBookOpenText },
  { label: "Events & News Screen", path: "/events-and-news", icon: PiCalendarBlank },
  { label: "Exam & Results Screen", path: "/exam-and-results", icon: PiClipboardText },
  { label: "Admission Screen", path: "/admissions-admin", icon: PiGraduationCap },
     
    ],
  },
    {
    label: "Academics Module",
    icon: MdAssignmentTurnedIn,
    children: [
       { label: "Subject Assignment", path: "/subject-assignment", icon: MdAssignment },
       {label: "Teacher Subjects",path: "/teacher-subjects",icon: FaChalkboardTeacher,},
        {label:"Results", path:"/results",icon:PiClipboardText},
        {label:"Achievements",path:"/achievements",icon:RiMedalLine },
        {label:"Academic calendar", path:"/academic-calender", icon:SlCalender},
    ],
  },
  {label: "Profile",path: "/profile",icon: ImProfile,hideInSidebar: true,},
  {
    label:"Student Profile", path:"/student-profile",icon:PiStudentFill
  },
  {
    label:"Student Fees", path:"/student-fees",icon:BsCash
  }
 
 
];
