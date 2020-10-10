import * as vscode from 'vscode';
import * as path from 'path';
import { TextDecoder } from 'util';
import {parseDoc, repeatParseDoc, createRootNode} from './parser';
import {findEntryPoint} from './entrypointfinder';

async function computeJSON(startingPoint: string) {

  var decoder = new TextDecoder('utf-8');

  var myURIArray = await vscode.workspace.findFiles("**/"+startingPoint, '**/node_modules/**', 10);

  // Computes the name of the rootNode
  var myRoot = createRootNode(myURIArray[0]);

  //vscode.workspace.openTextDocument(myURIArray[0])
  //.then(resultA => vscode.window.showTextDocument(resultA,1,false));

  var myResult = vscode.workspace.fs.readFile(myURIArray[0])
  //.then(result1 => findEntryPoint())
  .then(result2 => parseDoc(decoder.decode(result2), myURIArray[0], 0, myRoot))
  .then(result3 => repeatParseDoc(result3))
  .then(result4 => {return JSON.stringify(result4)})
  //console.log(JSON.parse(await myResult));
  return myResult;

}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
		vscode.commands.registerCommand('RNVisualizer.start', () => {
			RNVPanel.createOrShow(context.extensionPath);
		})
  );
  if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(RNVPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
				console.log(`Got state: ${state}`);
				RNVPanel.revive(webviewPanel, context.extensionPath);
			}
		});
	}
  /*context.subscriptions.push(
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
*/
}

class RNVPanel {
  public static currentPanel: RNVPanel | undefined;
  public static readonly viewType = 'RNVisualizer';
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionPath: string;
  private _disposables: vscode.Disposable[] = [];
  
  public static createOrShow(extensionPath: string) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
      : undefined;
    // If we already have a panel, show it.
		if (RNVPanel.currentPanel) {
			RNVPanel.currentPanel._panel.reveal(column);
			return;
    }
    // Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			RNVPanel.viewType,
			'React Native Visualizer',
			column || vscode.ViewColumn.One,
			{
				// Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
			}
    );
    RNVPanel.currentPanel = new RNVPanel(panel, extensionPath);
  }

  public static revive(panel: vscode.WebviewPanel, extensionPath: string) {
		RNVPanel.currentPanel = new RNVPanel(panel, extensionPath);
  }
  
  private constructor(panel: vscode.WebviewPanel, extensionPath: string) {
    this._panel = panel;
    this._extensionPath = extensionPath;
    // Set the webview's initial html content
    this._update();
    // Listen for when the panel is disposed. This happens when the user closes the panel or when the panel is closed programatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    // Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
    );
    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        switch (message.command) {
          case 'alert':
            vscode.workspace.openTextDocument(message.text)
            .then(resultA => vscode.window.showTextDocument(resultA,1,false));
            break;
          case 'refresh':
            console.log(message.text);
            var myNewResult = await computeJSON(message.text);
            this._panel.webview.html = this._getHtmlForWebview(this._panel.webview, myNewResult, true);
            break;
        }
      },
      null,
      this._disposables
    );

  }

  public dispose() {
		RNVPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
  }
  
  private async _update() {
    const webview = this._panel.webview;
    var myResult = await computeJSON("App.js");
    this._panel.title = "React Native Visualizer";
		this._panel.webview.html = this._getHtmlForWebview(webview, myResult, false);
  }
  
  private _getHtmlForWebview(webview: vscode.Webview, content: string, refresh: boolean):string {
    
    // Local path to the main script run in the webview
		const scriptPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, 'media', 'script.js')
    );
		// And the uri we use to load this script in the webview
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);
    
    //Same as above but for the CSS file
    const cssPathOnDisk = vscode.Uri.file(
      path.join(this._extensionPath, 'media', 'treeStyle.css')
    );
    const cssUri = webview.asWebviewUri(cssPathOnDisk);

    return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Tree Example</title>
        <link rel = "stylesheet" type = "text/css" href = "${cssUri}" />
      </head>
      <body>
        <script src="http://d3js.org/d3.v3.min.js"></script>
        <script src="${scriptUri}"></script>
        <h1>React Native Visualizer</h1>
        <script>
          prepareView(${content}, ${refresh});
        </script>
      </body>
    </html>
  `;
  }

}
