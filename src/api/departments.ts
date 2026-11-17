import type { Department } from "../types";
import { request } from "./client";

// Departments API
export const departmentApi = {
  getAll: () => request<Department[]>("/Departments"),
};
