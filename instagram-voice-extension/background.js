chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "togglePanel" });
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
