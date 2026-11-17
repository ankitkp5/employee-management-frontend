import { useMemo, useState, type FormEvent } from "react";
import { attendanceApi } from "../api";
import PageHeading from "../components/layout/PageHeading";
import { attendanceStatuses } from "../constants";
import type { Feedback } from "../hooks/useFeedback";
import type {
  AttendanceForm,
  AttendanceRow,
  AttendanceStatus,
  Employee,
} from "../types";
import { badge, dateText, inputTime, today } from "../utils/format";
import { blankAttendance } from "../utils/forms";

interface AttendancePageProps {
  employees: Employee[];
  attendance: AttendanceRow[];
  loading: boolean;
  feedback: Feedback;
  reload: () => Promise<void>;
}

export default function AttendancePage({
  employees,
  attendance,
  loading,
  feedback,
  reload,
}: AttendancePageProps) {
  const { setError, setNotice } = feedback;

  const [attendanceForm, setAttendanceForm] =
    useState<AttendanceForm>(blankAttendance);
  const [editingAttendance, setEditingAttendance] = useState<number | null>(
    null
  );
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [saving, setSaving] = useState(false);

  const filteredAttendance = useMemo(() => {
    return attendanceFilter
      ? attendance.filter(
          (item) => item.attendanceDate?.slice(0, 10) === attendanceFilter
        )
      : attendance;
  }, [attendance, attendanceFilter]);

  function attendanceField<K extends keyof AttendanceForm>(
    key: K,
    value: AttendanceForm[K]
  ) {
    setAttendanceForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetAttendance() {
    setEditingAttendance(null);
    setAttendanceForm(blankAttendance());
  }

  function editAttendance(item: AttendanceRow) {
    setEditingAttendance(item.attendanceId);

    setAttendanceForm({
      employeeId: item.employeeId,
      attendanceDate: item.attendanceDate?.slice(0, 10) || today(),
      status: item.status,
      checkIn: inputTime(item.checkIn),
      checkOut: inputTime(item.checkOut),
      remarks: item.remarks || "",
    });

    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!attendanceForm.employeeId) {
      setError("Please select an employee.");
      return;
    }

    setSaving(true);

    try {
      const payload: AttendanceForm = {
        ...attendanceForm,
        checkIn: attendanceForm.checkIn || "",
        checkOut: attendanceForm.checkOut || "",
        remarks: attendanceForm.remarks.trim(),
      };

      if (editingAttendance !== null) {
        await attendanceApi.update(editingAttendance, payload);
        setNotice("Attendance updated successfully.");
      } else {
        await attendanceApi.create(payload);
        setNotice("Attendance saved successfully.");
      }

      resetAttendance();
      await reload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAttendance(item: AttendanceRow) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this attendance record?"
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await attendanceApi.delete(item.attendanceId);

      if (editingAttendance === item.attendanceId) {
        resetAttendance();
      }

      setNotice("Attendance record deleted successfully.");
      await reload();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete attendance record."
      );
    }
  }

  return (
    <>
      <PageHeading
        title="Attendance"
        subtitle="Record daily attendance and maintain employee attendance history"
      />

      <div className="panel form-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">
              {editingAttendance !== null ? "EDIT RECORD" : "DAILY RECORD"}
            </div>
            <h2>
              {editingAttendance !== null
                ? "Update Attendance"
                : "Mark Attendance"}
            </h2>
          </div>

          {editingAttendance !== null && (
            <button
              type="button"
              className="btn refresh-btn"
              onClick={resetAttendance}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form onSubmit={saveAttendance}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="attendanceEmployee">Employee *</label>
              <select
                id="attendanceEmployee"
                className="form-select"
                value={attendanceForm.employeeId || ""}
                onChange={(event) =>
                  attendanceField("employeeId", Number(event.target.value))
                }
                required
              >
                <option value="">Select employee</option>

                {employees.map((employee) => (
                  <option key={employee.employeeId} value={employee.employeeId}>
                    {employee.employeeCode} — {employee.firstName}{" "}
                    {employee.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="attendanceDate">Date *</label>
              <input
                id="attendanceDate"
                type="date"
                className="form-control"
                value={attendanceForm.attendanceDate}
                onChange={(event) =>
                  attendanceField("attendanceDate", event.target.value)
                }
                required
              />
            </div>

            <div className="field">
              <label htmlFor="attendanceStatus">Status *</label>
              <select
                id="attendanceStatus"
                className="form-select"
                value={attendanceForm.status}
                onChange={(event) =>
                  attendanceField(
                    "status",
                    event.target.value as AttendanceStatus
                  )
                }
              >
                {attendanceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="attendanceCheckIn">Check In</label>
              <input
                id="attendanceCheckIn"
                type="time"
                className="form-control"
                value={attendanceForm.checkIn}
                onChange={(event) =>
                  attendanceField("checkIn", event.target.value)
                }
              />
            </div>

            <div className="field">
              <label htmlFor="attendanceCheckOut">Check Out</label>
              <input
                id="attendanceCheckOut"
                type="time"
                className="form-control"
                value={attendanceForm.checkOut}
                onChange={(event) =>
                  attendanceField("checkOut", event.target.value)
                }
              />
            </div>

            <div className="field">
              <label htmlFor="attendanceRemarks">Remarks</label>
              <input
                id="attendanceRemarks"
                className="form-control"
                value={attendanceForm.remarks}
                onChange={(event) =>
                  attendanceField("remarks", event.target.value)
                }
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary submit-btn"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editingAttendance !== null
                ? "Update Attendance"
                : "Save Attendance"}
          </button>
        </form>
      </div>

      <div className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <div className="eyebrow">ATTENDANCE HISTORY</div>
            <h2>Attendance Records</h2>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <input
              type="date"
              className="form-control"
              aria-label="Filter attendance by date"
              value={attendanceFilter}
              onChange={(event) => setAttendanceFilter(event.target.value)}
            />

            <button
              type="button"
              className="btn refresh-btn"
              onClick={() => setAttendanceFilter("")}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>CHECK IN</th>
                <th>CHECK OUT</th>
                <th>REMARKS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-message">
                    {loading
                      ? "Loading attendance..."
                      : "No attendance records found."}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((item) => {
                  const employee = employees.find(
                    (record) => record.employeeId === item.employeeId
                  );

                  const employeeName =
                    item.employeeName ||
                    (employee
                      ? `${employee.firstName} ${employee.lastName}`
                      : `Employee #${item.employeeId}`);

                  return (
                    <tr key={item.attendanceId}>
                      <td>
                        <strong>{employeeName}</strong>
                        <br />
                        <small>
                          {item.employeeCode || employee?.employeeCode || ""}
                        </small>
                      </td>

                      <td>{dateText(item.attendanceDate)}</td>

                      <td>
                        <span className={badge(item.status)}>
                          {item.status}
                        </span>
                      </td>

                      <td>{inputTime(item.checkIn) || "—"}</td>
                      <td>{inputTime(item.checkOut) || "—"}</td>
                      <td>{item.remarks || "—"}</td>

                      <td>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => editAttendance(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => void deleteAttendance(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          Showing {filteredAttendance.length} of {attendance.length} records
        </div>
      </div>
    </>
  );
}
