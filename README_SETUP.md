# Employee Management Frontend Starter

This is a React + TypeScript + Vite frontend starter for the Employee Management API.

## 1. Prerequisites
- Node.js and npm installed.
- The ASP.NET Core API project running.
- SQL Server database and API tested successfully.

## 2. Install and run
Open a terminal inside this folder and run:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## 3. Configure API URL
By default the frontend calls `https://localhost:54778/api`.
If your API uses a different URL/port:
1. Copy `.env.example` to a new file named `.env`.
2. Update `VITE_API_BASE_URL`, for example `https://localhost:7123/api`.
3. Stop and restart `npm run dev`.

The configured URL must end in `/api`, not `/swagger`.

## 4. API routes expected
- `GET /api/Employees`
- `POST /api/Employees`
- `PUT /api/Employees/{id}`
- `DELETE /api/Employees/{id}`
- `GET /api/Departments`

The employee payload fields should match the API DTO:
`employeeCode, firstName, lastName, email, phone, departmentId, designation, joiningDate, salary, isActive`.

If your backend uses different route names, IDs, or DTO property names, update `src/api.ts` and/or `src/App.tsx` accordingly.

## 5. CORS and HTTPS
Your API must allow the frontend origin `http://localhost:5173`.
If the browser reports a CORS error, verify the API's CORS policy and restart the API.
If HTTPS shows a certificate warning or fetch fails, open the API's HTTPS address in the browser once and accept the local development certificate if appropriate, or use the API's configured HTTP URL for local development and update `.env`.

## 6. Features in this starter
- Dashboard counts based on API data
- Employee list and search
- Add, edit, delete employee
- Department list
- Bootstrap responsive styling
- Visible API error messages

Authentication, attendance, salary records, PDF/Excel export, and reports are not implemented in this first frontend starter.
