const DEFAULT_BULLET_SPEED = 300; // px per second
const DEFAULT_BULLET_DAMAGE = 20;
const DEFAULT_WIDTH = 28;
const DEFAULT_HEIGHT = 28;
const DEFAULT_BOARD_WIDTH = 1280;

export default class Bullet {
  constructor({
    x,
    y,
    row,
    width = DEFAULT_WIDTH,
    height = DEFAULT_HEIGHT,
    speed = DEFAULT_BULLET_SPEED,
    damage = DEFAULT_BULLET_DAMAGE,
    boardWidth = DEFAULT_BOARD_WIDTH,
  }) {
    this.x = x;
    this.y = y;
    this.row = row;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.damage = damage;
    this.boardWidth = boardWidth;
    this.active = true;
  }

  update(deltaTime) {
    if (!this.active) {
      return;
    }

    this.x += this.speed * deltaTime;

    if (this.isOutOfBounds()) {
      this.destroy();
    }
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

  isOutOfBounds() {
    return this.x - this.width / 2 > this.boardWidth;
  }

  destroy() {
    this.active = false;
  }
}

export {
  DEFAULT_BULLET_SPEED,
  DEFAULT_BULLET_DAMAGE,
};
