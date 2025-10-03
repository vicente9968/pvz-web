import Plant from './plant.js';

export default class Sunflower extends Plant {
  static get type() {
    return 'sunflower';
  }

  static get displayName() {
    return '向日葵';
  }

  static get cost() {
    return 50;
  }

  static get cooldown() {
    return 5;
  }

  static get color() {
    return '#fdd835';
  }
}
