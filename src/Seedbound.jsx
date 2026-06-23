import { useEffect, useRef, useState } from "react";
import { Application, Assets, Container, Graphics, Sprite } from "pixi.js";
import { FOREST_LEVEL, surfaceYAt } from "./levels/forestLevel.js";

const WORLD_W = FOREST_LEVEL.width;
const BASE_H = FOREST_LEVEL.height;

function SeedboundStage({ paused, debug, runId, input, onStats, onWin }) {
  const host = useRef(null);
  const state = useRef({ paused, debug, onStats, onWin });
  state.current = { paused, debug, onStats, onWin };

  useEffect(() => {
    let app;
    let observer;
    let disposed = false;
    let ready = false;

    async function start() {
      app = new Application();
      await app.init({
        width: host.current.clientWidth,
        height: host.current.clientHeight,
        background: 0xdde5c5,
        antialias: true,
        resolution: Math.min(devicePixelRatio, 2),
        autoDensity: true,
      });
      ready = true;
      if (disposed) return app.destroy(true, { children: true });
      host.current.appendChild(app.canvas);

      const world = new Container();
      const effects = new Container();
      app.stage.addChild(world, effects);
      const [backgroundTexture, ...frames] = await Promise.all([
        Assets.load("/assets/seedbound-forest.png"),
        ...Array.from({ length: 6 }, (_, i) => Assets.load(`/assets/seed-frames/seed-${i}.png`)),
      ]);
      if (disposed) return;

      const background = new Sprite(backgroundTexture);
      background.width = WORLD_W;
      background.height = BASE_H;
      world.addChild(background);

      const collisionDebug = new Graphics();
      world.addChild(collisionDebug);

      const ambience = new Container();
      world.addChild(ambience);
      for (let i = 0; i < 15; i += 1) {
        const mote = new Graphics().circle(0, 0, 1.5 + (i % 3)).fill({ color: 0xfff2b2, alpha: 0.28 });
        mote.position.set(130 + i * 157, 130 + (i * 83) % 390);
        mote.baseY = mote.y;
        ambience.addChild(mote);
      }

      const shadow = new Graphics().ellipse(0, 0, 38, 11).fill({ color: 0x17251b, alpha: 0.3 });
      world.addChild(shadow);
      const hero = new Sprite(frames[0]);
      hero.anchor.set(0.5, 0.9);
      hero.width = 82;
      hero.height = 112;
      world.addChild(hero);

      const dropViews = FOREST_LEVEL.collectibles.map((drop) => {
        const view = new Graphics()
          .moveTo(0, -17).bezierCurveTo(15, 0, 12, 17, 0, 19)
          .bezierCurveTo(-12, 17, -15, 0, 0, -17)
          .fill(0x63d8f2).stroke({ color: 0xe9ffff, width: 2 });
        view.scale.set(0.72);
        view.position.set(drop.x, drop.y);
        world.addChild(view);
        return { ...drop, view, collected: false };
      });

      const mushroomViews = FOREST_LEVEL.mushrooms.map((m) => {
        const cap = new Graphics().ellipse(0, 0, m.radius, m.radius * 0.42).fill(0xe46f48).stroke({ color: 0xffd7a4, width: 4 });
        cap.position.set(m.x, m.y);
        world.addChild(cap);
        return { ...m, view: cap };
      });

      const gateGlow = new Graphics().circle(2310, 405, 55).fill({ color: 0xffd765, alpha: 0 });
      world.addChild(gateGlow);

      const waterFlow = new Container();
      const streamCore = new Graphics()
        .roundRect(0, 0, 7, 205, 4)
        .fill({ color: 0xa9eff6, alpha: 0.5 });
      streamCore.position.set(FOREST_LEVEL.water.x - 3, FOREST_LEVEL.water.top);
      waterFlow.addChild(streamCore);
      const flowingDrops = Array.from({ length: 9 }, (_, i) => {
        const drop = new Graphics().ellipse(0, 0, 3 + (i % 2), 8 + (i % 3)).fill({ color: 0xe2ffff, alpha: 0.8 });
        drop.x = FOREST_LEVEL.water.x + (i % 3 - 1) * 3;
        drop.y = 290 + i * 24;
        drop.offset = i * 24;
        waterFlow.addChild(drop);
        return drop;
      });
      const ripple = new Graphics()
        .ellipse(0, 0, 28, 7).stroke({ color: 0xc7fbff, width: 3, alpha: 0.65 })
        .ellipse(0, 0, 15, 4).stroke({ color: 0x72d9e8, width: 2, alpha: 0.6 });
      ripple.position.set(FOREST_LEVEL.water.x, FOREST_LEVEL.water.bottom);
      waterFlow.addChild(ripple);
      world.addChild(waterFlow);

      const player = { ...FOREST_LEVEL.spawn, vx: 0, vy: 0, w: 44, h: 62, grounded: false };
      let water = 0;
      let cameraX = 0;
      let lastJump = false;
      let lastHud = 0;
      let won = false;
      let coyote = 0;

      function resetAfterFall() {
        player.x = Math.max(90, cameraX + 90);
        player.y = 350;
        player.vx = 0;
        player.vy = 0;
      }

      function resize() {
        app.renderer.resize(host.current.clientWidth, host.current.clientHeight);
      }
      resize();
      observer = new ResizeObserver(resize);
      observer.observe(host.current);

      app.ticker.add((ticker) => {
        if (state.current.paused || won) return;
        const dt = Math.min(0.032, ticker.deltaMS / 1000);
        const controls = input.current;
        const direction = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
        const targetSpeed = direction * 285;
        player.vx += (targetSpeed - player.vx) * Math.min(1, dt * (player.grounded ? 14 : 7));
        if (!direction && player.grounded) player.vx *= Math.pow(0.05, dt);

        const pressedJump = controls.jump && !lastJump;
        lastJump = controls.jump;
        if (player.grounded) coyote = 0.11;
        else coyote -= dt;
        if (pressedJump && coyote > 0) {
          player.vy = -485;
          player.grounded = false;
          coyote = 0;
        }
        if (!controls.jump && player.vy < -170) player.vy += 900 * dt;

        const oldBottom = player.y + player.h / 2;
        player.vy += 1120 * dt;
        player.x += player.vx * dt;
        player.y += player.vy * dt;
        player.x = Math.max(35, Math.min(WORLD_W - 35, player.x));
        player.grounded = false;

        for (const surface of FOREST_LEVEL.surfaces) {
          const nextBottom = player.y + player.h / 2;
          const groundY = surfaceYAt(surface, player.x);
          if (
            groundY !== null &&
            player.vy >= 0 &&
            oldBottom <= groundY + 10 &&
            nextBottom >= groundY
          ) {
            player.y = groundY - player.h / 2;
            player.vy = 0;
            player.grounded = true;
          }
        }

        for (const mushroom of mushroomViews) {
          const dx = Math.abs(player.x - mushroom.x);
          const feet = player.y + player.h / 2;
          if (player.vy > 0 && dx < mushroom.radius * 0.78 && feet > mushroom.y - 24 && feet < mushroom.y + 24) {
            player.y = mushroom.y - player.h / 2 - 18;
            player.vy = -610;
            mushroom.view.scale.set(1.12, 0.78);
          } else {
            mushroom.view.scale.x += (1 - mushroom.view.scale.x) * 0.18;
            mushroom.view.scale.y += (1 - mushroom.view.scale.y) * 0.18;
          }
        }

        for (const drop of dropViews) {
          drop.view.rotation += dt * 0.8;
          drop.view.y = drop.y + Math.sin(ticker.lastTime * 0.004 + drop.x) * 6;
          if (!drop.collected && Math.hypot(player.x - drop.x, player.y - drop.y) < 55) {
            drop.collected = true;
            drop.view.visible = false;
            water += 1;
          }
        }

        if (player.y > BASE_H + 120) resetAfterFall();
        if (player.x > FOREST_LEVEL.goal.x && water === 3) {
          won = true;
          hero.texture = frames[5];
          hero.width = 106;
          hero.height = 136;
          gateGlow.alpha = 0.42;
          state.current.onWin({ water });
        }

        const moving = Math.abs(player.vx) > 35;
        const frameIndex = !player.grounded ? (player.vy < 0 ? 3 : 4) : moving ? 1 + Math.floor(ticker.lastTime / 130) % 2 : 0;
        if (!won) hero.texture = frames[frameIndex];
        hero.scale.x = Math.abs(hero.scale.x) * (player.vx < -5 ? -1 : 1);
        hero.position.set(player.x, player.y);
        hero.rotation = player.grounded ? player.vx / 1600 : player.vx / 2300;
        shadow.position.set(player.x, player.y + player.h / 2 - 3);
        shadow.scale.x = player.grounded ? 1 : Math.max(0.45, 1 - Math.abs(player.vy) / 850);
        shadow.alpha = player.grounded ? 0.3 : 0.13;

        collisionDebug.clear();
        collisionDebug.visible = state.current.debug;
        if (state.current.debug) {
          for (const surface of FOREST_LEVEL.surfaces) {
            surface.points.forEach(([x, y], index) => {
              if (index === 0) collisionDebug.moveTo(x, y);
              else collisionDebug.lineTo(x, y);
            });
            collisionDebug.stroke({ color: 0x55ff88, width: 4, alpha: 0.95 });
          }
          collisionDebug
            .circle(player.x, player.y + player.h / 2, 6)
            .fill(0xff4b4b)
            .rect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h)
            .stroke({ color: 0xffe34f, width: 2 });
        }

        ambience.children.forEach((mote, index) => {
          mote.y = mote.baseY + Math.sin(ticker.lastTime * 0.001 + index) * 12;
          mote.x += dt * (4 + index % 4);
          if (mote.x > WORLD_W) mote.x = 0;
        });
        flowingDrops.forEach((drop, index) => {
          drop.y = 290 + ((ticker.lastTime * (0.075 + index * 0.002) + drop.offset) % 202);
          drop.alpha = 0.35 + Math.sin(ticker.lastTime * 0.008 + index) * 0.25;
        });
        streamCore.scale.x = 0.75 + Math.sin(ticker.lastTime * 0.006) * 0.22;
        ripple.scale.set(0.88 + Math.sin(ticker.lastTime * 0.005) * 0.14);
        ripple.alpha = 0.55 + Math.sin(ticker.lastTime * 0.007) * 0.2;

        const viewW = app.screen.width;
        const targetCamera = Math.max(0, Math.min(WORLD_W - viewW, player.x - viewW * 0.34));
        cameraX += (targetCamera - cameraX) * Math.min(1, dt * 5.5);
        world.x = -cameraX;
        world.y = (app.screen.height - BASE_H) * 0.5 + Math.sin(ticker.lastTime * 0.00045) * 2;

        if (ticker.lastTime - lastHud > 100) {
          lastHud = ticker.lastTime;
          state.current.onStats({ water, progress: player.x / WORLD_W, hint: water < 3 && player.x > 1960 });
        }
      });
    }

    start();
    return () => {
      disposed = true;
      observer?.disconnect();
      if (ready) app.destroy(true, { children: true });
    };
  }, [runId, input]);

  return <div className="seed-stage" ref={host} />;
}

export function Seedbound() {
  const input = useRef({ left: false, right: false, jump: false });
  const [runId, setRunId] = useState(1);
  const [paused, setPaused] = useState(false);
  const [debug, setDebug] = useState(false);
  const [stats, setStats] = useState({ water: 0, progress: 0, hint: false });
  const [won, setWon] = useState(false);

  useEffect(() => {
    const down = (event) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) input.current.left = true;
      if (["ArrowRight", "d", "D"].includes(event.key)) input.current.right = true;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) input.current.jump = true;
    };
    const up = (event) => {
      if (["ArrowLeft", "a", "A"].includes(event.key)) input.current.left = false;
      if (["ArrowRight", "d", "D"].includes(event.key)) input.current.right = false;
      if (["ArrowUp", " ", "w", "W"].includes(event.key)) input.current.jump = false;
    };
    addEventListener("keydown", down);
    addEventListener("keyup", up);
    return () => {
      removeEventListener("keydown", down);
      removeEventListener("keyup", up);
    };
  }, []);

  const hold = (key, value) => () => { input.current[key] = value; };
  const restart = () => {
    setWon(false);
    setPaused(false);
    setStats({ water: 0, progress: 0, hint: false });
    setRunId((id) => id + 1);
  };

  return (
    <main className="seed-shell">
      <SeedboundStage paused={paused} debug={debug} runId={runId} input={input} onStats={setStats} onWin={() => setWon(true)} />
      <header className="seed-hud">
        <div className="moisture">{[0, 1, 2].map((i) => <i key={i} className={i < stats.water ? "full" : ""} />)}</div>
        <div className="growth"><span className="active">●</span><b>—</b><span className={won ? "active" : ""}>♣</span></div>
        <button onClick={() => setPaused((value) => !value)}>{paused ? "▶" : "Ⅱ"}</button>
      </header>
      <button className={`debug-toggle ${debug ? "active" : ""}`} onClick={() => setDebug((value) => !value)}>HITBOX</button>
      <div className="seed-progress"><span style={{ width: `${stats.progress * 100}%` }} /></div>
      {stats.hint && !won && <div className="gate-hint">The root gate needs all 3 dew drops</div>}
      <div className="controls">
        <div className="move-controls">
          <button aria-label="Move left" onPointerDown={hold("left", true)} onPointerUp={hold("left", false)} onPointerLeave={hold("left", false)}>‹</button>
          <button aria-label="Move right" onPointerDown={hold("right", true)} onPointerUp={hold("right", false)} onPointerLeave={hold("right", false)}>›</button>
        </div>
        <button className="jump" aria-label="Jump" onPointerDown={hold("jump", true)} onPointerUp={hold("jump", false)} onPointerLeave={hold("jump", false)}>↑</button>
      </div>
      {won && (
        <section className="seed-result">
          <small>THE ROOT GATE AWAKENS</small>
          <h1>You became a sprout</h1>
          <p>The forest remembers your first journey.</p>
          <button onClick={restart}>EXPLORE AGAIN</button>
        </section>
      )}
    </main>
  );
}
