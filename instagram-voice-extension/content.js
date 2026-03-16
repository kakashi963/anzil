(() => {
  const PANEL_ID = "ig-voice-collector-panel";
  const REFRESH_MS = 2500;

  const state = {
    panelVisible: false,
    pickupAllEnabled: false,
    records: new Map(),
    activeUrl: null,
    refreshTimer: null,
    initialized: false
  };

  function ensurePanel() {
    if (document.getElementById(PANEL_ID)) {
      return;
    }

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="igvc-header">
        <strong>Voice Collector</strong>
        <button type="button" id="igvc-close">×</button>
      </div>
      <div class="igvc-controls">
        <label>
          <input type="checkbox" id="igvc-pickup-all" /> Pick up all
        </label>
        <button type="button" id="igvc-refresh-now">Refresh now</button>
        <button type="button" id="igvc-clear">Clear list</button>
      </div>
      <div id="igvc-status">Ready</div>
      <ul id="igvc-list"></ul>
    `;

    const style = document.createElement("style");
    style.textContent = `
      #${PANEL_ID} {
        position: fixed;
        top: 76px;
        right: 16px;
        width: 360px;
        max-height: calc(100vh - 96px);
        z-index: 2147483647;
        background: #111;
        border: 1px solid #303030;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
        color: #f6f6f6;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        display: none;
        overflow: hidden;
      }

      #${PANEL_ID}.open {
        display: block;
      }

      #${PANEL_ID} .igvc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 12px;
        background: #1b1b1b;
        border-bottom: 1px solid #303030;
      }

      #${PANEL_ID} .igvc-header button {
        background: transparent;
        color: #fff;
        border: none;
        cursor: pointer;
        font-size: 18px;
      }

      #${PANEL_ID} .igvc-controls,
      #${PANEL_ID} #igvc-status {
        padding: 8px 12px;
        border-bottom: 1px solid #2a2a2a;
      }

      #${PANEL_ID} .igvc-controls {
        display: grid;
        gap: 8px;
        grid-template-columns: 1fr;
      }

      #${PANEL_ID} .igvc-controls button {
        border: 1px solid #424242;
        border-radius: 8px;
        background: #222;
        color: #f6f6f6;
        padding: 8px;
        cursor: pointer;
      }

      #${PANEL_ID} #igvc-list {
        list-style: none;
        margin: 0;
        padding: 8px;
        overflow: auto;
        max-height: calc(100vh - 280px);
      }

      #${PANEL_ID} .igvc-row {
        border: 1px solid #333;
        border-radius: 8px;
        padding: 8px;
        margin-bottom: 8px;
        background: #1a1a1a;
      }

      #${PANEL_ID} .igvc-url {
        display: block;
        margin: 6px 0;
        color: #c2c2c2;
        font-size: 11px;
        line-break: anywhere;
      }

      #${PANEL_ID} .igvc-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      #${PANEL_ID} .igvc-actions button {
        border: 1px solid #4f4f4f;
        border-radius: 6px;
        background: #292929;
        color: #fff;
        padding: 6px 10px;
        cursor: pointer;
      }

      #${PANEL_ID} .igvc-active {
        color: #7dffae;
      }
    `;

    document.documentElement.append(style, panel);

    panel.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    panel.querySelector("#igvc-close")?.addEventListener("click", () => {
      setPanelOpen(false);
    });

    panel.querySelector("#igvc-refresh-now")?.addEventListener("click", () => {
      collectAudioFromPage();
      render();
    });

    panel.querySelector("#igvc-clear")?.addEventListener("click", () => {
      state.records.clear();
      state.activeUrl = null;
      render();
    });

    panel.querySelector("#igvc-pickup-all")?.addEventListener("change", (event) => {
      state.pickupAllEnabled = Boolean(event.target.checked);
      updateStatus(state.pickupAllEnabled ? "Pick up all enabled" : "Pick up all disabled");
      chrome.storage.local.set({ igvcPickupAllEnabled: state.pickupAllEnabled });

      if (state.pickupAllEnabled) {
        collectAudioFromPage();
        render();
      }
    });
  }

  function setPanelOpen(visible) {
    const panel = document.getElementById(PANEL_ID);
    if (!panel) {
      return;
    }

    state.panelVisible = visible;
    panel.classList.toggle("open", visible);
  }

  function updateStatus(message) {
    const status = document.querySelector(`#${PANEL_ID} #igvc-status`);
    if (status) {
      status.textContent = message;
    }
  }

  function filenameForRecord(record) {
    const timePart = new Date(record.capturedAt).toISOString().replace(/[:.]/g, "-");
    return `instagram-voice-${timePart}.m4a`;
  }

  function addRecord(url, source) {
    if (!url || state.records.has(url)) {
      return false;
    }

    state.records.set(url, {
      url,
      source,
      capturedAt: Date.now()
    });
    return true;
  }

  function extractAudioUrls() {
    const urls = new Set();

    document.querySelectorAll("audio").forEach((audio) => {
      if (audio.src) {
        urls.add(audio.src);
      }
      audio.querySelectorAll("source").forEach((source) => {
        if (source.src) {
          urls.add(source.src);
        }
      });
    });

    document.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.href;
      if (/\.(m4a|mp3|ogg|wav)(\?|$)/i.test(href) || href.includes("audio")) {
        urls.add(href);
      }
    });

    return [...urls].filter((url) =>
      url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")
    );
  }

  function collectAudioFromPage() {
    const urls = extractAudioUrls();
    let added = 0;

    urls.forEach((url) => {
      if (addRecord(url, "scan")) {
        added += 1;
      }
    });

    if (added > 0) {
      updateStatus(`Added ${added} audio file(s). Total: ${state.records.size}`);
    } else {
      updateStatus(`No new audio found. Total: ${state.records.size}`);
    }
  }

  async function downloadRecord(record) {
    if (record.url.startsWith("blob:")) {
      const a = document.createElement("a");
      a.href = record.url;
      a.download = filenameForRecord(record);
      document.body.appendChild(a);
      a.click();
      a.remove();
      updateStatus("Started download for blob audio.");
      return;
    }

    chrome.runtime.sendMessage(
      {
        type: "downloadAudio",
        url: record.url,
        filename: filenameForRecord(record)
      },
      (response) => {
        if (!response?.ok) {
          updateStatus(`Download failed: ${response?.error || "unknown error"}`);
          return;
        }

        updateStatus(`Download started (#${response.downloadId}).`);
      }
    );
  }

  function render() {
    const list = document.querySelector(`#${PANEL_ID} #igvc-list`);
    if (!list) {
      return;
    }

    const records = [...state.records.values()].sort((a, b) => b.capturedAt - a.capturedAt);

    list.innerHTML = "";

    if (records.length === 0) {
      const li = document.createElement("li");
      li.className = "igvc-row";
      li.textContent = "No audio captured yet. Play an Instagram voice message or enable Pick up all.";
      list.appendChild(li);
      return;
    }

    records.forEach((record, index) => {
      const li = document.createElement("li");
      li.className = "igvc-row";

      const title = document.createElement("strong");
      title.textContent = `Voice #${records.length - index}`;

      const meta = document.createElement("div");
      const isActive = state.activeUrl === record.url;
      meta.className = isActive ? "igvc-active" : "";
      meta.textContent = `${new Date(record.capturedAt).toLocaleString()} • ${record.source}`;

      const url = document.createElement("code");
      url.className = "igvc-url";
      url.textContent = record.url;

      const actions = document.createElement("div");
      actions.className = "igvc-actions";

      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.textContent = "Play";
      playButton.addEventListener("click", () => {
        state.activeUrl = record.url;
        render();

        const audio = new Audio(record.url);
        audio.play().catch(() => {
          updateStatus("Could not play this audio in panel context.");
        });
      });

      const downloadButton = document.createElement("button");
      downloadButton.type = "button";
      downloadButton.textContent = "Download";
      downloadButton.addEventListener("click", () => {
        downloadRecord(record);
      });

      actions.append(playButton, downloadButton);
      li.append(title, meta, url, actions);
      list.appendChild(li);
    });
  }

  function onDocumentPlay(event) {
    const target = event.target;
    if (!(target instanceof HTMLAudioElement)) {
      return;
    }

    if (target.currentSrc && addRecord(target.currentSrc, "played")) {
      updateStatus(`Captured from playback. Total: ${state.records.size}`);
    }

    state.activeUrl = target.currentSrc || target.src || null;
    render();
  }

  function startRefreshLoop() {
    if (state.refreshTimer) {
      clearInterval(state.refreshTimer);
    }

    state.refreshTimer = setInterval(() => {
      if (!state.panelVisible) {
        return;
      }

      if (state.pickupAllEnabled) {
        collectAudioFromPage();
        render();
      }
    }, REFRESH_MS);
  }

  function initialize() {
    if (state.initialized) {
      return;
    }

    state.initialized = true;
    ensurePanel();

    chrome.storage.local.get(["igvcPickupAllEnabled"], (result) => {
      state.pickupAllEnabled = Boolean(result.igvcPickupAllEnabled);
      const checkbox = document.querySelector(`#${PANEL_ID} #igvc-pickup-all`);
      if (checkbox) {
        checkbox.checked = state.pickupAllEnabled;
      }
      updateStatus(state.pickupAllEnabled ? "Pick up all enabled" : "Ready");
    });

    document.addEventListener("play", onDocumentPlay, true);
    startRefreshLoop();
    render();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "togglePanel") {
      return;
    }

    initialize();
    setPanelOpen(!state.panelVisible);

    if (state.panelVisible && state.pickupAllEnabled) {
      collectAudioFromPage();
      render();
    }
  });

  initialize();
})();
