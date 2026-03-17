# Instagram Voice Collector (Chrome Extension)

This extension adds a fixed right-side panel on Instagram Web so you can:

- Detect voice-message audio URLs from chat.
- Keep a running list of captured audio files.
- Preview audio with a **Play** button.
- Download single recordings.
- Enable **Pick up all** mode to scan and collect audio every 2.5 seconds.

## Install (Developer Mode)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `instagram-voice-extension` folder.
5. Open Instagram Web chat and click the extension icon to toggle the side panel.

## How to use

1. Open Instagram DM in browser.
2. Click the extension icon once to open the panel.
3. Play a voice message in chat.
4. The panel captures that audio URL and shows it in the list.
5. Click **Play** in panel to preview.
6. Click **Download** to save.

## Pick up all mode

- Turn on **Pick up all** in the panel.
- While panel is open, extension rescans every 2.5 seconds.
- Use **Refresh now** if you need instant scan.

## Troubleshooting (if extension not working)

1. Go to `chrome://extensions` and click **Reload** on this extension.
2. Re-open Instagram tab and refresh (`Ctrl/Cmd + R`).
3. Open extension panel and turn on **Pick up all**.
4. Play voice message once in chat and wait 2–3 seconds.
5. If still empty, click **Refresh now** while audio is playing.
6. Open extension **Service worker** logs from `chrome://extensions` and check errors.

## Behavior details

- The panel stays on the right side and does not auto-close when you click inside it.
- Default mode is not pick-up-all; played audio is captured automatically.
- **Pick up all** mode scans for audio every 2.5 seconds while the panel is open.
- **Refresh now** manually scans once.
- **Clear list** removes all currently captured entries in the panel.

## Notes

- Instagram changes its UI and media URLs often. If a specific message format is not discovered, use **Pick up all** and **Refresh now** while playback is active.
- Downloading messages should only be done for accounts and conversations where you have clear permission.
