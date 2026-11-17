import { useState } from "react";
import { reportsApi } from "../api";
import PageHeading from "../components/layout/PageHeading";
import type { Feedback } from "../hooks/useFeedback";
import { today } from "../utils/format";

export default function ReportsPage({ feedback }: { feedback: Feedback }) {
  const { setError, setNotice } = feedback;

  const [reportFrom, setReportFrom] = useState(today());
  const [reportTo, setReportTo] = useState(today());
  const [reportLoading, setReportLoading] = useState("");

  async function runReport(reportName: string, action: () => Promise<void>) {
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

  return (
    <>
      <PageHeading
        title="Reports"
        subtitle="Export employee, salary and attendance reports"
      />

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
              void runReport("Attendance Excel report", () =>
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
          Downloads use the existing authenticated Reports API endpoints. If a
          report fails, verify that the endpoint exists in your backend and
          that your account is authorized to access it.
        </p>
      </div>
    </>
  );
}
