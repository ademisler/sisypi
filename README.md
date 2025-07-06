# Sisypi - Automation Assistant

Sisypi is a powerful Chrome extension designed to easily automate repetitive and time-consuming tasks on web pages. It allows you to create, edit, and run web automation scenarios through an intuitive interface **without requiring any coding knowledge**. Speed up your daily workflows, automate data collection processes, and increase your efficiency by minimizing manual errors.

## Features

Sisypi offers a rich and flexible feature set for your web automation needs:

*   **Visual Scenario Creation:** Add automation steps by directly selecting elements on the web page. Easily configure basic interactions like clicking, typing text, and copying data.
*   **Advanced Toolbox:** Provides various tools to add complexity and flexibility to your scenarios:
    *   **Wait:** Control scenario flow by waiting for a specific duration (in milliseconds). Important for page loads or dynamic content to appear.
    *   **Comment:** Add descriptive notes to your scenario steps to improve readability and maintenance.
    *   **Screenshot:** Automatically capture a screenshot of the page at specific moments in the scenario. Useful for debugging or process tracking.
    *   **Conditional Logic (IF/ELSE):** Run different steps based on whether a specific element exists on the page. Makes your scenarios more dynamic and fault-tolerant.
    *   **Loops (N Times):** Repeat a specific step or block of steps a predefined number of times. Especially useful when processing list items.
    *   **Scroll:** Scroll down the page to load new content or make invisible elements accessible.
*   **Variable Support:** Save values copied from the web page to named variables and use these variables for text inputs or other actions in subsequent steps (e.g., `{{username}}`). Makes your scenarios more generic and reusable.
*   **URL Restriction:** Ensure scenarios only run on pages matching specific URL patterns, preventing accidental or unwanted execution on incorrect pages.
*   **Scenario Management:** Easily create, edit, and delete your scenarios through an intuitive interface. You can back up all your scenarios as a single JSON file and restore them later.
*   **Multi-Language Support:** The user interface supports Turkish and English languages.

## Architecture

Sisypi operates using the core components of the Chrome extension architecture. These components are designed to fulfill different functions of the extension:

*   **Popup (`popup/`):** The main interface that opens when the user clicks the extension icon. All user interactions, such as creating, editing, and managing scenarios, take place here.
*   **Background Script (`scripts/background.js`):** The "brain" of the extension. It listens for browser events, stores scenario data, and coordinates communication between the popup and content scripts.
*   **Content Scripts (`content/content_script.js`, `content/selector_generator.js`):** Scripts injected directly into the web page. They access and interact with the web page's DOM. They enable element selection mode, execute scenario steps, and send status updates to the background script.
*   **Web Accessible Resources (`content/selection.css`):** The CSS file injected into the web page during element selection mode.

## Installation

Sisypi is a Chrome extension. Follow these steps to install and run it in your development environment:

1.  **Clone the Repository:** Clone this GitHub repository to your computer or download it as a ZIP and extract it to your desired directory.
    ```bash
    git clone https://github.com/ademisler/sisypi.git
    ```
2.  **Open Chrome Extensions:** Open your Chrome browser and type `chrome://extensions` in the address bar.
3.  **Enable Developer Mode:** Enable the "Developer mode" toggle in the top right corner.
4.  **Load Unpacked Extension:** Click the "Load unpacked" button.
5.  **Select Folder:** Select the `sisypi` folder you cloned or extracted.

Now the Sisypi extension will be installed and ready to use in your browser. You might want to pin the extension icon to your browser bar.

## Usage

Creating and running web automation scenarios using Sisypi is quite simple. Here's a step-by-step guide:

1.  **Open the Extension:** Click the Sisypi icon in the top right corner of your Chrome browser to open the extension window.
2.  **Create New Scenario:** On the main screen, click the **"Create New Scenario"** button. This will take you to the scenario editor screen.
3.  **Enter Scenario Information:**
    *   **Scenario Name:** Give your scenario a descriptive name (e.g., "Search on Google").
    *   **URL Restriction (Optional):** If you want the scenario to run only on a specific URL or URL pattern, enter a URL or part of it here (e.g., `google.com/maps`). This prevents your scenario from running on incorrect pages.
4.  **Add Steps:**
    *   **Add Step by Selecting Element:** Click this button to interact with an element on the web page. The extension will start element selection mode in the active tab. When you hover your mouse over elements, you will see numbered boxes. Enter the number of the desired element and click "Select". Then, choose the action you want to perform on the element (Click, Type, Copy) and enter the necessary parameters (e.g., text to type, variable name).
    *   **Toolbox:** From the "Toolbox" section at the bottom of the editor screen, you can add advanced steps like "Wait", "Comment", "Screenshot", "IF", "ELSE", "END IF", "N Times", "END LOOP", and "Scroll". Each tool adds a different layer of functionality and control to your scenario.
5.  **Save Scenario:** After you finish adding steps, click the **"Save"** button to save your scenario.
6.  **Run Scenario:** To run the saved scenario, click the **"Run"** button. The scenario will automatically execute in the active browser tab. The execution status will be displayed in the extension window.
7.  **Backup and Restore:** From the main screen, you can download all your scenarios as a single JSON file to your computer with **"Backup All"**, and restore previously backed-up scenarios with **"Load from Backup"**. This feature allows you to keep your scenarios safe and transfer them between different devices.

## Development

This project is developed using modern web development tools: Vite and TypeScript.

### Required Tools

*   [Node.js](https://nodejs.org/) (v18 or higher recommended)
*   [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)

### Setup and Running

1.  Clone the repository and navigate to the project directory:
    ```bash
    git clone https://github.com/ademisler/sisypi.git
    cd sisypi
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server. This command uses Vite for `popup.html` and related files, providing a fast reload and development experience:
    ```bash
    npm run dev
    ```
4.  To install the extension in Chrome, follow the "Installation" steps above. Changes made in development mode may not be automatically detected, so you might need to manually refresh the extension from the `chrome://extensions` page (by clicking the refresh icon on the extension's card) to see the changes.

## Project Structure

This section describes the main directory structure of the project and the purpose of each folder/file. This structure makes it easier for developers to navigate and contribute to the project.

```
sisypi/
├───.git/                   # Git version control directory
├───.gitignore              # Files to be ignored by Git
├───index.tsx               # Main React/TypeScript entry point (for Vite)
├───manifest.json           # Chrome extension manifest file (extension settings)
├───metadata.json           # Project metadata (likely for internal use)
├───package.json            # Node.js project dependencies and scripts
├───README.md               # This README file
├───tsconfig.json           # TypeScript configuration file
├───content/
│   ├───content_script.js   # Main content script injected into the web page
│   ├───selection.css       # CSS styles for element selection mode
│   └───selector_generator.js # Helper script for generating CSS selectors
├───icons/
│   ├───icon128.png         # Extension icons (in different sizes)
│   ├───icon16.png
│   └───icon48.png
├───lib/                    # External libraries
│   ├───sortable.min.js     # Library for drag-and-drop functionality
│   └───fontawesome/        # Font Awesome icon library
│       ├───css/
│       │   └───all.min.css
│       └───webfonts/       # Font Awesome web fonts
├───popup/
│   ├───popup.css           # CSS styles for the popup interface
│   ├───popup.html          # HTML structure of the popup interface
│   └───popup.js            # JavaScript logic for the popup interface
└───scripts/
    ├───background.js       # Extension's background service worker
    └───content.js          # Old or redundant content script (not in use)
```

## Contributing

Contributions are welcome! For bug reports, feature requests, or code contributions, please visit the GitHub repository and feel free to open an "issue" or submit a "pull request".

## Credits
Created by [Adem İşler](https://ademisler.com/). If you find this project useful,
consider [buying me a coffee](https://buymeacoffee.com/ademisler).

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
