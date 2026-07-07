import { useMemo } from "react";
import { SupermarketShiftGame } from "./SupermarketShiftGame.jsx";
import { MorningRushGame } from "./MorningRushGame.jsx";

export function SupermarketV2Entry() {
  const shift = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = Number(params.get("shift") || 1);
    return Number.isFinite(requested) ? Math.max(1, Math.min(3, requested)) : 1;
  }, []);

  return shift === 3 ? <MorningRushGame /> : <SupermarketShiftGame />;
}

export default SupermarketV2Entry;
