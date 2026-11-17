import { useMemo, useState, type FormEvent } from "react";
import { ApiError, employeeApi } from "../api";
import PageHeading from "../components/layout/PageHeading";
import { employmentStatuses } from "../constants";
import type { Feedback } from "../hooks/useFeedback";
import type { Department, Employee, EmployeeForm } from "../types";
import { badge, currency, dateText, today } from "../utils/format";
import { blankEmployee } from "../utils/forms";

interface EmployeesPageProps {
  employees: Employee[];
  departments: Department[];
  loading: boolean;
  feedback: Feedback;
  reload: () => Promise<void>;
}

export default function EmployeesPage({
  employees,
  departments,
  loading,
  feedback,
  reload,
}: EmployeesPageProps) {
  const { setError, setNotice } = feedback;

  const [employeeForm, setEmployeeForm] =
    useState<EmployeeForm>(blankEmployee);
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

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

    setError("");
    setNotice("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetEmployee() {
    setEditingEmployee(null);
    setEmployeeForm(blankEmployee());
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
      await reload();
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
      await reload();
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
          await reload();
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

  return (
    <>
      <PageHeading
        title="Employees"
        subtitle="Create, search, update and manage employee records"
      />

      <div className="panel form-panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">
              {editingEmployee !== null ? "EDIT RECORD" : "NEW RECORD"}
            </div>
            <h2>
              {editingEmployee !== null ? "Update Employee" : "Add Employee"}
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
                  employeeField("departmentId", Number(event.target.value))
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
                {employmentStatuses.map((status) => (
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
    </>
  );
}
