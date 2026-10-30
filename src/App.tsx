import { useEffect, useMemo, useState, type FormEvent } from "react";
import { authApi, authStorage, departmentApi, employeeApi } from "./api";
import type { Department, Employee, EmployeeForm } from "./types";

const emptyForm: EmployeeForm = {
  employeeCode: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  departmentId: 0,
  designation: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  salary: 0,
  isActive: true
};

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(
  () => Boolean(authStorage.getToken())
);

const [loginEmail, setLoginEmail] = useState("");
const [loginPassword, setLoginPassword] = useState("");
const [loginLoading, setLoginLoading] = useState(false);
const [loginError, setLoginError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [employeeData, departmentData] = await Promise.all([
        employeeApi.getAll(),
        departmentApi.getAll()
      ]);
      setEmployees(Array.isArray(employeeData) ? employeeData : []);
      setDepartments(Array.isArray(departmentData) ? departmentData : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setLoginError("");
  setLoginLoading(true);

  try {
    await authApi.login({
      email: loginEmail.trim(),
      password: loginPassword
    });

    setLoginPassword("");
    setIsAuthenticated(true);
  } catch (e) {
    authStorage.clearToken();

    setLoginError(
      e instanceof Error
        ? e.message
        : "Login failed. Please check your email and password."
    );
  } finally {
    setLoginLoading(false);
  }
}

function handleLogout() {
  authApi.logout();

  setIsAuthenticated(false);
  setEmployees([]);
  setDepartments([]);
  setError("");
  setNotice("");
  cancelEdit();
}

useEffect(() => {
  if (isAuthenticated) {
    void loadData();
  }
}, [isAuthenticated]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((employee) =>
      [employee.employeeCode, employee.firstName, employee.lastName, employee.email, employee.designation, employee.departmentName]
        .some((value) => (value || "").toLowerCase().includes(q))
    );
  }, [employees, search]);

  function updateField<K extends keyof EmployeeForm>(key: K, value: EmployeeForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(employee: Employee) {
    setEditingId(employee.employeeId);
    setForm({
      employeeCode: employee.employeeCode || "",
      firstName: employee.firstName || "",
      lastName: employee.lastName || "",
      email: employee.email || "",
      phone: employee.phone || "",
      departmentId: employee.departmentId,
      designation: employee.designation || "",
      joiningDate: employee.joiningDate ? employee.joiningDate.slice(0, 10) : "",
      salary: employee.salary || 0,
      isActive: employee.isActive
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm, joiningDate: new Date().toISOString().slice(0, 10) });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!form.departmentId) {
      setError("Please select a department first. Make sure at least one department exists in SQL Server.");
      return;
    }
    setSaving(true);
    try {
      if (editingId !== null) {
        await employeeApi.update(editingId, form);
        setNotice("Employee updated successfully.");
      } else {
        await employeeApi.create(form);
        setNotice("Employee created successfully.");
      }
      cancelEdit();
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save employee.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(employee: Employee) {
    if (!window.confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) return;
    setError("");
    setNotice("");
    try {
      await employeeApi.delete(employee.employeeId);
      setNotice("Employee deleted.");
      await loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete employee.");
    }
  }

  const activeCount = employees.filter((employee) => employee.isActive).length;

if (!isAuthenticated) {
  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-3">
      <div className="card border-0 shadow p-4" style={{ width: "100%", maxWidth: "420px" }}>
        <div className="text-center mb-4">
          <div className="brand-mark mx-auto mb-3">EM</div>
          <h1 className="h3 fw-bold">
            People<span style={{ color: "#8b5cf6" }}>Desk</span>
          </h1>
          <p className="text-secondary">Sign in to your Employee Management System</p>
        </div>

        {loginError && (
          <div className="alert alert-danger" role="alert">
            {loginError}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="loginEmail" className="form-label">Email address</label>
            <input
              id="loginEmail"
              type="email"
              className="form-control"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="loginPassword" className="form-label">Password</label>
            <input
              id="loginPassword"
              type="password"
              className="form-control"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loginLoading}
          >
            {loginLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

return (    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark">EM</div>
        <div className="brand-name">People<span>Desk</span></div>
        <div className="sidebar-caption">EMPLOYEE MANAGEMENT</div>
        <nav className="nav flex-column mt-4">
          <a className="nav-link active" href="#dashboard">▦ <span>Dashboard</span></a>
          <a className="nav-link" href="#employees">♙ <span>Employees</span></a>
          <a className="nav-link" href="#departments">▤ <span>Departments</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="status-dot"></div>
          <div><strong>API connection</strong><small>ASP.NET Core</small></div>
        </div>
      </aside>

      <main className="main-content">
      <header className="topbar">
  <div>
    <div className="eyebrow">WORKSPACE / PEOPLE</div>
    <h1>Employee Dashboard</h1>
  </div>

  <div className="d-flex gap-2">
    <button
      className="btn btn-light refresh-btn"
      onClick={() => void loadData()}
      disabled={loading}
    >
      ↻ Refresh data
    </button>

    <button
      className="btn btn-outline-danger"
      onClick={handleLogout}
    >
      Logout
    </button>
  </div>
</header>

        {error && <div className="alert alert-danger" role="alert"><strong>Something went wrong:</strong> {error}<div className="small mt-2">Check that the ASP.NET API is running, the API URL is correct, and CORS allows http://localhost:5173.</div></div>}
        {notice && <div className="alert alert-success" role="status">{notice}</div>}

        <section id="dashboard" className="stats-grid">
          <article className="stat-card">
            <div className="stat-icon purple">♙</div><div className="stat-label">Total employees</div>
            <div className="stat-value">{loading ? "—" : employees.length}</div><div className="stat-note">Records from your API</div>
          </article>
          <article className="stat-card">
            <div className="stat-icon blue">▤</div><div className="stat-label">Departments</div>
            <div className="stat-value">{loading ? "—" : departments.length}</div><div className="stat-note">Teams in the organisation</div>
          </article>
          <article className="stat-card">
            <div className="stat-icon green">✓</div><div className="stat-label">Active employees</div>
            <div className="stat-value">{loading ? "—" : activeCount}</div><div className="stat-note">Currently marked active</div>
          </article>
        </section>

        <section className="content-grid">
          <div className="panel form-panel">
            <div className="panel-heading">
              <div><div className="eyebrow">EMPLOYEE RECORDS</div><h2>{editingId === null ? "Add an employee" : "Edit employee"}</h2></div>
              {editingId !== null && <button className="btn btn-sm btn-outline-secondary" onClick={cancelEdit}>Cancel</button>}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field"><label htmlFor="employeeCode">Employee code *</label><input id="employeeCode" className="form-control" value={form.employeeCode} onChange={(e) => updateField("employeeCode", e.target.value)} required /></div>
                <div className="field"><label htmlFor="departmentId">Department *</label><select id="departmentId" className="form-select" value={form.departmentId || ""} onChange={(e) => updateField("departmentId", Number(e.target.value))} required><option value="">Select department</option>{departments.map((department) => <option key={department.departmentId} value={department.departmentId}>{department.departmentName}</option>)}</select></div>
                <div className="field"><label htmlFor="firstName">First name *</label><input id="firstName" className="form-control" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required /></div>
                <div className="field"><label htmlFor="lastName">Last name *</label><input id="lastName" className="form-control" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required /></div>
                <div className="field full"><label htmlFor="email">Email *</label><input id="email" type="email" className="form-control" value={form.email} onChange={(e) => updateField("email", e.target.value)} required /></div>
                <div className="field"><label htmlFor="phone">Phone</label><input id="phone" className="form-control" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} /></div>
                <div className="field"><label htmlFor="designation">Designation</label><input id="designation" className="form-control" value={form.designation} onChange={(e) => updateField("designation", e.target.value)} /></div>
                <div className="field"><label htmlFor="joiningDate">Joining date *</label><input id="joiningDate" type="date" className="form-control" value={form.joiningDate} onChange={(e) => updateField("joiningDate", e.target.value)} required /></div>
                <div className="field"><label htmlFor="salary">Monthly salary *</label><input id="salary" type="number" min="0" step="0.01" className="form-control" value={form.salary} onChange={(e) => updateField("salary", Number(e.target.value))} required /></div>
                <div className="field full checkbox-field"><input id="isActive" type="checkbox" className="form-check-input" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} /><label htmlFor="isActive">Employee is active</label></div>
              </div>
              <button type="submit" className="btn btn-primary submit-btn" disabled={saving || loading}>{saving ? "Saving..." : editingId === null ? "+ Add employee" : "Save changes"}</button>
            </form>
          </div>

          <div className="panel departments-panel" id="departments">
            <div className="panel-heading"><div><div className="eyebrow">YOUR ORGANISATION</div><h2>Departments</h2></div><span className="count-pill">{departments.length}</span></div>
            {departments.length === 0 && !loading ? <p className="empty-note">No departments returned by the API.</p> :
              <div className="department-list">{departments.map((department, index) => <div className="department-row" key={department.departmentId}><div className={`department-symbol symbol-${index % 4}`}>{department.departmentName?.slice(0, 1).toUpperCase()}</div><div className="department-info"><strong>{department.departmentName}</strong><small>{department.description || "Department"}</small></div><span className="department-arrow">↗</span></div>)}</div>}
            <div className="panel-footnote">Department records are loaded from your API.</div>
          </div>
        </section>

        <section id="employees" className="panel table-panel">
          <div className="panel-heading table-heading">
            <div><div className="eyebrow">PEOPLE DIRECTORY</div><h2>All employees <span className="count-pill">{filteredEmployees.length}</span></h2></div>
            <div className="search-box"><span>⌕</span><input aria-label="Search employees" placeholder="Search name, email, code..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          </div>
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>EMPLOYEE</th><th>DEPARTMENT</th><th>DESIGNATION</th><th>JOINING DATE</th><th>STATUS</th><th className="text-end">ACTIONS</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={6} className="table-message">Loading employee records...</td></tr> :
                 filteredEmployees.length === 0 ? <tr><td colSpan={6} className="table-message">No employees found. Add one using the form above.</td></tr> :
                 filteredEmployees.map((employee) => <tr key={employee.employeeId}>
                   <td><div className="employee-cell"><div className="avatar">{`${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase()}</div><div><strong>{employee.firstName} {employee.lastName}</strong><small>{employee.employeeCode} · {employee.email}</small></div></div></td>
                   <td>{employee.departmentName || departments.find((d) => d.departmentId === employee.departmentId)?.departmentName || `ID: ${employee.departmentId}`}</td>
                   <td>{employee.designation || "—"}</td>
                   <td>{employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}</td>
                   <td><span className={`status-badge ${employee.isActive ? "active-status" : "inactive-status"}`}>{employee.isActive ? "Active" : "Inactive"}</span></td>
                   <td className="text-end action-cell"><button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEdit(employee)}>Edit</button><button className="btn btn-sm btn-outline-danger" onClick={() => void handleDelete(employee)}>Delete</button></td>
                 </tr>)}
              </tbody>
            </table>
          </div>
          <div className="table-footer">Showing {filteredEmployees.length} of {employees.length} employees</div>
        </section>
        <footer className="page-footer">Employee Management System <span>•</span> React + TypeScript <span>•</span> ASP.NET Core API</footer>
      </main>
    </div>
  );
}
