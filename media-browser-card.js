import {
  css,
  html,
  LitElement,
} from "https://unpkg.com/lit-element@3.0.1/lit-element.js?module";

const folderIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
`;
const fileIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    class="icon w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
    />
  </svg>
`;
const menuIcon = html`
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon w-5 h-5"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M19 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
  </svg>
`;

const BROWSER_PLAYER = {
  entity_id: "browser",
  attributes: {
    friendly_name: "Browser",
  },
};

function getMediaPlayers(hass) {
  const filteredPlayers = Object.values(hass.states).filter(
    (entity) =>
      entity.entity_id.match(/^media_player\./) &&
      (entity.attributes.supported_features & 131072) !== 0
  );

  return [BROWSER_PLAYER, ...filteredPlayers];
}

async function browseMedia(hass, mediaContentId) {
  return hass.callWS({
    type: "media_source/browse_media",
    media_content_id: mediaContentId,
  });
}

async function playMedia(hass, entity_id, item) {
  return hass.callService("media_player", "play_media", {
    entity_id,
    media_content_id: item.media_content_id,
    media_content_type: item.media_content_type,
  });
}

async function playMediaInBrowser(hass, item) {
  const resolvedUrl = await hass.callWS({
    type: "media_source/resolve_media",
    media_content_id: item.media_content_id,
  });

  // Ideally we would like to open a dialog, as is done here: https://github.com/home-assistant/frontend/blob/c26a59d8059497104ed52ad44b17146547f0173c/src/panels/media-browser/ha-panel-media-browser.ts#L96
  // For now just open a new tab
  window.open(resolvedUrl.url, "_blank");
}

function isDirectory(item) {
  return ["directory", "app"].includes(item.media_class);
}

let clientData;

function loadClientData() {
  const clientDataJson = localStorage.getItem("homeassistant.mediabrowsercard");

  if (clientDataJson) {
    clientData = JSON.parse(clientDataJson);
  }

  clientData = Object.assign(
    {},
    {
      playedItemIds: [],
      currentPath: [],
    },
    clientData
  );
}

loadClientData();

function updateClientData(changes) {
  clientData = Object.assign({}, clientData, changes);
  const clientDataJson = JSON.stringify(clientData);

  localStorage.setItem("homeassistant.mediabrowsercard", clientDataJson);
}

class MediaBrowserCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      _currentDirectoryItem: { state: true },
      _currentPlayingItemId: { state: true },
      _currentPath: { state: true },
      _availablePlayers: { state: true },
      _selectedPlayer: { state: true },
      _menuOpened: { state: true },
    };
  }

  static get styles() {
    return css`
      @tailwind base;
      @tailwind components;
      @tailwind utilities;

      :host {
        display: block;
        height: var(--media-card-height, 500px);
      }
    `;
  }

  constructor() {
    super();
    this._currentPath = clientData.currentPath;
    this._availablePlayers = [];
    this._menuOpened = false;
  }

  firstUpdated() {
    this.loadCurrentDirectory();
  }

  updated(changedProps) {
    super.updated(changedProps);

    if (changedProps.has("hass")) {
      // Update available media players
      this._availablePlayers = this.hass ? getMediaPlayers(this.hass) : [];
      const isSelectedPlayerAvailable = this._selectedPlayer
        ? this._availablePlayers.some(
            (player) => player.entity_id === this._selectedPlayer.entity_id
          )
        : false;
      if (!isSelectedPlayerAvailable) {
        const newPlayer =
          this._availablePlayers.find(
            (player) => player.entity_id === clientData.selectedPlayerId
          ) || this._availablePlayers[0];
        this.selectPlayer(newPlayer);
      }

      // Update currently played items
      const playerState =
        this.hass && this._selectedPlayer
          ? this.hass.states[this._selectedPlayer.entity_id]
          : null;
      this._currentPlayingItemId = playerState
        ? decodeURI(playerState.attributes.media_content_id)
        : null;
    }
  }

  getCardSize() {
    return 3;
  }

  setConfig(config) {
    this.config = config;
  }

  select(item) {
    if (isDirectory(item)) {
      this._currentPath.push(item.media_content_id);
      updateClientData({ currentPath: this._currentPath });
      this.loadCurrentDirectory();
    } else {
      this.playItem(item);
    }
  }

  back() {
    if (this._currentPath.length <= 0) return;

    this._currentPath.pop();
    updateClientData({ currentPath: this._currentPath });
    this.loadCurrentDirectory();
  }

  selectPlayer(player) {
    this._selectedPlayer = player;
    updateClientData({
      selectedPlayerId: player ? player.entity_id : undefined,
    });
  }

  async loadCurrentDirectory() {
    const directoryId =
      this._currentPath[this._currentPath.length - 1] || undefined;
    this._currentDirectoryItem = await browseMedia(this.hass, directoryId);
  }

  async playItem(item) {
    if (!this._selectedPlayer) return;

    if (this._selectedPlayer.entity_id === BROWSER_PLAYER.entity_id) {
      await playMediaInBrowser(this.hass, item);
    } else {
      await playMedia(this.hass, this._selectedPlayer.entity_id, item);
    }

    if (!clientData.playedItemIds.includes(item.media_content_id)) {
      updateClientData({
        playedItemIds: [...clientData.playedItemIds, item.media_content_id],
      });
    }
  }

  openMenu() {
    this._menuOpened = true;

    setTimeout(() => {
      document.addEventListener("click", this.closeMenu.bind(this), {
        once: true,
      });
    });
  }

  closeMenu() {
    this._menuOpened = false;
  }

  jumpToLastPlayed() {
    const fileRows = this.shadowRoot.querySelectorAll("tr");
    const lastPlayed = Array.from(fileRows)
      .reverse()
      .find((row) => clientData.playedItemIds.includes(row.dataset.contentId));

    if (lastPlayed) {
      lastPlayed.scrollIntoView();
    }
  }

  clearPlayedItems() {
    updateClientData({
      playedItemIds: [],
    });
  }

  render() {
    const children =
      (this._currentDirectoryItem && this._currentDirectoryItem.children) || [];
    const hasChildren = children.length > 0;

    return html`
      <div
        class="h-full flex flex-col divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow dark:bg-gray-800 dark:divide-gray-700"
      >
        <div class="flex flex-col p-4 gap-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium">Media Browser</h3>
            <div>${this.renderPlayerSelect()}</div>
          </div>
          ${this._currentPath.length > 0
            ? html`
                <div class="flex justify-between">
                  <button
                    type="button"
                    class="rounded bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-500 dark:hover:bg-gray-600"
                    @click="${this.back}"
                  >
                    Back
                  </button>
                  ${this.renderMenu()}
                </div>
              `
            : null}
        </div>
        <div class="flex-1 overflow-y-auto">
          ${hasChildren
            ? this.renderFileList(children)
            : this.renderEmptyHint()}
        </div>
      </div>
    `;
  }

  renderPlayerSelect() {
    if (!this._availablePlayers.length) return null;

    const selectedPlayerId = this._selectedPlayer
      ? this._selectedPlayer.entity_id
      : null;
    const options = this._availablePlayers.map((player) => {
      const displayName = player.attributes.friendly_name || player.entity_id;
      return html`
        <option
          value="${player.entity_id}"
          ?selected="${player.entity_id === selectedPlayerId}"
        >
          ${displayName}
        </option>
      `;
    });

    return html`
      <select
        class="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-500"
        @change="${(event) =>
          this.selectPlayer(
            this._availablePlayers.find(
              (player) => player.entity_id === event.target.value
            )
          )}"
      >
        ${options}
      </select>
    `;
  }

  renderMenu() {
    return html`
      <div class="relative inline-block text-left">
        <div>
          <button
            type="button"
            class="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-2 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:ring-gray-500 dark:hover:bg-gray-600"
            id="menu-button"
            aria-expanded="true"
            aria-haspopup="true"
            @click="${this.openMenu}"
          >
            ${menuIcon}
          </button>
        </div>

        ${this._menuOpened
          ? html`
              <div
                class="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-700 dark:ring-gray-600"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabindex="-1"
              >
                <div class="py-1" role="none">
                  <button
                    class="w-full block text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600"
                    role="menuitem"
                    id="menu-item-0"
                    @click="${this.jumpToLastPlayed}"
                  >
                    Jump to last played
                  </button>
                  <button
                    class="w-full block text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-600"
                    role="menuitem"
                    id="menu-item-0"
                    @click="${this.clearPlayedItems}"
                  >
                    Clear played items
                  </button>
                </div>
              </div>
            `
          : null}
      </div>
    `;
  }

  renderEmptyHint() {
    return html` <div class="p-4">No files found.</div> `;
  }

  renderFileList(items) {
    const rows = items.map((item) => {
      const icon = isDirectory(item) ? folderIcon : fileIcon;
      const isPlaying =
        !isDirectory(item) &&
        this._currentPlayingItemId &&
        (this._currentPlayingItemId === item.media_content_id ||
          this._currentPlayingItemId.indexOf(item.title) >= 0);
      const hasBeenPlayed = clientData.playedItemIds.includes(
        item.media_content_id
      );
      const itemClass = isPlaying
        ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-200 dark:bg-indigo-800 dark:hover:bg-indigo-700"
        : hasBeenPlayed
        ? "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
        : "text-gray-900 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700";

      return html`
        <tr
          class="${itemClass}"
          @click="${() => this.select(item)}"
          data-content-id=${item.media_content_id}
        >
          <td class="pl-4 py-3.5">${icon}</td>
          <td class="w-full px-4 py-3.5 text-left text-sm font-semibold">
            ${item.title}
          </td>
        </tr>
      `;
    });

    return html` <table class="min-w-full">
      <tbody
        class="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700"
      >
        ${rows}
      </tbody>
    </table>`;
  }
}

customElements.define("media-browser-card", MediaBrowserCard);
