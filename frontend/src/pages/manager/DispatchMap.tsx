import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import client from "../../api/client";

interface Job {
  id: string;
  job_number: string;
  customer: { name: string; phone: string; address: string; latitude: number | null; longitude: number | null };
  issue_type: string;
  priority: string;
  status: string;
  assigned_technician: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "#94a3b8",
  assigned: "#3b82f6",
  en_route: "#eab308",
  on_site: "#f97316",
  in_progress: "#a855f7",
  completed: "#22c55e",
  failed: "#ef4444",
};

function makeIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const NAIROBI_CENTER: [number, number] = [-1.286389, 36.817223];

export default function DispatchMap() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/jobs").then((res) => {
      setJobs(res.data);
      setLoading(false);
    });
  }, []);

  const jobsWithLocation = jobs.filter(
    (j) => j.customer.latitude !== null && j.customer.longitude !== null
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dispatch Map</h1>
          <p className="text-sm text-slate-500">{jobsWithLocation.length} jobs plotted</p>
        </div>
        <button
          onClick={() => navigate("/manager")}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
        >
          ← Back to List
        </button>
      </header>

      {loading ? (
        <p className="p-6 text-slate-500">Loading map...</p>
      ) : (
        <div style={{ height: "calc(100vh - 73px)" }}>
          <MapContainer center={NAIROBI_CENTER} zoom={12} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              attribution='&copy; OpenStreetMap contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {jobsWithLocation.map((job) => (
              <Marker
                key={job.id}
                position={[job.customer.latitude!, job.customer.longitude!]}
                icon={makeIcon(statusColors[job.status] || "#94a3b8")}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{job.job_number}</p>
                    <p>{job.customer.name}</p>
                    <p className="text-slate-500">{job.customer.address}</p>
                    <p className="capitalize mt-1">{job.issue_type.replace("_", " ")} — {job.priority}</p>
                    <p className="mt-1">
                      <span className="font-medium">Status:</span> {job.status.replace("_", " ")}
                    </p>
                    <p><span className="font-medium">Tech:</span> {job.assigned_technician?.name || "Unassigned"}</p>
                    <button
                      onClick={() => navigate(`/manager/jobs/${job.id}`)}
                      className="mt-2 text-blue-600 underline text-xs"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </div>
  );
}
