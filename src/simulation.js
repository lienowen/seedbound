// --- God Simulator: World Model & Simulation ---

const MAP_W = 50;
const MAP_H = 35;
const TILE = 16; // pixel size per tile

// Life tier thresholds
const PLANT_TIERS = [
  { min: 0, label: "barren", color: 0xc4b898 },
  { min: 1, label: "grass", color: 0xa8c868 },
  { min: 2, label: "shrubs", color: 0x7ab840 },
  { min: 3, label: "trees", color: 0x4a8828 },
  { min: 4, label: "forest", color: 0x2d5a18 },
  { min: 5, label: "ancient", color: 0x1a3a0c },
];

const ANIMAL_TIERS = [
  { min: 0, label: "none", icon: "" },
  { min: 1, label: "insects", icon: "·" },
  { min: 2, label: "birds", icon: "v" },
  { min: 3, label: "herbivores", icon: "▲" },
  { min: 4, label: "predators", icon: "♦" },
];

const BUILDING_TIERS = [
  { min: 0, label: "none", icon: "" },
  { min: 1, label: "camp", icon: "⌂" },
  { min: 2, label: "village", icon: "▣" },
  { min: 3, label: "town", icon: "▣" },
  { min: 4, label: "city", icon: "▣" },
];

// Terrain colors — barren wasteland palette
const ELEVATION_COLORS = [
  0x3a6090, // 0: deep ocean
  0x4a7aa0, // 1: ocean
  0x6a9ab0, // 2: shallow water
  0xc4b898, // 3: sand/beach
  0xb8a878, // 4: dry plains
  0xa89860, // 5: arid highlands
  0x8a7a48, // 6: rocky plateau
  0x6a5a38, // 7: mountain base
  0x5a4a2e, // 8: mountain
  0x4a3a20, // 9: peak
];

function randomFrom(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function refreshTotals(world) {
  world.totalPlants = 0;
  world.totalAnimals = 0;
  world.totalBuildings = 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      world.totalPlants += world.plant[y][x];
      world.totalAnimals += world.animal[y][x];
      world.totalBuildings += world.building[y][x];
    }
  }
  if (world.totalBuildings > 5) world.stage = "Civilization";
  else if (world.totalAnimals > 8) world.stage = "Wildlife Flourishing";
  else if (world.totalPlants > 80) world.stage = "Green World";
  else if (world.totalPlants > 18) world.stage = "Life Emerging";
  else world.stage = "Barren Land";
  return world;
}

// --- World Creation ---
export function createWorld(seed) {
  const random = randomFrom(seed || Date.now());

  // Continent shape — landmass in center with irregular coastline
  const continent = Array.from({ length: MAP_H }, (_, y) =>
    Array.from({ length: MAP_W }, (_, x) => {
      const fx = x / MAP_W - 0.5;
      const fy = y / MAP_H - 0.5;
      // Base oval continent
      const dx = fx * 1.6, dy = fy * 1.1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Add noise to coastline
      const angle = Math.atan2(fy, fx);
      const coastNoise = Math.sin(angle * 5 + random() * 2) * 0.06 + Math.sin(angle * 11) * 0.03;
      const landDist = dist + coastNoise + (random() - 0.5) * 0.04;
      return landDist < 0.42;
    })
  );

  // Generate elevation
  const elevation = Array.from({ length: MAP_H }, (_, y) =>
    Array.from({ length: MAP_W }, (_, x) => {
      if (!continent[y][x]) {
        // Ocean — deeper near edges
        const fx = x / MAP_W - 0.5, fy = y / MAP_H - 0.5;
        const edgeDist = Math.max(Math.abs(fx), Math.abs(fy)) * 2;
        return Math.round(Math.max(0, 3 - edgeDist * 3 + random() * 0.5));
      }
      const fx = x / MAP_W, fy = y / MAP_H;
      // Mountains in top-left quadrant
      const mtDist = Math.sqrt((fx - 0.25) ** 2 + (fy - 0.3) ** 2);
      const mountain = mtDist < 0.18 ? Math.round((0.18 - mtDist) / 0.18 * 5 + random() * 2) : 0;
      // Hills in center-right
      const hillDist = Math.sqrt((fx - 0.6) ** 2 + (fy - 0.55) ** 2);
      const hills = hillDist < 0.15 ? Math.round((0.15 - hillDist) / 0.15 * 3 + random()) : 0;
      // River valley through center
      const riverDist = Math.abs(fy - 0.35 - Math.sin(fx * 4) * 0.12);
      const river = riverDist < 0.04 ? -2 : 0;
      // Base elevation
      const base = 4 + (random() - 0.5) * 2;
      return Math.round(Math.max(2, Math.min(9, base + mountain + hills + river)));
    })
  );

  // Barren start: no moisture, no life
  const moisture = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 0));
  const temperature = Array.from({ length: MAP_H }, (_, y) =>
    Array.from({ length: MAP_W }, (_, x) => {
      // Warmer near equator (center), colder near poles and mountains
      const lat = Math.abs(y / MAP_H - 0.5) * 2;
      return Math.round(Math.max(0, Math.min(9, 7 - lat * 4 - elevation[y][x] * 0.3 + (random() - 0.5) * 1.5)));
    })
  );

  // All barren
  const plant = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 0));
  const animal = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 0));
  const building = Array.from({ length: MAP_H }, () => Array.from({ length: MAP_W }, () => 0));

  return {
    MAP_W, MAP_H, TILE,
    elevation, moisture, temperature, plant, animal, building,
    continent,
    energy: 100,
    maxEnergy: 100,
    tick: 0,
    totalPlants: 0,
    totalAnimals: 0,
    totalBuildings: 0,
    stage: "Barren Land",
  };
}

// --- Simulation Tick ---
export function simulateTick(world) {
  const { MAP_W, MAP_H, elevation, moisture, temperature, plant, animal, building } = world;
  const next = structuredClone(world);
  next.tick += 1;
  const currentPlantMass = world.totalPlants || 0;
  const currentAnimalMass = world.totalAnimals || 0;

  // 1. Water flows downhill
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (moisture[y][x] <= 0) continue;
      const neighbors = [
        [y-1, x], [y+1, x], [y, x-1], [y, x+1],
        [y-1, x-1], [y-1, x+1], [y+1, x-1], [y+1, x+1],
      ];
      let totalFlow = 0;
      const flows = neighbors.map(([ny, nx]) => {
        if (ny < 0 || ny >= MAP_H || nx < 0 || nx >= MAP_W) return 0;
        const elevDiff = elevation[y][x] - elevation[ny][nx];
        if (elevDiff > 0) {
          const flow = Math.min(moisture[y][x] * 0.08, elevDiff * 0.3);
          totalFlow += flow;
          return flow;
        }
        return 0;
      });
      if (totalFlow > 0) {
        next.moisture[y][x] = Math.max(0, moisture[y][x] - totalFlow);
        neighbors.forEach(([ny, nx], i) => {
          if (flows[i] > 0) {
            next.moisture[ny][nx] = Math.min(9, moisture[ny][nx] + flows[i]);
          }
        });
      }
    }
  }

  // 2. Evaporation
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const evap = temperature[y][x] * 0.015 + 0.01;
      next.moisture[y][x] = Math.max(0, moisture[y][x] - evap);
    }
  }

  // 3. Plant growth
  next.totalPlants = 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const m = moisture[y][x], t = temperature[y][x];
      const p = plant[y][x];
      // Growth conditions: need moisture and moderate temperature
      if (m >= 1 && t >= 1 && t <= 8 && p < 5) {
        const growthChance = m * 0.03 * (1 - Math.abs(t - 4.5) / 5);
        if (Math.random() < growthChance) {
          next.plant[y][x] = Math.min(5, p + 1);
          if (p === 0) next.plant[y][x] = 1; // First growth is guaranteed if conditions met
        }
      }
      // Plants add moisture back (transpiration)
      if (p >= 3 && m < 6) {
        next.moisture[y][x] = Math.min(9, m + 0.02 * p);
      }
      next.totalPlants += next.plant[y][x];
    }
  }

  // 4. Animal spawning
  next.totalAnimals = 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      let a = animal[y][x];
      const p = next.plant[y][x];
      // Animals should feel earned: first build a real green belt, then life arrives.
      if (currentPlantMass >= 80 && p >= 2 && a === 0 && Math.random() < 0.0025) {
        next.animal[y][x] = 1;
        a = 1;
      }
      // Birds when more plants
      if (currentPlantMass >= 130 && p >= 3 && a === 1 && Math.random() < 0.0015) {
        next.animal[y][x] = 2;
        a = 2;
      }
      // Herbivores when trees exist
      if (currentPlantMass >= 210 && p >= 4 && a === 2 && Math.random() < 0.0009) {
        next.animal[y][x] = 3;
        a = 3;
      }
      // Predators when herbivores exist
      if (currentPlantMass >= 320 && a === 3 && Math.random() < 0.00035) {
        next.animal[y][x] = 4;
        a = 4;
      }
      // Animal decay if no food
      if (a >= 3 && p < 2 && Math.random() < 0.02) {
        next.animal[y][x] = Math.max(0, a - 1);
      }
      if (a >= 1 && a <= 2 && p < 1 && Math.random() < 0.03) {
        next.animal[y][x] = Math.max(0, a - 1);
      }
      next.totalAnimals += next.animal[y][x];
    }
  }

  // 5. Human settlement
  next.totalBuildings = 0;
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      let b = building[y][x];
      const p = next.plant[y][x];
      const a = next.animal[y][x];
      // Humans are a late reward, not a starting prop.
      if (currentPlantMass >= 260 && currentAnimalMass >= 24 && p >= 4 && a >= 3 && b === 0 && Math.random() < 0.00025) {
        next.building[y][x] = 1;
        b = 1;
      }
      // Village grows
      if (b >= 1 && b < 4 && p >= 3 && a >= 2) {
        if (currentPlantMass >= 300 && currentAnimalMass >= 30 && Math.random() < 0.00035 * b) {
          next.building[y][x] = Math.min(4, b + 1);
        }
      }
      // Spread to neighbors
      if (b >= 2) {
        const neighbors = [[y-1,x],[y+1,x],[y,x-1],[y,x+1]];
        for (const [ny, nx] of neighbors) {
          if (ny >= 0 && ny < MAP_H && nx >= 0 && nx < MAP_W) {
            if (currentPlantMass >= 360 && currentAnimalMass >= 35 && next.building[ny][nx] === 0 && next.plant[ny][nx] >= 3 && Math.random() < 0.0007 * b) {
              next.building[ny][nx] = 1;
            }
          }
        }
      }
      next.totalBuildings += next.building[y][x];
    }
  }

  // 6. Energy regeneration
  next.energy = Math.min(next.maxEnergy, next.energy + 0.3);

  // 7. Stage label
  if (next.totalBuildings > 5) next.stage = "Civilization";
  else if (next.totalAnimals > 20) next.stage = "Wildlife Flourishing";
  else if (next.totalPlants > 100) next.stage = "Green World";
  else if (next.totalPlants > 20) next.stage = "Life Emerging";
  else next.stage = "Barren Land";

  return next;
}

// --- Player Actions ---
export function applyElement(world, element, tileX, tileY, radius = 3) {
  const next = structuredClone(world);
  const cost = { water: 15, seed: 10, fire: 20, ice: 12, wind: 8 }[element] || 10;
  if (next.energy < cost) return next;
  next.energy -= cost;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius) continue;
      const x = tileX + dx, y = tileY + dy;
      if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) continue;
      const power = 1 - dist / radius;

      if (element === "water") {
        next.moisture[y][x] = Math.min(9, next.moisture[y][x] + 1.2 + power * 5.2);
        // Extinguish fire-like conditions
        if (next.temperature[y][x] > 8) next.temperature[y][x] = Math.max(0, next.temperature[y][x] - power * 3);
        if (power > 0.56 && next.elevation[y][x] <= 4) {
          next.moisture[y][x] = Math.min(9, next.moisture[y][x] + 2.2);
        }
      }
      if (element === "seed") {
        if (next.moisture[y][x] >= 0.6 && next.plant[y][x] < 5 && next.temperature[y][x] >= 1 && next.temperature[y][x] <= 8) {
          const wetBonus = next.moisture[y][x] >= 3 ? 2 : 1;
          next.plant[y][x] = Math.min(5, next.plant[y][x] + Math.max(1, Math.round(power * 2.4)) + wetBonus);
          next.moisture[y][x] = Math.max(0, next.moisture[y][x] - 0.45);
        }
      }
      if (element === "fire") {
        next.temperature[y][x] = Math.min(9, next.temperature[y][x] + power * 4);
        if (next.plant[y][x] > 0 && power > 0.5) {
          next.plant[y][x] = Math.max(0, next.plant[y][x] - 1);
          next.energy = Math.min(next.maxEnergy, next.energy + 2.8 * power);
        }
        next.moisture[y][x] = Math.max(0, next.moisture[y][x] - power * 2);
      }
      if (element === "ice") {
        next.temperature[y][x] = Math.max(0, next.temperature[y][x] - power * 3);
        if (next.moisture[y][x] > 0) {
          next.moisture[y][x] = Math.min(9, next.moisture[y][x] + power * 2); // Ice traps moisture
        }
      }
      if (element === "wind") {
        const spread = [
          [0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2],
        ];
        for (const [sx, sy] of spread) {
          const ny = y + sy;
          const nx = x + sx;
          if (ny >= 0 && ny < MAP_H && nx >= 0 && nx < MAP_W && power > 0.35) {
            next.moisture[ny][nx] = Math.min(9, next.moisture[ny][nx] + next.moisture[y][x] * power * 0.18);
            if (next.plant[y][x] > 0 && next.plant[ny][nx] < next.plant[y][x] - 1) {
              next.plant[ny][nx] = Math.max(next.plant[ny][nx], Math.min(3, next.plant[y][x] - 1));
            }
          }
        }
      }
    }
  }
  refreshTotals(next);
  if (next.totalPlants >= 65 && next.totalAnimals < 3) {
    for (let i = 0; i < 3; i++) {
      const x = Math.max(2, Math.min(MAP_W - 3, tileX + i * 2 - 2));
      const y = Math.max(2, Math.min(MAP_H - 3, tileY + (i % 2 ? 2 : -1)));
      if (next.plant[y][x] >= 2) next.animal[y][x] = Math.max(next.animal[y][x], 1);
    }
  }
  if (next.totalPlants >= 140 && next.totalAnimals >= 3 && next.totalBuildings < 1) {
    const x = Math.max(2, Math.min(MAP_W - 3, tileX - 2));
    const y = Math.max(2, Math.min(MAP_H - 3, tileY + 1));
    next.building[y][x] = 1;
  }
  return refreshTotals(next);
}

// Utility
export function getTileInfo(world, x, y) {
  const p = world.plant[y][x];
  const a = world.animal[y][x];
  const b = world.building[y][x];
  return {
    elevation: world.elevation[y][x],
    moisture: world.moisture[y][x],
    temperature: world.temperature[y][x],
    plantTier: PLANT_TIERS.find(t => t.min <= p) || PLANT_TIERS[0],
    animalTier: ANIMAL_TIERS.find(t => t.min <= a) || ANIMAL_TIERS[0],
    buildingTier: BUILDING_TIERS.find(t => t.min <= b) || BUILDING_TIERS[0],
    plant: p,
    animal: a,
    building: b,
  };
}

export { MAP_W, MAP_H, TILE, PLANT_TIERS, ANIMAL_TIERS, BUILDING_TIERS, ELEVATION_COLORS };
