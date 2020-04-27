import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import { stringify } from 'querystring';
import {parseDoc, repeatParseDoc} from './parser';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.start', () => {

      var decoder = new TextDecoder('utf-8');

      vscode.workspace.findFiles('**/App.js', '**/node_modules/**', 10)
      .then(result1 => vscode.workspace.fs.readFile(result1[0]))
      //.then(result2 => console.log(decoder.decode(result2)))
      .then(result2 => parseDoc(decoder.decode(result2)))
      .then(result3 => repeatParseDoc(result3))
      .then(result4 => {console.log("RESULT"); console.log(result4)})


      const panel = vscode.window.createWebviewPanel(
        'catCoding',
        'Cat Coding',
        vscode.ViewColumn.One,
        {
          enableScripts: true
        }
      );

      panel.webview.html = getWebviewContent();

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        message => {
          switch (message.command) {
            case 'alert':
              vscode.window.showErrorMessage(message.text);
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    })
  );

  vscode.window.registerWebviewPanelSerializer('catCoding', new CatCodingSerializer());

}

  class CatCodingSerializer implements vscode.WebviewPanelSerializer {
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
      // `state` is the state persisted using `setState` inside the webview
      console.log(`Got state: ${state}`);
  
      // Restore the content of our webview.
      //
      // Make sure we hold on to the `webviewPanel` passed in here and
      // also restore any event listeners we need on it.
      webviewPanel.webview.html = getWebviewContent();
    }
}

function getWebviewContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" />
    <h1 id="lines-of-code-counter">0</h1>
    <script>
      const vscode = acquireVsCodeApi();

      const counter = document.getElementById('lines-of-code-counter');
      
      // Check if we have an old state to restore from
      const previousState = vscode.getState();
      let count = previousState ? previousState.count : 0;
      counter.textContent = count;
      
      setInterval(() => {
        counter.textContent = count++;
        // Update the saved state
        vscode.setState({ count });
      }, 100);
    </script>
</body>
</html>`;
}
