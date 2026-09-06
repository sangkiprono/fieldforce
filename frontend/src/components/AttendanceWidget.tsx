import { useEffect, useState } from "react";
import client from "../api/client";

interface Attendance {
  id: string;
  check_in_time: string | null;
  check_out_time: string | null;
}

export default function AttendanceWidget() {
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchToday = async () => {
    const res = await client.get("/attendance/today");
    setAttendance(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchToday();
  }, []);

  const handleCheckIn = async () => {
    setActing(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await client.post("/attendance/check-in", {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
            await fetchToday();
            setActing(false);
          },
          async () => {
            await client.post("/attendance/check-in", {});
            await fetchToday();
            setActing(false);
          }
        );
      } else {
        await client.post("/attendance/check-in", {});
        await fetchToday();
        setActing(false);
      }
    } catch {
      setActing(false);
    }
  };

  const handleCheckOut = async () => {
    setActing(true);
    try {
      await client.post("/attendance/check-out");
      await fetchToday();
    } finally {
      setActing(false);
    }
  };

  if (loading) return null;

  const checkedIn = attendance?.check_in_time && !attendance?.check_out_time;
  const checkedOut = attendance?.check_in_time && attendance?.check_out_time;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-800">
          {checkedOut ? "Shift completed" : checkedIn ? "Currently checked in" : "Not checked in yet"}
        </p>
        {attendance?.check_in_time && (
          <p className="text-xs text-slate-500">
            In: {new Date(attendance.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {attendance.check_out_time && (
              <> — Out: {new Date(attendance.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
            )}
          </p>
        )}
      </div>

      {!checkedOut && (
        <button
          onClick={checkedIn ? handleCheckOut : handleCheckIn}
          disabled={acting}
          className={`px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 ${
            checkedIn ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {acting ? "..." : checkedIn ? "Check Out" : "Check In"}
        </button>
      )}
    </div>
  );
}
