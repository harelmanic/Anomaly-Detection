import AlertItem from "./AlertItem";

export default function AlertSidebar({ alerts }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Alerts</h2>
        {alerts.length > 0 && (
          <span className="alert-count">{alerts.length}</span>
        )}
      </div>

      <div className="alert-list">
        {alerts.length === 0 ? (
          <div className="empty-state">
            <p>No anomalies detected yet.</p>
            <p style={{ marginTop: 6 }}>Waiting for live feed…</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <AlertItem key={alert.alertRef} alert={alert} />
          ))
        )}
      </div>
    </aside>
  );
}
