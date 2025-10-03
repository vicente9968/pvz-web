const formatSun = (value) => `阳光：${Math.floor(value)}`;

export function setupUI({ state, plantTypes, rows, cols, onCardSelected, onCellClicked }) {
  const sunDisplay = document.getElementById('sun-display');
  const cardBar = document.getElementById('card-bar');
  const boardElement = document.getElementById('board');

  if (!sunDisplay || !cardBar || !boardElement) {
    throw new Error('UI 容器缺失，无法初始化界面。');
  }

  const cardElements = new Map();

  plantTypes.forEach((PlantType) => {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = PlantType.displayName;

    const body = document.createElement('div');
    body.className = 'card-body';
    body.textContent = `费用：${PlantType.cost}`;

    const footer = document.createElement('div');
    footer.className = 'card-footer';
    footer.textContent = `冷却：${PlantType.cooldown}s`;

    card.append(title, body, footer);
    cardBar.appendChild(card);

    card.addEventListener('click', () => {
      if (card.classList.contains('disabled')) {
        return;
      }
      onCardSelected(PlantType.type);
    });

    cardElements.set(PlantType.type, {
      card,
      footer,
      body,
    });
  });

  const cellElements = Array.from({ length: rows }, () => Array(cols));

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);

      cell.addEventListener('click', () => {
        onCellClicked(row, col);
      });

      boardElement.appendChild(cell);
      cellElements[row][col] = cell;
    }
  }

  function renderSun() {
    sunDisplay.textContent = formatSun(state.sun);
  }

  function renderCards() {
    const now = Date.now();
    plantTypes.forEach((PlantType) => {
      const registryEntry = cardElements.get(PlantType.type);
      if (!registryEntry) return;

      const { card, footer, body } = registryEntry;
      const remaining = Math.max(0, state.cooldowns[PlantType.type] - now);
      const isReady = remaining <= 0;
      const canAfford = state.sun >= PlantType.cost;

      card.classList.toggle('disabled', !isReady || !canAfford);
      if (state.selectedCard === PlantType.type && (!isReady || !canAfford)) {
        state.selectedCard = null;
      }
      card.classList.toggle(
        'selected',
        state.selectedCard === PlantType.type && isReady && canAfford,
      );

      if (isReady) {
        footer.textContent = `冷却：${PlantType.cooldown}s`;
      } else {
        const seconds = Math.ceil(remaining / 1000);
        footer.textContent = `冷却中：${seconds}s`;
      }

      if (canAfford) {
        body.textContent = `费用：${PlantType.cost}`;
      } else {
        body.textContent = `费用：${PlantType.cost}（不足）`;
      }
    });
  }

  function renderBoard() {
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cell = cellElements[row][col];
        const plant = state.board[row][col];
        cell.innerHTML = '';
        if (plant) {
          const token = document.createElement('div');
          token.className = 'plant-token';
          token.style.background = plant.constructor.color;

          const nameLine = document.createElement('div');
          nameLine.textContent = plant.constructor.displayName;

          const coordLine = document.createElement('small');
          coordLine.textContent = `${row + 1}-${col + 1}`;

          token.append(nameLine, coordLine);
          cell.appendChild(token);
        }
      }
    }
  }

  function render() {
    renderSun();
    renderCards();
    renderBoard();
  }

  return {
    render,
  };
}
