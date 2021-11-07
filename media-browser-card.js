import { css, html, LitElement } from "https://unpkg.com/lit-element@3.0.1/lit-element.js?module";

const folderIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
`;
const fileIcon = html`
  <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
`;

async function browseMedia(hass, mediaContentId) {
  return hass.callWS({
    type: "media_source/browse_media",
    media_content_id: mediaContentId
  });
}

async function playMedia(hass, config, item) {
  return hass.callService("media_player", "play_media", {
    entity_id: config.player,
    media_content_id: item.media_content_id,
    media_content_type: item.media_content_type
  });
}

function isDirectory(item) {
  return item.media_class === "directory";
}

let clientData;

function loadClientData() {
  const clientDataJson = localStorage.getItem("homeassistant.mediabrowsercard");

  if (clientDataJson) {
    clientData = JSON.parse(clientDataJson);
  }

  clientData = Object.assign({}, {
    playedItemIds: [],
    currentPath: []
  }, clientData);
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
      _currentPath: { state: true }
    };
  }

  static get styles() {
    return css`
      /* Apply Spectre.css root style on host */
      :host {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        line-height: 1.5;
        -webkit-tap-highlight-color: transparent;
        background: #fff;
        color: #3b4351;
        font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
        font-size: .8rem;
        overflow-x: hidden;
        text-rendering: optimizeLegibility; 
      }

      .card-header {
        display: flex;
        justify-content: space-between;
      }
      
      .card-body {
        overflow-x: hidden;
        overflow-y: auto;
      }
      
      .truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .table {
        table-layout: fixed;
        width: 100%;
      }
      
      .table tr {
        cursor: default;
      }
      
      .file {
        display: flex;
        align-items: center;
      }

      .file .icon {
        width: 24px;
        height: 24px;
        flex: 0 0 auto;
      }
      
      .file span {
        margin-left: 4px;
        flex: 1 1 0;
      }
        `;
  }

  constructor() {
    super();
    this._currentPath = clientData.currentPath;
  }

  firstUpdated() {
    this.loadCurrentDirectory();
  }

  updated(changedProps) {
    super.updated(changedProps);

    if (changedProps.has("hass")) {
      const playerState = this.hass ? this.hass.states[this.config.player] : null;
      this._currentPlayingItemId = playerState ? decodeURI(playerState.attributes.media_content_id) : null;
    }
  }

  getCardSize() {
    return 3;
  }

  setConfig(config) {
    if (!config.player) {
      throw new Error("You need to define a media player entity");
    }
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

  async loadCurrentDirectory() {
    const directoryId = this._currentPath[this._currentPath.length - 1] || undefined;
    this._currentDirectoryItem = await browseMedia(this.hass, directoryId);
  }

  async playItem(item) {
    await playMedia(this.hass, this.config, item);
    if (!clientData.playedItemIds.includes(item.media_content_id)) {
      updateClientData({
        playedItemIds: [...clientData.playedItemIds, item.media_content_id]
      });
    }
  }

  render() {
    const children = (this._currentDirectoryItem && this._currentDirectoryItem.children) || [];
    const hasChildren = children.length > 0;

    return html`
      <link rel="stylesheet" href="https://unpkg.com/spectre.css/dist/spectre.min.css">
      <div class="card">
        <div class="card-header">
          <h5 class="card-title">Media Browser</h5>
          ${
            this._currentPath.length > 0 ? html`
              <button class="btn btn-sm" @click="${this.back}">Back</button>
            ` : null
          }
        </div>
        <div class="card-body">
          ${hasChildren ? this.renderFileList(children) : this.renderEmptyHint()}
        </div>
      </div>
    `;
  }

  renderEmptyHint() {
    return html`
      <div>No files found.</div>
    `;
  }

  renderFileList(items) {
    const rows = items.map(item => {
      const icon = isDirectory(item) ? folderIcon : fileIcon;
      const isPlaying = !isDirectory(item)
        && this._currentPlayingItemId
        && (this._currentPlayingItemId === item.media_content_id || this._currentPlayingItemId.indexOf(item.title) >= 0);
      const hasBeenPlayed = clientData.playedItemIds.includes(item.media_content_id);
      const itemClass = isPlaying ? "text-primary" : hasBeenPlayed ? "text-gray" : "";

      return html`
        <tr class="${itemClass}">
          <td class="file" @click="${() => this.select(item)}">
            ${icon}
            <span class="truncate">
              ${item.title}
            </span>
          </td>
        </tr>
      `;
    });

    return html`
      <table class="table table-striped table-hover">
        <tbody>
        ${rows}
        </tbody>
      </table>`;
  }
}

customElements.define("media-browser-card", MediaBrowserCard);