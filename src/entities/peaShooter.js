import Plant from './plant.js';

export default class PeaShooter extends Plant {
  static get type() {
    return 'peaShooter';
  }

  static get displayName() {
    return '豌豆射手';
  }

  static get cost() {
    return 100;
  }

  static get cooldown() {
    return 7;
  }

  static get color() {
    return '#7ad152';
  }
}
