import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const { login, error, loading } = useAuth();
  const [secret, setSecret] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await login(secret.trim());
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div>
          <h1 className="auth-title">TealVue Anomaly Monitor</h1>
          <p className="auth-subtitle">Enter your API secret to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            className="input"
            type="password"
            placeholder="API secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            autoFocus
          />

          <button className="btn btn-primary" type="submit" disabled={loading || !secret}>
            {loading ? "Authenticating…" : "Connect"}
          </button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        {/* Dev hint — remove before production */}
        <p style={{ fontSize: "0.7rem", color: "var(--muted)", textAlign: "center" }}>
          Default secret: <code>tealvue-dev-secret</code>
        </p>
      </div>
    </div>
  );
}
