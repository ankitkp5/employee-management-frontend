import type {
  DashboardSummary,
  DepartmentDistribution,
  HiringTrend,
} from "../types";
import { request } from "./client";

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
