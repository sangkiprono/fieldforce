import { useEffect, useRef } from "react";

export function useJobsSocket(onUpdate: () => void) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/jobs");

    ws.onopen = () => {
      console.log("[WS] connected");
    };

    ws.onmessage = (event) => {
      console.log("[WS] message received:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "job_created" || data.type === "job_updated") {
          callbackRef.current();
        }
      } catch (e) {
        console.log("[WS] parse error", e);
      }
    };

    ws.onerror = (e) => {
      console.log("[WS] error", e);
    };

    ws.onclose = () => {
      console.log("[WS] closed");
    };

    return () => {
      ws.close();
    };
  }, []);
}
