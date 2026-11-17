import { useCallback, useEffect, useState } from "react";
import {
  attendanceApi,
  dashboardApi,
  departmentApi,
  employeeApi,
} from "../api";
import type {
  AttendanceRow,
  DashboardSummary,
  Department,
  DepartmentDistribution,
  Employee,
  HiringTrend,
} from "../types";

// Loads and holds all server data shared by the pages.
export function useAppData(
  enabled: boolean,
  setError: (message: string) => void
) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [distribution, setDistribution] = useState<
    DepartmentDistribution[]
  >([]);
  const [hiring, setHiring] = useState<HiringTrend[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        employeeApi.getAll(),
        departmentApi.getAll(),
        dashboardApi.getSummary(),
        dashboardApi.getDepartmentDistribution(),
        dashboardApi.getHiringTrend(),
        attendanceApi.getAll(),
      ]);

      const labels = [
        "Employees",
        "Departments",
        "Dashboard summary",
        "Department chart",
        "Hiring chart",
        "Attendance",
      ];

      const failures: string[] = [];

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failures.push(
            `${labels[index]}: ${
              result.reason instanceof Error
                ? result.reason.message
                : "Request failed"
            }`
          );

          return;
        }

        const value = result.value;

        switch (index) {
          case 0:
            setEmployees(
              Array.isArray(value) ? (value as Employee[]) : []
            );
            break;

          case 1:
            setDepartments(
              Array.isArray(value) ? (value as Department[]) : []
            );
            break;

          case 2:
            setSummary(value as DashboardSummary);
            break;

          case 3:
            setDistribution(
              Array.isArray(value)
                ? (value as DepartmentDistribution[])
                : []
            );
            break;

          case 4:
            setHiring(
              Array.isArray(value) ? (value as HiringTrend[]) : []
            );
            break;

          case 5:
            setAttendance(
              Array.isArray(value) ? (value as AttendanceRow[]) : []
            );
            break;
        }
      });

      if (failures.length > 0) {
        setError(failures.join(" | "));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load application data."
      );
    } finally {
      setLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    if (enabled) {
      void loadData();
    }
  }, [enabled, loadData]);

  // Clear everything (used on sign out).
  const reset = useCallback(() => {
    setEmployees([]);
    setDepartments([]);
    setSummary(null);
    setDistribution([]);
    setHiring([]);
    setAttendance([]);
  }, []);

  return {
    employees,
    departments,
    summary,
    distribution,
    hiring,
    attendance,
    loading,
    loadData,
    reset,
  };
}
