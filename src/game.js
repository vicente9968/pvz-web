export default class PvZGame extends Phaser.Scene {
  constructor() {
    super({ key: 'PvZGame' });
  }

  preload() {}

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x4caf50).setOrigin(0.5);
  }

  update() {}
}
