import type { Attendance, AttendanceForm } from "../types";
import { request } from "./client";

function toAttendanceRequest(data: AttendanceForm) {
  const toTimeSpan = (value: string) =>
    value ? `${value}:00` : null;

  return {
    ...data,
    checkIn: toTimeSpan(data.checkIn),
    checkOut: toTimeSpan(data.checkOut),
  };
}

// Attendance API
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
