export type EmploymentStatus =
  | "Active"
  | "Inactive"
  | "Resigned"
  | "Terminated";

export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Half Day"
  | "Leave";

export interface Employee {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: number;
  departmentName?: string | null;
  designation: string;
  joiningDate: string;
  salary: number;
  employmentStatus: EmploymentStatus;
  createdAt?: string;
  updatedAt?: string | null;
}

export interface EmployeeForm {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number;
  designation: string;
  joiningDate: string;
  salary: number;
  employmentStatus: EmploymentStatus;
}

export interface Department {
  departmentId: number;
  departmentName: string;
  description?: string | null;
}

export interface Attendance {
  attendanceId: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn?: string | null;
  checkOut?: string | null;
  remarks?: string | null;
}

export interface AttendanceForm {
  employeeId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  checkIn: string;
  checkOut: string;
  remarks: string;
}

export interface DashboardSummary {
  employees: {
    total: number;
    active: number;
    inactive: number;
    resigned: number;
    terminated: number;
  };
  departments: {
    total: number;
  };
  salary: {
    totalMonthlySalary: number;
  };
  attendance: {
    date: string;
    present: number;
    absent: number;
    halfDay: number;
    leave: number;
    totalMarked: number;
  };
}

export interface DepartmentDistribution {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
}

export interface HiringTrend {
  year: number;
  month: number;
  monthName: string;
  newHires: number;
}