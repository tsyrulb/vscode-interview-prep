import * as vscode from 'vscode';
import axios from 'axios';

interface Problem {
  contestId: number;
  index: string;
  name: string;
  rating?: number;
  tags: string[];
  description?: string;
}

type Language = 'Python' | 'C++' | 'JavaScript' | 'Java';

function isLanguage(value: string): value is Language {
	return ['Python', 'C++', 'JavaScript', 'Java'].includes(value);
  }
  
  export async function activate(context: vscode.ExtensionContext) {
	const getQuestionCmd = vscode.commands.registerCommand('vscode-interview-prep.getRandomQuestion', async () => {
	  try {
		const response = await axios.get('https://codeforces.com/api/problemset.problems');
		const problems: Problem[] = response.data.result.problems;
  
		const randomProblem = problems[Math.floor(Math.random() * problems.length)];
		const languages: Language[] = ['Python', 'C++', 'JavaScript', 'Java'];

		// Choose language
		const language = await vscode.window.showQuickPick(languages, {
		  placeHolder: 'Choose a programming language',
		});
  
		// Ensure the selected language is valid
		if (!language || !isLanguage(language)) {
		  vscode.window.showInformationMessage('No valid language selected. Aborting.');
		  return;
		}
  
		// Show problem details in a Webview
		await showProblemDetails(randomProblem);
  
		// Generate and open starter code
		const starterCode = getStarterCode(
		  language,
		  randomProblem.name,
		  `Rating: ${randomProblem.rating || 'Unrated'}\nTags: ${randomProblem.tags?.join(', ') || 'None'}`
		);
  
		const doc = await vscode.workspace.openTextDocument({ content: starterCode, language: language.toLowerCase() });
		await vscode.window.showTextDocument(doc);
	  } catch (error) {
		vscode.window.showErrorMessage('Failed to fetch programming problems.');
		console.error(error);
	  }
	});
  
	context.subscriptions.push(getQuestionCmd);
  }
  

function getStarterCode(language: Language, problemTitle: string, problemDescription: string): string {
  const commentPrefix = language === 'Python' ? '#' : '//';
  const starterCode: Record<Language, string> = {
    Python: `${commentPrefix} Problem: ${problemTitle}\n${commentPrefix} ${problemDescription}\n\n# Write your solution here\n`,
    'C++': `${commentPrefix} Problem: ${problemTitle}\n${commentPrefix} ${problemDescription}\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}`,
    JavaScript: `${commentPrefix} Problem: ${problemTitle}\n${commentPrefix} ${problemDescription}\n\n// Write your solution here\n`,
    Java: `${commentPrefix} Problem: ${problemTitle}\n${commentPrefix} ${problemDescription}\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}`,
  };
  return starterCode[language];
}

async function showProblemDetails(problem: Problem) {
  const panel = vscode.window.createWebviewPanel('problemDetails', `Problem: ${problem.name}`, vscode.ViewColumn.Beside, {});

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${problem.name}</title>
    </head>
    <body>
      <h1>${problem.name}</h1>
      <p><strong>Rating:</strong> ${problem.rating || 'Unrated'}</p>
      <p><strong>Tags:</strong> ${problem.tags?.join(', ') || 'None'}</p>
      <h3>Description</h3>
      <p>${problem.description || 'No description available.'}</p>
      <h3>URL</h3>
      <p><a href="https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}" target="_blank">Open Problem on Codeforces</a></p>
    </body>
    </html>
  `;
}

export function deactivate() {}
