const MINIMUM_SUN = 0;
const DEFAULT_SUN = 50;

let currentSun = DEFAULT_SUN;
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(currentSun);
    } catch (error) {
      console.error('Sun economy listener failed', error);
    }
  });
}

function clampSun(value) {
  return Math.max(MINIMUM_SUN, Math.floor(value));
}

export function getCurrentSun() {
  return currentSun;
}

export function addSun(amount) {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return;
  }

  if (amount <= 0) {
    return;
  }

  currentSun = clampSun(currentSun + amount);
  notify();
}

export function canAfford(cost) {
  if (typeof cost !== 'number' || Number.isNaN(cost)) {
    return false;
  }

  return currentSun >= cost;
}

export function spend(cost) {
  if (!canAfford(cost)) {
    return false;
  }

  currentSun = clampSun(currentSun - cost);
  notify();
  return true;
}

export function subscribe(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  listener(currentSun);

  return () => {
    listeners.delete(listener);
  };
}

export function resetEconomy() {
  currentSun = DEFAULT_SUN;
  notify();
}

export default {
  addSun,
  canAfford,
  spend,
  getCurrentSun,
  subscribe,
  resetEconomy,
};
