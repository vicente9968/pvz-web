import { rows, cols, cellSize } from './grid.js';

const LIGHT_GREEN = '#dff4c3';
const DARK_GREEN = '#b6e29f';

export function configureCanvas(canvas) {
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  if (canvas.style) {
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
  }
}

export function drawGrid(ctx) {
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = col * cellSize;
      const y = row * cellSize;
      const color = (row + col) % 2 === 0 ? LIGHT_GREEN : DARK_GREEN;

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cellSize, cellSize);
    }
  }

  ctx.strokeStyle = '#6b8e23';
  ctx.lineWidth = 1;

  for (let row = 0; row <= rows; row += 1) {
    const y = row * cellSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(cols * cellSize, y);
    ctx.stroke();
  }

  for (let col = 0; col <= cols; col += 1) {
    const x = col * cellSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rows * cellSize);
    ctx.stroke();
  }
}

export function initGame(canvas) {
  configureCanvas(canvas);
  const ctx = canvas.getContext('2d');
  drawGrid(ctx);
  return ctx;
}
