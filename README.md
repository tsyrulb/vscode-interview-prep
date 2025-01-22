# vscode-interview-prep (in development)

## Overview
`vscode-interview-prep` is a Visual Studio Code extension that helps users practice coding problems, view solutions, and get AI-generated explanations and feedback. The extension connects to an SQLite database containing problems and integrates with Google Generative AI to provide detailed explanations and analyze user code.

## Features
- Fetch random problems from a database.
- Display problem descriptions, difficulty levels, and solutions in a Webview.
- Get AI-generated explanations for problems (hidden by default, revealed upon user request).
- Analyze user-written code in the editor for errors and improvements via a "Help" button.
- Solutions are displayed in an easy-to-read format with copy functionality.

## Prerequisites
1. **Node.js and npm**: Install the latest version of Node.js from [nodejs.org](https://nodejs.org/).
2. **SQLite**: Ensure SQLite is installed and accessible from your environment.
3. **Google Generative AI API Key**: Obtain an API key from Google Cloud and enable the Generative AI API.
4. **Environment File (.env)**: Create a `.env` file in the root directory of your extension with the following content:
   ```env
   GOOGLE_API_KEY=your_google_api_key_here
   ```

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/vscode-interview-prep.git
   cd vscode-interview-prep
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Compile the TypeScript code:
   ```bash
   npm run compile
   ```

4. Open the extension folder in Visual Studio Code.

5. Press `F5` to launch the extension in a new Extension Development Host window.

## Usage

### Fetching a Random Problem
1. Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
2. Type `vscode-interview-prep: Get Random Question` and press Enter.
3. A Webview will open displaying the problem details.

### Viewing AI Explanations
- Click the **"Show AI Explanation"** button in the Webview to reveal the explanation.

### Analyzing User Code
1. Write your code in a new editor window.
2. In the problem Webview, click the **"Help"** button.
3. The AI will analyze your code and display feedback as a VS Code notification.

## Development

### Setting Up the Database
The extension uses an SQLite database (`problems.db`) located in the `data` directory. To populate the database:

1. Place your JSON problem file (e.g., `coding_questions.json`) in the `data` directory.
2. Run the database initialization script:
   ```bash
   node src/initializeDatabase.js
   ```

### Adding New Features
- Modify the TypeScript source files in the `src` directory.
- Recompile the code:
  ```bash
  npm run compile
  ```
- Reload the extension in the development host.

## File Structure
```
├── src
│   ├── extension.ts           # Main extension logic
│   ├── initializeDatabase.ts  # Database setup script
│   └── ...
├── data
│   ├── problems.db            # SQLite database
│   └── coding_questions.json  # Source JSON for problems
├── out                        # Compiled JavaScript files
├── .env                       # Environment variables (e.g., API key)
├── package.json               # Project configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Extension documentation
```

## Known Issues
- Ensure the `.env` file is correctly configured to avoid API key errors.
- Large JSON files may slow down the database initialization.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request.

## License
This project is licensed under the MIT License.


