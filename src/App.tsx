import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ApiError,
  authApi,
  authStorage,
  attendanceApi,
  dashboardApi,
  departmentApi,
  employeeApi,
  reportsApi,
} from "./api";

import type {
  Attendance,
  AttendanceForm,
  AttendanceStatus,
  DashboardSummary,
  Department,
  DepartmentDistribution,
  Employee,
  EmployeeForm,
  HiringTrend,
} from "./types";

import {
  ResponsiveContainer,
  // BarChart,
  // Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

type Page =
  | "Dashboard"
  | "Employees"
  | "Departments"
  | "Attendance"
  | "Reports";

type AttendanceRow = Attendance & {
  employeeCode?: string;
  employeeName?: string;
};

const today = () => {
  const date = new Date();
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );
  return localDate.toISOString().slice(0, 10);
};

const statuses = [
  "Active",
  "Inactive",
  "Resigned",
  "Terminated",
] as const;

const attendanceStatuses: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Half Day",
  "Leave",
];

const colors = ["#7257e8", "#3b82f6", "#10b981", "#f59e0b"];

const blankEmployee: EmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  departmentId: 0,
  designation: "",
  joiningDate: today(),
  salary: 0,
  employmentStatus: "Active",
};

const blankAttendance = (): AttendanceForm => ({
  employeeId: 0,
  attendanceDate: today(),
  status: "Present",
  checkIn: "09:00",
  checkOut: "18:00",
  remarks: "",
});

const currency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const dateText = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN");
};

const badge = (status?: string) =>
  `status-badge status-${(status || "unknown")
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

const inputTime = (value?: string | null) =>
  value ? value.slice(0, 5) : "";

export default function App() {
  const [page, setPage] = useState<Page>("Dashboard");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [distribution, setDistribution] = useState<
    DepartmentDistribution[]
  >([]);
  const [hiring, setHiring] = useState<HiringTrend[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);

  const [employeeForm, setEmployeeForm] =
    useState<EmployeeForm>(blankEmployee);

  const [attendanceForm, setAttendanceForm] =
    useState<AttendanceForm>(blankAttendance());

  const [editingEmployee, setEditingEmployee] = useState<number | null>(
    null
  );

  const [editingAttendance, setEditingAttendance] = useState<number | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [reportFrom, setReportFrom] = useState(today());
  const [reportTo, setReportTo] = useState(today());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportLoading, setReportLoading] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [authenticated, setAuthenticated] = useState(
    () => Boolean(authStorage.getToken())
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Load all application data.
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
  }, []);

  useEffect(() => {
    if (authenticated) {
      void loadData();
    }
  }, [authenticated, loadData]);

  // Authentication.
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      await authApi.login({
        email: email.trim(),
        password,
      });

      setPassword("");
      setAuthenticated(true);
    } catch (err) {
      authStorage.clearToken();

      setLoginError(
        err instanceof Error ? err.message : "Login failed."
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    authApi.logout();
    setAuthenticated(false);

    setEmployees([]);
    setDepartments([]);
    setSummary(null);
    setDistribution([]);
    setHiring([]);
    setAttendance([]);

    setEmployeeForm(blankEmployee);
    setAttendanceForm(blankAttendance());
    setEditingEmployee(null);
    setEditingAttendance(null);

    setError("");
    setNotice("");
    setLoginError("");
    setPage("Dashboard");
  }

  // Employee filtering.
  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return employees;

    return employees.filter((employee) =>
      [
        employee.employeeCode,
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.designation,
        employee.departmentName,
        employee.employmentStatus,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [employees, search]);

  const filteredAttendance = useMemo(() => {
    return attendanceFilter
      ? attendance.filter(
          (item) =>
            item.attendanceDate?.slice(0, 10) === attendanceFilter
        )
      : attendance;
  }, [attendance, attendanceFilter]);

  const counts = summary?.employees;

  // Employee form helpers.
  function employeeField<K extends keyof EmployeeForm>(
    key: K,
    value: EmployeeForm[K]
  ) {
    setEmployeeForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function editEmployee(employee: Employee) {
    setEditingEmployee(employee.employeeId);

    setEmployeeForm({
      employeeCode: employee.employeeCode || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      departmentId: employee.departmentId,
      designation: employee.designation || "",
      joiningDate: employee.joiningDate?.slice(0, 10) || today(),
      salary: employee.salary || 0,
      employmentStatus: employee.employmentStatus || "Active",
    });

    setPage("Employees");
    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEmployee() {
    setEditingEmployee(null);
    setEmployeeForm({
      ...blankEmployee,
      joiningDate: today(),
    });
  }

  async function saveEmployee(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setNotice("");

    if (!employeeForm.departmentId) {
      setError("Please select a department before saving.");
      return;
    }

    if (employeeForm.salary < 0) {
      setError("Salary cannot be negative.");
      return;
    }

    setSaving(true);

    try {
      if (editingEmployee !== null) {
        await employeeApi.update(editingEmployee, employeeForm);
        setNotice("Employee updated successfully.");
      } else {
        await employeeApi.create(employeeForm);
        setNotice("Employee created successfully.");
      }

      resetEmployee();
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save employee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.firstName} ${employee.lastName}?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await employeeApi.delete(employee.employeeId);

      if (editingEmployee === employee.employeeId) {
        resetEmployee();
      }

      setNotice("Employee deleted successfully.");
      await loadData();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        if (employee.employmentStatus === "Inactive") {
          setNotice(
            `${employee.firstName} ${employee.lastName} is already Inactive and has related records, so the record was kept.`
          );
          return;
        }

        const markInactive = window.confirm(
          `${employee.firstName} ${employee.lastName} has related records and cannot be deleted. Would you like to mark them Inactive instead?`
        );

        if (!markInactive) {
          setError("Employee was not deleted.");
          return;
        }

        try {
          await employeeApi.update(employee.employeeId, {
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone || "",
            departmentId: employee.departmentId,
            designation: employee.designation,
            joiningDate: employee.joiningDate.slice(0, 10),
            salary: employee.salary,
            employmentStatus: "Inactive",
          });

          if (editingEmployee === employee.employeeId) {
            resetEmployee();
          }

          setNotice(
            `${employee.firstName} ${employee.lastName} was marked Inactive. Related records were kept.`
          );
          await loadData();
        } catch (updateError) {
          setError(
            updateError instanceof Error
              ? updateError.message
              : "Could not mark employee inactive."
          );
        }

        return;
      }

      setError(
        err instanceof Error ? err.message : "Could not delete employee."
      );
    }
  }

  // Attendance form helpers.
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

    setPage("Attendance");
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
      await loadData();
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
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not delete attendance record."
      );
    }
  }

  // Reports.
  async function runReport(
    reportName: string,
    action: () => Promise<void>
  ) {
    setError("");
    setNotice("");
    setReportLoading(reportName);

    try {
      await action();
      setNotice(`${reportName} downloaded successfully.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not download report."
      );
    } finally {
      setReportLoading("");
    }
  }

  // Shared UI components.
  function pageHeading(
    title: string,
    subtitle: string,
    action?: ReactNode
  ) {
    return (
      <div className="topbar">
        <div>
          <div className="eyebrow">EMPLOYEE MANAGEMENT</div>
          <h1>{title}</h1>
          <p className="topbar-subtitle">{subtitle}</p>
        </div>

        <div className="topbar-actions">
          {action}
          <button
            type="button"
            className="btn refresh-btn"
            onClick={() => void loadData()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "↻ Refresh"}
          </button>
        </div>
      </div>
    );
  }

  function messages() {
    return (
      <>
        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Request issue:</strong> {error}
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            />
          </div>
        )}

        {notice && (
          <div className="alert alert-success" role="status">
            {notice}
            <button
              type="button"
              className="btn-close float-end"
              aria-label="Dismiss message"
              onClick={() => setNotice("")}
            />
          </div>
        )}
      </>
    );
  }

  function employeeTable() {
    return (
      <div className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <div className="eyebrow">DIRECTORY</div>
            <h2>Employee Records</h2>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              type="search"
              placeholder="Search employees..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search employees"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle">
            <thead>
              <tr>
                <th>EMPLOYEE</th>
                <th>DEPARTMENT</th>
                <th>DESIGNATION</th>
                <th>JOINING DATE</th>
                <th>SALARY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-message">
                    {loading
                      ? "Loading employees..."
                      : "No employee records found."}
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.employeeId}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar">
                          {(employee.firstName?.[0] || "") +
                            (employee.lastName?.[0] || "")}
                        </div>

                        <div>
                          <strong>
                            {employee.firstName} {employee.lastName}
                          </strong>
                          <small>{employee.email}</small>
                          <small>{employee.employeeCode}</small>
                        </div>
                      </div>
                    </td>

                    <td>{employee.departmentName || "—"}</td>
                    <td>{employee.designation || "—"}</td>
                    <td>{dateText(employee.joiningDate)}</td>
                    <td>{currency(employee.salary)}</td>
                    <td>
                      <span className={badge(employee.employmentStatus)}>
                        {employee.employmentStatus}
                      </span>
                    </td>

                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => editEmployee(employee)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => void deleteEmployee(employee)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>
      </div>
    );
  }

  // Login screen.
  if (!authenticated) {
    return (
      <div
        className="app-shell d-flex align-items-center justify-content-center p-3"
        style={{
          background:
            "linear-gradient(135deg, #171a35 0%, #34345f 55%, #7257e8 100%)",
        }}
      >
        <div
          className="panel login-card w-100"
          style={{ maxWidth: 430, padding: 36 }}
        >
          <div className="d-flex align-items-center gap-3 mb-4">
            <div className="brand-mark">E</div>
            <div>
              <div className="brand-name">
                Employee<span>Hub</span>
              </div>
              <div className="muted-note">Management portal</div>
            </div>
          </div>

          <div className="eyebrow">WELCOME BACK</div>
          <h1 className="mt-2 mb-2">
            Sign in to <span>your account</span>
          </h1>

          <p className="muted-note mb-4">
            Enter your credentials to access the employee management system.
          </p>

          {loginError && (
            <div className="alert alert-danger" role="alert">
              {loginError}
            </div>
          )}

          <form onSubmit={login}>
            <div className="mb-3">
              <label htmlFor="loginEmail">Email address</label>
              <input
                id="loginEmail"
                type="email"
                className="form-control"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="loginPassword">Password</label>
              <input
                id="loginPassword"
                type="password"
                className="form-control"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="btn btn-primary w-100"
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main application.
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">E</div>
        <div className="brand-name">
          Employee<span>Hub</span>
        </div>

        <div className="sidebar-caption">WORKSPACE</div>

        <nav className="side-nav" aria-label="Main navigation">
          {(
            [
              ["Dashboard", "▦"],
              ["Employees", "♙"],
              ["Departments", "▤"],
              ["Attendance", "◷"],
              ["Reports", "▧"],
            ] as [Page, string][]
          ).map(([item, icon]) => (
            <button
              type="button"
              key={item}
              className={`nav-link ${page === item ? "active" : ""}`}
              onClick={() => {
                setPage(item);
                setError("");
                setNotice("");
              }}
            >
              <span className="nav-icon">{icon}</span>
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span className="status-dot" />
          <div>
            <strong>Workspace active</strong>
            <small>Employee management</small>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-outline-light mt-3"
          onClick={logout}
        >
          Sign Out
        </button>
      </aside>

      <main className="main-content">
        {messages()}

        {/* DASHBOARD */}
        {page === "Dashboard" && (
          <>
            {pageHeading(
              "Dashboard",
              "Overview of your workforce and daily operations"
            )}

            {loading && (
              <div className="muted-note mb-3">Refreshing dashboard data...</div>
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">♙</div>
                <div className="stat-label">Total Employees</div>
                <div className="stat-value">
                  {counts?.total ?? employees.length}
                </div>
                <div className="stat-note">All employee records</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div className="stat-label">Active Employees</div>
                <div className="stat-value">
                  {counts?.active ??
                    employees.filter(
                      (employee) => employee.employmentStatus === "Active"
                    ).length}
                </div>
                <div className="stat-note">Currently active</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">▤</div>
                <div className="stat-label">Departments</div>
                <div className="stat-value">
                  {summary?.departments?.total ?? departments.length}
                </div>
                <div className="stat-note">Organization departments</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon cyan">₹</div>
                <div className="stat-label">Monthly Salary</div>
                <div className="stat-value">
                  {currency(summary?.salary?.totalMonthlySalary ?? 0)}
                </div>
                <div className="stat-note">Reported monthly salary total</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon amber">◷</div>
                <div className="stat-label">Present Today</div>
                <div className="stat-value">
                  {summary?.attendance?.present ?? 0}
                </div>
                <div className="stat-note">
                  {dateText(summary?.attendance?.date || today())}
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">＋</div>
                <div className="stat-label">New Hires</div>
                <div className="stat-value">
                  {hiring.reduce(
                    (total, item) => total + (item.newHires || 0),
                    0
                  )}
                </div>
                <div className="stat-note">Across returned hiring periods</div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">WORKFORCE STATUS</div>
                  <h2>Employee Overview</h2>
                </div>
              </div>

              <div className="status-strip">
                {[
                  ["Active", counts?.active ?? 0],
                  ["Inactive", counts?.inactive ?? 0],
                  ["Resigned", counts?.resigned ?? 0],
                  ["Terminated", counts?.terminated ?? 0],
                  ["Present", summary?.attendance?.present ?? 0],
                  ["Absent", summary?.attendance?.absent ?? 0],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className={`status-dot-lg status-${String(label).toLowerCase()}`} />
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="charts-grid">
              <div className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">TEAM STRUCTURE</div>
                    <h2>Employees by Department</h2>
                  </div>
                </div>

                {distribution.length === 0 ? (
                  <div className="empty-state">
                    No department distribution data available.
                  </div>
                ) : (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={distribution}
                          dataKey="employeeCount"
                          nameKey="departmentName"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                        >
                          {distribution.map((item, index) => (
                            <Cell
                              key={item.departmentId}
                              fill={colors[index % colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="panel chart-panel">
                <div className="panel-heading">
                  <div>
                    <div className="eyebrow">RECRUITMENT</div>
                    <h2>Hiring Trend</h2>
                  </div>
                </div>

                {hiring.length === 0 ? (
                  <div className="empty-state">
                    No hiring trend data available.
                  </div>
                ) : (
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={hiring}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="monthName" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="newHires"
                          name="New hires"
                          stroke="#7257e8"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">ATTENDANCE SUMMARY</div>
                  <h2>Today's Attendance</h2>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setPage("Attendance")}
                >
                  Manage Attendance
                </button>
              </div>

              <div className="attendance-metrics">
                {[
                  ["Present", summary?.attendance?.present ?? 0],
                  ["Absent", summary?.attendance?.absent ?? 0],
                  ["Half Day", summary?.attendance?.halfDay ?? 0],
                  ["Leave", summary?.attendance?.leave ?? 0],
                ].map(([label, value]) => (
                  <div className="metric-card" key={label}>
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              <p className="muted-note mb-0">
                Total marked: {summary?.attendance?.totalMarked ?? 0}
              </p>
            </div>
          </>
        )}

        {/* EMPLOYEES */}
        {page === "Employees" && (
          <>
            {pageHeading(
              "Employees",
              "Create, search, update and manage employee records"
            )}

            <div className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">
                    {editingEmployee !== null ? "EDIT RECORD" : "NEW RECORD"}
                  </div>
                  <h2>
                    {editingEmployee !== null
                      ? "Update Employee"
                      : "Add Employee"}
                  </h2>
                </div>

                {editingEmployee !== null && (
                  <button
                    type="button"
                    className="btn refresh-btn"
                    onClick={resetEmployee}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={saveEmployee}>
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="employeeCode">Employee Code *</label>
                    <input
                      id="employeeCode"
                      className="form-control"
                      value={employeeForm.employeeCode}
                      onChange={(event) =>
                        employeeField("employeeCode", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeFirstName">First Name *</label>
                    <input
                      id="employeeFirstName"
                      className="form-control"
                      value={employeeForm.firstName}
                      onChange={(event) =>
                        employeeField("firstName", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeLastName">Last Name *</label>
                    <input
                      id="employeeLastName"
                      className="form-control"
                      value={employeeForm.lastName}
                      onChange={(event) =>
                        employeeField("lastName", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeEmail">Email *</label>
                    <input
                      id="employeeEmail"
                      type="email"
                      className="form-control"
                      value={employeeForm.email}
                      onChange={(event) =>
                        employeeField("email", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeePhone">Phone</label>
                    <input
                      id="employeePhone"
                      className="form-control"
                      value={employeeForm.phone}
                      onChange={(event) =>
                        employeeField("phone", event.target.value)
                      }
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeDepartment">Department *</label>
                    <select
                      id="employeeDepartment"
                      className="form-select"
                      value={employeeForm.departmentId || ""}
                      onChange={(event) =>
                        employeeField(
                          "departmentId",
                          Number(event.target.value)
                        )
                      }
                      required
                    >
                      <option value="">Select department</option>
                      {departments.map((department) => (
                        <option
                          key={department.departmentId}
                          value={department.departmentId}
                        >
                          {department.departmentName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="employeeDesignation">Designation *</label>
                    <input
                      id="employeeDesignation"
                      className="form-control"
                      value={employeeForm.designation}
                      onChange={(event) =>
                        employeeField("designation", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeJoiningDate">Joining Date *</label>
                    <input
                      id="employeeJoiningDate"
                      type="date"
                      className="form-control"
                      value={employeeForm.joiningDate}
                      onChange={(event) =>
                        employeeField("joiningDate", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeSalary">Monthly Salary *</label>
                    <input
                      id="employeeSalary"
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-control"
                      value={employeeForm.salary}
                      onChange={(event) =>
                        employeeField("salary", Number(event.target.value))
                      }
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="employeeStatus">Employment Status *</label>
                    <select
                      id="employeeStatus"
                      className="form-select"
                      value={employeeForm.employmentStatus}
                      onChange={(event) =>
                        employeeField(
                          "employmentStatus",
                          event.target.value as EmployeeForm["employmentStatus"]
                        )
                      }
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary submit-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingEmployee !== null
                      ? "Update Employee"
                      : "Create Employee"}
                </button>

                {editingEmployee !== null && (
                  <button
                    type="button"
                    className="btn refresh-btn ms-2"
                    onClick={resetEmployee}
                    disabled={saving}
                  >
                    Reset
                  </button>
                )}
              </form>
            </div>

            {employeeTable()}
          </>
        )}

        {/* DEPARTMENTS */}
        {page === "Departments" && (
          <>
            {pageHeading(
              "Departments",
              "View departments and their employee distribution"
            )}

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">▤</div>
                <div className="stat-label">Total Departments</div>
                <div className="stat-value">{departments.length}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon blue">♙</div>
                <div className="stat-label">Employees</div>
                <div className="stat-value">{employees.length}</div>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div className="stat-label">Active Employees</div>
                <div className="stat-value">
                  {employees.filter(
                    (employee) => employee.employmentStatus === "Active"
                  ).length}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <div className="eyebrow">ORGANIZATION</div>
                  <h2>Department Directory</h2>
                </div>
              </div>

              {departments.length === 0 ? (
                <div className="empty-state">
                  {loading
                    ? "Loading departments..."
                    : "No departments found. Add departments through your backend or database."}
                </div>
              ) : (
                <div className="department-cards">
                  {departments.map((department, index) => {
                    const departmentEmployees = employees.filter(
                      (employee) =>
                        employee.departmentId === department.departmentId
                    );

                    return (
                      <div
                        className="department-card"
                        key={department.departmentId}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div
                            className={`department-symbol symbol-${index % 4}`}
                          >
                            {(department.departmentName?.[0] || "D").toUpperCase()}
                          </div>

                          <div className="department-info">
                            <strong>{department.departmentName}</strong>
                            <small>
                              {departmentEmployees.length} employee(s)
                            </small>
                          </div>
                        </div>

                        <p className="muted-note mt-3 mb-0">
                          {department.description || "No description available."}
                        </p>

                        <div className="mt-3">
                          <strong>
                            {distribution.find(
                              (item) =>
                                item.departmentId === department.departmentId
                            )?.employeeCount ?? departmentEmployees.length}
                          </strong>{" "}
                          <span className="muted-note">
                            employees in this department
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="panel table-panel">
              <div className="panel-heading table-heading">
                <div>
                  <div className="eyebrow">BREAKDOWN</div>
                  <h2>Department Employee Count</h2>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>DEPARTMENT</th>
                      <th>DESCRIPTION</th>
                      <th>EMPLOYEES</th>
                    </tr>
                  </thead>

                  <tbody>
                    {departments.map((department) => (
                      <tr key={department.departmentId}>
                        <td>{department.departmentName}</td>
                        <td>{department.description || "—"}</td>
                        <td>
                          {employees.filter(
                            (employee) =>
                              employee.departmentId === department.departmentId
                          ).length}
                        </td>
                      </tr>
                    ))}

                    {departments.length === 0 && (
                      <tr>
                        <td colSpan={3} className="table-message">
                          No department data available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ATTENDANCE */}
        {page === "Attendance" && (
          <>
            {pageHeading(
              "Attendance",
              "Record daily attendance and maintain employee attendance history"
            )}

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
                        attendanceField(
                          "employeeId",
                          Number(event.target.value)
                        )
                      }
                      required
                    >
                      <option value="">Select employee</option>

                      {employees.map((employee) => (
                        <option
                          key={employee.employeeId}
                          value={employee.employeeId}
                        >
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
                    onChange={(event) =>
                      setAttendanceFilter(event.target.value)
                    }
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
                          (record) =>
                            record.employeeId === item.employeeId
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
                                {item.employeeCode ||
                                  employee?.employeeCode ||
                                  ""}
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
        )}

        {/* REPORTS */}
        {page === "Reports" && (
          <>
            {pageHeading(
              "Reports",
              "Export employee, salary and attendance reports"
            )}

            <div className="report-grid">
              <div className="report-card">
                <div className="stat-icon purple">▤</div>
                <div className="eyebrow">EMPLOYEE DIRECTORY</div>
                <h2 className="mt-2">Employee Excel Report</h2>
                <p className="muted-note mt-2">
                  Export the employee directory into an Excel spreadsheet.
                </p>

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  disabled={Boolean(reportLoading)}
                  onClick={() =>
                    void runReport(
                      "Employee Excel report",
                      reportsApi.exportEmployeesExcel
                    )
                  }
                >
                  {reportLoading === "Employee Excel report"
                    ? "Preparing..."
                    : "Download Excel"}
                </button>
              </div>

              <div className="report-card">
                <div className="stat-icon blue">PDF</div>
                <div className="eyebrow">EMPLOYEE DIRECTORY</div>
                <h2 className="mt-2">Employee PDF Report</h2>
                <p className="muted-note mt-2">
                  Download the employee report as a PDF document.
                </p>

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  disabled={Boolean(reportLoading)}
                  onClick={() =>
                    void runReport(
                      "Employee PDF report",
                      reportsApi.exportEmployeesPdf
                    )
                  }
                >
                  {reportLoading === "Employee PDF report"
                    ? "Preparing..."
                    : "Download PDF"}
                </button>
              </div>

              <div className="report-card">
                <div className="stat-icon green">₹</div>
                <div className="eyebrow">PAYROLL</div>
                <h2 className="mt-2">Salary Report</h2>
                <p className="muted-note mt-2">
                  Export salary information using the configured backend report.
                </p>

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  disabled={Boolean(reportLoading)}
                  onClick={() =>
                    void runReport(
                      "Salary Excel report",
                      reportsApi.exportSalariesExcel
                    )
                  }
                >
                  {reportLoading === "Salary Excel report"
                    ? "Preparing..."
                    : "Download Excel"}
                </button>
              </div>

              <div className="report-card">
                <div className="stat-icon amber">◷</div>
                <div className="eyebrow">ATTENDANCE</div>
                <h2 className="mt-2">Attendance Report</h2>
                <p className="muted-note mt-2">
                  Select a date range to export attendance records.
                </p>

                <div className="field mt-3">
                  <label htmlFor="reportFrom">From date</label>
                  <input
                    id="reportFrom"
                    type="date"
                    className="form-control"
                    value={reportFrom}
                    onChange={(event) => setReportFrom(event.target.value)}
                  />
                </div>

                <div className="field mt-3">
                  <label htmlFor="reportTo">To date</label>
                  <input
                    id="reportTo"
                    type="date"
                    className="form-control"
                    value={reportTo}
                    min={reportFrom}
                    onChange={(event) => setReportTo(event.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary mt-3"
                  disabled={Boolean(reportLoading) || reportFrom > reportTo}
                  onClick={() =>
                    void runReport(
                      "Attendance Excel report",
                      () =>
                        reportsApi.exportAttendanceExcel(reportFrom, reportTo)
                    )
                  }
                >
                  {reportLoading === "Attendance Excel report"
                    ? "Preparing..."
                    : "Download Excel"}
                </button>
              </div>
            </div>

            <div className="panel mt-3">
              <div className="eyebrow">REPORTING NOTE</div>
              <h2>Export information</h2>
              <p className="muted-note mb-0 mt-2">
                Downloads use the existing authenticated Reports API endpoints.
                If a report fails, verify that the endpoint exists in your
                backend and that your account is authorized to access it.
              </p>
            </div>
          </>
        )}

        <footer className="text-center muted-note mt-4 mb-2">
          EmployeeHub · Employee Management System
        </footer>
      </main>
    </div>
  );
}