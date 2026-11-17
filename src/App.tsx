import { useState } from "react";
import { authApi, authStorage } from "./api";
import Messages from "./components/layout/Messages";
import Sidebar from "./components/layout/Sidebar";
import { useAppData } from "./hooks/useAppData";
import { useFeedback } from "./hooks/useFeedback";
import AttendancePage from "./pages/AttendancePage";
import DashboardPage from "./pages/DashboardPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import EmployeesPage from "./pages/EmployeesPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import type { Page } from "./types";

export default function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [authenticated, setAuthenticated] = useState(() =>
    Boolean(authStorage.getToken())
  );

  const feedback = useFeedback();
  const data = useAppData(authenticated, feedback.setError);

  function navigate(next: Page) {
    setPage(next);
    feedback.clear();
  }

  function logout() {
    authApi.logout();
    setAuthenticated(false);
    data.reset();
    feedback.clear();
    setPage("Dashboard");
  }

  if (!authenticated) {
    return <LoginPage onLoggedIn={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} onLogout={logout} />

      <main className="main-content">
        <Messages {...feedback} />

        {page === "Dashboard" && (
          <DashboardPage
            employees={data.employees}
            departments={data.departments}
            summary={data.summary}
            distribution={data.distribution}
            hiring={data.hiring}
            loading={data.loading}
            onNavigate={setPage}
          />
        )}

        {page === "Employees" && (
          <EmployeesPage
            employees={data.employees}
            departments={data.departments}
            loading={data.loading}
            feedback={feedback}
            reload={data.loadData}
          />
        )}

        {page === "Departments" && (
          <DepartmentsPage
            employees={data.employees}
            departments={data.departments}
            distribution={data.distribution}
            loading={data.loading}
          />
        )}

        {page === "Attendance" && (
          <AttendancePage
            employees={data.employees}
            attendance={data.attendance}
            loading={data.loading}
            feedback={feedback}
            reload={data.loadData}
          />
        )}

        {page === "Reports" && <ReportsPage feedback={feedback} />}

        <footer className="text-center muted-note mt-4 mb-2">
          EmployeeHub · Employee Management System
        </footer>
      </main>
    </div>
  );
}
