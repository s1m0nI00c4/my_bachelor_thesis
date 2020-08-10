import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import {parseDoc, repeatParseDoc, createRootNode} from './parser';
import {findEntryPoint} from './entrypointfinder';

async function computeJSON() {

  var decoder = new TextDecoder('utf-8');

  var myURIArray = await vscode.workspace.findFiles("**/App.js", '**/node_modules/**', 10);

  // Computes the name of the rootNode
  var myRoot = createRootNode(myURIArray[0]);

  //vscode.workspace.openTextDocument(myURIArray[0])
  //.then(resultA => vscode.window.showTextDocument(resultA,1,false));

  var myResult = vscode.workspace.fs.readFile(myURIArray[0])
  //.then(result1 => findEntryPoint())
  .then(result2 => parseDoc(decoder.decode(result2), myURIArray[0], 0, myRoot))
  .then(result3 => repeatParseDoc(result3))
  .then(result4 => {return JSON.stringify(result4)})
  console.log(JSON.parse(await myResult));
  return myResult;

}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('RNVisualizer.start', async () => {

      var myResult = await computeJSON();

      const panel = vscode.window.createWebviewPanel(
        'RNVisualizer',
        'React Native Visualizer',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true
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

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        async message => {
          switch (message.command) {
            case 'alert':
              vscode.workspace.openTextDocument(message.text)
              .then(resultA => vscode.window.showTextDocument(resultA,1,false));
              break;
            case 'refresh':
              console.log("IN 2");
              var myNewResult = await computeJSON();
              panel.webview.html = getWebviewContent(params,myNewResult);
              break;
          }
        },
        undefined,
        context.subscriptions
      );


    })
  );

  vscode.window.registerWebviewPanelSerializer('RNVisualizer', new RNVSerializer());
}

  class RNVSerializer implements vscode.WebviewPanelSerializer {
    async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
      console.log(`Got state: ${state}`);
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
      <h1>React Native Visualizer</h1>
      <button type="button" id="editButton" onclick="toggleEditMode()">Add node!</button>
      <button type="button" id="removeButton" onclick="toggleRemoveMode()">Remove node!</button>
      <button type="button" id="refresh" onclick="handleRefresh()">Refresh tree</button>
      <p id="loadingText"></p>
      <p class="alert">Click on the blue plus to add your new node to the desired parent</p>
      <form name="myform" onSubmit="return handleClick()">
            <input type="text" id="name" placeholder="Node name">
            <input type="text" id="content" placeholder="Node content">
            <input type="number" id="id" min="0" placeholder="Node id">
            <input name="Submit"  type="submit" value="Add to graph" >
      </form>
      <script>
        myFunction(${content});
      </script>
      <script>
        function handleRefresh() {
          document.getElementById("loadingText").innerHTML = "Loading...";
          refresh();
        }
      </script>
    </body>
  </html>
`;
}