export interface Department {
  departmentId: number;
  departmentName: string;
  description?: string | null;
}

export interface Employee {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: number;
  departmentName?: string;
  designation?: string | null;
  joiningDate: string;
  salary: number;
  isActive: boolean;
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
  isActive: boolean;
}