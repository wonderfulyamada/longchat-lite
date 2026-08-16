# LongChat Lite

Current version: v0.3.0

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

## How it works

### Hide older conversation turns

LongChat Lite hides older conversation turns in very long chats. The **Keep** setting lets you keep the latest `5 / 10 / 20 / 30 / 40 / 60` turns visible.

This does not delete or modify any conversation data stored by ChatGPT. It only changes which turns are displayed in your browser.

### Reduce off-screen rendering

LongChat Lite applies `content-visibility` to the turns that remain visible. This allows the browser to reduce layout and paint work for content outside the viewport.

### Safe Switch

ChatGPT normally switches between chats using SPA navigation. Switching between very long conversations this way can temporarily cause high browser load.

Safe Switch intercepts conversation-link clicks and uses a regular full-page navigation instead. This lets the browser discard the current page before loading the next chat, reducing peak load during the switch. Page transitions may feel slightly slower, but Safe Switch prioritizes reducing freezes on heavily loaded systems.

### Initial-load rendering shield

The content script runs at `document_start`. While a long conversation is loading, LongChat Lite temporarily suppresses rendering of the conversation body, applies the **Keep** limit, and then reveals it. This is intended to reduce the cost of rendering the full history once before hiding older turns.

### Lightweight background checking

LongChat Lite does not use `MutationObserver`. It performs only a lightweight turn-count check every three seconds, and does no additional processing when the number of turns has not changed.

This approach replaced the continuous DOM monitoring used in the v0.1 series, after that monitoring itself was found to add load.

## Settings

- **ON / OFF** enables or disables conversation-turn hiding.
- **Keep** selects how many recent turns remain visible. **Keep 5** or **Keep 10** is recommended for especially long chats.
- **Safe Switch** enables or disables full-page navigation when opening another conversation.
- **Apply** immediately reapplies the current settings to the conversation.

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
