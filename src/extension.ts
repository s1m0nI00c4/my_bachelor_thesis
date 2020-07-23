import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import {parseDoc, repeatParseDoc} from './parser';
import {findEntryPoint} from './entrypointfinder';


export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('RNVisualizer.start', async () => {

      var decoder = new TextDecoder('utf-8');

      var myResult = vscode.workspace.findFiles("**/MissionRestaurant.js", '**/node_modules/**', 10)
      .then(result1 => vscode.workspace.fs.readFile(result1[0]))
      //.then(result1 => findEntryPoint())
      .then(result2 => parseDoc(decoder.decode(result2)))
      .then(result3 => repeatParseDoc(result3))
      .then(result4 => {return JSON.stringify(result4)})

      console.log(JSON.parse(await myResult));

      const panel = vscode.window.createWebviewPanel(
        'RNVisualizer',
        'React Native Visualizer',
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

      panel.webview.html = getWebviewContent(params, await myResult);
    })
  );

  vscode.window.registerWebviewPanelSerializer('RNVisualizer', new RNVSerializer());
}

  class RNVSerializer implements vscode.WebviewPanelSerializer {
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
      webviewPanel.webview.html = getWebviewContent([], "");
    }
}

function getWebviewContent(params: vscode.Uri[], content: string) { 

  return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Tree Example</title>
      <link rel = "stylesheet" type = "text/css" href = "${params[1]}" />
    </head>
    <body>
      <script src="http://d3js.org/d3.v3.min.js"></script>
      <script src="${params[0]}"></script>
      <script>
        myFunction(${content});
      </script>
    </body>
  </html>
`;
}