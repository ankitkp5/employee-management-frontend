import PageHeading from "../components/layout/PageHeading";
import type { Department, DepartmentDistribution, Employee } from "../types";

interface DepartmentsPageProps {
  employees: Employee[];
  departments: Department[];
  distribution: DepartmentDistribution[];
  loading: boolean;
}

export default function DepartmentsPage({
  employees,
  departments,
  distribution,
  loading,
}: DepartmentsPageProps) {
  return (
    <>
      <PageHeading
        title="Departments"
        subtitle="View departments and their employee distribution"
      />

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
            {
              employees.filter(
                (employee) => employee.employmentStatus === "Active"
              ).length
            }
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
                <div className="department-card" key={department.departmentId}>
                  <div className="d-flex align-items-center gap-3">
                    <div className={`department-symbol symbol-${index % 4}`}>
                      {(department.departmentName?.[0] || "D").toUpperCase()}
                    </div>

                    <div className="department-info">
                      <strong>{department.departmentName}</strong>
                      <small>{departmentEmployees.length} employee(s)</small>
                    </div>
                  </div>

                  <p className="muted-note mt-3 mb-0">
                    {department.description || "No description available."}
                  </p>

                  <div className="mt-3">
                    <strong>
                      {distribution.find(
                        (item) => item.departmentId === department.departmentId
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
                    {
                      employees.filter(
                        (employee) =>
                          employee.departmentId === department.departmentId
                      ).length
                    }
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
  );
}
