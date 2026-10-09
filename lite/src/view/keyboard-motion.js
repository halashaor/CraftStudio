export class KeyboardMotion {
  constructor({ speed = 12 } = {}) {
    this.speed = speed;
    this.velocity = [0, 0, 0];
  }
  reset() {
    this.velocity = [0, 0, 0];
  }
  step(dt, keys, forward, right) {
    dt = Math.max(0, Math.min(0.05, dt));
    const direction = [0, 0, 0];
    for (const [key, vector, sign] of [
      ['KeyW', forward, 1],
      ['KeyS', forward, -1],
      ['KeyD', right, 1],
      ['KeyA', right, -1],
      ['KeyE', [0, 1, 0], 1],
      ['KeyQ', [0, 1, 0], -1],
    ])
      if (keys.has(key)) vector.forEach((v, a) => (direction[a] += v * sign));
    const length = Math.hypot(...direction),
      speed = this.speed * (keys.has('ShiftLeft') || keys.has('ShiftRight') ? 3 : 1),
      blend = 1 - Math.exp(-dt * (length ? 12 : 24));
    this.velocity = this.velocity.map((v, a) => {
      const next = v + ((length ? (direction[a] / length) * speed : 0) - v) * blend;
      return Math.abs(next) < 0.001 ? 0 : next;
    });
    return this.velocity.map((v) => v * dt);
  }
  get moving() {
    return this.velocity.some((v) => v !== 0);
  }
}
