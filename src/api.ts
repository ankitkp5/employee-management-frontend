import type { Department, Employee, EmployeeForm } from "./types";

// Change VITE_API_BASE_URL in .env if your API runs on a different port.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "https://localhost:54778/api").replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`${response.status} ${response.statusText}${message ? ` — ${message}` : ""}`);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const employeeApi = {
  getAll: () => request<Employee[]>("/Employees"),
  create: (data: EmployeeForm) => request<Employee>("/Employees", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: EmployeeForm) => request<Employee>(`/Employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/Employees/${id}`, { method: "DELETE" })
};

export const departmentApi = {
  getAll: () => request<Department[]>("/Departments")
};