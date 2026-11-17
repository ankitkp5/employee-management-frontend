import type { AttendanceStatus, Page } from "../types";

export const employmentStatuses = [
  "Active",
  "Inactive",
  "Resigned",
  "Terminated",
] as const;

export const attendanceStatuses: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Day",
  "Leave",
];

export const chartColors = ["#7257e8", "#3b82f6", "#10b981", "#f59e0b"];

// Sidebar navigation. Add ["Reports", "▧"] here to show the Reports page.
export const navItems: [Page, string][] = [
  ["Dashboard", "▦"],
  ["Employees", "♙"],
  ["Departments", "▤"],
  ["Attendance", "◷"],
];
