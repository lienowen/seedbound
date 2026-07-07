export function calculateShiftScore(metrics = {}) {
  const availability = clampPercent(metrics.availability ?? 0);
  const accuracy = clampPercent(metrics.accuracy ?? 0);
  const facing = clampPercent(metrics.facing ?? 0);
  const customer = clampPercent(metrics.customerService ?? 0);
  const waste = clampPercent(metrics.wasteControl ?? 0);

  return {
    total: Math.round(
      availability * 0.35
      + accuracy * 0.25
      + facing * 0.2
      + customer * 0.1
      + waste * 0.1,
    ),
    breakdown: {
      availability,
      accuracy,
      facing,
      customer,
      waste,
    },
  };
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}
