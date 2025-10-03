const DEFAULT_ZOMBIE_HEALTH = 100;
const DEFAULT_ZOMBIE_SPEED = 20; // px per second
const DEFAULT_ATTACK_DAMAGE_PER_SECOND = 10;
const DEFAULT_WIDTH = 80;
const DEFAULT_HEIGHT = 120;

export default class Zombie {
  constructor({
    x,
    y,
    row,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    speed = DEFAULT_ZOMBIE_SPEED,
    health = DEFAULT_ZOMBIE_HEALTH,
  }) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.health = health;
    this.maxHealth = health;
    this.active = true;
    this.isEating = false;
    this.targetPlant = null;
  }

  update(deltaTime) {
    if (!this.active) {
      return;
    }

    if (this.isEating && this.targetPlant) {
      this.applyDamageToPlant(deltaTime);
      if (!this.targetPlant || this.targetPlant.health <= 0) {
        this.stopEating();
      }
      return;
    }

    this.x -= this.speed * deltaTime;
  }

  getBounds() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;

    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - halfHeight,
      bottom: this.y + halfHeight,
    };
  }

  takeDamage(amount) {
    if (!this.active) {
      return;
    }

    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.active = false;
    this.isEating = false;
    this.targetPlant = null;
  }

  startEating(plant) {
    this.isEating = true;
    this.targetPlant = plant;
  }

  stopEating() {
    this.isEating = false;
    this.targetPlant = null;
  }

  applyDamageToPlant(deltaTime) {
    if (!this.targetPlant) {
      return;
    }

    if (typeof this.targetPlant.health !== 'number') {
      this.targetPlant.health = DEFAULT_PLANT_HEALTH;
    }

    const damage = DEFAULT_ATTACK_DAMAGE_PER_SECOND * deltaTime;
    this.targetPlant.health = Math.max(0, this.targetPlant.health - damage);

    if (this.targetPlant.health === 0) {
      this.targetPlant.destroyed = true;
    }
  }
}

const DEFAULT_PLANT_HEALTH = 100;

export {
  DEFAULT_ZOMBIE_HEALTH,
  DEFAULT_ZOMBIE_SPEED,
  DEFAULT_ATTACK_DAMAGE_PER_SECOND,
  DEFAULT_PLANT_HEALTH,
};
