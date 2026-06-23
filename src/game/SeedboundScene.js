import Phaser from "phaser";

const WORLD_WIDTH = 2600;
const FLOOR = [
  [0, 525, 650, 90],
  [940, 575, 460, 90],
  [1390, 665, 1210, 110],
  [1320, 418, 520, 24],
  [1840, 270, 760, 36],
];

export class SeedboundScene extends Phaser.Scene {
  constructor() {
    super("seedbound");
    this.mobile = { left: false, right: false, jump: false };
  }

  preload() {
    this.load.image("forest", "/assets/seedbound-forest.png");
    for (let i = 0; i < 6; i += 1) this.load.image(`seed-${i}`, `/assets/seed-frames/seed-${i}.png`);
  }

  create() {
    this.cameras.main.setBackgroundColor("#dfe8c9");
    const bg = this.add.image(0, 0, "forest").setOrigin(0).setDisplaySize(2530, 844);
    bg.setScrollFactor(1);

    this.platforms = FLOOR.map(([x, y, width, height]) => {
      const body = this.matter.add.rectangle(x + width / 2, y + height / 2, width, height, {
        isStatic: true,
        friction: 0.02,
        label: "ground",
      });
      return body;
    });

    this.player = this.matter.add.sprite(145, 430, "seed-0");
    this.player.setDisplaySize(78, 108);
    this.player.setOrigin(0.5, 0.77);
    this.player.setFixedRotation();
    this.player.setFriction(0.01);
    this.player.setFrictionAir(0.035);
    this.player.setBounce(0);
    this.player.setBody({ type: "circle", radius: 25 }, { label: "player" });
    this.player.setCollisionCategory(1);

    this.shadow = this.add.ellipse(this.player.x, this.player.y + 35, 66, 16, 0x17251b, 0.28);
    this.shadow.setDepth(2);
    this.player.setDepth(3);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,D,SPACE");
    this.grounded = false;
    this.jumpWasDown = false;
    this.lastGroundedAt = 0;
    this.jumpQueuedAt = -1000;
    this.checkpoint = { x: 145, y: 430 };
    this.water = 0;
    this.finished = false;
    this.lastHudAt = 0;

    this.dew = [
      this.createDew(380, 420),
      this.createDew(835, 350),
      this.createDew(1190, 500),
    ];

    this.mushrooms = [
      this.createMushroom(720, 520, 44),
      this.createMushroom(805, 470, 48),
      this.createMushroom(900, 415, 52),
    ];
    this.createWaterfall(1670, 285, 210);

    this.matter.world.on("collisionstart", (event) => {
      for (const pair of event.pairs) {
        const other = pair.bodyA.gameObject === this.player ? pair.bodyB : pair.bodyB.gameObject === this.player ? pair.bodyA : null;
        if (!other) continue;
        if (other.label === "dew" && other.gameObject.active) {
          other.gameObject.disableBody(true, true);
          this.water += 1;
          this.game.events.emit("hud", { water: this.water, progress: this.player.x / WORLD_WIDTH });
        }
        if (other.label === "mushroom" && this.player.body.velocity.y > 0) {
          this.player.setVelocityY(-11.5);
          this.tweens.add({ targets: other.gameObject, scaleY: 0.65, duration: 70, yoyo: true });
        }
      }
    });
    this.matter.world.on("collisionactive", (event) => {
      for (const pair of event.pairs) {
        const playerIsA = pair.bodyA.gameObject === this.player;
        const playerIsB = pair.bodyB.gameObject === this.player;
        if (!playerIsA && !playerIsB) continue;
        const other = playerIsA ? pair.bodyB : pair.bodyA;
        if (other.label !== "ground" && other.label !== "mushroom") continue;
        if (other.position.y > this.player.body.position.y + 10) this.lastGroundedAt = this.time.now;
      }
    });

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, 844);
    this.matter.world.setBounds(0, -200, WORLD_WIDTH, 1250, 64, true, true, false, false);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08, -110, 50);
    this.cameras.main.setDeadzone(100, 180);
  }

  createDew(x, y) {
    const drop = this.add.graphics();
    drop.fillStyle(0x54cbe5, 1);
    drop.lineStyle(3, 0xf2ffff, 1);
    drop.fillCircle(0, 4, 13);
    drop.fillTriangle(-13, 4, 13, 4, 0, -19);
    drop.strokeCircle(0, 4, 13);
    const body = this.matter.add.gameObject(drop, {
      shape: { type: "circle", radius: 20 },
      isStatic: true,
      isSensor: true,
      label: "dew",
    });
    body.setPosition(x, y);
    this.tweens.add({ targets: body, y: y - 8, duration: 900, yoyo: true, repeat: -1, ease: "Sine.inOut" });
    return body;
  }

  createMushroom(x, y, radius) {
    const cap = this.add.ellipse(x, y, radius * 2, radius * 0.78, 0xe46f48).setStrokeStyle(4, 0xffd7a4);
    this.matter.add.gameObject(cap, {
      shape: { type: "circle", radius: radius * 0.72 },
      isStatic: true,
      label: "mushroom",
    });
    return cap;
  }

  createWaterfall(x, y, height) {
    const particles = this.add.particles(x, y, "seed-0", {
      lifespan: 900,
      speedY: { min: 170, max: 240 },
      speedX: { min: -8, max: 8 },
      scale: { start: 0.025, end: 0.01 },
      alpha: { start: 0.55, end: 0 },
      frequency: 65,
      emitting: true,
    });
    particles.setDepth(2);
    this.add.rectangle(x, y + height / 2, 6, height, 0x9eeaf1, 0.42).setDepth(1);
    this.tweens.add({
      targets: this.add.ellipse(x, y + height, 56, 13).setStrokeStyle(3, 0xd8ffff, 0.7),
      scaleX: 1.35,
      scaleY: 1.35,
      alpha: 0.1,
      duration: 850,
      repeat: -1,
    });
  }

  setMobileInput(next) {
    Object.assign(this.mobile, next);
  }

  update(time, delta) {
    if (this.finished) return;
    const left = this.cursors.left.isDown || this.keys.A.isDown || this.mobile.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || this.mobile.right;
    const jump = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || this.mobile.jump;

    this.grounded = time - this.lastGroundedAt < 110;
    const dt = Math.min(delta, 32) / 16.667;
    const acceleration = this.grounded ? 0.46 : 0.27;
    if (left) this.player.setVelocityX(Math.max(this.player.body.velocity.x - acceleration * dt, -5.4));
    else if (right) this.player.setVelocityX(Math.min(this.player.body.velocity.x + acceleration * dt, 5.4));
    else this.player.setVelocityX(this.player.body.velocity.x * Math.pow(this.grounded ? 0.78 : 0.97, dt));

    if (jump && !this.jumpWasDown) this.jumpQueuedAt = time;
    if (time - this.jumpQueuedAt < 130 && time - this.lastGroundedAt < 115) {
      this.player.setVelocityY(-9.8);
      this.jumpQueuedAt = -1000;
      this.lastGroundedAt = -1000;
      this.cameras.main.shake(55, 0.0012);
    }
    if (!jump && this.player.body.velocity.y < -3.4) {
      this.player.setVelocityY(this.player.body.velocity.y + 0.42 * dt);
    }
    this.jumpWasDown = jump;

    const airborne = Math.abs(this.player.body.velocity.y) > 0.7;
    const frame = airborne ? (this.player.body.velocity.y < 0 ? 3 : 4) : Math.abs(this.player.body.velocity.x) > 0.8 ? 1 + Math.floor(time / 140) % 2 : 0;
    this.player.setTexture(`seed-${frame}`);
    this.player.setFlipX(this.player.body.velocity.x < -0.1);
    this.player.rotation = Phaser.Math.Clamp(this.player.body.velocity.x / 32, -0.18, 0.18);

    this.shadow.setPosition(this.player.x, this.player.y + 38);
    this.shadow.setScale(airborne ? 0.65 : 1, airborne ? 0.7 : 1);
    this.shadow.setAlpha(airborne ? 0.13 : 0.28);

    if (this.player.y > 940) {
      this.player.setPosition(this.checkpoint.x, this.checkpoint.y);
      this.player.setVelocity(0, 0);
      this.cameras.main.flash(120, 255, 247, 218, false);
    }
    if (this.player.x > 1030 && this.checkpoint.x < 1000) this.checkpoint = { x: 1050, y: 470 };
    if (this.player.x > 1450 && this.checkpoint.x < 1400) this.checkpoint = { x: 1460, y: 560 };
    if (this.player.x > 2240 && this.water === 3) {
      this.finished = true;
      this.player.setTexture("seed-5").setDisplaySize(102, 132);
      this.game.events.emit("win");
    }
    if (time - this.lastHudAt >= 100) {
      this.lastHudAt = time;
      this.game.events.emit("hud", {
        water: this.water,
        progress: this.player.x / WORLD_WIDTH,
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        vx: Number(this.player.body.velocity.x.toFixed(2)),
        vy: Number(this.player.body.velocity.y.toFixed(2)),
      });
    }
  }
}
