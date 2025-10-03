export default class Plant {
  constructor({ row, col }) {
    this.row = row;
    this.col = col;
    this.type = this.constructor.type;
  }

  static get type() {
    return 'plant';
  }

  static get displayName() {
    return '植物';
  }

  static get cost() {
    return 0;
  }

  static get cooldown() {
    return 0;
  }

  static get color() {
    return '#cccccc';
  }
}
