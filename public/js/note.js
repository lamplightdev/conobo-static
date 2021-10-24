import Wafer from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/wafer.js';
import { emit } from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/dom.js';

import { html } from './util.js';

class Note extends Wafer {
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
          outline-offset: -2px;
        }

        :host {
          position: relative;
          display: flex;
          flex-direction: column;
          background-color: #f7f783;
          color: #333;
          --bar-height: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 0.25rem;
          overflow: hidden;
        }

        :host(:not([moving]):not([resizing])) {
          transition: 0.2s all ease-in-out;
        }

        #bar {
          display: flex;
          align-items: center;
          height: var(--bar-height);
          background-color: rgba(255, 255, 255, 0.3);
        }

        #remove {
          flex-shrink: 0;
          height: var(--bar-height);
          width: var(--bar-height);
          border: 0;
          box-shadow: none;
          background: transparent;
        }

        #remove img,
        #resize img {
          height: var(--bar-height);
          width: auto;
          opacity: 0.2;
          padding: 0.2rem;
          pointer-events: none;
        }

        #remove:hover img,
        #resize:hover img {
          opacity: 1;
        }

        #resize img {
          transform: rotate(90deg);
          padding: 0.2rem 0.2rem 0.5rem 0.5rem;
        }

        :host([disabled]) #remove {
          display: none;
        }

        #move {
          height: 2rem;
          cursor: move;
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          opacity: 0.6;
          padding: 0.5rem;
          font-size: 0.8rem;
          overflow: hidden;
        }

        #move span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          pointer-events: none;
        }

        :host([disabled]) #move {
          pointer-events: none;
          cursor: pointer;
        }

        #resize {
          position: absolute;
          bottom: 0;
          right: 0;
          width: var(--bar-height);
          height: var(--bar-height);
          cursor: nwse-resize;
        }

        :host([disabled]) #resize {
          display: none;
        }

        .content {
          flex-grow: 1;
          background: inherit;
          font-family: inherit;
          font-size: inherit;
          color: inherit;
          border: 0px;
          resize: none;
          width: 100%;
          padding: 1rem;
          overflow: auto;
        }

        div.content {
          display: none;
        }

        :host([disabled]) textarea.content,
        :host([other]) textarea.content {
          display: none;
        }

        :host([disabled]) div.content,
        :host([other]) div.content {
          display: block;
        }
      </style>

      <div id="bar">
        <button id="remove"><img alt="remove" /></button>
        <div id="move"><span></span></div>
      </div>
      <textarea class="content"></textarea>
      <div class="content"></div>
      <div id="resize"><img alt="resize" /></div>
    `;
  }

  static get props() {
    return {
      env: {
        type: Object,
        initial: {},
        targets: [
          {
            selector: '$#remove img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/close.svg`;
            },
          },
          {
            selector: '$#resize img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/resize.svg`;
            },
          },
        ],
        triggers: [],
      },
      _id: {
        type: String,
        initial: null,
        reflect: true,
      },
      boardId: {
        type: String,
        initial: null,
      },
      userId: {
        type: String,
        initial: null,
      },
      username: {
        type: Object,
        initial: null,
        targets: [
          {
            selector: '$#move span',
            text: true,
            use: (username) => username || '',
          },
        ],
      },
      scale: {
        type: Number,
        initial: 1,
      },
      color: {
        type: String,
        initial: '',
        targets: [
          {
            selector: 'self',
            dom: (self, color) => {
              self.style.backgroundColor = color;
            },
          },
        ],
      },
      content: {
        type: String,
        initial: '',
        targets: [
          {
            selector: '$textarea.content',
            property: 'value',
          },
          {
            selector: '$div.content',
            text: true,
          },
        ],
      },
      size: {
        type: Object,
        initial: null,
        targets: [
          {
            selector: 'self',
            dom: (self, size) => {
              self.style.width = `${size.width}px`;
              self.style.height = `${size.height}px`;
            },
          },
        ],
      },
      position: {
        type: Object,
        initial: null,
        targets: [
          {
            selector: 'self',
            dom: (self, position) => {
              self.style.left = `${position.x}px`;
              self.style.top = `${position.y}px`;
            },
          },
        ],
      },
      disabled: {
        type: Boolean,
        initial: true,
        reflect: true,
      },
      other: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      moving: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      resizing: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      zIndex: {
        type: Number,
        initial: 0,
        targets: [
          {
            selector: 'self',
            dom: (self, zIndex) => {
              self.style.zIndex = zIndex;
            },
          },
        ],
      },
      maxZIndex: {
        type: Number,
        initial: 0,
      },
    };
  }

  get events() {
    return {
      self: {
        mousedown: this.onSelfMouseDown,
      },
      '$#move': {
        mousedown: this.onMouseDown,
        touchstart: {
          fn: this.onTouchStart,
          opts: {
            passive: false,
          },
        },
      },
      '$#resize': {
        mousedown: this.onMouseDown,
        touchstart: {
          fn: this.onTouchStart,
          opts: {
            passive: false,
          },
        },
      },
      '$#remove': {
        click: this.onRemove,
      },
      '$.content': {
        input: this.onContentInput,
      },
    };
  }

  _moveInit(
    event,
    eventNames = { move: 'mousemove', up: 'mouseup' },
    eventSourceFn
  ) {
    event.preventDefault();

    this.moving = true;

    const eventSource = eventSourceFn(event);

    const _dragInit = {
      x: this.position.x,
      y: this.position.y,
    };

    const _dragStart = {
      x: eventSource.pageX,
      y: eventSource.pageY,
    };

    const onMove = async (event) => {
      const eventSource = eventSourceFn(event);

      this.position = {
        x: _dragInit.x - (_dragStart.x - eventSource.pageX) / this.scale,
        y: _dragInit.y - (_dragStart.y - eventSource.pageY) / this.scale,
      };

      this.save({
        position: this.position,
      });
    };

    window.addEventListener(eventNames.move, onMove);

    window.addEventListener(
      eventNames.up,
      () => {
        window.removeEventListener(eventNames.move, onMove);

        this.moving = false;
      },
      {
        once: true,
      }
    );
  }

  _resizeInit(
    event,
    eventNames = { move: 'mousemove', up: 'mouseup' },
    eventSourceFn
  ) {
    event.preventDefault();

    this.resizing = true;

    const eventSource = eventSourceFn(event);

    const _dragInit = {
      width: this.size.width,
      height: this.size.height,
    };

    const _dragStart = {
      x: eventSource.pageX,
      y: eventSource.pageY,
    };

    const onMove = (event) => {
      const eventSource = eventSourceFn(event);

      this.size = {
        width:
          _dragInit.width - (_dragStart.x - eventSource.pageX) / this.scale,
        height:
          _dragInit.height - (_dragStart.y - eventSource.pageY) / this.scale,
      };

      if (this.size.width < 160) {
        this.size.width = 160;
      }

      if (this.size.height < 160) {
        this.size.height = 160;
      }

      this.save({
        size: this.size,
      });
    };

    window.addEventListener(eventNames.move, onMove);

    window.addEventListener(
      eventNames.up,
      () => {
        window.removeEventListener(eventNames.move, onMove);

        this.resizing = false;
      },
      {
        once: true,
      }
    );
  }

  onMouseDown(event) {
    event.preventDefault();

    switch (event.target.id) {
      case 'move':
        this._moveInit(
          event,
          { move: 'mousemove', up: 'mouseup' },
          (event) => event
        );
        break;
      case 'resize':
        this._resizeInit(
          event,
          { move: 'mousemove', up: 'mouseup' },
          (event) => event
        );
        break;
    }
  }

  onTouchStart(event) {
    event.preventDefault();

    switch (event.target.id) {
      case 'move':
        this._moveInit(
          event,
          { move: 'touchmove', up: 'touchend' },
          (event) => event.touches[0]
        );
        break;
      case 'resize':
        this._resizeInit(
          event,
          { move: 'touchmove', up: 'touchend' },
          (event) => event.touches[0]
        );
        break;
    }
  }

  onContentInput(event) {
    this.save({
      content: event.target.value,
    });
  }

  save(toUpdate) {
    emit(this, 'clip-note-save', {
      _id: this._id,
      ...toUpdate,
    });
  }

  onRemove() {
    emit(this, 'clip-note-remove', {
      _id: this._id,
    });
  }

  onSelfMouseDown() {
    const zIndex = this.maxZIndex + 1;
    this.zIndex = zIndex;

    emit(this, 'clip-note-zindex', {
      zIndex,
    });
  }
}

customElements.define('clip-note', Note);
