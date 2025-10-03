export const rows = 5;
export const cols = 9;
export const cellSize = 80;

export function worldToCell(x, y) {
  const col = Math.floor(x / cellSize);
  const row = Math.floor(y / cellSize);

  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    return null;
  }

  return { row, col };
}

export function cellToWorld(row, col) {
  if (col < 0 || col >= cols || row < 0 || row >= rows) {
    return null;
  }

  const x = col * cellSize + cellSize / 2;
  const y = row * cellSize + cellSize / 2;

  return { x, y };
}
