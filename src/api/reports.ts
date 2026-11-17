import { downloadReport } from "./client";

// Reports API
export const reportsApi = {
  exportEmployeesExcel: () =>
    downloadReport("/Reports/employees/excel", "Employees.xlsx"),

  exportEmployeesPdf: () =>
    downloadReport("/Reports/employees/pdf", "Employees.pdf"),

  exportSalariesExcel: () =>
    downloadReport("/Reports/salaries/excel", "Salary-Report.xlsx"),

  exportAttendanceExcel: (from: string, to: string) =>
    downloadReport(
      `/Reports/attendance/excel?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`,
      "Attendance-Report.xlsx"
    ),
};
