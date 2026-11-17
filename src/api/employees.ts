import type { Employee, EmployeeForm } from "../types";
import { request } from "./client";

// Employees API
export const employeeApi = {
  getAll: () => request<Employee[]>("/Employees"),

  create: (data: EmployeeForm) =>
    request<Employee>("/Employees", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: EmployeeForm) =>
    request<Employee>(`/Employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/Employees/${id}`, {
      method: "DELETE",
    }),
};
