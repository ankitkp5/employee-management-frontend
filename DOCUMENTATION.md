# EmployeeHub — Frontend Documentation

EmployeeHub is the web front end of an Employee Management System. It lets a signed-in user manage employees and attendance and view a dashboard. All data lives in a separate ASP.NET Core Web API; this project only displays it and sends changes to it.

---

## 1. Tech stack

| Part | Technology |
|---|---|
| UI | React 18 + TypeScript |
| Build tool / dev server | Vite 5 (port 5173, `strictPort`) |
| Styling | Bootstrap 5 + `src/styles.css` |
| Charts | Recharts |
| Package manager | npm (pnpm lock file also present) |
| Hosting | Vercel (auto-deploys from GitHub `master`) |

There is no router library, no state library and no test suite. Page switching and state are plain React.

---

## 2. Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run preview    # serve the built dist/ locally
```

---

## 3. Backend connection

The API address is set in one place: [src/config/env.ts](src/config/env.ts)

```ts
export const API_BASE_URL = "https://emphr.somee.com/api";
```

- It is **hard-coded on purpose**. The `.env` file and the `VITE_API_BASE_URL` variable are **no longer read**, so a stale value on Vercel cannot override it.
- To point at another backend (for example local), edit this one line, then rebuild/redeploy.
- The URL must end in `/api`, not `/swagger`.
- The backend must allow this site's origin in its CORS policy.

### Endpoints the app calls

| Area | Method and path | Used for |
|---|---|---|
| Auth | `POST /Auth/login` | Sign in, returns a JWT token |
| Employees | `GET /Employees` | List |
| | `POST /Employees` | Create |
| | `PUT /Employees/{id}` | Update |
| | `DELETE /Employees/{id}` | Delete |
| Departments | `GET /Departments` | List |
| Dashboard | `GET /Dashboard/summary` | Counts, salary total, today's attendance |
| | `GET /Dashboard/department-distribution` | Pie chart data |
| | `GET /Dashboard/hiring-trend` | Line chart data |
| Attendance | `GET /Attendance`, `GET /Attendance/{id}` | List / one record |
| | `POST /Attendance` | Create |
| | `PUT /Attendance/{id}` | Update |
| | `DELETE /Attendance/{id}` | Delete |
| Reports | `GET /Reports/employees/excel` | Employee Excel |
| | `GET /Reports/employees/pdf` | Employee PDF |
| | `GET /Reports/salaries/excel` | Salary Excel |
| | `GET /Reports/attendance/excel?from=&to=` | Attendance Excel |

---

## 4. Folder structure

```
src/
  main.tsx              Entry point. Mounts <App/>, loads Bootstrap + styles.css
  App.tsx               App shell: login gate, sidebar, which page is shown
  styles.css            All custom styling

  config/env.ts         API base URL

  api/                  Everything that talks to the backend
    client.ts           request(), downloadReport(), ApiError, token storage
    auth.ts             login / logout
    employees.ts        employeeApi
    departments.ts      departmentApi
    dashboard.ts        dashboardApi
    attendance.ts       attendanceApi
    reports.ts          reportsApi
    index.ts            re-exports the above

  pages/                One file per screen
    LoginPage.tsx
    DashboardPage.tsx
    EmployeesPage.tsx
    DepartmentsPage.tsx
    AttendancePage.tsx
    ReportsPage.tsx

  components/
    layout/             Sidebar.tsx, PageHeading.tsx, Messages.tsx
    charts/             DepartmentPieChart.tsx, HiringTrendChart.tsx

  hooks/
    useAppData.ts       Loads and holds all server data
    useFeedback.ts      Error and success messages

  constants/index.ts    Status lists, chart colours, sidebar menu items
  types/index.ts        Shared TypeScript types
  utils/
    format.ts           today(), currency(), dateText(), badge(), inputTime()
    forms.ts            Empty form values for employee / attendance
```

---

## 5. How the app works

### 5.1 Start-up
1. `main.tsx` renders `<App />`.
2. `App` checks `localStorage["token"]`. If a token exists the user is treated as signed in; otherwise the login page is shown.

### 5.2 Login ([LoginPage.tsx](src/pages/LoginPage.tsx))
1. User enters email and password and submits.
2. `authApi.login` sends `POST /Auth/login`.
3. On success the returned JWT is saved in `localStorage["token"]` and `App` switches to the main screen.
4. On failure the token is cleared and the error text appears above the form.

### 5.3 Every other request ([api/client.ts](src/api/client.ts))
All calls go through one `request()` function, which:
- adds the header `Authorization: Bearer <token>`;
- adds `Content-Type: application/json` when a body is sent;
- turns network failures into the message "Cannot connect to the API at …";
- turns `401` into "Your session may have expired. Please log in again." and `403` into "You do not have permission…";
- throws an `ApiError` (with the HTTP `status`) for other failures such as `409`;
- returns nothing for `204` or empty responses.

### 5.4 Loading data ([hooks/useAppData.ts](src/hooks/useAppData.ts))
- Once the user is signed in, `loadData()` fetches **six endpoints in parallel**: employees, departments, dashboard summary, department distribution, hiring trend, attendance.
- Each request is independent. If one fails, the others still load, and the failures are shown together in the red message bar (for example "Hiring chart: 500 …").
- Pages call `loadData()` again after every create, update or delete so the screen matches the server.
- There is no Refresh button; data reloads on login and after each change.

### 5.4.1 Messages ([hooks/useFeedback.ts](src/hooks/useFeedback.ts))
A red error bar and a green notice bar sit at the top of every page. Both can be dismissed with the ✕ button, and both clear when you change page.

### 5.5 Navigation ([App.tsx](src/App.tsx), [Sidebar.tsx](src/components/layout/Sidebar.tsx))
- `App` keeps the current page name in state: Dashboard, Employees, Departments, Attendance or Reports.
- The sidebar buttons come from `navItems` in [constants/index.ts](src/constants/index.ts).
- **Reports is currently hidden** from the sidebar. The page and its code still exist. To show it again, add `["Reports", "▧"]` to `navItems`.
- **Sign Out** deletes the token, clears all loaded data and returns to the login page.

---

## 6. Screens

### Dashboard
- Six stat cards: Total Employees, Active Employees, Departments, Monthly Salary (₹), Present Today, New Hires.
- Employee Overview strip: Active / Inactive / Resigned / Terminated, plus Present / Absent today.
- Pie chart "Employees by Department" and line chart "Hiring Trend". An empty-state message shows if the API returns no data.
- Today's Attendance box (Present, Absent, Half Day, Leave) with a **Manage Attendance** button that opens the Attendance page.
- If the summary endpoint fails, the cards fall back to counts calculated from the employee and department lists where possible.

### Employees
- **Form** with: Employee Code, First Name, Last Name, Email, Phone (optional), Department, Designation, Joining Date, Monthly Salary, Employment Status (Active / Inactive / Resigned / Terminated).
- Validation: required fields are enforced by the browser; a department must be chosen; salary cannot be negative.
- **Create:** fill the form and press *Create Employee*.
- **Edit:** press *Edit* on a row. The form is filled and the page scrolls to the top; the button becomes *Update Employee*. *Cancel Edit* or *Reset* leaves edit mode.
- **Delete:** asks for confirmation, then deletes.
  - If the server answers **409** (the employee has related records such as attendance), the app offers to **mark the employee Inactive instead**. If the employee is already Inactive it simply keeps the record and says so.
- **Table:** avatar with initials, name, email, code, department, designation, joining date, salary, coloured status badge, Edit/Delete buttons. A search box filters by code, name, email, designation, department or status. The footer shows "Showing X of Y employees".

### Departments
- Cards for total departments, employees and active employees.
- A card for each department with its first letter, employee count, description and the employee count from the distribution endpoint (falls back to counting locally).
- A table of department, description and employee count.
- Read-only: departments are added through the backend or database, not from this app.

### Attendance
- **Form:** Employee, Date, Status (Present / Absent / Half Day / Leave), Check In (default 09:00), Check Out (default 18:00), Remarks.
- The API expects times as `HH:mm:ss`; the app adds the `:00` seconds before sending, and sends `null` for an empty time.
- **Create / Edit / Delete** work like the Employees page (Edit fills the form; Delete asks for confirmation).
- **History table** with employee name and code, date, status badge, check in/out, remarks, and Edit/Delete. A date filter and a *Clear* button narrow the list.

### Reports (hidden from the sidebar)
- Four downloads: Employee Excel, Employee PDF, Salary Excel, and Attendance Excel for a chosen From/To date range.
- The file is fetched with the token, turned into a blob and saved through a temporary download link.
- The attendance button is disabled if From is later than To.

---

## 7. Key code to know

| If you want to… | Edit |
|---|---|
| Change the backend URL | [src/config/env.ts](src/config/env.ts) |
| Add or change an API call | the matching file in [src/api/](src/api/) |
| Change what a page shows | the file in [src/pages/](src/pages/) |
| Add a sidebar item | [src/constants/index.ts](src/constants/index.ts) and the page switch in [src/App.tsx](src/App.tsx) |
| Add a new data field | [src/types/index.ts](src/types/index.ts), then the page form/table and the API payload |
| Change date, money or badge formatting | [src/utils/format.ts](src/utils/format.ts) |
| Change colours and layout | [src/styles.css](src/styles.css) |

### Adding a new page
1. Add its name to the `Page` type in `types/index.ts`.
2. Create `src/pages/NewPage.tsx`.
3. Add it to `navItems` in `constants/index.ts`.
4. Add `{page === "NewPage" && <NewPage … />}` in `App.tsx`.
5. If it needs an API, add a file in `src/api/` and export it from `api/index.ts`.

---

## 8. Data types

Defined in [src/types/index.ts](src/types/index.ts): `Employee`, `EmployeeForm`, `Department`, `Attendance`, `AttendanceForm`, `AttendanceRow`, `DashboardSummary`, `DepartmentDistribution`, `HiringTrend`, `Page`.

- Employment statuses: `Active`, `Inactive`, `Resigned`, `Terminated`
- Attendance statuses: `Present`, `Absent`, `Half Day`, `Leave`

---

## 9. Deployment

- Hosted on Vercel at `employee-management-frontend-src.vercel.app`.
- Vercel builds from the GitHub repo `ankitkp5/employee-management-frontend`, branch `master`. Pushing to `master` triggers a new deploy.
- After a deploy, hard-refresh the browser (Ctrl+Shift+R) to avoid seeing the old build.

### Git branches
| Branch | Purpose |
|---|---|
| `master` | Live branch (deployed) |
| `backup/before-restructure` | Untouched copy of the code before the folder reorganisation |
| `refactor/folder-structure` | The reorganised code described in this document |

---

## 10. Known limitations

- The login token is kept in `localStorage` and is not refreshed. If it expires, requests fail with a "session may have expired" message and the user must sign out and in again; the app does not log out automatically.
- No automated tests.
- The production bundle is about 577 kB (a size warning appears on build) because everything loads at once.
- Form drafts are kept per page and are lost when you leave the page.
- `README_SETUP.md` is the original starter guide and is partly out of date (it still mentions `src/api.ts`, `.env` and says login is not implemented). This file is the current reference.
