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

## Behavior details

- The panel stays on the right side and does not auto-close when you click inside it.
- Default mode is not pick-up-all; played audio is captured automatically.
- **Pick up all** mode scans for audio every 2.5 seconds while the panel is open.
- **Refresh now** manually scans once.
- **Clear list** removes all currently captured entries in the panel.

## Notes

- Instagram changes its UI and media URLs often. If a specific message format is not discovered, use **Pick up all** and **Refresh now** while playback is active.
- Downloading messages should only be done for accounts and conversations where you have clear permission.
