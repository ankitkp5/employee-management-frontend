import type { AttendanceForm, EmployeeForm } from "../types";
import { today } from "./format";

export const blankEmployee = (): EmployeeForm => ({
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  departmentId: 0,
  designation: "",
  joiningDate: today(),
  salary: 0,
  employmentStatus: "Active",
});

export const blankAttendance = (): AttendanceForm => ({
  employeeId: 0,
  attendanceDate: today(),
  status: "Present",
  checkIn: "09:00",
  checkOut: "18:00",
  remarks: "",
});
