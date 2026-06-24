import { useAuth } from "../context/AuthContext";

export default function Header({ connected, symbolCount, alertCount }) {
  const { logout } = useAuth();

  return (
    <header className="header">
      <div className="header-brand">
        {/* Live / disconnected indicator dot */}
        <div className={`header-dot ${connected ? "" : "disconnected"}`} />
        <h1>TealVue Anomaly Monitor</h1>
        <span className="header-status">
          {connected
            ? `Live · ${symbolCount} symbol${symbolCount !== 1 ? "s" : ""}`
            : "Reconnecting…"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {alertCount > 0 && (
          <span style={{ fontSize: "0.75rem", color: "var(--red)" }}>
            {alertCount} alert{alertCount !== 1 ? "s" : ""}
          </span>
        )}
        <button
          className="btn"
          onClick={logout}
          style={{ background: "var(--border)", color: "var(--muted)", padding: "5px 12px" }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
