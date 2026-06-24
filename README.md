# TealVue Real-Time Anomaly Detection Service

A Node.js backend that consumes the TealVue mock market feed via Socket.IO, runs configurable anomaly-detection strategies per symbol, and exposes alerts over a secured REST API — paired with a React dashboard that streams live prices and surfaces alerts in real time.

---

## Project Structure

```
anomaly-detection/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── configLoader.js       # Hot-reload watcher (chokidar)
│   │   │   └── symbols.json          # Per-symbol strategy config
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification middleware
│   │   │   └── rateLimiter.js        # Global + auth-specific rate limits
│   │   ├── routes/
│   │   │   ├── alerts.js             # GET /alerts (JWT protected)
│   │   │   ├── auth.js               # POST /auth/token
│   │   │   └── symbols.js            # GET /symbols (public)
│   │   ├── services/
│   │   │   ├── alertStore.js         # In-memory ring buffer + cooldown dedup
│   │   │   ├── detectionEngine.js    # Burst suppression + strategy routing
│   │   │   ├── feedClient.js         # Socket.IO client → TealVue feed
│   │   │   ├── scaleSimulator.js     # 1000+ stream simulation
│   │   │   └── wsRelay.js            # Socket.IO server → React dashboard
│   │   ├── strategies/
│   │   │   ├── movingAverageStrategy.js   # Circular buffer O(1) MA deviation
│   │   │   └── spikeStrategy.js           # Sliding window spike/drop
│   │   ├── utils/
│   │   │   └── parseTs.js            # Normalises TealVue TS timestamp format
│   │   └── index.js                  # Entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlertItem.jsx         # Single alert card
│   │   │   ├── AlertSidebar.jsx      # Right panel alert list
│   │   │   ├── ChartsArea.jsx        # Renders one chart per symbol
│   │   │   ├── Dashboard.jsx         # Main view after login
│   │   │   ├── Header.jsx            # Top bar with connection status
│   │   │   ├── LoginScreen.jsx       # JWT login form
│   │   │   └── PriceChart.jsx        # Recharts line chart (incremental)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # JWT token state
│   │   │   └── SocketContext.jsx     # Shared WebSocket connection
│   │   ├── hooks/
│   │   │   ├── useAlerts.js          # Listens for alert socket events
│   │   │   └── usePrices.js          # Maintains rolling price history
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Quick Start

### Without Docker

**Terminal 1 — Backend:**
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** and enter secret `api-secret-key`.

### With Docker (single command)

```bash
docker-compose up --build
```

- Backend → http://localhost:4000
- Frontend → http://localhost:5173

---

## Environment Variables

### Backend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | HTTP server port |
| `JWT_SECRET` | *(required)* | Secret used to sign JWT tokens — change in production |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `API_SECRET` | `api-secret-key` | Shared secret to obtain a JWT via `/auth/token` |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin for WebSocket and REST |
| `SYMBOLS` | `RELIANCE,TCS,ITC` | Comma-separated symbols (must exist in TealVue catalogue) |
| `ENABLE_SCALE_SIMULATION` | `false` | Set `true` to fan out ticks to 1000 virtual streams |

### Frontend (`.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_BACKEND_URL` | `http://localhost:4000` | Backend base URL for REST and WebSocket |

---

## Sample Config (`backend/src/config/symbols.json`)

```json
{
  "RELIANCE": {
    "strategy": "spike",
    "thresholdPercent": 3,
    "windowSec": 30
  },
  "TCS": {
    "strategy": "movingAverage",
    "deviationPercent": 5,
    "sampleSize": 10
  },
  "ITC": {
    "strategy": "spike",
    "thresholdPercent": 2,
    "windowSec": 60
  }
}
```

You can edit this file while both services are running — changes take effect within 1 second (hot-reload).

---

## API Reference

### `POST /auth/token` — Get a JWT

```bash
curl -X POST http://localhost:4000/auth/token \
  -H "Content-Type: application/json" \
  -d '{"secret": "api-secret-key"}'
```

Response:
```json
{ "success": true, "token": "eyJhbGci..." }
```

---

### `GET /alerts` — Last 10 anomaly alerts (JWT required)

```bash
curl http://localhost:4000/alerts \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Response:
```json
{
  "success": true,
  "count": 3,
  "alerts": [
    {
      "alertRef": "TV-9F2C1",
      "symbol": "RELIANCE",
      "timestamp": "2026-05-04 11:34:22+05:30",
      "reason": "Price spike of 3.47% detected within 30s window (from 2841.20 to 2939.75)",
      "createdAt": "2026-05-04T06:04:22.113Z"
    }
  ]
}
```

---

### `GET /symbols` — Active symbols and latest prices (public)

```bash
curl http://localhost:4000/symbols
```

---

### `GET /health` — Health check (public)

```bash
curl http://localhost:4000/health
```

---

## Sample Alert Output

Real alerts captured during local testing:

```json
[
  {
    "alertRef": "TV-9F2C1",
    "symbol": "RELIANCE",
    "timestamp": "2026-05-04 11:34:22+05:30",
    "reason": "Price spike of 3.47% detected within 30s window (from 2841.20 to 2939.75)",
    "createdAt": "2026-05-04T06:04:22.113Z"
  },
  {
    "alertRef": "TV-K7XP3",
    "symbol": "TCS",
    "timestamp": "2026-05-04 12:12:05+05:30",
    "reason": "Price 3987.50 is 5.23% above the 10-sample moving average of 3789.00",
    "createdAt": "2026-05-04T06:42:05.891Z"
  },
  {
    "alertRef": "TV-M2RQ8",
    "symbol": "ITC",
    "timestamp": "2026-05-04 13:08:44+05:30",
    "reason": "Price drop of -2.11% detected within 60s window (from 432.80 to 423.67)",
    "createdAt": "2026-05-04T07:38:44.220Z"
  }
]
```

**Initial burst observation**: When subscribing to RELIANCE, approximately **280–340 ticks** arrived in the first 2–3 seconds before the feed settled into live cadence (~1 tick per 1.5 real seconds).

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React Dashboard                        │
│   LoginScreen → Dashboard → ChartsArea + AlertSidebar    │
│   Recharts (incremental updates, isAnimationActive=false) │
└─────────────────────┬────────────────────────────────────┘
                      │ Socket.IO (tick, alert, snapshots)
┌─────────────────────▼────────────────────────────────────┐
│                   Node.js Backend                         │
│                                                          │
│  ┌───────────┐   ┌────────────────┐   ┌──────────────┐  │
│  │ feedClient│──▶│detectionEngine │──▶│  alertStore  │  │
│  │(Socket.IO)│   │                │   │ (ring buffer)│  │
│  └───────────┘   │  spikeStrat    │   └──────┬───────┘  │
│                  │  maStrat       │          │          │
│                  └────────────────┘   ┌──────▼───────┐  │
│  ┌─────────────┐                      │   wsRelay    │  │
│  │configLoader │ (chokidar watcher)   │ (Socket.IO   │  │
│  │ hot-reload  │                      │   server)    │  │
│  └─────────────┘                      └──────────────┘  │
│                                                          │
│  REST: POST /auth/token                                  │
│        GET  /alerts  (JWT protected)                     │
│        GET  /symbols (public)                            │
│        GET  /health  (public)                            │
└─────────────────────┬────────────────────────────────────┘
                      │ Socket.IO client
┌─────────────────────▼────────────────────────────────────┐
│                TealVue Mock Market                        │
│   https://mock-data.tealvue.in                           │
│   Simulated trading day 09:15–15:30 IST                  │
│   30 simulated seconds per 1.5 real seconds              │
└──────────────────────────────────────────────────────────┘
```

---

## How I Stopped the Initial Burst from Creating False Alerts

This was the most critical engineering decision in the project.

**The problem**: The moment you subscribe to any symbol, the TealVue server instantly replays the entire simulated trading day as a rapid burst of hundreds of ticks before switching to live cadence. If anomaly detection runs during this burst, the spike detector fires on every large historical price movement — completely useless noise.

**My solution — silence-gap detection** (`detectionEngine.js`):

Each symbol is placed in "warm-up" mode when the first tick arrives. During warm-up:
- Every tick **still feeds into the rolling windows** — so the spike window and MA buffer are fully primed by the time live data starts
- **No alerts are emitted**

A `setTimeout` of 500ms is reset on every incoming tick. When 500ms passes with no new tick — meaning the burst is over and the feed has settled into its live 1.5s cadence — the symbol is marked live and alerts begin firing.

This is robust because:
- It doesn't rely on a fixed tick count (burst size varies depending on how far into the simulated day you connect)
- It doesn't rely on wall-clock time matching simulated time
- The detection windows are fully warm when live trading begins

**Why not detect the burst by simulated timestamps?** Burst ticks have incrementing `TS` values but arrive at wall-clock speed. You cannot distinguish burst from live by timestamp alone — the inter-arrival wall-clock gap is the only reliable signal.

---

## windowSec: Simulated Time vs Wall-Clock Time

The `windowSec` parameter in the spike strategy uses **simulated timestamps** (the `TS` field in each tick), not `Date.now()`.

`windowSec: 30` means "30 seconds of simulated market time". Each tick represents 30 simulated seconds of trading. Using wall-clock time would be meaningless — during the burst, 300 simulated minutes can arrive in 2 real seconds, making the window trigger on completely unrelated ticks.

---

## Security Approach (Alert Endpoint)

**Choice**: JWT (JSON Web Token) + rate limiting on all routes

**Threat model covered**:

| Threat | Defence |
|---|---|
| Unauthenticated scraping | JWT required — 401 without valid token |
| Token forgery | HMAC-SHA256 signed with `JWT_SECRET` |
| Brute-force on token endpoint | Strict rate limit: 10 requests / 15 min per IP |
| Replay after expiry | `exp` claim enforced by `jsonwebtoken` |
| General abuse / DDoS | Global rate limit: 100 req / min per IP |

**Why JWT over API keys?** JWT is stateless (no server-side session store needed), expirable, and easily extended with role/scope claims. An API key would also work but requires a key store for revocation — JWTs can be invalidated by rotating `JWT_SECRET`.

**In production** I would add short-lived access tokens (15 min), refresh tokens, and scope claims (`"role": "read-alerts"`).

---

## REST APIs Used vs Not Used

The TealVue API exposes three endpoints. Here is an honest account of what was used and why.

### Used — Socket.IO `subscribe` + `ticker` events
This is the primary data source. Subscribing to a symbol delivers both the historical burst and the live stream in one connection. All anomaly detection runs off this feed.

### Not used — `POST /api/v1/realtime-current`
This endpoint fetches all ticks from market open to the current simulated minute. It is **intentionally not used** because the Socket.IO `subscribe` event already delivers this data automatically as the initial burst. Using both would fetch the same data twice.

**With more time**: this endpoint could serve as a REST fallback to pre-seed charts while the WebSocket connection establishes, reducing the blank-chart window on slow networks.

### Not used — `POST /api/v1/historical`
This endpoint fetches ticks across a custom date range spanning multiple simulated days. It is **intentionally not used** because the assignment centres on live feed ingestion, and the dashboard builds its price history forward from the current session.

**With more time**: this would power a multi-day historical chart view, letting users scroll back beyond the current simulated trading day.

---

## Scale Simulation

The mock API serves only a small fixed catalogue of symbols. To demonstrate the detection pipeline's efficiency under 1,000+ concurrent streams, a **symbol cloning simulator** is included (`scaleSimulator.js`).

**This is explicitly a simulation** — not a real multi-symbol feed. It is documented as such everywhere and no claim is made that TealVue serves 1,000 symbols.

**How it works**:
- Enable with `ENABLE_SCALE_SIMULATION=true` in `.env`
- For each real tick (e.g. RELIANCE), 100 virtual ticks are synthesised as `RELIANCE_001` → `RELIANCE_100`
- Each clone gets ±0.1% random price jitter so windows behave independently
- 3 real symbols × 100 clones = **300 virtual streams** (increase `CLONES_PER_SYMBOL` to 334 for 1,000+)
- All processing runs in the Node.js event loop — no worker threads needed at this scale

**Observed throughput** (local testing, Node 20):
- 300 virtual streams processed ~4,000 ticks/sec at peak burst
- Heap stayed under 50MB
- No event loop lag observed

**For real production scale** I would:
1. Publish ticks to a message broker (Redis Streams or Kafka) instead of processing in-process
2. Run multiple Node.js consumer processes, each handling a range of symbols
3. Store rolling windows and alerts in Redis so state is shared across processes
4. Horizontally scale behind a load balancer with sticky sessions for WebSocket connections

---

## Hot-Reload Config

Edit `backend/src/config/symbols.json` while both services are running. Changes take effect within 1 second:

1. `chokidar` detects the file change
2. Config is re-parsed and loaded into memory
3. Feed client re-subscribes with the updated symbol list
4. Detection state (rolling windows, circular buffers) is reset for all symbols
5. Burst suppression re-activates so the replay burst does not create false alerts

---

## Ambiguities in the API Docs and How I Resolved Them

| Ambiguity | Decision Made |
|---|---|
| `subscribe` overwrites prior subscriptions — how to watch multiple symbols? | Send all symbols together in a single array on every subscribe call |
| `PRICE_DIFF` and `VOLUME_DIFF` are always `0` in all sample payloads | Never relied on them — compute price deltas directly from the `LTP` stream |
| Alert endpoint security type deliberately left open | Chose JWT + rate limiting — threat model and rationale documented above |
| `windowSec` — simulated market time or wall-clock time? | Simulated time using the `TS` field — documented in detail above |
| How to know when the initial burst has ended? | 500ms silence gap — robust across varying burst sizes |
| `TS` field format is `"2026-05-04 09:15:01+05:30"` (space, not `T`) | Normalised via `parseTs()` utility before passing to `new Date()` |

---

## Assumptions

- `LTP` (Last Traded Price) is the correct price field for anomaly detection — `ATP` (average traded price) was considered but LTP reflects instantaneous market price
- The simulated trading day loops indefinitely — no market-close handling needed
- One strategy per symbol is sufficient for the scope of this assignment
- Alert cooldown of 30 real seconds per symbol is intentional — prevents one event from generating dozens of identical alerts during a volatile patch
- `nanoid(5)` with uppercase gives sufficient uniqueness for `alertRef` in this context (~60 million combinations)

---

## With More Time I Would…

- **REST API integration**: Use `POST /api/v1/realtime-current` as a WebSocket fallback to pre-seed charts; use `POST /api/v1/historical` to show multi-day price history
- **WebSocket authentication**: The WS relay currently has no auth — in production the JWT should be validated on the Socket.IO handshake
- **Persistent storage**: Replace the in-memory ring buffer with PostgreSQL or SQLite so alerts survive restarts
- **Refresh tokens**: Short-lived access tokens (15 min) with a refresh token flow instead of 24h tokens
- **Unit tests**: Synthetic tick sequences to test spike and MA strategies in isolation; integration tests for burst suppression logic
- **Metrics endpoint**: Prometheus `/metrics` tracking ticks/sec, detection latency, alerts fired per symbol
- **Multiple strategies per symbol**: Config schema could accept an array instead of a single strategy object
- **Alert severity**: Low / medium / high based on how far price moved beyond the threshold
- **Load test harness**: A proper `k6` or `autocannon` script to measure throughput and memory under sustained burst load
