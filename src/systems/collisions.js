import { DEFAULT_PLANT_HEALTH } from '../entities/zombie.js';

const DEFAULT_BOARD_WIDTH = 1280;
const DEFAULT_PLANT_WIDTH = 80;
const DEFAULT_PLANT_HEIGHT = 100;

function rectsOverlap(a, b) {
  return !(
    a.right < b.left ||
    a.left > b.right ||
    a.bottom < b.top ||
    a.top > b.bottom
  );
}

function normalisePlant(plant) {
  if (typeof plant.width !== 'number') {
    plant.width = DEFAULT_PLANT_WIDTH;
  }

  if (typeof plant.height !== 'number') {
    plant.height = DEFAULT_PLANT_HEIGHT;
  }

  if (typeof plant.health !== 'number') {
    plant.health = DEFAULT_PLANT_HEALTH;
  }
}

function getEntityBounds(entity) {
  if (typeof entity.getBounds === 'function') {
    return entity.getBounds();
  }

  const halfWidth = entity.width / 2;
  const halfHeight = entity.height / 2;

  return {
    left: entity.x - halfWidth,
    right: entity.x + halfWidth,
    top: entity.y - halfHeight,
    bottom: entity.y + halfHeight,
  };
}

export function updateCollisions({
  bullets = [],
  zombies = [],
  plants = [],
  deltaTime = 0,
  boardWidth = DEFAULT_BOARD_WIDTH,
}) {
  bullets.forEach((bullet) => {
    bullet.boardWidth = boardWidth;
    bullet.update(deltaTime);
  });

  zombies.forEach((zombie) => {
    zombie.update(deltaTime);
  });

  bullets.forEach((bullet) => {
    if (!bullet.active) {
      return;
    }

    const bulletBounds = bullet.getBounds();
    zombies.forEach((zombie) => {
      if (!zombie.active || zombie.row !== bullet.row || !bullet.active) {
        return;
      }

      const zombieBounds = zombie.getBounds();
      if (rectsOverlap(bulletBounds, zombieBounds)) {
        zombie.takeDamage(bullet.damage);
        bullet.destroy();
      }
    });
  });

  zombies.forEach((zombie) => {
    if (!zombie.active) {
      return;
    }

    if (zombie.isEating && zombie.targetPlant) {
      if (zombie.targetPlant.destroyed) {
        zombie.stopEating();
      } else {
        const plantBounds = getEntityBounds(zombie.targetPlant);
        const zombieBounds = zombie.getBounds();
        if (!rectsOverlap(zombieBounds, plantBounds)) {
          zombie.stopEating();
        }
      }
    }

    if (!zombie.isEating) {
      plants
        .filter((plant) => plant.row === zombie.row && !plant.destroyed)
        .some((plant) => {
          normalisePlant(plant);
          const plantBounds = getEntityBounds(plant);
          const zombieBounds = zombie.getBounds();
          if (rectsOverlap(zombieBounds, plantBounds)) {
            zombie.startEating(plant);
            return true;
          }
          return false;
        });
    }

    if (zombie.isEating) {
      zombie.applyDamageToPlant(deltaTime);
    }
  });

  return {
    bullets: bullets.filter((bullet) => bullet.active),
    zombies: zombies.filter((zombie) => zombie.active),
    plants: plants.filter((plant) => !plant.destroyed),
  };
}

export default updateCollisions;
