import { useState, useEffect } from "react";

const MAX_ALERTS = 50;

/**
 * Subscribes to socket alert events and maintains a local list.
 * Marks the newest alert as "isNew" for 2s so the UI can highlight it.
 */
export function useAlerts(socket) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Socket may be null on first render — wait until it's ready
    if (!socket) return;

    // Seed with whatever alerts the server already has when we connect
    socket.on("alert_snapshot", (initial) => {
      setAlerts(initial.map((a) => ({ ...a, isNew: false })));
    });

    socket.on("alert", (alert) => {
      setAlerts((prev) => {
        const updated = [{ ...alert, isNew: true }, ...prev].slice(0, MAX_ALERTS);
        return updated;
      });

      // Clear the highlight after 2 seconds
      setTimeout(() => {
        setAlerts((prev) =>
          prev.map((a) => (a.alertRef === alert.alertRef ? { ...a, isNew: false } : a))
        );
      }, 2000);
    });

    return () => {
      socket.off("alert_snapshot");
      socket.off("alert");
    };
  }, [socket]); // re-run when socket becomes available

  return alerts;
}
