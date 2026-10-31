import type {
  Department,
  Employee,
  EmployeeForm,
  DashboardSummary,
  DepartmentDistribution,
  HiringTrend,
  Attendance,
  AttendanceForm,
} from "./types";

// ASP.NET Core Web API base URL.
// Update the port if your backend uses a different HTTPS port.
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://localhost:54778/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

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
  },
};

// Common API request function
async function request<T>(
  path: string,
  options: RequestInit = {},
  includeToken = true
): Promise<T> {
  const token = includeToken ? authStorage.getToken() : null;
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the API at ${API_BASE_URL}. Check whether the backend is running and the URL is correct.`
    );
  }

  if (!response.ok) {
    const message = await response.text();

    if (response.status === 401) {
      throw new Error(
        "401 Unauthorized: Your session may have expired. Please log in again."
      );
    }

    if (response.status === 403) {
      throw new Error(
        "403 Forbidden: You do not have permission to perform this action."
      );
    }

    throw new ApiError(
      response.status,
      `${response.status} ${response.statusText}${
        message ? ` — ${message}` : ""
      }`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// Download Excel/PDF reports
async function downloadReport(
  path: string,
  fileName: string
): Promise<void> {
  const token = authStorage.getToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to the API at ${API_BASE_URL}. Check whether the backend is running.`
    );
  }

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `${response.status} ${response.statusText}${
        message ? ` — ${message}` : ""
      }`
    );
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = downloadUrl;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

// Authentication API
export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await request<LoginResponse>(
      "/Auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false
    );

    authStorage.saveToken(response.token);
    return response;
  },

  logout: (): void => {
    authStorage.clearToken();
  },
};

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

// Departments API
export const departmentApi = {
  getAll: () => request<Department[]>("/Departments"),
};

// Dashboard API
export const dashboardApi = {
  getSummary: () => request<DashboardSummary>("/Dashboard/summary"),

  getDepartmentDistribution: () =>
    request<DepartmentDistribution[]>(
      "/Dashboard/department-distribution"
    ),

  getHiringTrend: () =>
    request<HiringTrend[]>("/Dashboard/hiring-trend"),
};

// Attendance API
function toAttendanceRequest(data: AttendanceForm) {
  const toTimeSpan = (value: string) =>
    value ? `${value}:00` : null;

  return {
    ...data,
    checkIn: toTimeSpan(data.checkIn),
    checkOut: toTimeSpan(data.checkOut),
  };
}

export const attendanceApi = {
  getAll: () => request<Attendance[]>("/Attendance"),

  getById: (id: number) =>
    request<Attendance>(`/Attendance/${id}`),

  create: (data: AttendanceForm) =>
    request<Attendance>("/Attendance", {
      method: "POST",
      body: JSON.stringify(toAttendanceRequest(data)),
    }),

  update: (id: number, data: AttendanceForm) =>
    request<Attendance>(`/Attendance/${id}`, {
      method: "PUT",
      body: JSON.stringify(toAttendanceRequest(data)),
    }),

  delete: (id: number) =>
    request<void>(`/Attendance/${id}`, {
      method: "DELETE",
    }),
};

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