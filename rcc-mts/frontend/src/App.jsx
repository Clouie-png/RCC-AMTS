import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { DepartmentManagement } from "./pages/admin/department-management";
import { CategoryManagement } from "./pages/admin/category-management";
import { UserManagement } from "./pages/admin/user-management";
import { ReportManagement } from "./pages/admin/report-management";
import Login from "./pages/login";
import { TopBar } from "./components/top-bar";
import { ProtectedRoute } from "./components/protected-route";
import { FacultyStaffPage } from "./pages/faculty-staff/index";
import { SubCategoryManagement } from "./pages/admin/sub-category-management";
import { StatusManagement } from "./pages/admin/status-management";
import { AssetManagement } from "./pages/admin/asset-management";
import { PCPartsManagement } from "./pages/admin/pc-parts-management";
import { TicketManagement } from "./pages/admin/ticket-management";
import { AdminHome } from "./pages/admin/home";
import { MaintenancePage } from "./pages/maintenance/index";

// Placeholder for unauthorized access
const Unauthorized = () => (
  <div>
    <h1>Unauthorized Access</h1>
    <p>You do not have permission to view this page.</p>
  </div>
);

// Layout component to include the TopBar
const AdminLayout = () => (
  <>
    <TopBar />
    <main>
      <Outlet />
    </main>
  </>
);

// Admin layout wrapper (optional - if you want admin-specific styling)
const AppLayout = () => (
  <>
    <Outlet />
  </>
);

function App() {
  return (
    <Routes>
      {/* Public routes without TopBar */}
      <Route path="/login" element={<Login />} />

      {/* Redirect root to login or dashboard */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected routes with TopBar */}
      <Route element={<AppLayout />}>
        {/* Admin routes protected by role */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            {/* Default admin route */}
            <Route index element={<Navigate to="home" replace />} />

            <Route path="home" element={<AdminHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="departments" element={<DepartmentManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="subcategories" element={<SubCategoryManagement />} />
            <Route path="statuses" element={<StatusManagement />} />
            <Route path="assets" element={<AssetManagement />} />
            <Route path="pc-parts" element={<PCPartsManagement />} />
            <Route path="tickets" element={<TicketManagement />} />
            <Route path="reports" element={<ReportManagement />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["faculty/staff"]} />}>
          <Route path="/faculty-staff" element={<FacultyStaffPage />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={["maintenance"]} />}>
          <Route path="/maintenance/*" element={<MaintenancePage />} />
        </Route>

        {/* Add other protected routes here if needed */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Route>

      {/* Catch-all route for 404s */}
      <Route path="*" element={<Navigate to="/login" replace />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
    </Routes>
  );
}

export default App;
