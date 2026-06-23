export const FOREST_LEVEL = {
  width: 2530,
  height: 844,
  spawn: { x: 145, y: 420 },
  goal: { x: 2240, y: 430 },
  surfaces: [
    {
      id: "start-ground",
      points: [[0, 500], [250, 500], [480, 496], [640, 500]],
    },
    {
      id: "mushroom-landing",
      points: [[970, 548], [1160, 545], [1390, 548]],
    },
    {
      id: "lower-path",
      points: [[1390, 655], [1580, 648], [1780, 650], [1980, 654], [2220, 650], [2530, 650]],
    },
    {
      id: "vine-bridge",
      points: [[1320, 401], [1450, 397], [1580, 389], [1710, 383], [1845, 380]],
    },
    {
      id: "upper-leaf",
      points: [[1850, 258], [2020, 252], [2200, 248], [2530, 250]],
    },
  ],
  mushrooms: [
    { x: 720, y: 525, radius: 42 },
    { x: 805, y: 470, radius: 46 },
    { x: 900, y: 410, radius: 52 },
  ],
  collectibles: [
    { id: "dew-start", x: 380, y: 420 },
    { id: "dew-mushroom", x: 835, y: 355 },
    { id: "dew-lower", x: 1190, y: 475 },
  ],
  water: {
    x: 1671,
    top: 286,
    bottom: 496,
  },
};

export function surfaceYAt(surface, x) {
  const points = surface.points;
  for (let i = 0; i < points.length - 1; i += 1) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    if (x >= x1 && x <= x2) {
      const ratio = (x - x1) / Math.max(1, x2 - x1);
      return y1 + (y2 - y1) * ratio;
    }
  }
  return null;
}
