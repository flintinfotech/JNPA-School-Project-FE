
import { LuUsers } from "react-icons/lu";
import { MdOutlineSubject } from "react-icons/md";
import { MdAssignment } from "react-icons/md";
import { PiBookOpenText, PiCalendarBlank, PiClipboardText, PiGraduationCap, PiStudent } from "react-icons/pi";

// import { PiBookOpenText, PiCalendarBlank, PiClipboardText, PiGraduationCap, PiStudent} from "react-icons/pi";
import { MdClass } from "react-icons/md";

import { ImProfile } from "react-icons/im";


export interface AdminNavItem {
  label: string;      // shown in sidebar AND as header title
  path: string;       // flat route, e.g. "/users"
  icon: any;
}

export const adminNavItems: AdminNavItem[] = [
  { label: "Users", path: "/users", icon: LuUsers },
  { label: "Students", path: "/students", icon: PiStudent },
  { label: "Academics", path: "/academics-admin", icon: PiBookOpenText },
  { label: "Events & News", path: "/events-and-news", icon: PiCalendarBlank },
  { label: "Exam & Results", path: "/exam-and-results", icon: PiClipboardText },
  { label: "Admission", path: "/admissions-admin", icon: PiGraduationCap },
  { label: "Subjects Master", path: "/subjects-master", icon: MdOutlineSubject },
  { label: "Class Master",path: "/class-master",icon: MdClass },
  
   {label:"Employee Details",path:"/update-user",icon:ImProfile},
  
  { label: "Subject Assignment", path: "/subject-assignment", icon: MdAssignment },

];