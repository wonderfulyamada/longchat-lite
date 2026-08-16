# LongChat Lite v0.3.0

LongChat Lite is an unofficial Chrome extension that reduces rendering load in very long ChatGPT conversations.

This version moves away from Tampermonkey and runs as a Chrome Manifest V3 extension.

## Why the extension version?

The userscript version worked well during normal use, but hard navigation between very large conversations required the script to be injected again after every page load.

v0.3.0 uses a Chrome content script with `run_at: document_start`, so LongChat Lite is injected by Chrome itself on each ChatGPT page load.

## Features

- Hide older conversation turns
- Keep only the latest 5 / 10 / 20 / 30 / 40 / 60 turns visible
- `content-visibility` for visible turns
- Safe Switch mode
  - intercepts conversation-link clicks
  - avoids ChatGPT's heavy SPA conversation swap
  - uses a full page navigation instead
- Initial-load rendering shield
- No MutationObserver
- Low-cost 3-second turn-count check
- Persistent settings with `chrome.storage.local`

## Install

1. Extract the ZIP.
2. Open Chrome.
3. Go to `chrome://extensions/`.
4. Turn on **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted `longchat-lite-extension-v0.3.0` folder.
7. Disable the old Tampermonkey LongChat Lite script to avoid running both versions at once.
8. Reload `https://chatgpt.com/`.

The bottom-right panel should show:

`LONGCHAT LITE | ON | Keep 10 | Safe ON`

## Notes

This is an unofficial project and is not affiliated with or endorsed by OpenAI.

ChatGPT is a trademark of OpenAI.

LongChat Lite does not delete conversation data. It only changes how much of the conversation is rendered in the browser.

ChatGPT's UI can change at any time, which may break this extension.

## Development history

- v0.2.0: Tampermonkey userscript version.
- v0.3.0: Migrated from Tampermonkey to a Chrome Manifest V3 extension.

## License

MIT License. See `LICENSE`.
