import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";
import { useAuth } from "../../context/AuthContext";

interface Job {
  id: string;
  job_number: string;
  customer: { name: string; phone: string; address: string };
  issue_type: string;
  priority: string;
  status: string;
  description: string | null;
}

interface StockEntry {
  id: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
}

const statusFlow: Record<string, string | null> = {
  assigned: "en_route",
  en_route: "on_site",
  on_site: "in_progress",
  in_progress: "completed",
  completed: null,
  failed: null,
};

const statusLabels: Record<string, string> = {
  assigned: "Start Heading Out",
  en_route: "Arrived On Site",
  on_site: "Start Work",
  in_progress: "Mark Completed",
};

const statusColors: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700",
  en_route: "bg-yellow-100 text-yellow-700",
  on_site: "bg-orange-100 text-orange-700",
  in_progress: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function MyJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stock, setStock] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [photoJobId, setPhotoJobId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [materialsUsed, setMaterialsUsed] = useState<{ item_id: string; quantity: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    const res = await client.get("/jobs/mine");
    setJobs(res.data);
    setLoading(false);
  };

  const fetchStock = async () => {
    const res = await client.get("/inventory/my-stock");
    setStock(res.data);
  };

  useEffect(() => {
    fetchJobs();
    fetchStock();
  }, []);

  const handleAdvanceStatus = async (job: Job) => {
    const nextStatus = statusFlow[job.status];
    if (!nextStatus) return;

    if (nextStatus === "completed") {
      setPhotoJobId(job.id);
      setMaterialsUsed([]);
      return;
    }

    setUpdatingId(job.id);
    try {
      await client.patch(`/jobs/${job.id}/status`, { status: nextStatus });
      await fetchJobs();
    } finally {
      setUpdatingId(null);
    }
  };

  const addMaterialRow = () => {
    setMaterialsUsed([...materialsUsed, { item_id: "", quantity: "" }]);
  };

  const updateMaterialRow = (index: number, field: "item_id" | "quantity", value: string) => {
    const updated = [...materialsUsed];
    updated[index][field] = value;
    setMaterialsUsed(updated);
  };

  const removeMaterialRow = (index: number) => {
    setMaterialsUsed(materialsUsed.filter((_, i) => i !== index));
  };

  const handleCompleteWithPhoto = async (jobId: string) => {
    setUploading(true);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("caption", "Proof of work");
        await client.post(`/jobs/${jobId}/photos`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      for (const m of materialsUsed) {
        if (m.item_id && m.quantity) {
          await client.post(`/inventory/jobs/${jobId}/materials`, {
            item_id: m.item_id,
            quantity_used: parseInt(m.quantity),
          });
        }
      }

      await client.patch(`/jobs/${jobId}/status`, { status: "completed" });
      setPhotoJobId(null);
      setSelectedFile(null);
      setMaterialsUsed([]);
      await fetchJobs();
      await fetchStock();
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const activeJobs = jobs.filter((j) => !["completed", "failed", "cancelled"].includes(j.status));
  const doneJobs = jobs.filter((j) => ["completed", "failed", "cancelled"].includes(j.status));

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Jobs</h1>
          <p className="text-sm text-slate-500">{user?.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/technician/stock")}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            My Stock
          </button>
          <button
            onClick={handleLogout}
            className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        {loading ? (
          <p className="text-slate-500">Loading jobs...</p>
        ) : activeJobs.length === 0 ? (
          <p className="text-slate-500">No active jobs assigned to you.</p>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{job.job_number}</p>
                    <p className="text-sm text-slate-500">{job.customer.name} — {job.customer.phone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-1">{job.customer.address}</p>
                <p className="text-sm text-slate-700 mb-1 capitalize">{job.issue_type.replace("_", " ")} — {job.priority} priority</p>
                {job.description && <p className="text-sm text-slate-500 mb-3">{job.description}</p>}

                {photoJobId === job.id ? (
                  <div className="mt-3 border border-slate-200 rounded p-3 bg-slate-50 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Attach proof of work (optional)</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-medium text-slate-700">Materials used (optional)</p>
                        <button onClick={addMaterialRow} className="text-xs text-blue-600 underline">+ Add material</button>
                      </div>
                      {materialsUsed.map((m, i) => (
                        <div key={i} className="flex gap-2 mb-1">
                          <select
                            value={m.item_id}
                            onChange={(e) => updateMaterialRow(i, "item_id", e.target.value)}
                            className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="">Select item</option>
                            {stock.map((s) => (
                              <option key={s.item.id} value={s.item.id}>{s.item.name} ({s.quantity} left)</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Qty"
                            value={m.quantity}
                            onChange={(e) => updateMaterialRow(i, "quantity", e.target.value)}
                            className="w-20 border border-slate-300 rounded px-2 py-1 text-sm"
                          />
                          <button onClick={() => removeMaterialRow(i)} className="text-red-500 text-sm">×</button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleCompleteWithPhoto(job.id)}
                        disabled={uploading}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {uploading ? "Completing..." : "Confirm Completion"}
                      </button>
                      <button
                        onClick={() => { setPhotoJobId(null); setSelectedFile(null); setMaterialsUsed([]); }}
                        className="text-slate-500 text-sm px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  statusFlow[job.status] && (
                    <button
                      onClick={() => handleAdvanceStatus(job)}
                      disabled={updatingId === job.id}
                      className="w-full mt-2 bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {updatingId === job.id ? "Updating..." : statusLabels[job.status]}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {doneJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-medium text-slate-500 mb-2">Completed</h2>
            <div className="space-y-2">
              {doneJobs.map((job) => (
                <div key={job.id} className="bg-white rounded border border-slate-200 p-3 flex justify-between text-sm">
                  <span className="text-slate-600">{job.job_number} — {job.customer.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
