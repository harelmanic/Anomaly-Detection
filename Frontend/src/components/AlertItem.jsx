// Formats the simulated timestamp into a readable local time string
function formatTime(ts) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

export default function AlertItem({ alert }) {
  const { alertRef, symbol, timestamp, reason, isNew } = alert;

  return (
    <div className={`alert-item ${isNew ? "new" : ""}`}>
      {/* alertRef is the hidden required field from the brief — TV-XXXXX format */}
      <div className="alert-ref">{alertRef}</div>
      <div className="alert-symbol">{symbol}</div>
      <div className="alert-reason">{reason}</div>
      <div className="alert-time">{formatTime(timestamp)}</div>
    </div>
  );
}
