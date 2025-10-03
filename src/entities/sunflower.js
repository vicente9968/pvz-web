import economy from '../systems/economy.js';

const SUN_INTERVAL = 5000; // milliseconds
const SUN_VALUE = 25;

export default class Sunflower {
  constructor({ position = { x: 0, y: 0 }, onSunProduced } = {}) {
    this.position = position;
    this.onSunProduced = onSunProduced;
    this.timeAccumulator = 0;
    this.alive = true;
  }

  update(deltaTime) {
    if (!this.alive) {
      return;
    }

    this.timeAccumulator += deltaTime;

    if (this.timeAccumulator >= SUN_INTERVAL) {
      const cycles = Math.floor(this.timeAccumulator / SUN_INTERVAL);
      const totalSun = cycles * SUN_VALUE;
      this.timeAccumulator -= cycles * SUN_INTERVAL;
      economy.addSun(totalSun);

      if (typeof this.onSunProduced === 'function') {
        this.onSunProduced({ amount: totalSun, producer: this });
      }
    }
  }

  destroy() {
    this.alive = false;
  }
}
