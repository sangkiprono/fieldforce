import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/manager/Dashboard";
import CreateJob from "./pages/manager/CreateJob";
import JobDetail from "./pages/manager/JobDetail";
import MyJobs from "./pages/technician/MyJobs";

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
        <Route path="/manager" element={
          <ProtectedRoute role="manager"><Dashboard /></ProtectedRoute>
        } />
        <Route path="/manager/create-job" element={
          <ProtectedRoute role="manager"><CreateJob /></ProtectedRoute>
        } />
        <Route path="/manager/jobs/:jobId" element={
          <ProtectedRoute role="manager"><JobDetail /></ProtectedRoute>
        } />
        <Route path="/technician" element={
          <ProtectedRoute role="technician"><MyJobs /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
