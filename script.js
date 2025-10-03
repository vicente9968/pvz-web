/**
 * Plants vs. Zombies (vanilla HTML/CSS/JS implementation)
 * Run via any static server (e.g., `python -m http.server`).
 * All tunable numbers live in the constants below for easy balancing.
 */

// ======= CONSTANT CONFIGURATION =======
const GRID_ROWS = 5;
const GRID_COLS = 9;
const CELL_SIZE = 100;
const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;
const INITIAL_SUN = 150;
const SUN_FROM_CLICK = 25;
const SUN_FROM_SUNFLOWER = 25;
const SUN_FALL_INTERVAL = 9000;
const SUN_LIFETIME = 8000;
const SUN_FALL_SPEED = 0.05; // pixels per ms
const PLANT_PLACE_COOLDOWN = 300;

const PROJECTILE_SPEED = 0.45; // pixels per ms
const PROJECTILE_WIDTH = 12;
const PROJECTILE_HEIGHT = 12;

const GAME_SPEED = 1; // Global speed modifier for tuning

const LEVELS = [
  {
    id: 1,
    name: "Day 1",
    startingSun: 150,
    waves: [
      {
        count: 6,
        delayRange: [3000, 5200],
        types: ["basic", "basic", "cone"],
      },
      {
        count: 8,
        delayRange: [2600, 4600],
        types: ["basic", "basic", "cone"],
      },
    ],
    sunlightBonus: 0,
    zombieSpeedModifier: 0,
  },
  {
    id: 2,
    name: "Day 2",
    startingSun: 125,
    waves: [
      {
        count: 8,
        delayRange: [2600, 4200],
        types: ["basic", "cone", "cone"],
      },
      {
        count: 12,
        delayRange: [2000, 3600],
        types: ["basic", "cone", "bucket"],
      },
    ],
    sunlightBonus: 1,
    zombieSpeedModifier: 0.06,
  },
];

const PLANT_DEFS = {
  sunflower: {
    name: "Sunflower",
    cost: 50,
    cooldown: 7500,
    hp: 300,
    producesSun: true,
    sunInterval: 24000,
    projectile: null,
  },
  peashooter: {
    name: "Pea Shooter",
    cost: 100,
    cooldown: 7500,
    hp: 300,
    attackInterval: 1500,
    projectile: {
      damage: 20,
      slow: 0,
    },
  },
  snowpea: {
    name: "Snow Pea",
    cost: 175,
    cooldown: 8500,
    hp: 300,
    attackInterval: 1700,
    projectile: {
      damage: 20,
      slow: 0.45,
      slowDuration: 4000,
    },
  },
  wallnut: {
    name: "Wall-Nut",
    cost: 50,
    cooldown: 15000,
    hp: 1600,
    projectile: null,
  },
};

const ZOMBIE_DEFS = {
  basic: {
    name: "Zombie",
    hp: 200,
    speed: 0.025,
    damage: 40,
    attackInterval: 1400,
  },
  cone: {
    name: "Conehead Zombie",
    hp: 370,
    speed: 0.026,
    damage: 45,
    attackInterval: 1300,
  },
  bucket: {
    name: "Buckethead Zombie",
    hp: 600,
    speed: 0.027,
    damage: 45,
    attackInterval: 1200,
  },
};

const AUDIO_LIBRARY = {
  plant: () => console.debug("[audio] plant"),
  collect: () => console.debug("[audio] collect sun"),
  shoot: () => console.debug("[audio] shoot"),
  zombieSpawn: () => console.debug("[audio] zombie spawn"),
  zombieEat: () => console.debug("[audio] zombie bite"),
  victory: () => console.debug("[audio] victory"),
  defeat: () => console.debug("[audio] defeat"),
};

// ======= RUNTIME STATE =======
let canvas;
let ctx;
let lastTimestamp = 0;
let running = false;
let sunCount = INITIAL_SUN;
let selectedPlant = null;
let hoverCell = null;
let placingBlockedUntil = 0;
let currentLevelIndex = 0;
let levelState = null;
let audioEnabled = true;
let sunSpawnTimer = SUN_FALL_INTERVAL;

const plants = [];
const zombies = [];
const suns = [];
const projectiles = [];
const projectilePool = [];

let gridPlants = [];

const cardElements = new Map();
const cardCooldowns = new Map();

const banner = document.createElement("div");
banner.className = "status-banner";
document.body.appendChild(banner);

// ======= INITIALIZATION =======
window.addEventListener("load", () => {
  canvas = document.getElementById("gameCanvas");
  ctx = canvas.getContext("2d");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  setupCards();
  bindUI();
  resetGame(0);
  requestAnimationFrame(loop);
});

function setupCards() {
  const cardBar = document.getElementById("cardBar");
  cardBar.innerHTML = "";
  const template = document.getElementById("cardTemplate");
  Object.entries(PLANT_DEFS).forEach(([type, def]) => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.dataset.type = type;
    card.querySelector(".card-title").textContent = def.name;
    card.querySelector(".card-cost").textContent = `${def.cost} sun`;
    card.addEventListener("click", () => selectPlantCard(type));
    cardBar.appendChild(card);
    cardElements.set(type, card);
    cardCooldowns.set(type, { lastPlaced: -Infinity });
  });
}

function bindUI() {
  canvas.addEventListener("mousemove", handlePointerMove);
  canvas.addEventListener("mouseleave", () => (hoverCell = null));
  canvas.addEventListener("click", handleCanvasClick);

  document.getElementById("startButton").addEventListener("click", () => {
    if (levelState.state === "ready" || levelState.state === "victory" || levelState.state === "defeat") {
      resetGame(currentLevelIndex);
    }
    startGame();
  });

  document.getElementById("pauseButton").addEventListener("click", () => {
    if (!running) return;
    togglePause();
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    resetGame(currentLevelIndex);
  });

  document.getElementById("overlayPrimary").addEventListener("click", () => {
    hideOverlay();
    resetGame(currentLevelIndex);
    startGame();
  });

  document.getElementById("overlaySecondary").addEventListener("click", () => {
    hideOverlay();
    const nextIndex = Math.min(currentLevelIndex + 1, LEVELS.length - 1);
    resetGame(nextIndex);
    startGame();
  });

  document.getElementById("audioToggle").addEventListener("click", (e) => {
    audioEnabled = !audioEnabled;
    e.currentTarget.textContent = audioEnabled ? "🔊 On" : "🔇 Off";
    e.currentTarget.setAttribute("aria-pressed", String(audioEnabled));
  });
}

function resetGame(levelIndex) {
  hideOverlay();
  currentLevelIndex = levelIndex;
  const levelConfig = LEVELS[levelIndex];
  sunCount = levelConfig.startingSun + levelConfig.sunlightBonus * 25;
  selectedPlant = null;
  hoverCell = null;
  placingBlockedUntil = 0;
  running = false;
  lastTimestamp = 0;
  plants.length = 0;
  zombies.length = 0;
  suns.length = 0;
  projectiles.length = 0;
  projectilePool.length = 0;
  gridPlants = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null));
  cardCooldowns.forEach((cooldown) => {
    cooldown.lastPlaced = -Infinity;
  });
  sunSpawnTimer = SUN_FALL_INTERVAL;

  levelState = {
    state: "ready",
    waveIndex: 0,
    spawnedInWave: 0,
    nextSpawnTimer: 0,
    waveCountdown: 3000,
    completed: false,
    elapsed: 0,
  };

  updateSunDisplay();
  updateWaveDisplay();
  updateLevelDisplay();
  const pauseButton = document.getElementById("pauseButton");
  pauseButton.textContent = "Pause";
  updateButtons();
  updateCards(performance.now());
  showBanner(`Level ${levelConfig.id}: ${levelConfig.name}`);
}

// ======= GAME LOOP =======
function loop(timestamp) {
  requestAnimationFrame(loop);
  if (!lastTimestamp) lastTimestamp = timestamp;
  const delta = Math.min(50, (timestamp - lastTimestamp) * GAME_SPEED);
  lastTimestamp = timestamp;

  if (running) {
    updateGame(delta, timestamp);
  }
  renderGame();
}

function updateGame(delta, now) {
  levelState.elapsed += delta;
  updateLevelProgress(delta);
  updatePlants(delta, now);
  updateZombies(delta, now);
  updateProjectiles(delta);
  updateSunSpawner(delta);
  updateSuns(delta);
  updateCards(now);
  checkVictoryConditions();
}

function renderGame() {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  drawLawn();
  drawGrid();
  drawSuns();
  drawPlants();
  drawProjectiles();
  drawZombies();
  drawHighlight();
}

// ======= UPDATE HELPERS =======
function updateLevelProgress(delta) {
  const levelConfig = LEVELS[currentLevelIndex];
  if (levelState.completed) return;

  if (levelState.waveIndex >= levelConfig.waves.length) {
    levelState.completed = true;
    return;
  }

  const wave = levelConfig.waves[levelState.waveIndex];
  levelState.nextSpawnTimer -= delta;

  if (levelState.spawnedInWave >= wave.count) {
    if (zombies.length === 0) {
      levelState.waveIndex += 1;
      levelState.spawnedInWave = 0;
      levelState.nextSpawnTimer = 4000;
      if (levelState.waveIndex < levelConfig.waves.length) {
        showBanner(`Wave ${levelState.waveIndex + 1}`);
      }
      updateWaveDisplay();
    }
    return;
  }

  if (levelState.nextSpawnTimer <= 0) {
    spawnZombieFromWave(wave);
    const [minDelay, maxDelay] = wave.delayRange;
    levelState.nextSpawnTimer = randRange(minDelay, maxDelay);
  }
}

function spawnZombieFromWave(wave) {
  const levelConfig = LEVELS[currentLevelIndex];
  const type = wave.types[Math.floor(Math.random() * wave.types.length)];
  const row = Math.floor(Math.random() * GRID_ROWS);
  const zombieDef = ZOMBIE_DEFS[type];
  const zombie = {
    type,
    row,
    x: CANVAS_WIDTH + 20,
    y: row * CELL_SIZE + CELL_SIZE / 2,
    hp: zombieDef.hp,
    speed: zombieDef.speed + levelConfig.zombieSpeedModifier,
    damage: zombieDef.damage,
    attackInterval: zombieDef.attackInterval,
    attackTimer: 0,
    slowedUntil: 0,
    width: 80,
    height: 90,
    eating: false,
  };
  zombies.push(zombie);
  levelState.spawnedInWave += 1;
  playAudio("zombieSpawn");
}

function updatePlants(delta, now) {
  for (let i = plants.length - 1; i >= 0; i -= 1) {
    const plant = plants[i];
    const def = PLANT_DEFS[plant.type];
    plant.internalTimer += delta;

    if (plant.type === "sunflower") {
      if (plant.internalTimer >= def.sunInterval) {
        plant.internalTimer = 0;
        spawnSun(plant.x, plant.y - 20, SUN_FROM_SUNFLOWER, true);
      }
    }

    if (def.projectile) {
      plant.attackTimer -= delta;
      if (plant.attackTimer <= 0 && zombieAhead(plant.row, plant.x)) {
        shootProjectile(plant, def.projectile);
        plant.attackTimer = def.attackInterval;
      }
    }

    if (plant.hp <= 0) {
      removePlant(plant);
      plants.splice(i, 1);
    }
  }
}

function updateZombies(delta, now) {
  for (let i = zombies.length - 1; i >= 0; i -= 1) {
    const zombie = zombies[i];
    const def = ZOMBIE_DEFS[zombie.type];
    let speed = zombie.speed;
    if (zombie.slowedUntil > now) {
      speed *= 0.5;
    }

    if (zombie.eating) {
      zombie.attackTimer -= delta;
      if (zombie.attackTimer <= 0) {
        const targetPlant = getPlantInFront(zombie);
        if (targetPlant) {
          targetPlant.hp -= zombie.damage;
          playAudio("zombieEat");
          zombie.attackTimer = zombie.attackInterval;
        } else {
          zombie.eating = false;
        }
      }
    } else {
      zombie.x -= speed * delta * 60;
      const targetPlant = getPlantInFront(zombie);
      if (targetPlant) {
        zombie.eating = true;
        zombie.attackTimer = def.attackInterval;
      }
    }

    if (zombie.hp <= 0) {
      zombies.splice(i, 1);
      continue;
    }

    if (zombie.x < 0) {
      triggerDefeat();
      return;
    }
  }
}

function updateProjectiles(delta) {
  for (let i = projectiles.length - 1; i >= 0; i -= 1) {
    const projectile = projectiles[i];
    projectile.x += projectile.speed * delta * 60;

    if (projectile.x > CANVAS_WIDTH + 40) {
      recycleProjectile(i);
      continue;
    }

    const hit = findHitZombie(projectile);
    if (hit) {
      hit.hp -= projectile.damage;
      if (projectile.slow && projectile.slowDuration) {
        hit.slowedUntil = Math.max(hit.slowedUntil, performance.now() + projectile.slowDuration);
      }
      recycleProjectile(i);
    }
  }
}

function updateSunSpawner(delta) {
  if (levelState.state !== "running") return;
  sunSpawnTimer -= delta;
  if (sunSpawnTimer <= 0) {
    const x = randRange(60, CANVAS_WIDTH - 60);
    spawnSun(x, -30, SUN_FROM_CLICK, false);
    sunSpawnTimer = SUN_FALL_INTERVAL + randRange(-1500, 1500);
  }
}

function updateSuns(delta) {
  for (let i = suns.length - 1; i >= 0; i -= 1) {
    const sun = suns[i];
    if (!sun.stationary) {
      sun.y += SUN_FALL_SPEED * delta * 60;
      if (sun.y >= sun.targetY) {
        sun.y = sun.targetY;
        sun.stationary = true;
      }
    }
    sun.life -= delta;
    if (sun.life <= 0) {
      suns.splice(i, 1);
    }
  }
}

function updateCards(now) {
  const levelConfig = LEVELS[currentLevelIndex];
  cardElements.forEach((card, type) => {
    const def = PLANT_DEFS[type];
    const cooldown = cardCooldowns.get(type);
    const elapsed = now - cooldown.lastPlaced;
    const ratio = Math.max(0, 1 - elapsed / def.cooldown);
    card.querySelector(".cooldown-mask").style.height = `${ratio * 100}%`;

    const affordable = sunCount >= def.cost;
    const ready = elapsed >= def.cooldown;
    const usable = affordable && ready && levelState.state !== "defeat" && levelState.state !== "victory";

    card.classList.toggle("disabled", !usable);
    if (selectedPlant === type && !usable) {
      selectedPlant = null;
    }
  });
}

function updateButtons() {
  const pauseButton = document.getElementById("pauseButton");
  pauseButton.disabled = !running;
}

// ======= RENDER HELPERS =======
function drawLawn() {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, "#7bc96f");
  gradient.addColorStop(1, "#4e8f3b");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  for (let row = 0; row < GRID_ROWS; row += 1) {
    ctx.fillStyle = row % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(0, row * CELL_SIZE, CANVAS_WIDTH, CELL_SIZE);
  }
}

function drawGrid() {
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = 2;
  for (let row = 1; row < GRID_ROWS; row += 1) {
    const y = row * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
  for (let col = 1; col < GRID_COLS; col += 1) {
    const x = col * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
}

function drawHighlight() {
  if (!hoverCell) return;
  ctx.save();
  ctx.fillStyle = "rgba(255, 255, 0, 0.18)";
  ctx.fillRect(hoverCell.col * CELL_SIZE, hoverCell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  ctx.restore();
}

function drawPlants() {
  plants.forEach((plant) => {
    const { x, y } = plant;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = plant.type === "sunflower" ? "#ffeb3b" : plant.type === "wallnut" ? "#a86a3d" : plant.type === "snowpea" ? "#b3e5fc" : "#4caf50";
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(plantLabel(plant.type), plant.x - 30, plant.y + 40);

    if (plant.hp < PLANT_DEFS[plant.type].hp) {
      const ratio = Math.max(0, plant.hp / PLANT_DEFS[plant.type].hp);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(plant.x - 35, plant.y + 45, 70, 6);
      ctx.fillStyle = "#8bc34a";
      ctx.fillRect(plant.x - 35, plant.y + 45, 70 * ratio, 6);
    }
  });
}

function drawZombies() {
  zombies.forEach((zombie) => {
    ctx.save();
    ctx.translate(zombie.x, zombie.y);
    ctx.fillStyle = "#5d4037";
    ctx.beginPath();
    ctx.rect(-30, -45, 60, 90);
    ctx.fill();
    ctx.fillStyle = "#a1887f";
    ctx.fillRect(-26, -60, 52, 20);
    ctx.restore();

    const def = ZOMBIE_DEFS[zombie.type];
    const ratio = Math.max(0, zombie.hp / def.hp);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(zombie.x - 32, zombie.y + 48, 64, 6);
    ctx.fillStyle = "#ff7043";
    ctx.fillRect(zombie.x - 32, zombie.y + 48, 64 * ratio, 6);
  });
}

function drawProjectiles() {
  ctx.save();
  projectiles.forEach((projectile) => {
    ctx.fillStyle = projectile.slow ? "#b3e5fc" : "#8bc34a";
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, PROJECTILE_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();
  });
  ctx.restore();
}

function drawSuns() {
  suns.forEach((sun) => {
    ctx.save();
    ctx.translate(sun.x, sun.y);
    const gradient = ctx.createRadialGradient(0, 0, 8, 0, 0, 28);
    gradient.addColorStop(0, "#fff59d");
    gradient.addColorStop(1, "#fbc02d");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#5d4037";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(`+${sun.value}`, -18, 6);
    ctx.restore();
  });
}

// ======= INPUT HANDLERS =======
function handlePointerMove(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const col = Math.floor(x / CELL_SIZE);
  const row = Math.floor(y / CELL_SIZE);
  if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
    hoverCell = { row, col };
  } else {
    hoverCell = null;
  }
}

function handleCanvasClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (collectSunAt(x, y)) {
    return;
  }

  if (!selectedPlant || !hoverCell) return;
  if (performance.now() < placingBlockedUntil) return;

  const { row, col } = hoverCell;
  if (gridPlants[row][col]) return;

  const def = PLANT_DEFS[selectedPlant];
  const now = performance.now();
  const cooldown = cardCooldowns.get(selectedPlant);
  if (sunCount < def.cost || now - cooldown.lastPlaced < def.cooldown) return;

  placePlant(selectedPlant, row, col);
  sunCount -= def.cost;
  cooldown.lastPlaced = now;
  placingBlockedUntil = now + PLANT_PLACE_COOLDOWN;
  updateSunDisplay();
  updateCards(now);
}

function selectPlantCard(type) {
  const card = cardElements.get(type);
  if (card.classList.contains("disabled")) return;
  if (selectedPlant === type) {
    selectedPlant = null;
  } else {
    selectedPlant = type;
  }
  cardElements.forEach((el, t) => {
    el.classList.toggle("selected", selectedPlant === t);
  });
}

function collectSunAt(x, y) {
  for (let i = suns.length - 1; i >= 0; i -= 1) {
    const sun = suns[i];
    const dx = x - sun.x;
    const dy = y - sun.y;
    if (dx * dx + dy * dy <= 30 * 30) {
      sunCount += sun.value;
      suns.splice(i, 1);
      updateSunDisplay();
      playAudio("collect");
      return true;
    }
  }
  return false;
}

// ======= GAME ACTIONS =======
function placePlant(type, row, col) {
  const def = PLANT_DEFS[type];
  const plant = {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `plant-${Date.now()}-${Math.random()}`,
    type,
    row,
    col,
    x: col * CELL_SIZE + CELL_SIZE / 2,
    y: row * CELL_SIZE + CELL_SIZE / 2,
    hp: def.hp,
    internalTimer: 0,
    attackTimer: def.attackInterval || 0,
  };
  plants.push(plant);
  gridPlants[row][col] = plant;
  playAudio("plant");
}

function removePlant(plant) {
  gridPlants[plant.row][plant.col] = null;
}

function shootProjectile(plant, projectileDef) {
  const projectile = acquireProjectile();
  projectile.x = plant.x + 24;
  projectile.y = plant.y - 12;
  projectile.speed = PROJECTILE_SPEED;
  projectile.damage = projectileDef.damage;
  projectile.slow = projectileDef.slow || 0;
  projectile.slowDuration = projectileDef.slowDuration || 0;
  projectiles.push(projectile);
  playAudio("shoot");
}

function acquireProjectile() {
  if (projectilePool.length > 0) {
    return projectilePool.pop();
  }
  return {
    x: 0,
    y: 0,
    speed: PROJECTILE_SPEED,
    damage: 20,
    slow: 0,
    slowDuration: 0,
  };
}

function recycleProjectile(index) {
  const proj = projectiles.splice(index, 1)[0];
  projectilePool.push(proj);
}

function spawnSun(x, y, value, stationary = false) {
  const targetY = stationary ? y : Math.min(CANVAS_HEIGHT - 40, y + randRange(60, 160));
  suns.push({
    x,
    y,
    targetY,
    value,
    life: SUN_LIFETIME,
    stationary,
  });
}

function startGame() {
  if (running) return;
  levelState.state = "running";
  running = true;
  lastTimestamp = performance.now();
  document.getElementById("pauseButton").disabled = false;
  showBanner("Fight!");
}

function togglePause() {
  running = !running;
  levelState.state = running ? "running" : "paused";
  document.getElementById("pauseButton").textContent = running ? "Pause" : "Resume";
  if (running) {
    lastTimestamp = performance.now();
    showBanner("Resumed");
  } else {
    showBanner("Paused");
  }
  updateButtons();
}

function triggerDefeat() {
  levelState.state = "defeat";
  running = false;
  updateButtons();
  playAudio("defeat");
  showOverlay("Defeat", "Zombies ate your brains!", false);
}

function triggerVictory() {
  if (levelState.state === "victory") return;
  levelState.state = "victory";
  running = false;
  updateButtons();
  playAudio("victory");
  const hasNext = currentLevelIndex < LEVELS.length - 1;
  showOverlay("Victory!", hasNext ? "Prepare for the next wave!" : "You've cleared all demo levels!", hasNext);
}

function checkVictoryConditions() {
  if (!levelState.completed) return;
  if (zombies.length === 0) {
    triggerVictory();
  }
}

function showOverlay(title, message, showNext) {
  const overlay = document.getElementById("overlay");
  overlay.classList.remove("hidden");
  document.getElementById("overlayTitle").textContent = title;
  document.getElementById("overlayMessage").textContent = message;
  const secondary = document.getElementById("overlaySecondary");
  secondary.classList.toggle("hidden", !showNext);
  document.getElementById("overlayPrimary").textContent = showNext ? "Replay" : "Restart";
  if (showNext) {
    secondary.textContent = "Next Level";
  }
}

function hideOverlay() {
  document.getElementById("overlay").classList.add("hidden");
}

function updateSunDisplay() {
  document.getElementById("sunCount").textContent = sunCount;
}

function updateWaveDisplay() {
  const levelConfig = LEVELS[currentLevelIndex];
  const total = levelConfig.waves.length;
  const current = Math.min(total, levelState.waveIndex + 1);
  document.getElementById("waveInfo").textContent = `${current}/${total}`;
}

function updateLevelDisplay() {
  const levelConfig = LEVELS[currentLevelIndex];
  document.getElementById("levelName").textContent = levelConfig.name;
}

function showBanner(text) {
  banner.textContent = text;
  banner.classList.add("visible");
  setTimeout(() => banner.classList.remove("visible"), 2000);
}

// ======= COLLISION HELPERS =======
function zombieAhead(row, plantX) {
  return zombies.some((zombie) => zombie.row === row && zombie.x > plantX);
}

function findHitZombie(projectile) {
  for (let i = 0; i < zombies.length; i += 1) {
    const zombie = zombies[i];
    if (Math.abs(zombie.y - projectile.y) < CELL_SIZE / 2) {
      if (projectile.x >= zombie.x - zombie.width / 2) {
        return zombie;
      }
    }
  }
  return null;
}

function getPlantInFront(zombie) {
  const col = Math.floor((zombie.x - CELL_SIZE / 2) / CELL_SIZE);
  if (col < 0 || col >= GRID_COLS) return null;
  return gridPlants[zombie.row][col];
}

function plantLabel(type) {
  switch (type) {
    case "sunflower":
      return "☀";
    case "peashooter":
      return "🌿";
    case "snowpea":
      return "❄";
    case "wallnut":
      return "🥜";
    default:
      return "?";
  }
}

// ======= UTILITY =======
function randRange(min, max) {
  return Math.random() * (max - min) + min;
}

function playAudio(key) {
  if (!audioEnabled) return;
  const handler = AUDIO_LIBRARY[key];
  if (handler) handler();
}
