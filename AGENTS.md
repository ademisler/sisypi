# Agent Instructions for the Sisypi Extension

Hello, fellow agent! This document provides important information to help you work on this codebase.

## Project Architecture

This is a Chrome browser extension built with a modern tech stack. The architecture is composed of three main parts:

1.  **Popup UI (React + TypeScript):** The user interface that opens when you click the extension icon is a React application written in TypeScript.
    -   **Main Entry Point:** `index.tsx`
    -   **HTML Root:** `popup/popup.html`
    -   **Styling:** `popup/popup.css`
    -   This code is compiled into a single JavaScript file by Vite.

2.  **Background Script (`scripts/background.js`):** This is a standard extension service worker. It's the central coordinator that manages state, saves data to `chrome.storage`, and facilitates communication between the popup and the content script. It is written in plain JavaScript.

3.  **Content Script (`content/content_script.js`):** This script is injected into web pages to perform the actual automation.
    -   It is responsible for the element selection UI (the numbered boxes).
    -   It contains the `scenarioEngine`, which executes the automation steps. This engine understands control flow like `IF/ELSE` and `LOOP`.

## Build Process

The project uses **Vite** to build the React popup.

-   **Configuration File:** `vite.config.cjs`
-   **To build the project, you MUST run:** `npm run build`

This command will compile the `index.tsx` and all related files and place the final, loadable extension into the `/dist` directory. The `/dist` directory is what you should load as an "unpacked extension" in Chrome for testing.

**IMPORTANT:** There have been significant, unresolvable issues with the `npm` environment in some sandboxes. The `npm install` command sometimes fails to create the `node_modules/.bin` directory, which prevents the `vite` command from being found. If you encounter build errors like `vite: not found`, this is likely the cause. This is an **environmental issue**, not a code issue.

## Key Files to Check

-   **`index.tsx`:** This is where all the UI logic for the popup lives. It contains the React components for the main view, the scenario editor, the steps, and the modals.
-   **`content/content_script.js`:** This is where the core automation logic resides. If you need to change how a step is executed (e.g., add a new type of action), you need to modify the `scenarioEngine` in this file.
-   **`scripts/background.js`:** Modify this file if you need to change how data is stored or how messages are passed between the popup and content scripts.
-   **`manifest.json`:** The standard manifest for the Chrome extension.
-   **`vite.config.cjs`:** The build configuration. You should not need to change this unless you are fundamentally altering the project structure.
-   **`README.md`:** The user-facing documentation. If you add a user-visible feature, update this file.
