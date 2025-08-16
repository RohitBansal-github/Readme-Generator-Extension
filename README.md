# GitHub README Generator 🚀

[![Project Overview]](projectOverview..png)  <!-- Replace placeholder.png with an actual image -->

## 📖 Description

This project is a Chrome extension that leverages the Gemini AI model to generate professional-quality `README.md` files for GitHub repositories.  It simplifies the process of creating comprehensive and well-formatted documentation, saving developers valuable time and effort.  The target users are developers who want to quickly and easily generate high-quality `README` files for their projects.


## 🧭 Table of Contents

- [Project Title](#project-title)
- [Description](#description)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Contact Info](#contact-info)


## 🌟 Features

- Generates professional-looking `README.md` files.
- Uses the Gemini AI model for accurate and comprehensive content.
- Supports full-stack projects and APIs.
- Includes a user-friendly Chrome extension interface.
- Auto-generates a table of contents.
- Handles both frontend and backend project structures.
- Provides options to copy and download the generated `README.md`.
- Includes error handling and retry mechanisms.


## 🧰 Technologies Used

-  JavaScript
-  HTML
-  CSS
-  Google Gemini API


## 📁 Project Structure

The project consists of the following key files and directories:

```
github-readme-generator/
├── background.js       // Chrome extension background script
├── manifest.json       // Chrome extension manifest file
├── popup.html          // Chrome extension popup UI
└── popup.js            // Chrome extension popup logic
```


## ⚙️ Setup Instructions

1. **Clone the repo:**  Clone this repository to your local machine using Git:
   ```bash
   git clone <repository_url>
   ```

2. **Install dependencies:**  This project uses only frontend technologies and has no backend dependencies.

3. **Obtain a Gemini API Key:** You'll need a Google Cloud Platform account and a Gemini API key.  Follow Google's instructions to create one.  This key is required for the extension to function.

4. **Load the extension:** Open `chrome://extensions/` in your Chrome browser. Enable "Developer mode" in the top right corner. Click "Load unpacked," and select the `github-readme-generator` directory.

5. **Enter your API key:**  Open the extension's popup, enter your Gemini API key, and click "Save API Key".

6. **Generate README:** Navigate to a GitHub repository page, and click the extension's "Generate README" button.


## ▶️ Usage

1. Open the Chrome extension.
2. Paste the GitHub repository URL into the provided field.
3. Enter your Gemini API key.
4. Click "Generate README".
5. The generated `README.md` will be displayed in the extension's output area. You can copy or download the file.


## 🖼️ Screenshots

| Image                     | Description                                                              |
|--------------------------|--------------------------------------------------------------------------|
| [Screenshot 1](Screenshot_1.png) | Extension popup with API key input                                      |
| [Screenshot 2](Screenshot_2.png) | Extension popup displaying generated README                                |
<!-- Replace placeholder.png with actual screenshots -->


## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request if you encounter problems or want to add new features.


## 📞 Contact Info

For support or inquiries, please contact `rohitbansal7364@gmail.com`.
