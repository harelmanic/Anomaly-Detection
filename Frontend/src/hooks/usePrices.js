import { useState, useEffect, useRef } from "react";

const MAX_POINTS = 300;

export function usePrices(socket) {
  const [priceHistory, setPriceHistory] = useState({});
  const prevPriceRef = useRef({});

  useEffect(() => {
    if (!socket) return;

    socket.on("price_snapshot", (snapshot) => {
      const initial = {};
      Object.entries(snapshot).forEach(([symbol, data]) => {
        // Use 'close' or 'price' - whichever is available
        const price = data.close || data.price || data.open;
        initial[symbol] = [
          { 
            time: new Date(data.timestamp.replace(" ", "T")).getTime(), 
            price: price, 
            volume: data.volume 
          }
        ];
        prevPriceRef.current[symbol] = price;
      });
      setPriceHistory(initial);
    });

    socket.on("tick", ({ symbol, timestamp, volume, open, high, low, close, price }) => {
      // Use close price if available, otherwise use open
      const currentPrice = close || price || open;
      
      const point = { 
        time: new Date(timestamp.replace(" ", "T")).getTime(), 
        price: currentPrice, 
        volume: volume 
      };

      setPriceHistory((prev) => {
        const existing = prev[symbol] || [];
        const updated = [...existing, point];
        const trimmed = updated.length > MAX_POINTS ? updated.slice(-MAX_POINTS) : updated;
        return { ...prev, [symbol]: trimmed };
      });

      prevPriceRef.current[symbol] = currentPrice;
    });

    return () => {
      socket.off("price_snapshot");
      socket.off("tick");
    };
  }, [socket]);

  return { priceHistory, prevPrices: prevPriceRef.current };
}
