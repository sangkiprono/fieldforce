import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import { useJobsSocket } from "../../hooks/useJobsSocket";
import NotificationBell from "../../components/NotificationBell";

interface Job {
  id: string;
  job_number: string;
  customer: { name: string; phone: string; address: string };
  issue_type: string;
  priority: string;
  status: string;
  assigned_technician: { name: string } | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-slate-200 text-slate-700",
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-yellow-100 text-yellow-700",
  on_site: "bg-orange-100 text-orange-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
};

export default function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [liveFlash, setLiveFlash] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchJobs = async () => {
    const params = statusFilter ? { status: statusFilter } : {};
    const res = await client.get("/jobs", { params });
    setJobs(res.data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchJobs();
  }, [statusFilter]);

  useJobsSocket(() => {
    fetchJobs();
    setLiveFlash(true);
    setTimeout(() => setLiveFlash(false), 1500);
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExport = async (format: "xlsx" | "pdf") => {
    setShowExportMenu(false);
    const params: Record<string, string> = { format };
    if (statusFilter) params.status = statusFilter;

    const token = localStorage.getItem("token");
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`http://127.0.0.1:8000/reports/jobs/export?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fieldforce_jobs.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">FieldForce</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {liveFlash && (
            <span className="text-xs text-green-600 font-medium animate-pulse">Live update</span>
          )}
          <NotificationBell />
          <button
            onClick={() => navigate("/manager/analytics")}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Analytics
          </button>
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
            >
              Export
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
                <button
                  onClick={() => handleExport("xlsx")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => handleExport("pdf")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                >
                  Export as PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate("/manager/inventory")}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Inventory
          </button>
          <button
            onClick={() => navigate("/manager/map")}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Map View
          </button>
          <button
            onClick={() => navigate("/manager/create-job")}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
          >
            + New Job
          </button>
          <button
            onClick={handleLogout}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="flex gap-2 mb-4">
          {["", "pending", "assigned", "en_route", "on_site", "in_progress", "completed", "failed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded text-sm font-medium transition ${
                statusFilter === s ? "bg-slate-800 text-white" : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-500">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="text-slate-500">No jobs found.</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3">Job #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Issue</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    onClick={() => navigate(`/manager/jobs/${job.id}`)}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{job.job_number}</td>
                    <td className="px-4 py-3">{job.customer.name}</td>
                    <td className="px-4 py-3">{job.issue_type.replace("_", " ")}</td>
                    <td className="px-4 py-3 capitalize">{job.priority}</td>
                    <td className="px-4 py-3">{job.assigned_technician?.name || "Unassigned"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                        {job.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
