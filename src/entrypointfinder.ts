import * as vscode from 'vscode';
import {TextDecoder} from 'util';

export async function findEntryPoint() {
    var result = "NO ENTRY POINT";
    var defaultExpo = await entryPointExpo('**/App.js');
    if (defaultExpo) {
        result = defaultExpo;

    } else {
        
        var specificPath = await entryPointParser();
        var specificExpo = await (entryPointGeneric(specificPath));
        if (specificExpo) {
            result = specificExpo;
        } else {
            result = await entryPointGeneric('**/index.js');
        }
    }
    return result;
}

async function entryPointExpo(app: string) :Promise<string> {

    var decoder = new TextDecoder('utf-8');

    return vscode.workspace.findFiles(app, '**/node_modules/**', 10)
    .then(result1 => vscode.workspace.fs.readFile(result1[0]))
    .then(result2 => decoder.decode(result2))

}

async function entryPointGeneric(app: string) :Promise<string> {

    var decoder = new TextDecoder('utf-8');

    return vscode.workspace.findFiles(app, '**/node_modules/**', 10)
    .then(result1 => vscode.workspace.fs.readFile(result1[0]))
    .then(result2 => decoder.decode(result2))

}

async function entryPointParser() :Promise<string> {
    var decoder = new TextDecoder('utf-8');
    return vscode.workspace.findFiles("**/package.json", '**/node_modules/**', 10)
    .then(result1 => vscode.workspace.fs.readFile(result1[0]))
    .then(result2 => decoder.decode(result2))
    .then(result3 => JSON.parse(result3))
    .then(result4 => result4.main);
}
