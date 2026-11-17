import DepartmentPieChart from "../components/charts/DepartmentPieChart";
import HiringTrendChart from "../components/charts/HiringTrendChart";
import PageHeading from "../components/layout/PageHeading";
import type {
  DashboardSummary,
  Department,
  DepartmentDistribution,
  Employee,
  HiringTrend,
  Page,
} from "../types";
import { currency, dateText, today } from "../utils/format";

interface DashboardPageProps {
  employees: Employee[];
  departments: Department[];
  summary: DashboardSummary | null;
  distribution: DepartmentDistribution[];
  hiring: HiringTrend[];
  loading: boolean;
  onNavigate: (page: Page) => void;
}

export default function DashboardPage({
  employees,
  departments,
  summary,
  distribution,
  hiring,
  loading,
  onNavigate,
}: DashboardPageProps) {
  const counts = summary?.employees;

  return (
    <>
      <PageHeading
        title="Dashboard"
        subtitle="Overview of your workforce and daily operations"
      />

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
            {hiring.reduce((total, item) => total + (item.newHires || 0), 0)}
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
              <span
                className={`status-dot-lg status-${String(label).toLowerCase()}`}
              />
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
            <DepartmentPieChart data={distribution} />
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
            <div className="empty-state">No hiring trend data available.</div>
          ) : (
            <HiringTrendChart data={hiring} />
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
            onClick={() => onNavigate("Attendance")}
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
  );
}
