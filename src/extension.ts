import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import { marked } from 'marked';

// Load environment variables
require('dotenv').config();

// Import Google Generative AI client
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Define the database path
const dbPath = path.resolve(__dirname, '../data/problems.db');
const db = new sqlite3.Database(dbPath);

// Function to fetch a random problem
function fetchRandomProblem(): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM problems ORDER BY RANDOM() LIMIT 1', (err, row) => {
      if (err) {
        return reject(new Error(`Error querying the database: ${err.message}`));
      }
      if (!row) {
        return reject(new Error('No problems found in the database.'));
      }
      resolve(row);
    });
  });
}

// Function to get AI-generated content
async function getAIResponse(prompt: string): Promise<string> {
  try {
    const resp = await model.generateContent(prompt);
    return resp.response.text || 'No response generated by AI.';
  } catch (error) {
    console.error('Error fetching response from Generative AI:', error);
    return 'Failed to fetch response from AI. Please try again later.';
  }
}

// Function to display problem details in a Webview
async function showProblemDetails(problem: any) {
  const panel = vscode.window.createWebviewPanel(
    'problemDetails',
    `Problem: ${problem.question}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  const descriptionHtml = marked(problem.question || '');
  const explanationPrompt = `Explain this problem and its expected solution in detail: ${problem.question}`;
  const explanation = await getAIResponse(explanationPrompt);

  const formattedSolutions = JSON.parse(problem.solutions || '[]')
    .map(
      (solution: string, index: number) => `
        <details class="solution">
          <summary>Solution ${index + 1}</summary>
          <pre><code class="language-python">${solution}</code></pre>
          <button class="copy-button" data-code="${solution}" onclick="copyCode(this)">Copy Code</button>
        </details>
      `
    )
    .join('');

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${problem.question}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          color: #333;
        }
        pre {
          background: #f4f4f4;
          padding: 10px;
          border-radius: 5px;
        }
        .metadata {
          margin-bottom: 20px;
        }
        .hidden {
          display: none;
        }
        .toggle-button {
          margin: 10px 0;
          padding: 10px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .toggle-button:hover {
          background: #2980b9;
        }
      </style>
    </head>
    <body>
      <h1>Problem Description</h1>
      <div class="metadata">
        <p><strong>Difficulty:</strong> ${problem.difficulty || 'Unknown'}</p>
        <p><strong>URL:</strong> <a href="${problem.url || '#'}" target="_blank">Open Problem</a></p>
      </div>
      <div>${descriptionHtml}</div>
      <button class="toggle-button" onclick="toggleExplanation()">Show AI Explanation</button>
      <div id="aiExplanation" class="hidden">
        <h2>AI Explanation</h2>
        <p>${explanation}</p>
      </div>
      <h2>Solutions</h2>
      ${formattedSolutions || '<p>No solutions available.</p>'}
      <button class="toggle-button" onclick="sendHelp()">Help</button>
      <script>
        function toggleExplanation() {
          const explanationDiv = document.getElementById('aiExplanation');
          explanationDiv.classList.toggle('hidden');
        }
        async function sendHelp() {
          const vscode = acquireVsCodeApi();
          vscode.postMessage({ type: 'help' });
        }
      </script>
    </body>
    </html>
  `;

  // Listen for "Help" button messages
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.type === 'help') {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor found to analyze.');
        return;
      }
      const userCode = editor.document.getText();
      const analysisPrompt = `Analyze the following Python code and provide feedback with explanations for any issues:\n\n${userCode}`;
      const aiFeedback = await getAIResponse(analysisPrompt);
      vscode.window.showInformationMessage(aiFeedback);
    }
  });
}

// VS Code extension activation
export async function activate(context: vscode.ExtensionContext) {
  const getRandomQuestionCmd = vscode.commands.registerCommand('vscode-interview-prep.getRandomQuestion', async () => {
    try {
      const randomProblem = await fetchRandomProblem();
      showProblemDetails(randomProblem);
    } catch (error) {
      vscode.window.showErrorMessage('Failed to fetch a random problem. Please try again.');
      console.error('Error fetching problem from SQLite:', error);
    }
  });

  context.subscriptions.push(getRandomQuestionCmd);
}

// Close the database when the extension is deactivated
export function deactivate() {
  db.close((err) => {
    if (err) {
      console.error('Error closing the SQLite database:', err.message);
    } else {
      console.log('SQLite database connection closed.');
    }
  });
}
