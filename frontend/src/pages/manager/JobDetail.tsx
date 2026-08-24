import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import client from "../../api/client";

interface Job {
  id: string;
  job_number: string;
  customer: { name: string; phone: string; address: string };
  issue_type: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_technician: { id: string; name: string } | null;
  created_at: string;
}

interface HistoryItem {
  id: string;
  status: string;
  changed_by: string;
  note: string | null;
  created_at: string;
}

interface Note {
  id: string;
  author_id: string;
  note: string;
  created_at: string;
}

interface Photo {
  id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
}

interface Technician {
  id: string;
  name: string;
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

export default function JobDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [jobRes, historyRes, notesRes, photosRes] = await Promise.all([
      client.get(`/jobs/${jobId}`),
      client.get(`/jobs/${jobId}/history`),
      client.get(`/jobs/${jobId}/notes`),
      client.get(`/jobs/${jobId}/photos`),
    ]);
    setJob(jobRes.data);
    setHistory(historyRes.data);
    setNotes(notesRes.data);
    setPhotos(photosRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [jobId]);

  if (loading || !job) {
    return <div className="p-6 text-slate-500">Loading job...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <button onClick={() => navigate("/manager")} className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to Dashboard
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">{job.job_number}</h1>
              <p className="text-sm text-slate-500">Created {new Date(job.created_at).toLocaleString()}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[job.status]}`}>
              {job.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-400">Customer</p>
              <p className="text-slate-800 font-medium">{job.customer.name}</p>
              <p className="text-slate-500">{job.customer.phone}</p>
              <p className="text-slate-500">{job.customer.address}</p>
            </div>
            <div>
              <p className="text-slate-400">Issue</p>
              <p className="text-slate-800 font-medium capitalize">{job.issue_type.replace("_", " ")}</p>
              <p className="text-slate-400 mt-2">Priority</p>
              <p className="text-slate-800 capitalize">{job.priority}</p>
              <p className="text-slate-400 mt-2">Technician</p>
              <p className="text-slate-800">{job.assigned_technician?.name || "Unassigned"}</p>
            </div>
          </div>

          {job.description && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-slate-400 text-sm">Description</p>
              <p className="text-slate-700 text-sm">{job.description}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Status Timeline</h2>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">No status changes yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[h.status]}`}>
                    {h.status.replace("_", " ")}
                  </span>
                  <span className="text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                  {h.note && <span className="text-slate-600">— {h.note}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {notes.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Notes</h2>
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="text-sm text-slate-700 border-l-2 border-slate-200 pl-3">
                  {n.note}
                  <p className="text-xs text-slate-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {photos.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Photos</h2>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((p) => (
                <a key={p.id} href={`http://127.0.0.1:8000${p.photo_url}`} target="_blank" rel="noreferrer">
                  <img
                    src={`http://127.0.0.1:8000${p.photo_url}`}
                    alt={p.caption || "Job photo"}
                    className="rounded border border-slate-200 w-full h-24 object-cover"
                  />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
