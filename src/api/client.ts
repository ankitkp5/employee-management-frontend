import { API_BASE_URL } from "../config/env";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
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
export async function request<T>(
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
export async function downloadReport(
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
