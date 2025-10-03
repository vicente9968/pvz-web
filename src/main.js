import ZombieSpawner from './systems/spawner.js';

const ROWS = 5;
const COLS = 9;
const CELL_WIDTH = 100;
const CELL_HEIGHT = 100;
const CANVAS_WIDTH = COLS * CELL_WIDTH;
const CANVAS_HEIGHT = ROWS * CELL_HEIGHT;
const SHOOTER_X = 60;
const SPAWN_X = CANVAS_WIDTH - 60;

class Zombie {
  constructor(row) {
    this.row = row;
    this.width = 70;
    this.height = 90;
    this.x = SPAWN_X;
    this.y = row * CELL_HEIGHT + (CELL_HEIGHT - this.height) / 2;
    this.speed = 22; // px per second
    this.health = 5;
    this.maxHealth = this.health;
    this.isDead = false;
  }

  update(delta) {
    if (this.isDead) {
      return;
    }
    this.x -= this.speed * delta;
  }

  takeDamage(amount) {
    if (this.isDead) {
      return;
    }
    this.health -= amount;
    if (this.health <= 0) {
      this.isDead = true;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

    // Face
    ctx.fillStyle = '#a5d6a7';
    ctx.fillRect(this.x - this.width / 3, this.y - 20, this.width / 1.5, 20);

    // Health bar
    if (!this.isDead) {
      const barWidth = this.width;
      const healthRatio = Math.max(this.health, 0) / this.maxHealth;
      ctx.fillStyle = '#222';
      ctx.fillRect(this.x - barWidth / 2, this.y - 30, barWidth, 8);
      ctx.fillStyle = '#76c893';
      ctx.fillRect(
        this.x - barWidth / 2,
        this.y - 30,
        barWidth * healthRatio,
        8
      );
    }
    ctx.restore();
  }
}

class Projectile {
  constructor(row) {
    this.row = row;
    this.radius = 10;
    this.x = SHOOTER_X + 20;
    this.y = row * CELL_HEIGHT + CELL_HEIGHT / 2;
    this.speed = 360;
    this.damage = 1;
    this.active = true;
  }

  update(delta, zombies) {
    if (!this.active) {
      return;
    }
    this.x += this.speed * delta;
    if (this.x > CANVAS_WIDTH + 40) {
      this.active = false;
      return;
    }

    for (const zombie of zombies) {
      if (zombie.isDead || zombie.row !== this.row) {
        continue;
      }
      const zombieLeft = zombie.x - zombie.width / 2;
      const zombieRight = zombie.x + zombie.width / 2;
      const zombieTop = zombie.y;
      const zombieBottom = zombie.y + zombie.height;

      const intersects =
        this.x + this.radius > zombieLeft &&
        this.x - this.radius < zombieRight &&
        this.y + this.radius > zombieTop &&
        this.y - this.radius < zombieBottom;

      if (intersects) {
        zombie.takeDamage(this.damage);
        this.active = false;
        break;
      }
    }
  }

  draw(ctx) {
    if (!this.active) {
      return;
    }
    ctx.save();
    ctx.fillStyle = '#f9c74f';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Shooter {
  constructor(row) {
    this.row = row;
    this.cooldown = 0;
    this.fireInterval = 1.2; // seconds
  }

  update(delta, projectiles, zombies) {
    if (zombies.length === 0) {
      this.cooldown = 0;
    }
    this.cooldown -= delta;
    if (this.cooldown <= 0) {
      projectiles.push(new Projectile(this.row));
      this.cooldown = this.fireInterval;
    }
  }

  draw(ctx) {
    const x = SHOOTER_X - 30;
    const y = this.row * CELL_HEIGHT + CELL_HEIGHT / 2 - 30;
    ctx.save();
    ctx.fillStyle = '#2a9d8f';
    ctx.beginPath();
    ctx.arc(x + 30, y + 30, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#264653';
    ctx.beginPath();
    ctx.arc(x + 40, y + 25, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class Game {
  constructor(canvas, statusEl, messageEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusEl = statusEl;
    this.messageEl = messageEl;

    this.projectiles = [];
    this.zombies = [];
    this.shooters = [];
    this.gameOver = false;
    this.result = null;
    this.lastFrame = null;
    this.startTime = null;

    this.spawner = new ZombieSpawner({
      startDelay: 10000,
      interval: 6000,
      duration: 60000,
      getNow: () => performance.now(),
      spawnZombie: (row) => this.spawnZombie(row),
      isGameOver: () => this.gameOver,
      rows: ROWS,
    });

    for (let row = 0; row < ROWS; row += 1) {
      this.shooters.push(new Shooter(row));
    }
  }

  reset() {
    this.projectiles = [];
    this.zombies = [];
    this.gameOver = false;
    this.result = null;
    this.startTime = performance.now();
    this.lastFrame = this.startTime;
    this.spawner.reset(this.startTime);
    this.messageEl.classList.add('hidden');
    this.messageEl.textContent = '';
    this.updateStatus(this.startTime, 0, 0);
  }

  start() {
    this.reset();
    requestAnimationFrame((timestamp) => this.loop(timestamp));
  }

  restart() {
    const shouldStartLoop = this.gameOver;
    this.reset();
    if (shouldStartLoop) {
      requestAnimationFrame((timestamp) => this.loop(timestamp));
    }
  }

  spawnZombie(row) {
    this.zombies.push(new Zombie(row));
  }

  spawnProjectile(row) {
    this.projectiles.push(new Projectile(row));
  }

  loop(timestamp) {
    if (this.gameOver) {
      return;
    }
    const delta = (timestamp - this.lastFrame) / 1000;
    this.lastFrame = timestamp;

    this.spawner.update(timestamp);
    this.updateEntities(delta);
    this.render();
    this.updateStatus(timestamp, this.zombies.length, this.projectiles.length);
    this.checkVictory(timestamp);

    if (!this.gameOver) {
      requestAnimationFrame((time) => this.loop(time));
    }
  }

  updateEntities(delta) {
    this.shooters.forEach((shooter) =>
      shooter.update(delta, this.projectiles, this.zombies)
    );

    for (const projectile of this.projectiles) {
      projectile.update(delta, this.zombies);
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.active);

    for (const zombie of this.zombies) {
      zombie.update(delta);
      if (!this.gameOver && !zombie.isDead && zombie.x - zombie.width / 2 <= 0) {
        this.endGame('lose');
      }
    }
    this.zombies = this.zombies.filter((zombie) => !zombie.isDead);
  }

  checkVictory(timestamp) {
    if (this.gameOver) {
      return;
    }
    const elapsed = timestamp - this.startTime;
    if (this.spawner.isFinished(elapsed) && this.zombies.length === 0) {
      this.endGame('win');
    }
  }

  endGame(result) {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.result = result;
    this.showMessage(result === 'win' ? '胜利！' : '失败…');
    if (result === 'win') {
      // Provide alert for clarity
      setTimeout(() => {
        window.alert('恭喜你，成功守住了所有僵尸！');
      }, 100);
    } else {
      setTimeout(() => {
        window.alert('僵尸突破了防线，游戏失败。');
      }, 100);
    }
  }

  showMessage(text) {
    this.messageEl.textContent = text;
    this.messageEl.classList.remove('hidden');
  }

  updateStatus(timestamp, zombieCount, projectileCount) {
    if (!this.statusEl) {
      return;
    }
    const elapsedSec = ((timestamp - this.startTime) / 1000).toFixed(1);
    const spawnRemaining = Math.max(
      0,
      Math.ceil((this.spawner.remainingTime(timestamp - this.startTime)) / 1000)
    );
    this.statusEl.innerHTML = `
      <div><strong>已进行：</strong> ${elapsedSec} 秒</div>
      <div><strong>剩余生成时间：</strong> ${spawnRemaining} 秒</div>
      <div><strong>场上僵尸：</strong> ${zombieCount}</div>
      <div><strong>飞行中的豌豆：</strong> ${projectileCount}</div>
    `;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid(ctx);
    this.shooters.forEach((shooter) => shooter.draw(ctx));
    this.projectiles.forEach((projectile) => projectile.draw(ctx));
    this.zombies.forEach((zombie) => zombie.draw(ctx));
  }

  drawGrid(ctx) {
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const x = col * CELL_WIDTH;
        const y = row * CELL_HEIGHT;
        ctx.fillStyle = (row + col) % 2 === 0 ? '#7bc96f' : '#5cbb5e';
        ctx.fillRect(x, y, CELL_WIDTH, CELL_HEIGHT);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.strokeRect(x, y, CELL_WIDTH, CELL_HEIGHT);
      }
    }
  }
}

function setupGame() {
  const canvas = document.getElementById('game-canvas');
  const statusEl = document.getElementById('status');
  const messageEl = document.getElementById('message');
  const restartBtn = document.getElementById('restart');

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const game = new Game(canvas, statusEl, messageEl);
  game.start();

  restartBtn.addEventListener('click', () => {
    game.restart();
  });
}

document.addEventListener('DOMContentLoaded', setupGame);
