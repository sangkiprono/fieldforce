import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const [listRes, countRes] = await Promise.all([
      client.get("/notifications"),
      client.get("/notifications/unread-count"),
    ]);
    setNotifications(listRes.data);
    setUnreadCount(countRes.data.count);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/jobs");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification") {
          fetchNotifications();
        }
      } catch {
        // ignore
      }
    };
    return () => ws.close();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) {
      await client.patch(`/notifications/${n.id}/read`);
      await fetchNotifications();
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleMarkAllRead = async () => {
    await client.patch("/notifications/read-all");
    await fetchNotifications();
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative border border-slate-300 text-slate-600 px-3 py-2 rounded hover:bg-slate-100 transition"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
            <p className="font-medium text-slate-800 text-sm">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="text-xs text-blue-600 hover:underline">
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400 px-4 py-6 text-center">No notifications yet.</p>
          ) : (
            <div>
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    !n.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
