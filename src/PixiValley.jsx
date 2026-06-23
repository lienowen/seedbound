import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import { MAP_W, MAP_H, TILE, ELEVATION_COLORS, getTileInfo } from "./simulation.js";

const RENDER_STEP = 2;
const RENDER_W = Math.ceil(MAP_W / RENDER_STEP);
const RENDER_H = Math.ceil(MAP_H / RENDER_STEP);
const ISO_W = 64;
const ISO_H = 32;
const ISO_ORIGIN_X = RENDER_H * ISO_W / 2 + 30;
const ISO_ORIGIN_Y = 72;
const CONTINENT_W = 1420;
const CONTINENT_H = 947;
const CONTINENT_CENTER = { x: ISO_ORIGIN_X + 295, y: ISO_ORIGIN_Y + 382 };

function isoPoint(x, y, elevation = 0) {
  return {
    x: ISO_ORIGIN_X + (x - y) * ISO_W / 2,
    y: ISO_ORIGIN_Y + (x + y) * ISO_H / 2 - Math.max(0, elevation - 3) * 2,
  };
}

function textureIndex(world, x, y) {
  if (!world.continent[y][x] || world.elevation[y][x] < 3) return 0;
  if (world.plant[y][x] >= 1) return 2;
  if (world.temperature[y][x] <= 1) return 7;
  if (world.moisture[y][x] >= 1) return 1;
  return 0;
}

function addPowerBurst(app, layer, x, y, selected, color) {
  const burst = new Container();
  burst.position.set(x, y);
  layer.addChild(burst);

  const ring = new Graphics()
    .circle(0, 0, 14).fill({ color, alpha: 0.17 })
    .circle(0, 0, 23).stroke({ color, width: 3, alpha: 0.88 })
    .circle(0, 0, 43).stroke({ color, width: 2, alpha: 0.5 });
  burst.addChild(ring);

  const particles = [];
  const countByPower = { water: 18, seed: 16, fire: 18, ice: 14, wind: 11 };
  const count = countByPower[selected] ?? 12;
  for (let i = 0; i < count; i++) {
    const particle = new Graphics();
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const radius = 14 + Math.random() * 36;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * 0.58;

    if (selected === "water") {
      particle.moveTo(0, -18 - Math.random() * 24)
        .lineTo(0, 14 + Math.random() * 18)
        .stroke({ color: 0x62d7ff, width: 2, alpha: 0.85 });
    } else if (selected === "seed") {
      particle.ellipse(0, 0, 5, 9).fill({ color: 0xa6f44b, alpha: 0.88 });
    } else if (selected === "fire") {
      particle.circle(0, 0, 4 + Math.random() * 5).fill({ color: i % 2 ? 0xffb047 : 0xff7048, alpha: 0.88 });
    } else if (selected === "ice") {
      particle.rect(-4, -4, 8, 8).fill({ color: 0xcaf5ff, alpha: 0.76 });
      particle.rotation = angle;
    } else {
      particle.arc(0, 0, 10 + Math.random() * 16, -0.7, 0.8)
        .stroke({ color: 0xb48cff, width: 2, alpha: 0.72 });
    }

    particle.position.set(px, selected === "water" ? py - 78 : py);
    particle.targetX = px + Math.cos(angle) * (selected === "wind" ? 58 : 24);
    particle.targetY = py + (selected === "water" ? 62 : Math.sin(angle) * 22);
    particle.startY = particle.y;
    particles.push(particle);
    burst.addChild(particle);
  }

  let age = 0;
  const animateBurst = (ticker) => {
    age += ticker.deltaMS;
    const progress = Math.min(1, age / 720);
    ring.scale.set(0.58 + progress * 1.65);
    ring.alpha = 1 - progress;
    ring.rotation += ticker.deltaTime * 0.025;
    particles.forEach((particle, i) => {
      const ease = 1 - Math.pow(1 - progress, 2);
      particle.x += (particle.targetX - particle.x) * 0.12 * ticker.deltaTime;
      particle.y = particle.startY + (particle.targetY - particle.startY) * ease;
      particle.alpha = Math.max(0, 1 - progress * 1.18);
      particle.scale.set(0.72 + Math.sin(progress * Math.PI + i) * 0.16 + progress * 0.28);
      if (selected === "wind") particle.rotation += 0.08 * ticker.deltaTime;
    });
    if (progress >= 1) {
      app.ticker.remove(animateBurst);
      burst.destroy({ children: true });
    }
  };
  app.ticker.add(animateBurst);
}

export function PixiValley({ world, selected, elementColor, disabled, onDrop }) {
  const hostRef = useRef(null);
  const apiRef = useRef({ onDrop, selected, elementColor, disabled });
  const appRef = useRef(null);
  const mapRef = useRef(null);
  const uiRef = useRef(null);
  const lifeRef = useRef(null);
  const worldRef = useRef(world);
  const panRef = useRef({ x: 0, y: 0, scale: 1, dragging: false, lastX: 0, lastY: 0 });
  apiRef.current = { onDrop, selected, disabled, elementColor };
  worldRef.current = world;

  // --- Update isometric terrain state ---
  useEffect(() => {
    const tiles = mapRef.current;
    if (!tiles || !world?.elevation) return;
    for (let ry = 0; ry < RENDER_H; ry++) {
      for (let rx = 0; rx < RENDER_W; rx++) {
        const x = Math.min(MAP_W - 1, rx * RENDER_STEP);
        const y = Math.min(MAP_H - 1, ry * RENDER_STEP);
        const tile = tiles[ry * RENDER_W + rx];
        if (!tile) continue;
        const nextIndex = textureIndex(world, x, y);
        if (tile.textureIndex !== nextIndex) {
          tile.textureIndex = nextIndex;
          tile.texture = tile.textures[nextIndex];
        }
        const ocean = !world.continent[y][x] || world.elevation[y][x] < 3;
        tile.tint = nextIndex === 2 ? 0xa8ff6f : ocean ? 0x4f9bc0 : 0xffffff;
        tile.alpha = ocean ? 0 : nextIndex === 0 ? 0 : nextIndex === 1 ? 0.5 : 0.78;
      }
    }
  }, [world]);

  // --- Element cursor overlay ---
  useEffect(() => {
    const gfx = uiRef.current;
    if (!gfx) return;
    gfx.clear();
    if (disabled) return;
    const el = ELEMENTS_SUPPORT[selected];
    if (!el) return;
    const center = isoPoint(RENDER_W / 2, RENDER_H / 2);
    gfx.ellipse(center.x, center.y, ISO_W * 3.2, ISO_H * 3.2)
      .stroke({ color: el.colorHex, width: 1, alpha: 0.4 });
  }, [selected, disabled]);

  // --- Main setup ---
  useEffect(() => {
    let disposed = false;
    let app;
    let initialized = false;
    let resizeObserver;

    async function mount() {
      app = new Application();
      await app.init({
        antialias: false,
        autoDensity: true,
        backgroundAlpha: 0,
        width: Math.max(1, hostRef.current.clientWidth),
        height: Math.max(1, hostRef.current.clientHeight),
        resolution: Math.min(window.devicePixelRatio || 1, 2),
      });
      initialized = true;
      appRef.current = app;
      if (disposed) { app.destroy(true, { children: true }); return; }
      hostRef.current.appendChild(app.canvas);

      const worldContainer = new Container();
      app.stage.addChild(worldContainer);

      const continentTexture = await Assets.load("/assets/isometric/barren-continent.png");
      const continentBase = new Sprite(continentTexture);
      continentBase.anchor.set(0.5);
      continentBase.width = CONTINENT_W;
      continentBase.height = CONTINENT_H;
      continentBase.position.set(CONTINENT_CENTER.x, CONTINENT_CENTER.y);
      worldContainer.addChild(continentBase);

      const terrainTextures = await Promise.all(
        Array.from({ length: 8 }, (_, i) => Assets.load(`/assets/isometric/terrain/terrain-${i}.png`))
      );
      const allTextures = terrainTextures;

      const terrainLayer = new Container();
      worldContainer.addChild(terrainLayer);
      const tiles = [];
      for (let ry = 0; ry < RENDER_H; ry++) {
        for (let rx = 0; rx < RENDER_W; rx++) {
          const x = Math.min(MAP_W - 1, rx * RENDER_STEP);
          const y = Math.min(MAP_H - 1, ry * RENDER_STEP);
          const index = textureIndex(worldRef.current, x, y);
          const sprite = new Sprite(allTextures[index]);
          const point = isoPoint(rx, ry, worldRef.current.elevation[y][x]);
          sprite.anchor.set(0.5, 0.68);
          sprite.position.set(point.x, point.y);
          sprite.width = ISO_W * 0.82;
          sprite.height = ISO_H * 1.68;
          sprite.textures = allTextures;
          sprite.textureIndex = index;
          const ocean = !worldRef.current.continent[y][x] || worldRef.current.elevation[y][x] < 3;
          sprite.tint = index === 2 ? 0xa8ff6f : ocean ? 0x4f9bc0 : 0xffffff;
          sprite.alpha = ocean ? 0 : index === 0 ? 0 : index === 1 ? 0.5 : 0.78;
          terrainLayer.addChild(sprite);
          tiles.push(sprite);
        }
      }
      mapRef.current = tiles;

      // UI overlay (cursor, selection)
      const uiGfx = new Graphics();
      uiGfx.eventMode = "none";
      worldContainer.addChild(uiGfx);
      uiRef.current = uiGfx;

      const lifeLayer = new Container();
      worldContainer.addChild(lifeLayer);
      lifeRef.current = lifeLayer;
      const settlerTextures = await Promise.all(
        Array.from({ length: 8 }, (_, i) => Assets.load(`/assets/isometric/settler/settler-${i}.png`))
      );
      const natureTextures = await Promise.all(
        Array.from({ length: 8 }, (_, i) => Assets.load(`/assets/isometric/nature/nature-${i}.png`))
      );

      const camp = new Sprite(natureTextures[4]);
      camp.anchor.set(0.5, 0.86);
      camp.width = 74;
      camp.height = 78;
      const campPoint = isoPoint(14.5, 10.5, 4);
      camp.position.set(campPoint.x, campPoint.y);
      camp.visible = false;
      lifeLayer.addChild(camp);

      const settlers = Array.from({ length: 3 }, (_, index) => {
        const sprite = new Sprite(settlerTextures[0]);
        sprite.anchor.set(0.5, 0.9);
        sprite.width = 34;
        sprite.height = 54;
        sprite.position.set(camp.x + (index - 1) * 26, camp.y + 18 + index * 7);
        sprite.visible = false;
        sprite.seed = index * 2.17;
        sprite.homeX = sprite.x;
        sprite.homeY = sprite.y;
        lifeLayer.addChild(sprite);
        return sprite;
      });

      const critters = Array.from({ length: 4 }, (_, index) => {
        const sprite = new Sprite(natureTextures[index % 3]);
        sprite.anchor.set(0.5, 0.9);
        sprite.width = 28 + index * 3;
        sprite.height = 28 + index * 3;
        const point = isoPoint(17 + index * 2, 13 + (index % 2) * 2, 4);
        sprite.position.set(point.x, point.y);
        sprite.visible = false;
        sprite.seed = index * 1.73;
        sprite.homeX = sprite.x;
        sprite.homeY = sprite.y;
        lifeLayer.addChild(sprite);
        return sprite;
      });

      app.ticker.add((ticker) => {
        const current = worldRef.current;
        const animalReady = current && current.totalAnimals > 0;
        const populationReady = current && current.totalBuildings > 0;
        camp.visible = populationReady;
        critters.forEach((sprite, index) => {
          sprite.visible = animalReady && index < Math.max(1, Math.min(4, current.totalAnimals));
          if (!sprite.visible) return;
          const phase = ticker.lastTime * 0.00075 + sprite.seed;
          sprite.x = sprite.homeX + Math.sin(phase) * (14 + index * 4);
          sprite.y = sprite.homeY + Math.cos(phase * 1.4) * 8;
          sprite.alpha = 0.74 + Math.sin(phase * 2) * 0.18;
        });
        settlers.forEach((sprite, index) => {
          sprite.visible = populationReady;
          if (!populationReady) return;
          const phase = ticker.lastTime * 0.00045 + sprite.seed;
          const taskPhase = Math.floor((ticker.lastTime / 4200 + index) % 4);
          const walking = taskPhase === 0 || taskPhase === 1;
          const targetX = sprite.homeX + Math.sin(phase) * (42 + index * 13);
          const targetY = sprite.homeY + Math.cos(phase * 0.7) * 18;
          sprite.x += (targetX - sprite.x) * 0.018 * ticker.deltaTime;
          sprite.y += (targetY - sprite.y) * 0.018 * ticker.deltaTime;
          const walkFrame = 1 + Math.floor(ticker.lastTime / 220 + index) % 2;
          const actionFrames = [walkFrame, walkFrame, 4 + (index % 2), 6];
          sprite.texture = settlerTextures[walking ? walkFrame : actionFrames[taskPhase]];
          sprite.scale.x = Math.abs(sprite.scale.x) * (Math.cos(phase) < 0 ? -1 : 1);
        });
        lifeLayer.children.sort((a, b) => a.y - b.y);
      });

      // Fit map to viewport
      function fitMap() {
        const rect = hostRef.current.getBoundingClientRect();
        app.renderer.resize(Math.max(1, rect.width), Math.max(1, rect.height));
        app.stage.hitArea = app.screen;
        const w = app.screen.width, h = app.screen.height;
        const scale = Math.max(w / CONTINENT_W, h / CONTINENT_H) * 1.82;
        panRef.current.scale = scale;
        panRef.current.x = w / 2 - CONTINENT_CENTER.x * scale;
        panRef.current.y = h / 2 - (CONTINENT_CENTER.y + 34) * scale;
        worldContainer.scale.set(scale);
        worldContainer.position.set(panRef.current.x, panRef.current.y);
      }
      fitMap();
      resizeObserver = new ResizeObserver(fitMap);
      resizeObserver.observe(hostRef.current);

      // Pointer events for pan + tap
      app.stage.eventMode = "static";

      app.stage.on("pointerdown", (e) => {
        panRef.current.dragging = true;
        panRef.current.lastX = e.global.x;
        panRef.current.lastY = e.global.y;
      });
      app.stage.on("pointermove", (e) => {
        if (!panRef.current.dragging) return;
        const dx = e.global.x - panRef.current.lastX;
        const dy = e.global.y - panRef.current.lastY;
        panRef.current.x += dx;
        panRef.current.y += dy;
        panRef.current.lastX = e.global.x;
        panRef.current.lastY = e.global.y;
        worldContainer.position.set(panRef.current.x, panRef.current.y);
      });
      app.stage.on("pointerup", (e) => {
        const dx = Math.abs(e.global.x - panRef.current.lastX);
        const dy = Math.abs(e.global.y - panRef.current.lastY);
        panRef.current.dragging = false;
        // If barely moved, treat as tap
        if (dx < 5 && dy < 5 && !apiRef.current.disabled) {
          const s = panRef.current.scale;
          const localX = (e.global.x - panRef.current.x) / s - ISO_ORIGIN_X;
          const localY = (e.global.y - panRef.current.y) / s - ISO_ORIGIN_Y;
          const tileX = Math.round((localX / ISO_W + localY / ISO_H) * RENDER_STEP);
          const tileY = Math.round((localY / ISO_H - localX / ISO_W) * RENDER_STEP);
          if (tileX >= 0 && tileX < MAP_W && tileY >= 0 && tileY < MAP_H) {
            const localImpactX = (e.global.x - panRef.current.x) / s;
            const localImpactY = (e.global.y - panRef.current.y) / s;
            const color = Number.parseInt(apiRef.current.elementColor.replace("#", ""), 16);
            addPowerBurst(app, worldContainer, localImpactX, localImpactY, apiRef.current.selected, color);
            apiRef.current.onDrop(tileX, tileY);
          }
        }
      });
      app.stage.on("pointerupoutside", () => { panRef.current.dragging = false; });

      // Zoom with wheel
      app.stage.on("wheel", (e) => {
        const s = panRef.current.scale;
        const newScale = Math.max(0.42, Math.min(3.4, s * (e.deltaY < 0 ? 1.08 : 0.92)));
        // Zoom toward mouse position
        const mx = e.global.x, my = e.global.y;
        panRef.current.x = mx - (mx - panRef.current.x) * (newScale / s);
        panRef.current.y = my - (my - panRef.current.y) * (newScale / s);
        panRef.current.scale = newScale;
        worldContainer.scale.set(newScale);
        worldContainer.position.set(panRef.current.x, panRef.current.y);
      });
    }

    mount();
    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      if (initialized && app) app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={hostRef} className="pixi-valley" aria-label="God simulator world map" />;
}

// Local element reference for cursor
const ELEMENTS_SUPPORT = {
  water: { colorHex: 0x53c8ff },
  seed: { colorHex: 0xa6f44b },
  fire: { colorHex: 0xff7048 },
  ice: { colorHex: 0xa9e8ff },
  wind: { colorHex: 0xb48cff },
};
