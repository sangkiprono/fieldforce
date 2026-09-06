import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../../api/client";

interface TechAttendance {
  technician_id: string;
  technician_name: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

const statusColors: Record<string, string> = {
  checked_in: "bg-green-100 text-green-700",
  checked_out: "bg-slate-100 text-slate-600",
  absent: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  checked_in: "Checked In",
  checked_out: "Checked Out",
  absent: "Not Checked In",
};

export default function TeamAttendance() {
  const [attendance, setAttendance] = useState<TechAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/attendance/team-today").then((res) => {
      setAttendance(res.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Team Attendance</h1>
          <p className="text-sm text-slate-500">Today, {new Date().toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => navigate("/manager")}
          className="border border-slate-300 text-slate-600 px-4 py-2 rounded hover:bg-slate-100 transition"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        {loading ? (
          <p className="text-slate-500">Loading attendance...</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600 text-left">
                <tr>
                  <th className="px-4 py-3">Technician</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check In</th>
                  <th className="px-4 py-3">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a.technician_id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-800">{a.technician_name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                        {statusLabels[a.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
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
