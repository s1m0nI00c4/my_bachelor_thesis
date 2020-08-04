import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import {Node} from './parser';

interface Resource {
  myUri: vscode.Uri;
  myContent: string;
}

export async function findResources(components: Node[], oldUri: vscode.Uri): Promise<Node[]> {
    var result = components;
    for (var item of result) {
      if (item.origin && item.follow===true) {
        var resourceResult = await openResources(item.origin, oldUri);
        item.blob = resourceResult.myContent;
        item.myUri = resourceResult.myUri;
      }
      if (item.children) {
        item.children = await findResources(item.children, oldUri);
      }
    }
    return result;
  }
  
export async function openResources(resource: string, oldUri: vscode.Uri) {
  var result: Resource = {myUri: oldUri, myContent: ""};
  var patt1 = /\/\w+.js/;
  var obj1 = patt1.exec(resource);
    if (obj1) {
      var smt = await contentReader(obj1[0]);
      result = smt;
    } else {
      var newResource = resource + ".js";
      var obj2 = patt1.exec(newResource);
      if (obj2) {
        var smt = await contentReader(obj2[0]);
        result = smt;
      }
    }
  return result;
}
  
export async function contentReader(filename: String): Promise<Resource> {
  
  var decoder = new TextDecoder('utf-8');
  var myUriArray = await vscode.workspace.findFiles("**" + filename, '**/node_modules/**', 10);
  var myContent = await vscode.workspace.fs.readFile(myUriArray[0])
  .then(result2 => decoder.decode(result2))
  return {myUri: myUriArray[0], myContent: myContent};
}