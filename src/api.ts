import type { Department, Employee, EmployeeForm } from "./types";

// ASP.NET Core Web API base URL
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://localhost:54778/api"
).replace(/\/+$/, "");


export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  expiresInMinutes: number;
  user: {
    id: string;
    fullName: string;
    email: string;
  };
}

// JWT token storage
export const authStorage = {
  getToken: (): string | null => localStorage.getItem("token"),

  saveToken: (token: string): void => {
    localStorage.setItem("token", token);
  },

  clearToken: (): void => {
    localStorage.removeItem("token");
  }
};

// Common API request function
async function request<T>(
  path: string,
  options: RequestInit = {},
  includeToken = true
): Promise<T> {
  const token = includeToken ? authStorage.getToken() : null;

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const message = await response.text();

    if (response.status === 401) {
      throw new Error(
        "401 Unauthorized: Please log in again or check the JWT token."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "403 Forbidden: You do not have permission to perform this action."
      );
    }

    throw new Error(
      `${response.status} ${response.statusText}${
        message ? ` — ${message}` : ""
      }`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  return (text ? JSON.parse(text) : undefined) as T;
}

// Authentication API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await request<LoginResponse>(
      "/Auth/login",
      {
        method: "POST",
        body: JSON.stringify(data)
      },
      false
    );

    authStorage.saveToken(response.token);

    return response;
  },

  logout: (): void => {
    authStorage.clearToken();
  }
};

// Employees API
export const employeeApi = {
  getAll: () => request<Employee[]>("/Employees"),

  create: (data: EmployeeForm) =>
    request<Employee>("/Employees", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  update: (id: number, data: EmployeeForm) =>
    request<Employee>(`/Employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    }),

  delete: (id: number) =>
    request<void>(`/Employees/${id}`, {
      method: "DELETE"
    })
};

// Departments API
export const departmentApi = {
  getAll: () => request<Department[]>("/Departments")
};
