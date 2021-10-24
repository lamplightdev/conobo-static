import Wafer from 'https://unpkg.com/@lamplightdev/wafer@1.0.14/lib/wafer.js';

import { html } from './util.js';

class User extends Wafer {
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
          display: flex;
          align-items: center;
          --size: 3rem;
        }

        #name-container {
          margin-right: 0.5rem;
        }

        #username,
        #owner {
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          background-color: var(--username-bg, rgba(255, 255, 255, 0.8));
          backdrop-filter: blur(5px);
        }

        #username {
          font-size: 0.8rem;
          text-align: right;

          max-width: 8rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        :host([owner]) #username {
          border-bottom-right-radius: 0;
          border-bottom-left-radius: 0;
        }

        #owner {
          text-align: right;
          text-transform: uppercase;
          font-size: 0.5rem;
          padding-top: 0;
          border-top-right-radius: 0;
          border-top-left-radius: 0;
        }

        :host(:not([owner])) #owner {
          display: none;
        }

        :host(:hover) #username {
          max-width: 20rem;
        }

        #avatar {
          position: relative;
          background-color: white;
          height: var(--size);
          width: var(--size);
          border-radius: var(--size);
          overflow: hidden;
        }

        #avatar img {
          height: var(--size);
          width: var(--size);
        }
      </style>

      <div id="name-container">
        <div id="username"></div>
        <div id="owner">Owner</div>
      </div>
      <div id="avatar">
        <img alt="" />
      </div>
    `;
  }

  static get props() {
    return {
      env: {
        type: Object,
        initial: {},
        triggers: ['avatar'],
      },
      _id: {
        type: String,
        initial: null,
      },
      username: {
        type: String,
        initial: null,
        targets: [
          {
            selector: '$#username',
            text: true,
          },
        ],
      },
      owner: {
        type: Boolean,
        initial: false,
        reflect: true,
      },
      avatar: {
        type: String,
        initial: null,
        targets: [
          {
            selector: '$#avatar img',
            property: 'src',
            use: (avatar, self) =>
              avatar || `${self.env.STATIC_URL}/images/icon.svg`,
          },
        ],
      },
      hideName: {
        type: Boolean,
        initial: false,
        targets: [
          {
            selector: '$#username',
            property: 'hidden',
          },
        ],
      },
    };
  }
}

customElements.define('clip-user', User);
