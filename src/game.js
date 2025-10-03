import ui from './ui/ui.js';
import Sunflower from './entities/sunflower.js';
import economy, { resetEconomy } from './systems/economy.js';

class Game {
  constructor() {
    this.entities = new Set();
    this.lastTimestamp = null;
    this.animationFrameId = null;
    this.running = false;
  }

  start() {
    if (this.running) {
      return;
    }

    resetEconomy();
    ui.init();

    this.spawnDefaultPlants();

    this.running = true;
    this.lastTimestamp = performance.now();
    this.animationFrameId = requestAnimationFrame(this.tick);
  }

  stop() {
    if (!this.running) {
      return;
    }

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.running = false;
    this.lastTimestamp = null;
  }

  spawnDefaultPlants() {
    if (this.entities.size > 0) {
      return;
    }

    const sunflower = new Sunflower();
    this.entities.add(sunflower);
  }

  tick = (timestamp) => {
    if (!this.running) {
      return;
    }

    const delta = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    this.entities.forEach((entity) => {
      if (typeof entity.update === 'function') {
        entity.update(delta);
      }
    });

    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  addEntity(entity) {
    if (!entity) {
      return;
    }

    this.entities.add(entity);
  }

  removeEntity(entity) {
    if (!entity) {
      return;
    }

    this.entities.delete(entity);

    if (typeof entity.destroy === 'function') {
      entity.destroy();
    }
  }

  attemptPurchase(cost) {
    if (economy.spend(cost)) {
      return true;
    }

    ui.flashSun(cost);
    return false;
  }
}

const game = new Game();

window.addEventListener('DOMContentLoaded', () => {
  game.start();
});

export default game;
