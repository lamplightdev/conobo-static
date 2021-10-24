import Wafer from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/wafer.js';
import {
  repeat,
  emit,
} from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/dom.js';

const canvasSize = 4096;
const mapSize = 205;

const sizeFactor = mapSize / canvasSize;

import { html } from './util.js';

class MiniMap extends Wafer {
  static get template() {
    return html`
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        *:focus-visible {
          outline: 2px solid #5e5e5e;
        }

        :host {
          display: block;
          width: ${mapSize}px;
          height: ${mapSize}px;
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(5px);

          position: relative;
          overflow: hidden;

          border-top-left-radius: 0.25rem;
        }

        #item {
          position: absolute;
          top: 0;
          left: 0;
          background-color: rgba(0, 0, 0, 0.2);
        }

        #frame {
          position: absolute;
          z-index: 1;
          top: 0;
          left: 0;
          border: 1px solid rgba(0, 0, 0, 0.8);
          background-color: rgba(0, 0, 0, 0.1);
          cursor: move;
        }
      </style>

      <div id="frame"></div>

      <div id="content"></div>
    `;
  }

  static get props() {
    return {
      size: {
        type: Object,
        initial: {
          width: 0,
          height: 0,
        },
      },
      frameSize: {
        type: Object,
        initial: {
          width: 0,
          height: 0,
        },
        targets: [
          {
            selector: '$#frame',
            dom: (el, size, self) => {
              if (!size) {
                return;
              }

              el.style.width = `${size.width * (1 / self.scale)}px`;
              el.style.height = `${size.height * (1 / self.scale)}px`;
            },
          },
        ],
      },
      position: {
        type: Object,
        initial: {
          left: 0,
          top: 0,
        },
        targets: [
          {
            selector: '$#frame',
            dom: (el, value, self) => {
              el.style.transform = `translate(
                ${(value.left * sizeFactor) / self.scale}px,
                ${(value.top * sizeFactor) / self.scale}px
              )`;
            },
          },
        ],
      },
      scale: {
        type: Number,
        initial: 1,
        targets: [],
        triggers: ['frameSize', 'position'],
      },
      items: {
        type: Array,
        initial: [],
        targets: [
          {
            selector: '$#content',
            dom: (container, items) => {
              return repeat({
                container,
                html: html`<div id="item"></div>`,
                keyFn: (item) => item._id,
                items,
                targets: [
                  {
                    selector: 'self',
                    dom: (el, item) => {
                      el.style.transform = `translate(
                        ${item.position.x * sizeFactor}px,
                        ${item.position.y * sizeFactor}px
                      )`;

                      el.style.width = `${item.size.width * sizeFactor}px`;
                      el.style.height = `${item.size.height * sizeFactor}px`;
                    },
                  },
                ],
              });
            },
          },
        ],
      },
    };
  }

  get events() {
    return {
      self: {
        click: this.onClick,
      },
      '$#frame': {
        mousedown: this.onMouseDown,
        touchstart: {
          fn: this.onTouchStart,
          opts: {
            passive: false,
          },
        },
      },
    };
  }

  constructor() {
    super();

    this._dragInit = { left: null, top: null };
    this._dragStart = { left: null, top: null };
  }

  updated(updated) {
    if (updated.has('size')) {
      this.frameSize = {
        width: sizeFactor * this.size.width * (1 / this.scale),
        height: sizeFactor * this.size.height * (1 / this.scale),
      };
    }
  }

  onMouseDown(event) {
    event.preventDefault();

    this._dragInit = {
      left: (this.position.left * sizeFactor * 1) / this.scale,
      top: (this.position.top * sizeFactor * 1) / this.scale,
    };

    this._dragStart = {
      left: event.pageX,
      top: event.pageY,
    };

    const boundOnMouseMove = this.onMouseMove.bind(this);

    window.addEventListener('mousemove', boundOnMouseMove);

    window.addEventListener(
      'mouseup',
      () => {
        window.removeEventListener('mousemove', boundOnMouseMove);
      },
      {
        once: true,
      }
    );
  }

  onMouseMove(event) {
    this.moveTo({
      position: {
        left: this._dragInit.left + event.pageX - this._dragStart.left,
        top: this._dragInit.top + event.pageY - this._dragStart.top,
      },
    });
  }

  onTouchStart(event) {
    event.preventDefault();

    this._dragInit = {
      left: (this.position.left * sizeFactor) / this.scale,
      top: (this.position.top * sizeFactor) / this.scale,
    };

    this._dragStart = {
      left: event.touches[0].pageX,
      top: event.touches[0].pageY,
    };

    const boundOnTouchMove = this.onTouchMove.bind(this);

    window.addEventListener('touchmove', boundOnTouchMove);

    window.addEventListener(
      'touchend',
      () => {
        window.removeEventListener('touchmove', boundOnTouchMove);
      },
      {
        once: true,
      }
    );
  }

  onTouchMove(event) {
    this.moveTo({
      position: {
        left:
          this._dragInit.left + event.touches[0].pageX - this._dragStart.left,
        top: this._dragInit.top + event.touches[0].pageY - this._dragStart.top,
      },
    });
  }

  onClick(event) {
    const path = event.composedPath();
    if (path[0] !== this.shadowRoot.querySelector('#frame')) {
      const rect = this.getBoundingClientRect();
      this.moveTo({
        position: {
          left: event.pageX - rect.x,
          top: event.pageY - rect.y,
        },
        centre: true,
      });
    }
  }

  moveTo({ position, centre = false }) {
    const newPosition = {
      left: position.left / sizeFactor,
      top: position.top / sizeFactor,
    };

    if (centre) {
      newPosition.left -= this.size.width / this.scale / 2;
      newPosition.top -= this.size.height / this.scale / 2;
    }

    newPosition.left *= this.scale;
    newPosition.top *= this.scale;

    emit(this, 'clip-updateposition', {
      position: newPosition,
    });
  }
}

customElements.define('clip-minimap', MiniMap);
