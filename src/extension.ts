import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import { stringify } from 'querystring';
import {parseDoc, repeatParseDoc} from './parser';
import {findEntryPoint} from './entrypointfinder';
import {Node} from './parser';


export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('catCoding.start', async () => {

      var decoder = new TextDecoder('utf-8');

      var myResult = vscode.workspace.findFiles("**/App.js", '**/node_modules/**', 10)
      .then(result1 => vscode.workspace.fs.readFile(result1[0]))
      //.then(result1 => findEntryPoint())
      .then(result2 => parseDoc(decoder.decode(result2)))
      .then(result3 => repeatParseDoc(result3))
      .then(result4 => {return JSON.stringify(result4)})

      //console.log(await ((await myResult).charAt(0)));
      //console.log(JSON.parse(await myResult));


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

      const onDiskPath3 = vscode.Uri.file(
        path.join(context.extensionPath, 'media', 'data.json')
      );

      // And get the special URI to use with the webview
      const jsSrc = panel.webview.asWebviewUri(onDiskPath1);
      const cssSrc = panel.webview.asWebviewUri(onDiskPath2);
      const jsonSrc = panel.webview.asWebviewUri(onDiskPath3);

      const params = [jsSrc, cssSrc, jsonSrc];

      panel.webview.html = getWebviewContent(params, await myResult);
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
      
      webviewPanel.webview.html = getWebviewContent([], "");
    }
}

function getWebviewContent(params: vscode.Uri[], content: string) { 

  //console.log(JSON.parse(content));

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
        /*var request = new XMLHttpRequest();
        request.open("GET", "${params[2]}", false);
        request.send(null)
        var my_JSON_object = JSON.parse(request.responseText);*/
        myFunction(${content});
      </script>
    </body>
  </html>
`;
}