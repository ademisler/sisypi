# Sisypi Chrome Extension

This folder contains the source code for the Sisypi visual automation extension.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build the extension with Vite:
   ```bash
   npm run build
   ```
   The compiled files are emitted to the `dist/` folder.
3. Load the extension in Chrome:
   - Open `chrome://extensions`
   - Enable **Developer mode**
   - Click **Load unpacked** and choose the `dist` directory.

## Development

During development you can run
```bash
npm run dev
```
to rebuild on changes.

## Tests

Run unit tests with:
```bash
npm test
```
