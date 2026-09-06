import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import client from "../../api/client";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

interface Summary {
  total_jobs: number;
  by_status: Record<string, number>;
}

interface TechStat {
  technician_id: string;
  technician_name: string;
  total_jobs: number;
  completed_jobs: number;
}

interface TrendPoint {
  date: string;
  count: number;
}

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [techStats, setTechStats] = useState<TechStat[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [issueBreakdown, setIssueBreakdown] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      client.get("/dashboard/summary"),
      client.get("/dashboard/jobs-by-technician"),
      client.get("/dashboard/jobs-trend"),
      client.get("/dashboard/issue-breakdown"),
    ]).then(([s, t, tr, ib]) => {
      setSummary(s.data);
      setTechStats(t.data);
      setTrend(tr.data);
      setIssueBreakdown(ib.data);
      setLoading(false);
    });
  }, []);

  if (loading || !summary) {
    return <div className="p-6 text-slate-500">Loading analytics...</div>;
  }

  const statusLabels = Object.keys(summary.by_status).map((s) => s.replace("_", " "));
  const statusValues = Object.values(summary.by_status);

  const statColors = [
    "#94a3b8", "#3b82f6", "#eab308", "#f97316", "#a855f7", "#22c55e", "#ef4444", "#64748b",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Analytics</h1>
          <p className="text-sm text-slate-500">{summary.total_jobs} total jobs</p>
        </div>
        <button
          onClick={() => navigate("/manager")}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(summary.by_status).slice(0, 4).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
              <p className="text-xs text-slate-500 capitalize">{status.replace("_", " ")}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Jobs Created (Last 14 Days)</h2>
            <Line
              data={{
                labels: trend.map((t) => t.date.slice(5)),
                datasets: [{
                  label: "Jobs created",
                  data: trend.map((t) => t.count),
                  borderColor: "#3b82f6",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  fill: true,
                  tension: 0.3,
                }],
              }}
              options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Jobs by Status</h2>
            <Doughnut
              data={{
                labels: statusLabels,
                datasets: [{
                  data: statusValues,
                  backgroundColor: statColors,
                }],
              }}
              options={{ plugins: { legend: { position: "right" } } }}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Jobs by Technician</h2>
            <Bar
              data={{
                labels: techStats.map((t) => t.technician_name),
                datasets: [
                  { label: "Total", data: techStats.map((t) => t.total_jobs), backgroundColor: "#94a3b8" },
                  { label: "Completed", data: techStats.map((t) => t.completed_jobs), backgroundColor: "#22c55e" },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }}
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Issue Type Breakdown</h2>
            <Doughnut
              data={{
                labels: Object.keys(issueBreakdown).map((k) => k.replace("_", " ")),
                datasets: [{
                  data: Object.values(issueBreakdown),
                  backgroundColor: statColors,
                }],
              }}
              options={{ plugins: { legend: { position: "right" } } }}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
