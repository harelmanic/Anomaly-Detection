import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Custom tooltip so it shows price formatted nicely
function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { price, time } = payload[0].payload;
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 6,
      padding: "6px 10px",
      fontSize: "0.75rem",
      fontFamily: "var(--font-mono)",
    }}>
      <div style={{ color: "var(--text)" }}>₹{price.toFixed(2)}</div>
      <div style={{ color: "var(--muted)" }}>{new Date(time).toLocaleTimeString()}</div>
    </div>
  );
}

export default function PriceChart({ symbol, history, strategy }) {
  const latest = history[history.length - 1];
  const prev    = history[history.length - 2];

  // Determine price direction for colour — green up, red down, white flat
  const direction = !prev
    ? "flat"
    : latest.price > prev.price
    ? "up"
    : latest.price < prev.price
    ? "down"
    : "flat";

  const lineColor = direction === "up" ? "#22c55e" : direction === "down" ? "#ef4444" : "#64748b";

  // Compute a Y-axis domain with 0.5% padding so the line isn't flush with edges
  const yDomain = useMemo(() => {
    if (!history.length) return ["auto", "auto"];
    const prices = history.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.3 || max * 0.001;
    return [min - pad, max + pad];
  }, [history]);

  return (
    <div className="chart-card">
      <div className="chart-card-header">
        <div>
          <div className="chart-symbol">{symbol}</div>
          <div className="chart-meta">
            {history.length} ticks · vol {latest?.volume?.toLocaleString() ?? "—"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={`chart-price ${direction}`}>
            ₹{latest ? latest?.price?.toFixed(2) : "—"}
          </div>
          <span className="chart-strategy">{strategy}</span>
        </div>
      </div>

      {/* 
        ResponsiveContainer + LineChart from Recharts.
        We pass `history` directly as data — Recharts diffs the array internally,
        so adding a single point to the end causes only an incremental DOM update,
        not a full chart re-render.
      */}
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="time"
            hide
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
          />
          <YAxis
            domain={yDomain}
            width={60}
            tick={{ fontSize: 10, fill: "var(--muted)", fontFamily: "var(--font-mono)" }}
            tickFormatter={(v) => `₹${v.toFixed(0)}`}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false} // critical — disabling animation prevents lag on rapid ticks
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
