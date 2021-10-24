import Wafer from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/wafer.js';
import { repeat } from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/dom.js';

import './user.js';
import './note.js';
import './minimap.js';

import { html } from './util.js';

const canvasSize = 4096;
class Board extends Wafer {
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
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: auto;
        }

        #boardname {
          flex-grow: 1;
          margin: 0 1rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }

        #menu,
        #actions {
          position: fixed;
          z-index: 100;
          left: 0;
          right: 0;
          top: 0;
          margin: 1rem auto 0 auto;
          padding: 0 0.4rem 0 0.6rem;
          height: 3.8rem;
          width: calc(100vw - 2rem);
          border-radius: 1rem 2rem 2rem 1rem;

          display: flex;
          align-items: center;
          justify-content: space-between;

          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(5px);
        }

        #actions {
          display: flex;
          align-items: center;
          justify-content: space-around;
          top: auto;
          bottom: 0;
          max-width: 24rem;
          border-radius: 0.5rem 0.5rem 0rem 0rem;
          padding: 0.5rem;
          text-align: center;
        }

        :host(:not([scale='1'])) #zoom-out,
        :host([scale='1']) #zoom-in {
          display: none;
        }

        #separator {
          display: inline-block;
          width: 1px;
          height: 2rem;
          border-left: 1px solid #5e5e5e;
        }

        :host(:not([owner])) #clear,
        :host(:not([owner])) #separator.separator-clear {
          display: none;
        }

        #logo {
          display: block;
          height: 40px;
        }

        #menu clip-user {
          --username-bg: transparent;
        }

        #menu a {
          text-decoration: none;
          color: inherit;
        }

        #users {
          position: fixed;
          z-index: 10;
          top: 5rem;
          right: 1.4rem;

          display: flex;
          flex-direction: column;
          align-items: flex-end;

          max-height: calc(100vh - 20rem);
          overflow: scroll;
        }

        #users clip-user + clip-user {
          margin-top: 0.6rem;
        }

        #board {
          width: ${canvasSize}px;
          height: ${canvasSize}px;
          background-color: #eee;

          position: relative;

          transform-origin: top left;
        }

        clip-note {
          position: absolute;
        }

        clip-minimap {
          position: fixed;
          bottom: 0;
          right: 0;
          z-index: 10;
        }

        button {
          background-color: transparent;
          color: #5e5e5e;
          width: 2rem;
          height: 2rem;
          box-shadow: none;
          border: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        button.addnote {
          border-radius: 2rem;
          border: 2px solid #5e5e5e;
          background-color: #f7f783;
        }

        button.addnote-blue {
          background-color: #99deff;
        }

        button.addnote-red {
          background-color: #f5c4c4;
        }

        .action-info {
          position: absolute;
          top: -23rem;
          left: auto;
          right: auto;
          max-width: 20rem;

          background-color: white;
          border-radius: 0.5rem 0.5rem 0 0;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-evenly;
          height: 23rem;
        }

        .action-info .close {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
        }

        .action-info a {
          width: auto;
          height: auto;
          box-shadow: none;
          border: 0;
          background-color: #5e5e5e;
          color: #eee;
          text-transform: uppercase;
          border-radius: 1rem;
          padding: 0.4rem 0.6rem;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: bold;
          display: inline-flex;
          align-items: center;
          background-color: #f7f783;
          border: 1px solid #5e5e5e;
          color: #5e5e5e;
        }

        .action-info a:hover {
          text-decoration: underline;
        }

        .action-info p.action-text {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-info p.action-text button {
          flex-shrink: 0;
          margin-left: 0.5rem;
        }

        #help-info h2 {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #help-info h2 img {
          margin-left: 0.5rem;
          height: 4rem;
          width: auto;
        }

        :host(:not([showshare])) #sharing {
          display: none;
        }

        :host(:not([showhelp])) #help-info {
          display: none;
        }

        #qr {
          width: 16rem;
          height: 16rem;
        }
      </style>

      <div id="menu">
        <a href="/"><img id="logo" alt="conobo" /></a>
        <a id="boardname"></a>
        <a href="/user"><clip-user id="user"></clip-user></a>
      </div>

      <div id="actions">
        <button
          class="addnote addnote-yellow"
          data-color="#f7f783"
          title="Add yellow note"
        >
          <img alt="" />
        </button>
        <button
          class="addnote addnote-blue"
          data-color="#99deff"
          title="Add blue note"
        >
          <img alt="" />
        </button>
        <button
          class="addnote addnote-red"
          data-color="#f5c4c4"
          title="Add red note"
        >
          <img alt="" />
        </button>
        <div id="separator"></div>
        <button id="share" title="Share"><img alt="" /></button>
        <button class="zoom" id="zoom-in" title="Zoom in">
          <img alt="" />
        </button>
        <button class="zoom" id="zoom-out" title="Zoom out">
          <img alt="" />
        </button>
        <button id="help" title="Help"><img alt="" /></button>
        <div id="separator" class="separator-clear"></div>
        <button id="clear" title="Clear all">
          <img alt="" />
        </button>

        <div id="sharing" class="action-info">
          <button class="close"><img alt="close" /></button>
          <p>Share this page with others to collaborate in real time:</p>
          <img id="qr" alt="QR Code" />
          <a target="_blank">Sharing link</a>
        </div>

        <div id="help-info" class="action-info">
          <button class="close"><img alt="close" /></button>
          <h2><img alt="conobo" /></h2>
          <p>
            <strong>conobo</strong> is a realtime collaborative notice board
            that lets you and those you invite add notes to a live updating
            notice board.
          </p>
          <div>
            <p class="action-text">
              Get stated by adding a note
              <button class="addnote addnote-yellow" data-color="#f7f783">
                <img alt="Add yellow note" />
              </button>
            </p>
            <p class="action-text">
              and sharing the page with others
              <button id="share"><img alt="Share" /></button>
            </p>
          </div>
        </div>
      </div>

      <div id="users"></div>

      <div id="board">
        <div id="notes"></div>
      </div>

      <clip-minimap></clip-minimap>
    `;
  }

  static get props() {
    return {
      env: {
        type: Object,
        initial: {},
        targets: [
          {
            selector: '$#logo',
            property: 'src',
            use: (env) => `${env.STATIC_URL}/images/logo.svg`,
          },
          {
            selector: '$#share img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/share.svg`;
            },
          },
          {
            selector: '$#zoom-in img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/zoom-in.svg`;
            },
          },
          {
            selector: '$#zoom-out img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/zoom-out.svg`;
            },
          },
          {
            selector: '$#help img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/help.svg`;
            },
          },
          {
            selector: '$#clear img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/remove.svg`;
            },
          },
          {
            selector: '$.addnote img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/add.svg`;
            },
          },
          {
            selector: '$.action-info .close img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/close.svg`;
            },
          },
          {
            selector: '$#help-info h2 img',
            property: 'src',
            use: (env) => {
              return `${env.STATIC_URL}/images/logo.svg`;
            },
          },
          {
            selector: '$clip-note',
            property: 'env',
          },
          {
            selector: '$clip-user',
            property: 'env',
          },
        ],
      },
      owner: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      user: {
        type: Object,
        initial: null,
        targets: [
          {
            selector: '$#user',
            dom: (el, user) => {
              for (const key of Object.keys(user)) {
                el[key] = user[key];
              }
            },
          },
        ],
        triggers: ['board'],
      },
      board: {
        type: Object,
        initial: null,
        targets: [
          {
            selector: '$#qr',
            property: 'src',
            use: (board) =>
              `https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=${encodeURIComponent(
                `${window.location.origin}/board/${board._id}`
              )}`,
          },
          {
            selector: '$#sharing a',
            property: 'href',
            use: (board) => `${window.location.origin}/board/${board._id}`,
          },
          {
            selector: '$#boardname',
            use: (board) => board.name,
            text: true,
          },
          {
            selector: '$#boardname',
            use: (board, self) =>
              self.user._id === board.userId ? `/board/edit/${board._id}` : '',
            property: 'href',
          },
          {
            selector: 'self',
            use: (board, self) => board.userId === self.user._id,
            property: 'owner',
          },
          {
            selector: '$#user',
            use: (board, self) => board.userId === self.user._id,
            property: 'owner',
          },
        ],
        triggers: ['users'],
      },
      size: {
        type: Object,
        initial: {
          width: 0,
          height: 0,
        },
        targets: [
          {
            selector: '$clip-minimap',
            property: 'size',
          },
        ],
      },
      position: {
        type: Object,
        initial: {
          top: 0,
          left: 0,
        },
        targets: [
          {
            selector: '$clip-minimap',
            property: 'position',
          },
          {
            selector: 'self',
            dom: (self, position) => {
              self.scrollLeft = position.left;
              self.scrollTop = position.top;
            },
          },
        ],
      },
      scale: {
        type: Number,
        initial: 1,
        reflect: true,
        triggers: ['notes'],
        targets: [
          {
            selector: '$#board',
            dom: (el, scale, self) => {
              el.style.transform = `scale(${scale})`;
              el.style.marginBottom = `-${canvasSize - canvasSize * scale}px`;
            },
          },
          {
            selector: '$clip-minimap',
            property: 'scale',
          },
        ],
      },
      users: {
        type: Array,
        initial: [],
        targets: [
          {
            selector: '$#users',
            dom: (container, users, self) => {
              return repeat({
                container,
                items: users.filter((user) => user._id !== self.user._id),
                keyFn: (user) => user._id,
                html: html`<clip-user></clip-user>`,
                targets: [
                  {
                    selector: 'self',
                    dom: (el, user) => {
                      for (const key of Object.keys(user)) {
                        el[key] = user[key];
                      }

                      el.owner = user._id === self.board.userId;
                      el.env = self.env;
                    },
                  },
                ],
              });
            },
          },
        ],
      },
      notes: {
        type: Array,
        initial: [],
        targets: [
          {
            selector: '$#notes',
            dom: (container, notes, self) => {
              return repeat({
                container,
                items: notes,
                keyFn: (note) => note._id,
                html: html`<clip-note></clip-note>`,
                init: (el) => {
                  el.zIndex = self.maxZIndex;
                  self.maxZIndex++;
                },
                targets: [
                  {
                    selector: 'self',
                    dom: (el, note) => {
                      note.scale = self.scale;

                      note.disabled =
                        self.user._id !== note.userId &&
                        self.user._id !== self.board.userId;

                      note.other = self.user._id !== note.userId;
                      note.env = self.env;

                      for (const key of Object.keys(note)) {
                        el[key] = note[key];
                      }
                    },
                  },
                ],
              });
            },
          },
          {
            selector: '$clip-minimap',
            property: 'items',
          },
        ],
      },
      maxZIndex: {
        type: Number,
        initial: 0,
        targets: [
          {
            selector: '$clip-note',
            property: 'maxZIndex',
          },
        ],
      },
      showShare: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      showHelp: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
    };
  }

  get events() {
    return {
      '$.addnote': {
        click: this.onAddNote,
      },
      '$.zoom': {
        click: this.onZoom,
      },
      '$#clear': {
        click: this.onClear,
      },
      '$#share': {
        click: this.onShare,
      },
      '$#help': {
        click: this.onHelp,
      },
      '$.action-info .close': {
        click: () => {
          this.showShare = false;
          this.showHelp = false;
        },
      },
      self: {
        scroll: this.onScroll,
        'clip-note-save': this.onNoteSave,
        'clip-note-remove': this.onNoteRemove,
        'clip-updateposition': this.onUpdatePosition,
        'clip-note-zindex': this.onNoteZIndex,
      },
    };
  }

  constructor() {
    super();

    this._socket = null;
    this._throttlePeriod = 200;

    this._noteTimers = {};
    this._resizeTimer = null;
    this._positionTimer = null;
    this._zIndexTimer = null;
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener(
      'visibilitychange',
      this.onVisibilityChange.bind(this)
    );

    window.addEventListener('focus', this.onFocus.bind(this));

    this.getWindowSize();

    window.addEventListener('resize', this.onResize.bind(this));
  }

  getWindowSize() {
    this.size = {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0,
    };
  }

  onResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      this.getWindowSize();
    }, 200);
  }

  onScroll() {
    this.position = {
      left: this.scrollLeft,
      top: this.scrollTop,
    };
  }

  async firstUpdated() {
    this.initSocket();

    try {
      const { position, scale } = JSON.parse(
        localStorage.getItem(`board:${this.board._id}:position`)
      );

      if (!position) {
        throw Error();
      }

      this.scale = scale || 1;
      await this.requestUpdate();
      this.position = position;
    } catch (error) {
      this.position = {
        left: (canvasSize * this.scale - this.size.width) / 2,
        top: (canvasSize * this.scale - this.size.height) / 2,
      };
      this.scale = 1;
    }

    try {
      const orders = JSON.parse(
        localStorage.getItem(`board:${this.board._id}:orders`)
      );

      if (!orders) {
        throw Error();
      }

      if (orders.length) {
        for (const [index, order] of Object.entries(
          orders.sort((a, b) => a.zIndex - b.zIndex)
        )) {
          const el = this.shadowRoot.querySelector(
            `clip-note[_id="${order._id}"]`
          );
          if (el) {
            el.zIndex = index;
          }
        }

        this.maxZIndex = orders.length - 1;
      }
    } catch (error) {}

    if (!localStorage.getItem(`conobo-helpshown`)) {
      this.showHelp = true;
      localStorage.setItem(`conobo-helpshown`, 'true');
    }
  }

  updated(updated) {
    if (updated.has('position')) {
      clearTimeout(this._positionTimer);

      const minLeftPosition = 0;
      const minTopPosition = 0;
      const maxLeftPosition = canvasSize * this.scale - this.size.width;
      const maxTopPosition = canvasSize * this.scale - this.size.height;

      let adjusted = false;

      if (this.position.left < minLeftPosition) {
        this.position.left = minLeftPosition;
        adjusted = true;
      }

      if (this.position.top < minTopPosition) {
        this.position.top = minTopPosition;
        adjusted = true;
      }

      if (this.position.left > maxLeftPosition) {
        this.position.left = maxLeftPosition;
        adjusted = true;
      }

      if (this.position.top > maxTopPosition) {
        this.position.top = maxTopPosition;
        adjusted = true;
      }

      if (adjusted) {
        this.position = {
          ...this.position,
        };
      } else {
        this._positionTimer = setTimeout(() => {
          localStorage.setItem(
            `board:${this.board._id}:position`,
            JSON.stringify({ position: this.position, scale: this.scale })
          );
        }, 1000);
      }
    }

    if (updated.has('scale')) {
      const oldScale = updated.get('scale');
      const scaleDiff = 1 / this.scale - 1 / oldScale;

      const scaleOrigin = {
        left: (this.position.left + this.size.width / 2) * this.scale,
        top: (this.position.top + this.size.height / 2) * this.scale,
      };

      this.position = {
        left: this.position.left - (scaleDiff * this.size.width) / 2,
        top: this.position.top - (scaleDiff * this.size.height) / 2,
      };

      this.position.left +=
        (this.size.width / 2 - scaleOrigin.left) * scaleDiff;
      this.position.top += (this.size.height / 2 - scaleOrigin.top) * scaleDiff;

      clearTimeout(this._positionTimer);
      this._positionTimer = setTimeout(() => {
        localStorage.setItem(
          `board:${this.board._id}:position`,
          JSON.stringify({ position: this.position, scale: this.scale })
        );
      }, 1000);
    }

    if (updated.has('maxZIndex')) {
      if (this.maxZIndex > 0) {
        clearTimeout(this._zIndexTimer);
        this._zIndexTimer = setTimeout(() => {
          const orders = [];
          for (const note of this.shadowRoot.querySelectorAll('clip-note')) {
            orders.push({ _id: note._id, zIndex: note.zIndex });
          }

          localStorage.setItem(
            `board:${this.board._id}:orders`,
            JSON.stringify(orders)
          );
        }, 1000);
      }
    }
  }

  initSocket() {
    const url = new URL(window.location);
    url.protocol = url.protocol === 'https:' ? 'wss' : 'ws';
    url.pathname = `/ws/board/${this.board._id}`;

    this._socket = new WebSocket(url);

    this._socket.addEventListener('open', () => {
      console.log('Opened websocket');
    });

    this._socket.addEventListener('message', ({ data }) => {
      const { type, action, payload } = JSON.parse(data);

      if (type !== 'BOARD') {
        return;
      }

      switch (action) {
        case 'NOTE:LIST':
          return this.receiveNoteList(payload);
        case 'NOTE:SAVE':
          return this.receiveNoteSave(payload);
        case 'NOTE:REMOVE':
          return this.receiveNoteRemove(payload);
        case 'USER:ENTER':
          return this.receiveUserEnter(payload);
        case 'USER:LEAVE':
          return this.receiveUserLeave(payload);
        case 'USER:LIST':
          return this.receiveUserList(payload);
      }
    });

    this._socket.addEventListener('close', () => {
      this._socket = null;
      console.log('Closed websocket');
    });
  }

  receiveUserEnter(user) {
    const index = this.users.findIndex(
      (existingUser) => existingUser._id === user._id
    );
    if (index === -1) {
      this.users.push(user);
      this.users = this.users.slice();
    }
  }

  receiveUserLeave(user) {
    const index = this.users.findIndex(
      (existingUser) => existingUser._id === user._id
    );
    if (index > -1) {
      this.users.splice(index, 1);
      this.users = this.users.slice();
    }
  }

  receiveUserList(users) {
    this.users = users;
  }

  receiveNoteList(notes) {
    this.notes = notes;
  }

  receiveNoteSave(note) {
    const index = this.notes.findIndex(
      (existingNote) => existingNote._id === note._id
    );
    if (index > -1) {
      this.notes.splice(index, 1, note);
    } else {
      this.notes.push(note);
    }

    this.notes = this.notes.slice();
  }

  receiveNoteRemove(_id) {
    const index = this.notes.findIndex(
      (existingNote) => existingNote._id === _id
    );

    if (index > -1) {
      this.notes.splice(index, 1);
      this.notes = this.notes.slice();
    }
  }

  onAddNote(event) {
    const color = event.currentTarget.dataset.color || '';

    const size = {
      width: 300,
      height: 300,
    };

    const centreTopLeft = {
      width: (this.size.width / 2 - size.width / 2) / this.scale,
      height: (this.size.height / 2 - size.height / 2) / this.scale,
    };

    const position = {
      x: this.position.left / this.scale + centreTopLeft.width,
      y: this.position.top / this.scale + centreTopLeft.height,
    };

    // bit of randomness
    position.x +=
      Math.floor(Math.random() * (centreTopLeft.width - 30)) *
      (Math.round(Math.random()) === 0 ? 1 : -1);

    position.y +=
      Math.floor(Math.random() * (centreTopLeft.height - 30)) *
      (Math.round(Math.random()) === 0 ? 1 : -1);

    const note = {
      _id: `${Date.now()}:${this.user._id}`,
      boardId: this.board._id,
      userId: this.user._id,
      username: this.user.username,
      content: '',
      size,
      position,
      color,
    };

    this.notes.push(note);
    this.notes = this.notes.slice();

    this.transmitSaveNote(note);
  }

  onZoom() {
    if (this.scale === 1) {
      this.scale = 0.5;
    } else {
      this.scale = 1;
    }
  }

  onClear() {
    this.transmitClearBoard();
  }

  transmitSaveNote(note) {
    clearTimeout(this._noteTimers[note._id]);

    this._noteTimers[note._id] = setTimeout(() => {
      this._socket.send(
        JSON.stringify({
          type: 'BOARD',
          action: `NOTE:SAVE`,
          payload: { boardId: this.board._id, userId: this.user._id, note },
        })
      );
    }, this._throttlePeriod);
  }

  transmitRemoveNote(_id) {
    this._socket.send(
      JSON.stringify({
        type: 'BOARD',
        action: `NOTE:REMOVE`,
        payload: { _id },
      })
    );
  }

  transmitClearBoard() {
    this._socket.send(
      JSON.stringify({
        type: 'BOARD',
        action: `BOARD:CLEAR`,
      })
    );
  }

  onNoteSave(event) {
    const { _id, ...data } = event.detail;

    this.saveNote(_id, data);
  }

  saveNote(_id, data) {
    const note = this.notes.find((existingNote) => existingNote._id === _id);

    if (note) {
      Object.assign(note, data);
      this.notes = this.notes.slice();

      this.transmitSaveNote(note);
    }
  }

  onNoteRemove(event) {
    const { _id } = event.detail;

    this.removeNote(_id);
  }

  removeNote(_id) {
    const noteIndex = this.notes.findIndex(
      (existingNote) => existingNote._id === _id
    );

    if (noteIndex > -1) {
      this.notes.splice(noteIndex, 1);
      this.notes = this.notes.slice();

      this.transmitRemoveNote(_id);
    }
  }

  onVisibilityChange() {
    if (document.visibilityState === 'visible') {
      if (!this._socket) {
        this.initSocket();
      }
    }
  }

  onFocus() {
    if (!this._socket) {
      this.initSocket();
    }
  }

  onUpdatePosition(event) {
    const { position } = event.detail;

    this.position = position;
  }

  onNoteZIndex(event) {
    const { zIndex } = event.detail;
    this.maxZIndex = zIndex;
  }

  onShare() {
    this.showShare = !this.showShare;
    this.showHelp = false;
  }

  onHelp() {
    this.showHelp = !this.showHelp;
    this.showShare = false;
  }
}

customElements.define('clip-board', Board);
