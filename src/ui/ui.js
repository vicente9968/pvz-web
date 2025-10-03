import economy, { subscribe as subscribeEconomy } from '../systems/economy.js';

class GameUI {
  constructor() {
    this.root = null;
    this.sunText = null;
    this.unsubscribe = null;
    this.initialised = false;
  }

  init() {
    if (this.initialised) {
      return;
    }

    this.root = document.querySelector('[data-ui-root]');

    if (!this.root) {
      this.root = document.createElement('div');
      this.root.dataset.uiRoot = 'true';
      this.root.style.position = 'fixed';
      this.root.style.top = '16px';
      this.root.style.left = '16px';
      this.root.style.padding = '8px 12px';
      this.root.style.background = 'rgba(255, 255, 255, 0.85)';
      this.root.style.borderRadius = '6px';
      this.root.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      this.root.style.fontFamily = '"Helvetica Neue", Arial, sans-serif';
      this.root.style.fontSize = '18px';
      this.root.style.fontWeight = 'bold';
      this.root.style.zIndex = '1000';
      document.body.appendChild(this.root);
    }

    this.sunText = this.root.querySelector('[data-ui-sun-text]');

    if (!this.sunText) {
      this.sunText = document.createElement('span');
      this.sunText.dataset.uiSunText = 'true';
      this.root.textContent = 'Sun: ';
      this.root.appendChild(this.sunText);
    }

    this.unsubscribe = subscribeEconomy((amount) => {
      if (!this.sunText) {
        return;
      }

      this.sunText.textContent = String(amount);
    });

    this.initialised = true;
  }

  destroy() {
    if (typeof this.unsubscribe === 'function') {
      this.unsubscribe();
      this.unsubscribe = null;
    }

    this.initialised = false;
  }

  flashSun(cost) {
    if (!this.sunText) {
      return;
    }

    this.sunText.animate(
      [
        { color: '#f7b733' },
        { color: '#e32b2b' },
        { color: '#f7b733' },
      ],
      {
        duration: 600,
        easing: 'ease-in-out',
      },
    );

    if (!economy.canAfford(cost)) {
      this.root.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' },
        ],
        {
          duration: 300,
          iterations: 1,
        },
      );
    }
  }
}

const ui = new GameUI();

export default ui;
