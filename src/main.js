import PvZGame from './game.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#2e7d32',
  parent: document.body,
  scene: [PvZGame]
};

window.addEventListener('load', () => {
  window.pvzGame = new Phaser.Game(config);
});
