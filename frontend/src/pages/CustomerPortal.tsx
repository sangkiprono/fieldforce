import { useState } from "react";
import axios from "axios";

interface Job {
  id: string;
  job_number: string;
  issue_type: string;
  description: string | null;
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

const statusSteps = ["pending", "assigned", "en_route", "on_site", "in_progress", "completed"];

export default function CustomerPortal() {
  const [phone, setPhone] = useState("");
  const [jobs, setJobs] = useState<Job[] | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setJobs(null);
    try {
      const res = await axios.get("http://127.0.0.1:8000/portal/lookup", { params: { phone } });
      setJobs(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Track Your Service Request</h1>
          <p className="text-sm text-slate-500 mt-1">Enter your phone number to check the status of your job</p>
        </div>

        <form onSubmit={handleLookup} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0722334455"
              className="flex-1 border border-slate-300 rounded px-3 py-2"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-5 py-2 rounded font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Searching..." : "Track"}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        {jobs && jobs.length === 0 && (
          <p className="text-center text-slate-500">No service requests found for this number.</p>
        )}

        {jobs && jobs.length > 0 && (
          <div className="space-y-4">
            {jobs.map((job) => {
              const stepIndex = statusSteps.indexOf(job.status);
              return (
                <div key={job.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-800">{job.job_number}</p>
                      <p className="text-xs text-slate-400">{new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                      {job.status.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-sm text-slate-700 capitalize mb-1">{job.issue_type.replace("_", " ")}</p>
                  {job.description && <p className="text-sm text-slate-500 mb-3">{job.description}</p>}

                  {job.status !== "failed" && job.status !== "cancelled" && (
                    <div className="flex items-center mt-4">
                      {statusSteps.map((step, i) => (
                        <div key={step} className="flex items-center flex-1">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              i <= stepIndex ? "bg-blue-600" : "bg-slate-200"
                            }`}
                          />
                          {i < statusSteps.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 ${
                                i < stepIndex ? "bg-blue-600" : "bg-slate-200"
                              }`}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {job.assigned_technician && (
                    <p className="text-xs text-slate-400 mt-3">
                      Technician assigned: {job.assigned_technician.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
