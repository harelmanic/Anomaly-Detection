import PriceChart from "./PriceChart";

export default function ChartsArea({ symbols, priceHistory }) {
  if (!symbols.length) {
    return (
      <main className="charts-area">
        <div className="empty-state" style={{ marginTop: 60 }}>
          <p>Waiting for symbol config…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="charts-area">
      {symbols.map(({ symbol, strategy }) => {
        const history = priceHistory[symbol] || [];
        // if (!history.length) return null;

        return (
          <PriceChart
            key={symbol}
            symbol={symbol}
            history={history}
            strategy={strategy}
          />
        );
      })}
    </main>
  );
}
