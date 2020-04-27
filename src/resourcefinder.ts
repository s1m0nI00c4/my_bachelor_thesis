import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import {Node} from './parser';

export async function findResources(components: Node[]): Promise<Node[]> {
    var result = components;
    for (var item of result) {
      if (item.origin && item.follow===true) {
        item.blob = await openResources(item.origin);
      }
      if (item.children) {
        item.children = await findResources(item.children);
      }
    }
    return result;
  }
  
export async function openResources(resource: string) {
  var result: string = "";
  var patt1 = /\/\w+.js/;
  var obj1 = patt1.exec(resource);
    if (obj1) {
      var smt = await contentReader(obj1[0]);
      result = smt;
    }
  return result;
}
  
export async function contentReader(filename: String) {
  
  var decoder = new TextDecoder('utf-8');
  var result = vscode.workspace.findFiles("**" + filename, '**/node_modules/**', 10)
  .then(result1 => vscode.workspace.fs.readFile(result1[0]))
  .then(result2 => decoder.decode(result2))
  return result;
  
}