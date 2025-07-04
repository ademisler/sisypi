# Sisypi Chrome Extension

Sisypi is a lightweight Chrome extension for recording and replaying
repetitive browser actions. All data is stored locally in the browser
for maximum privacy.

## Development

The source for the extension lives in the `extension/` folder. Load the
unpacked directory in Chrome via the extensions page.

### Features

- Start and stop recording from the popup.
- Insert wait or copy steps while recording.
- View, edit, run and delete saved scenarios.

Each scenario is stored as a sequence of steps (click, input, navigate,
wait, copy). During playback these steps are executed on the active tab.

