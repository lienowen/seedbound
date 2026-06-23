import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import { SeedboundScene } from "./game/SeedboundScene.js";

export function PhaserGame() {
  const mount = useRef(null);
  const scene = useRef(null);
  const [stats, setStats] = useState({ water: 0, progress: 0 });
  const [won, setWon] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    mount.current.replaceChildren();
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: mount.current,
      width: 390,
      height: 844,
      transparent: false,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      physics: {
        default: "matter",
        matter: { gravity: { y: 1.25 }, enableSleeping: false },
      },
      render: { antialias: true, roundPixels: false },
      audio: { noAudio: true },
      scene: [SeedboundScene],
    });
    game.events.on("ready", () => { scene.current = game.scene.getScene("seedbound"); });
    game.events.on("hud", setStats);
    game.events.on("win", () => setWon(true));
    const timer = setInterval(() => {
      if (game.scene.isActive("seedbound")) {
        scene.current = game.scene.getScene("seedbound");
        clearInterval(timer);
      }
    }, 50);
    return () => {
      clearInterval(timer);
      game.destroy(true);
      mount.current?.replaceChildren();
    };
  }, []);

  const press = (key, value) => () => scene.current?.setMobileInput({ [key]: value });
  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    if (next) scene.current?.scene.pause();
    else scene.current?.scene.resume();
  };

  return (
    <main
      className="game-shell"
      data-player-x={stats.x ?? 0}
      data-player-y={stats.y ?? 0}
      data-player-vx={stats.vx ?? 0}
      data-player-vy={stats.vy ?? 0}
    >
      <div className="game-mount" ref={mount} />
      <header className="game-hud">
        <div className="dew-hud">{[0, 1, 2].map((i) => <i key={i} className={i < stats.water ? "full" : ""} />)}</div>
        <div className="growth-hud"><b>SEED</b><span /><b>SPROUT</b></div>
        <button aria-label="Pause" onClick={togglePause}>{paused ? "PLAY" : "II"}</button>
      </header>
      <div className="level-progress"><span style={{ width: `${stats.progress * 100}%` }} /></div>
      <div className="mobile-controls">
        <div>
          <button aria-label="Move left" onPointerDown={press("left", true)} onPointerUp={press("left", false)} onPointerCancel={press("left", false)}>‹</button>
          <button aria-label="Move right" onPointerDown={press("right", true)} onPointerUp={press("right", false)} onPointerCancel={press("right", false)}>›</button>
        </div>
        <button className="jump-button" aria-label="Jump" onPointerDown={press("jump", true)} onPointerUp={press("jump", false)} onPointerCancel={press("jump", false)}>↑</button>
      </div>
      {won && <section className="win-panel"><small>ROOT GATE AWAKENED</small><h1>You became a sprout</h1><p>First trail complete.</p></section>}
    </main>
  );
}
