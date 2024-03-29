import {Node, Dependencies} from './parser';
import * as Parser from './parser';
import * as Helper from "./helper";
import * as vscode from 'vscode';


/* This function takes an array of imports and classifies them according to their name and properties, returning another array with these additional info*/
export function processImports(arr: Dependencies[]): Dependencies[] {
 
  var result: Dependencies[] = arr;
  result.forEach(item => { 
    if (item.all === true) {
      item.follow = true;
    }
    if (item.origin === "react") {
      item.follow = false;
      item.type = "react";
    }
    else if (isStateManagement(item.origin)) {
      item.follow = false;
      item.type = "state-management";
    }
    else if (isNavigation(item.origin)) {
      item.follow = true;
      item.type = "react-navigation";
    }
    else if (isExternal(item.origin)) {
      item.follow = false;
      item.type = "external";
    }
    else {
      item.follow = true;
      item.type = "internal";
    }
  })  
  return result;
}
  
  function isStateManagement(str: string) {
    var result = false;
    const libraries = ["unstated", "redux", "react-redux", "undux", "mobx", "mobx-react"];
    libraries.forEach(item => {
      if (str === item) {
        result = true;
      }
    })
    return result;
  }
  
  function isNavigation(str: string) {
    var result = false;
      if (/react-navigation/.test(str)) {
        result = true;
      }
    return result;
  }
  
  function isExternal(str: string) {
    var result = true; 
    const test = str.charAt(0);
    if (/(\.|\\)/.test(test)) {
      result = false;
    }
    return result;
  }

export function processRoutes(routes: string, id: number, myUri: vscode.Uri) {
  var patt1 = /\w+:\s*\w+/g
  var patt2 = /\w+/g
  var result: Node[] = [];
  var obj1 = routes.match(patt1);
  if(obj1) {
    var len = obj1.length;
    obj1.forEach((item) => {
      var obj2 = item.match(patt2);
      if (obj2) {
        Parser.setGID();
        result.push({
          id: Parser.getGID(),
          name: obj2[0],
          content: obj2[0],
          children: [{id: Parser.getGID()+1, name: obj2[1], content: obj2[1], type: "Navigational", children: [], origin: undefined, follow: true, myUri:myUri }],
          type: "Navigational",
          origin: "react-navigation",
          myUri: myUri,
          follow: true
        })
        Parser.setGID();
      }
    })
  }
  return result;
}

export function processReturns(stringToParse: string): string[] {
  var result: string[] = [];
  var regex = /return\s*\([\s\S]*/g
  var match = regex.exec(stringToParse);
  if (match) {
    var firstResult = Helper.balancedParentheses(match[0], "(")
    result.push(firstResult);
    var newStringToParse = stringToParse.slice(match.index+firstResult.length);
    result = result.concat(processReturns(newStringToParse));
  }

  return result
}