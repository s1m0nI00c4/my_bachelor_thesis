import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import { stringify } from 'querystring';
import {parseDoc, repeatParseDoc} from './parser';
import {findEntryPoint} from './entrypointfinder';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.start', async () => {

      var decoder = new TextDecoder('utf-8');

      vscode.workspace.findFiles("**/App.js", '**/node_modules/**', 10)
      .then(result1 => vscode.workspace.fs.readFile(result1[0]))
      //.then(result1 => findEntryPoint())
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

      const onDiskPath1 = vscode.Uri.file(
        path.join(context.extensionPath, 'media', 'script.js')
      );

      const onDiskPath2 = vscode.Uri.file(
        path.join(context.extensionPath, 'media', 'treeStyle.css')
      );

      // And get the special URI to use with the webview
      const jsSrc = panel.webview.asWebviewUri(onDiskPath1);
      const cssSrc = panel.webview.asWebviewUri(onDiskPath2);

      const params = [jsSrc, cssSrc];

      panel.webview.html = getWebviewContent(params);

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
      
      webviewPanel.webview.html = getWebviewContent([]);
    }
}

function getWebviewContent(params: vscode.Uri[]) { 

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Tree Example</title>
      <link rel = "stylesheet" type = "text/css" href = "${params[1]}" />
      <style>
      </style>

    </head>

    <body>

    <!-- load the d3.js library -->	
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.17/d3.min.js"></script>
	
    <script src="${params[0]}"></script>
    </body>
  </html>
`;
}