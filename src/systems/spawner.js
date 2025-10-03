export default class ZombieSpawner {
  constructor({
    startDelay = 10000,
    interval = 6000,
    duration = 60000,
    getNow = () => performance.now(),
    spawnZombie,
    isGameOver = () => false,
    rows = 5,
  } = {}) {
    this.startDelay = startDelay;
    this.interval = interval;
    this.duration = duration;
    this.getNow = getNow;
    this.spawnZombie = spawnZombie;
    this.isGameOver = isGameOver;
    this.rows = rows;

    this.startTime = null;
    this.lastSpawnTime = null;
  }

  reset(startTime = this.getNow()) {
    this.startTime = startTime;
    this.lastSpawnTime = this.startTime + this.startDelay - this.interval;
  }

  update(currentTime = this.getNow()) {
    if (typeof this.spawnZombie !== 'function' || this.isGameOver()) {
      return;
    }

    if (this.startTime === null) {
      this.reset(currentTime);
    }

    const elapsed = currentTime - this.startTime;
    const totalActiveDuration = this.startDelay + this.duration;

    if (elapsed < this.startDelay) {
      return;
    }

    if (elapsed > totalActiveDuration) {
      return;
    }

    if (currentTime - this.lastSpawnTime < this.interval) {
      return;
    }

    const row = this.randomRow();
    this.spawnZombie(row);
    this.lastSpawnTime = currentTime;
  }

  isFinished(elapsed) {
    return elapsed >= this.startDelay + this.duration;
  }

  remainingTime(elapsed) {
    const totalActiveDuration = this.startDelay + this.duration;
    if (elapsed >= totalActiveDuration) {
      return 0;
    }
    if (elapsed < 0) {
      return totalActiveDuration;
    }
    return totalActiveDuration - elapsed;
  }

  randomRow() {
    return Math.floor(Math.random() * this.rows);
  }
}
