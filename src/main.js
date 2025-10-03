import { setupUI } from './systems/ui.js';
import Sunflower from './entities/sunflower.js';
import PeaShooter from './entities/peaShooter.js';

const GRID_ROWS = 5;
const GRID_COLS = 9;

const plantTypes = [Sunflower, PeaShooter];

const state = {
  sun: 50,
  selectedCard: null,
  board: Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(null)),
  cooldowns: plantTypes.reduce((acc, PlantType) => {
    acc[PlantType.type] = 0;
    return acc;
  }, {}),
};

const ui = setupUI({
  state,
  plantTypes,
  rows: GRID_ROWS,
  cols: GRID_COLS,
  onCardSelected: handleCardSelect,
  onCellClicked: handleCellClick,
});

function handleCardSelect(type) {
  const PlantType = plantTypes.find((plant) => plant.type === type);
  if (!PlantType) return;
  const now = Date.now();
  const isCoolingDown = now < state.cooldowns[type];
  const canAfford = state.sun >= PlantType.cost;
  if (isCoolingDown || !canAfford) {
    return;
  }
  state.selectedCard = type;
  ui.render();
}

function handleCellClick(row, col) {
  if (!state.selectedCard) return;
  if (state.board[row][col]) {
    return;
  }

  const PlantType = plantTypes.find((plant) => plant.type === state.selectedCard);
  if (!PlantType) {
    state.selectedCard = null;
    return;
  }

  const now = Date.now();
  if (state.sun < PlantType.cost || now < state.cooldowns[PlantType.type]) {
    state.selectedCard = null;
    ui.render();
    return;
  }

  state.board[row][col] = new PlantType({ row, col });
  state.sun -= PlantType.cost;
  state.cooldowns[PlantType.type] = now + PlantType.cooldown * 1000;
  state.selectedCard = null;
  ui.render();
}

setInterval(() => {
  ui.render();
}, 250);

ui.render();
