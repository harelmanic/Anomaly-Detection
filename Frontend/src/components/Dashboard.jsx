import { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { usePrices } from "../hooks/usePrices";
import { useAlerts } from "../hooks/useAlerts";
import Header from "./Header";
import ChartsArea from "./ChartsArea";
import AlertSidebar from "./AlertSidebar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function Dashboard({ token }) {
  const { socket, connected } = useSocket();
  const { priceHistory } = usePrices(socket);
  const alerts = useAlerts(socket);

  // Symbol list comes from the REST endpoint (not the socket) so we get strategy info too
  const [symbols, setSymbols] = useState([]);

  useEffect(() => {
    console.log(priceHistory, 'priceHistory')
    async function fetchSymbols() {
      try {
        const res = await fetch(`${BACKEND_URL}/symbols`);
        const data = await res.json();
        if (data.success) setSymbols(data.symbols);
      } catch (err) {
        console.error("[Dashboard] Failed to fetch symbols:", err.message);
      }
    }

    fetchSymbols();

    // Re-fetch symbol list every 30s to pick up hot-reload config changes
    const interval = setInterval(fetchSymbols, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="layout">
      <Header
        connected={connected}
        symbolCount={symbols.length}
        alertCount={alerts.length}
      />
      <p>{symbols.length} symbols loaded</p>
      <ChartsArea symbols={symbols} priceHistory={priceHistory} />
      <AlertSidebar alerts={alerts} />
    </div>
  );
}
