import { useEffect, useRef } from "react";

export function useJobsSocket(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/jobs");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "job_created" || data.type === "job_updated") {
          callbackRef.current();
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      // silent — connection issues shouldn't break the UI
    };

    return () => {
      ws.close();
    };
  }, []);
}
