async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"]
    });
  } catch (error) {
    // Content script may already be present or page may block execution.
  }
}

async function togglePanelOnTab(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { type: "togglePanel" });
  } catch (error) {
    await ensureContentScript(tabId);
    await chrome.tabs.sendMessage(tabId, { type: "togglePanel" });
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  await togglePanelOnTab(tab.id);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "downloadAudio") {
    return;
  }

  chrome.downloads.download(
    {
      url: message.url,
      filename: message.filename,
      saveAs: true
    },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({
          ok: false,
          error: chrome.runtime.lastError.message
        });
        return;
      }

      sendResponse({ ok: true, downloadId });
    }
  );

  return true;
});
