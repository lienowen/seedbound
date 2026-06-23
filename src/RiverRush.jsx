import { useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Text } from "pixi.js";

const RUN_SECONDS = 35;
const TRACK = [
  { t: 0.10, x: 0.28, kind: "flower" },
  { t: 0.17, x: 0.58, kind: "rock" },
  { t: 0.24, x: 0.72, kind: "flower" },
  { t: 0.30, x: 0.40, kind: "rock" },
  { t: 0.37, x: 0.20, kind: "flower" },
  { t: 0.43, x: 0.62, kind: "flower" },
  { t: 0.49, x: 0.78, kind: "fire" },
  { t: 0.55, x: 0.35, kind: "rock" },
  { t: 0.61, x: 0.18, kind: "flower" },
  { t: 0.67, x: 0.50, kind: "rock" },
  { t: 0.73, x: 0.74, kind: "flower" },
  { t: 0.79, x: 0.32, kind: "flower" },
  { t: 0.85, x: 0.60, kind: "fire" },
  { t: 0.91, x: 0.48, kind: "bird" },
];

function GameStage({ runId, paused, onFrame, onFinish }) {
  const hostRef = useRef(null);
  const callbacks = useRef({ onFrame, onFinish, paused });
  callbacks.current = { onFrame, onFinish, paused };

  useEffect(() => {
    let app;
    let ready = false;
    let observer;
    let disposed = false;

    async function init() {
      app = new Application();
      await app.init({
        width: hostRef.current.clientWidth,
        height: hostRef.current.clientHeight,
        background: 0xeedfc4,
        antialias: true,
        resolution: Math.min(devicePixelRatio, 2),
        autoDensity: true,
      });
      ready = true;
      if (disposed) return app.destroy(true, { children: true });
      hostRef.current.appendChild(app.canvas);

      const world = new Container();
      const course = new Container();
      const playerLayer = new Container();
      app.stage.addChild(world, course, playerLayer);

      const backdrop = new Graphics();
      const river = new Graphics();
      world.addChild(backdrop, river);

      const player = new Graphics();
      playerLayer.addChild(player);

      const wake = new Graphics();
      playerLayer.addChildAt(wake, 0);

      const items = TRACK.map((data, index) => {
        const view = new Graphics();
        course.addChild(view);
        return { ...data, index, view, hit: false, passed: false };
      });

      let elapsed = 0;
      let playerX = 0.5;
      let targetX = 0.5;
      let dragging = false;
      let health = 3;
      let bloom = 0;
      let near = 0;
      let score = 0;
      let lastHudUpdate = 0;

      function dimensions() {
        const w = app.screen.width;
        const h = app.screen.height;
        backdrop.clear().rect(0, 0, w, h).fill(0xf2e5ce);
        backdrop
          .poly([0, 0, w * 0.23, 0, w * 0.42, h, 0, h]).fill(0x789a47)
          .poly([w, 0, w * 0.77, 0, w * 0.58, h, w, h]).fill(0x6f9141);
        river.clear()
          .poly([w * 0.23, 0, w * 0.77, 0, w * 0.58, h, w * 0.42, h])
          .fill(0x38aeca)
          .stroke({ color: 0xd7f7ef, width: 3, alpha: 0.7 });
      }
      dimensions();

      function drawPlayer(w, h) {
        const x = w * (0.37 + playerX * 0.26);
        const y = h * 0.77;
        player.clear()
          .moveTo(x, y - 30)
          .bezierCurveTo(x + 25, y - 2, x + 22, y + 21, x, y + 25)
          .bezierCurveTo(x - 22, y + 21, x - 25, y - 2, x, y - 30)
          .fill(0x5ed9f3)
          .stroke({ color: 0xffffff, width: 3, alpha: 0.9 });
        wake.clear()
          .moveTo(x, y + 12).lineTo(x - 14, h).stroke({ color: 0xc7f5ff, width: 4, alpha: 0.32 })
          .moveTo(x, y + 12).lineTo(x + 14, h).stroke({ color: 0xc7f5ff, width: 4, alpha: 0.32 });
      }

      function drawItem(item, progress, w, h) {
        const relative = item.t - progress;
        const y = h * (0.16 + (1 - relative * 3.1) * 0.72);
        const perspective = Math.max(0.28, Math.min(1.15, y / (h * 0.72)));
        const riverLeft = w * (0.23 + (y / h) * 0.19);
        const riverWidth = w * (0.54 - (y / h) * 0.38);
        const x = riverLeft + item.x * riverWidth;
        item.screenX = x;
        item.screenY = y;
        item.scale = perspective;
        item.view.visible = y > -40 && y < h + 60 && !item.passed;
        if (!item.view.visible) return;
        item.view.clear();
        if (item.kind === "rock") {
          item.view.poly([x - 22 * perspective, y + 15 * perspective, x, y - 24 * perspective, x + 25 * perspective, y + 15 * perspective])
            .fill(item.hit ? 0x8c7365 : 0x59636a).stroke({ color: 0xe2e0d7, width: 2 });
        } else if (item.kind === "fire") {
          item.view.moveTo(x, y - 27 * perspective)
            .bezierCurveTo(x + 25 * perspective, y, x + 15 * perspective, y + 24 * perspective, x, y + 20 * perspective)
            .bezierCurveTo(x - 18 * perspective, y + 18 * perspective, x - 22 * perspective, y, x, y - 27 * perspective)
            .fill(0xe96f32).stroke({ color: 0xffc65d, width: 3 });
        } else if (item.kind === "bird") {
          item.view.circle(x, y, 17 * perspective).fill(0x4bb6d0).stroke({ color: 0xffffff, width: 3 });
        } else {
          const color = item.hit ? 0xef7e86 : 0xc8b9a2;
          item.view.circle(x, y, 14 * perspective).fill(color).stroke({ color: 0xffffff, width: 2 });
          for (let p = 0; p < 5; p += 1) {
            const a = (Math.PI * 2 * p) / 5;
            item.view.circle(x + Math.cos(a) * 13 * perspective, y + Math.sin(a) * 13 * perspective, 7 * perspective).fill(color);
          }
        }
      }

      app.stage.eventMode = "static";
      app.stage.hitArea = app.screen;
      app.stage.on("pointerdown", (e) => {
        dragging = true;
        targetX = e.global.x / app.screen.width;
      });
      app.stage.on("pointermove", (e) => {
        if (dragging) targetX = e.global.x / app.screen.width;
      });
      app.stage.on("pointerup", () => { dragging = false; });
      app.stage.on("pointerupoutside", () => { dragging = false; });

      observer = new ResizeObserver(() => {
        app.renderer.resize(hostRef.current.clientWidth, hostRef.current.clientHeight);
        dimensions();
      });
      observer.observe(hostRef.current);

      app.ticker.add((ticker) => {
        if (callbacks.current.paused) return;
        elapsed += ticker.deltaMS / 1000;
        const progress = Math.min(1, elapsed / RUN_SECONDS);
        targetX = Math.max(0.02, Math.min(0.98, targetX));
        playerX += (targetX - playerX) * Math.min(1, ticker.deltaTime * 0.18);
        const w = app.screen.width;
        const h = app.screen.height;
        drawPlayer(w, h);

        items.forEach((item) => {
          drawItem(item, progress, w, h);
          if (!item.view.visible || item.passed) return;
          const dx = Math.abs(item.screenX - w * (0.37 + playerX * 0.26));
          const dy = Math.abs(item.screenY - h * 0.77);
          const threshold = 24 + item.scale * 18;
          if (dy < threshold && dx < threshold && !item.hit) {
            item.hit = true;
            if (item.kind === "flower") {
              bloom += 1;
              score += 120 * Math.max(1, bloom);
            } else if (item.kind === "bird") {
              score += 1200;
            } else {
              health -= 1;
              bloom = 0;
            }
          } else if (dy < threshold && dx < threshold * 1.8 && dx > threshold && !item.near) {
            item.near = true;
            near += 1;
            score += 80;
          }
          if (item.screenY > h * 0.88) item.passed = true;
        });

        if (ticker.lastTime - lastHudUpdate >= 100) {
          lastHudUpdate = ticker.lastTime;
          callbacks.current.onFrame({ elapsed, health, bloom, near, score, progress });
        }
        if (health <= 0 || progress >= 1) {
          callbacks.current.onFinish({ won: health > 0, health, bloom, near, score, elapsed });
          app.ticker.stop();
        }
      });
    }

    init();
    return () => {
      disposed = true;
      observer?.disconnect();
      if (ready) app.destroy(true, { children: true });
    };
  }, [runId]);

  return <div className="rush-stage" ref={hostRef} aria-label="River Rush game stage" />;
}

export function RiverRush() {
  const [runId, setRunId] = useState(1);
  const [paused, setPaused] = useState(false);
  const [stats, setStats] = useState({ elapsed: 0, health: 3, bloom: 0, near: 0, score: 0, progress: 0 });
  const [result, setResult] = useState(null);

  function restart() {
    setResult(null);
    setStats({ elapsed: 0, health: 3, bloom: 0, near: 0, score: 0, progress: 0 });
    setPaused(false);
    setRunId((id) => id + 1);
  }

  return (
    <main className="rush-shell">
      <GameStage runId={runId} paused={paused} onFrame={setStats} onFinish={setResult} />
      <header className="rush-hud">
        <div className="water-life">{[0, 1, 2].map((i) => <i key={i} className={i < stats.health ? "active" : ""} />)}</div>
        <div className="rush-score"><small>BLOOM</small><strong>x{stats.bloom}</strong></div>
        <button onClick={() => setPaused((value) => !value)}>{paused ? "PLAY" : "II"}</button>
      </header>
      <div className="rush-progress"><span style={{ width: `${stats.progress * 100}%` }} /></div>
      <div className="rush-stats"><span>{Math.round(stats.score)} PTS</span><span>{stats.near} NEAR MISS</span></div>
      {!result && stats.elapsed < 2.8 && <div className="steer-hint"><b>DRAG LEFT OR RIGHT</b><span>Keep the water alive</span></div>}
      {result && (
        <section className="rush-result">
          <small>{result.won ? "RIVER COMPLETE" : "DROPLET EVAPORATED"}</small>
          <h1>{result.score.toLocaleString()} points</h1>
          <p>Bloom x{result.bloom} · {result.near} near miss</p>
          <button onClick={restart}>RUN AGAIN</button>
        </section>
      )}
    </main>
  );
}
