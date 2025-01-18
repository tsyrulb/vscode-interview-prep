import * as vscode from 'vscode';
import * as sqlite3 from 'sqlite3';
import * as path from 'path';

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

// Function to display problem details in a Webview with Markdown rendering
function showProblemDetails(problem: any) {
  const panel = vscode.window.createWebviewPanel(
    'problemDetails',
    `Problem: ${problem.question}`,
    vscode.ViewColumn.One,
    {
      enableScripts: true,
    }
  );

  // Convert Markdown description to HTML
  const marked = require('marked');
  const descriptionHtml = marked.parse(problem.question || '');

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
        /* General Styles */
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          margin: 20px;
          max-width: 800px;
          color: #333;
          background-color: #f9f9f9;
        }

        h1, h2 {
          color: #2c3e50;
        }

        a {
          color: #3498db;
          text-decoration: none;
        }

        pre {
          background-color: #2d2d2d;
          color: #ffffff;
          padding: 10px;
          border-radius: 5px;
          font-family: 'Courier New', monospace;
        }

        .metadata, .section {
          margin-bottom: 20px;
          padding: 15px;
          border-radius: 5px;
          background-color: #ecf0f1;
          box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
        }

        .copy-button {
          display: block;
          margin: 10px 0;
          background: #3498db;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 5px;
          cursor: pointer;
        }

        .copy-button:hover {
          background: #2980b9;
        }

        .solution summary {
          cursor: pointer;
          font-weight: bold;
        }

        .solution pre {
          margin: 10px 0;
        }

        .solution {
          margin-bottom: 20px;
        }

        hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 20px 0;
        }
      </style>
      <!-- Include Highlight.js -->
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
    </head>
    <body>
      <h1>Problem Description</h1>
      <div class="metadata">
        <p><strong>Difficulty:</strong> ${problem.difficulty || 'Unknown'}</p>
        <p><strong>URL:</strong> <a href="${problem.url || '#'}" target="_blank">Open Problem</a></p>
      </div>

      <!-- Rendered Markdown -->
      <div class="section">
        ${descriptionHtml}
      </div>

      <div class="section">
        <h2>Solutions</h2>
        ${formattedSolutions || '<p>No solutions available.</p>'}
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
      <script>
        document.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });

        function copyCode(button) {
          const code = button.getAttribute('data-code');
          navigator.clipboard
            .writeText(code)
            .then(() => {
              button.textContent = 'Copied!';
              button.style.backgroundColor = '#27ae60';
              setTimeout(() => {
                button.textContent = 'Copy Code';
                button.style.backgroundColor = '';
              }, 2000);
            })
            .catch(() => {
              button.textContent = 'Failed to copy!';
              button.style.backgroundColor = '#e74c3c';
            });
        }
      </script>
    </body>
    </html>
  `;
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
