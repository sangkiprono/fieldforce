import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/manager/Dashboard";
import CreateJob from "./pages/manager/CreateJob";
import JobDetail from "./pages/manager/JobDetail";
import DispatchMap from "./pages/manager/DispatchMap";
import Inventory from "./pages/manager/Inventory";
import Analytics from "./pages/manager/Analytics";
import TeamAttendance from "./pages/manager/TeamAttendance";
import MyJobs from "./pages/technician/MyJobs";
import MyStock from "./pages/technician/MyStock";
import CustomerPortal from "./pages/CustomerPortal";

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: "manager" | "technician" }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/track" element={<CustomerPortal />} />
        <Route path="/manager" element={
          <ProtectedRoute role="manager"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/manager/create-job" element={
          <ProtectedRoute role="manager"><CreateJob /></ProtectedRoute>
        } />
        <Route path="/manager/jobs/:jobId" element={
          <ProtectedRoute role="manager"><JobDetail /></ProtectedRoute>
        } />
        <Route path="/manager/map" element={
          <ProtectedRoute role="manager"><DispatchMap /></ProtectedRoute>
        } />
        <Route path="/manager/inventory" element={
          <ProtectedRoute role="manager"><Inventory /></ProtectedRoute>
        } />
        <Route path="/manager/analytics" element={
          <ProtectedRoute role="manager"><Analytics /></ProtectedRoute>
        } />
        <Route path="/manager/attendance" element={
          <ProtectedRoute role="manager"><TeamAttendance /></ProtectedRoute>
        } />
        <Route path="/technician" element={
          <ProtectedRoute role="technician"><MyJobs /></ProtectedRoute>
        } />
        <Route path="/technician/stock" element={
          <ProtectedRoute role="technician"><MyStock /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
