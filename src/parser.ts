import {processImports, processRoutes} from "./processor";
import * as Helper from "./helper";
import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import * as ResourceFinder from './resourcefinder';

export interface Node {
  id: number;
  name: string;
  content: string;
  type: string;
  children: Node[];
  origin?: string;
  follow?: boolean;
  blob?: string;
}

export interface Dependencies {
  name: string;
  origin: string;
  all: boolean;
  follow?: boolean;
  type?: string;
}

interface Consts {
  name: string;
  content: string;
  type: string;
}

interface Exports {
  name: string;
  default: boolean;
  type: string;
  content?: string;
}

export async function parseDoc(str: string) {

    var result: Node[] = [];

    var imports: Dependencies[] = parseForImports(str, []);
    //console.log("My imports");
    //console.log(imports);
    var processedImports: Dependencies[] = processImports(imports);
    //console.log("My processed imports");
    //console.log(processedImports);

    var myConsts: Consts[] = parseForConst(str);
    //console.log("My consts")
    //console.log(myConsts);
  
    var myExports = parseForExports(str);
    //console.log("---My Exports---");
    //console.log(myExports);
    var exportedComponents = retrieveExports(myExports, str);
    //console.log("My exported Components");
    //console.log(exportedComponents);
    /*var myClass: string = parseForClass(str, "Login");
    console.log("My class:");
    console.log(myClass);*/
    var myRender: Exports[] = parseForRender(exportedComponents);
    //console.log("My render:")
    //console.log(myRender);
    if (myRender.length === 1) {
      if (myRender[0].content) {
      var myComponents: Node[] = parseForComponents(myRender[0].content);
      //console.log("My Components: ")
      //console.log(myComponents);
      var componentsToFollow: Node[] = followComponents(myComponents, processedImports);
      //console.log("Components to follow:")
      //console.log(componentsToFollow);
      var withNavigation: Node[] = internalNavigation(componentsToFollow, myConsts);
      var withNavigation2: Node[] = followComponents(withNavigation, processedImports);
      //console.log("With Navigation 2: ")
      //console.log(withNavigation2);
      var allResources: Node[] = await ResourceFinder.findResources(withNavigation2);
      //console.log("All Resources:");
      //console.log(allResources);
      result = allResources;
      }
    }

    return result
  
}

export async function repeatParseDoc(initial: Node[]): Promise<Node[]> {
  var result: Node[] = initial;
   for (var item of result) {
    if (item.blob && (!item.children || item.children.length === 0)) {
      //console.log("LEAF: " + item.name)

      item.children = await parseDoc(item.blob);
      item.blob = "";

    } 
    item.children = await repeatParseDoc(item.children);
  }
  return result;

}


function followComponents(components: Node[], dependencies: Dependencies[]): Node[] {

  var result =  components;
  result?.forEach(item => {

      var targetImport = dependencies.filter(function(elem) {return elem.name === item.name});
      if (targetImport[0]) {
        item.origin = targetImport[0].origin;
        item.follow = targetImport[0].follow;
      }
      else {
        item.origin = undefined;
        item.follow = true;
      }
      item.children = followComponents(item.children, dependencies); //Add children
  })

  return result;

}
  
/*This function that parses all 'imports' within a Javascript file, returning them in an array of strings*/
function parseForImports(str: string, arr: Array<string>): Dependencies[] {
  var obj = /import.*;/.exec(str);
  if (obj !== null) {
    var parsedString = obj[0];
    arr.push(parsedString);
    var rest = str.slice(obj.index+parsedString.length);
    return parseForImports(rest, arr);
  } else {
    return findDependencies(arr);
  }
}
  
  function findDependencies(arr: Array<string>): Dependencies[] {
    var result: Dependencies[] = [];
    var patt1 = /import\s+/; // captures import keyword
    var patt2 = /[a-zA-Z]*\s*,\s*(\{|\*)/;  // f.e.:  "import x, {something else} from y" or "import x, * as y from z"
    var patt3 = /\w+\s+from/;  // f.e.:  import x from "y"
    var patt4 = /\{[^\}]*\}\s+/;  // f.e.:  import {something something} from "y"
    var patt5 = /\*\s+as\s+\w+/;  // f.e.:  import * as x from "y" 
    var patt6 = /("|')[\s\S]*("|')/; // captures from statement
    arr.forEach((item) => {
      var obj1 = patt1.exec(item);
      if (obj1) {
        var rest = item.slice(obj1.index+obj1[0].length); //slices the "import " keyword away
        var obj2 = patt2.exec(rest);
        var obj3 = patt3.exec(rest);
        var obj4 = patt4.exec(rest);
        var obj5 = patt5.exec(rest);
        var obj6 = patt6.exec(rest);
        if (obj2 && obj6) {
          var myName = obj2[0].match(/\w+/);
          if (myName)
          result.push({
            name: myName[0],
            origin: obj6[0].slice(1,-1),
            all: false,
          })
          var obj7 = rest.match(/\{[^\}]*\}/);
          var obj8 = rest.match(/\*\s+as\s+\w+/);
          if (obj7) {
           result = result.concat(dependenciesWithinCurly(obj7[0], obj6[0].slice(1,-1)))
          } else if (obj8) {
            var myName = obj8[0].match(/\b(?!as)\b\S+/g);
            if (myName)
            result.push({
              name: myName[0],
              origin: obj6[0].slice(1,-1),
              all: true
            })
          }
        } else if (obj5 && obj6) {
          var obj8 = rest.match(/\*\s+as\s+\w+/);
            if (obj8) {
              const myName = obj8[0].match(/\b(?!as)\b\S+/g);
              if (myName)
              result.push({
                name: myName[0],
                origin: obj6[0].slice(1,-1),
                all: true
              })
            }
          } else if (obj4 && obj6) {
            result = result.concat(dependenciesWithinCurly(obj4[0],obj6[0].slice(1,-1)));
          } else if (obj3 && obj6) {
            const myName = obj3[0].match(/\w+/);
            if (myName)
            result.push({
              name: myName[0],
              origin: obj6[0].slice(1,-1),
              all: false,
            })
  
          }
      }
      
    });
    return result;
  }
  
  /* This is a helper function to findDependencies. Returns an array of dependencies for all the imports within curly parentheses*/
  function dependenciesWithinCurly(rest: string, from: string) {
    var deps = rest.match(/\w+/g);
    var result: { name: string; origin: string; all: boolean }[] = [];
    if (deps) {
      deps.forEach((item) => {
        result.push({
          name: item,
          origin: from,
          all: false
        })
      })
    }
    return result;
  }
  
  function parseForExports(stringToParse: string) {
    var patt1 = /(export\s*default\s*function[\s\S]*|export\s*default\s*\w+)/gm          // Find all the export default statements
    var patt1a = /export\s*default\s*function[\s\S]*/gm
    var patt1b = /export\s*default\s*class[\s\S]*/gm
    var patt1c = /export\s*default\s*\w+/gm
    var patt2 = /export\s*{[^}]*}/gm                                                      // Find all the export + parentheses statements
    var patt3 = /export\s*\*\s*from/gm                                                    // Find the export * statement
    var patt4 = /(export\s*let|export\s*const|export\s*var)\s*[^;]*/gm                    // Find all the export let, export var and export const statements

    var result = [];
    var obj1 = patt1a.exec(stringToParse);
    var obj2 = patt1b.exec(stringToParse);
    var obj3 = patt1c.exec(stringToParse);
    if (obj1 || obj2 || obj3) {
      if (obj1) {
        var patt5 = /export\s*default\s*function\s*\w+/gm;
        var obj4 = patt5.exec(obj1[0]);
        var patt6 = /\w+/gm;
        if (obj4) {
          var words = obj4[0].match(patt6);
          if (words)
          result.push({
            name: words[3],
            default: true,
            type: "Function"
          })
        }  
      } else if (obj2) {
        var patt5 = /export\s*default\s*class\s*\w+/gm;
        var obj4 = patt5.exec(obj2[0]);
        var patt6 = /\w+/gm;
        if (obj4) {
          var words = obj4[0].match(patt6);
          if (words) {
          result.push({
            name: words[3],
            default: true,
            type: "Class",
          })}
        } 

      } else if (obj3) {
        var patt5 = /export\s*default\s*\w+/gm;
        var obj4 = patt5.exec(obj3[0]);
        var patt6 = /\w+/gm;
        if (obj4) {
          var words = obj4[0].match(patt6);
          if (words)
          result.push({
            name: words[2],
            default: true,
            type: "Expression",
          })
        }

      }
    }

    return result;

  }

  function retrieveExports(exports: Exports[], stringToParse:string) {

    var result: Exports[] = exports;
    result.forEach(item => {
      if (item.type === "Expression") {
        var regex = new RegExp("const " + item.name + "[\\s\\S]*");
        var obj = stringToParse.match(regex);
        if (obj) {
          item.content = obj[0]
        }  
      } 
      else if (item.type === "Class") {
        item.content = parseForClass(stringToParse, item.name);
      }
    })
    return result;
  }
  
  /*This function parses a Javascript file for a specific class, returning it if successful*/
  function parseForClass(stringToParse: string, className:string) {
    var regex = new RegExp("class " + className + "[\\s\\S]*");
    var obj = stringToParse.match(regex);
    var result = "";
    if (obj)
      result = Helper.balancedParentheses(obj[0], "{");
    return result;
  }
  
  /*This function parses a Javascript Class for its render() method*/
  
  function parseForRender(exports: Exports[]) {
    var result: Exports[] = exports;
    var regexC = new RegExp("render()[\\s\\S]*return[\\s\\S]*");
    var pattExp = /return\s*\([\s\S]*/g
    result.forEach(item => {
      if (item.content) {
        if (item.type === "Class") {
          var obj = item.content.match(regexC);
          if (obj) {
            const newStringToParse = Helper.balancedParentheses(obj[0], "{");
            var regex = new RegExp("return[\\s\\S]*")
            if (newStringToParse) {
              var newObj = newStringToParse.match(regex);
              if (newObj)
                item.content = Helper.balancedParentheses(newObj[0], "(");
            }     
          }
        }
        else if (item.type === "Expression") {
          var obj = item.content.match(pattExp);
          if (obj) {
            item.content = Helper.balancedParentheses(obj[0], "(");
   
          }

        }
      }
    })
   
    return result;
  }
  /* This function parses all components inside a render method, puts them in the correct hierarchy and returns them as a JSON file */
  function parseForComponents(stringToParse: string): Node[] {
    
    var patt1 = /(<\w+[^(\/>)]*>|<[A-Z][A-Za-z]*[^\/]*\/>|<\/\w+>)/gs // Any component
    var patt2 = /<\w+[^(\/>)]*>/; //Opener of a wrapper
    var patt3 = /<[A-Z][A-Za-z]*[^\/]*\/>/; //Standalone component
    var patt4 = /<\/\w+>/; //Closer of a wrapper
    var JSONResult: Node[] = [];
    var id = 0;
    var result = stringToParse.match(patt1);
    result?.forEach((item) => {
        var test1 = item.match(patt2);
        var name = item.match(/\w+/);
        
        if (test1 && name) {
          JSONResult.push(
            {
              id: id++,
              name: name[0],
              content: item,
              type: "Opener",
              children: [],
            }
          );
        } else {
          var test2 = item.match(patt3);
          if (test2 && name) {
            JSONResult.push(
              { 
                id: id++,
                name: name[0],
                content: item,
                type: "Standalone",
                children: [],
              }
            );
          } else {
            var test3 = item.match(patt4);
            if (name && test3) {
              JSONResult.push(
                {
                  id: id++,
                  name: name[0],
                  content: item,
                  type: "Closer",
                  children: [],
                }
              );
            }
          }
        }
    });

   return hierarchify(JSONResult);
   //return JSONResult;
  }
  
  // This helper function takes a plain array of JSX Tags and, according to its rules, creates a JSON object representing the hierarchy of components
  function hierarchify(plainArray: Node[] ): Node[] {
      var newArray: Node[]  = plainArray;
      var result: Node[] = [];
      if (plainArray) {

        var i = 0;
        while (i < newArray.length) {
          if (newArray[i].type === "Opener") {
            var openers = 1;
            var closers = 0;
            var cc  = i+1;  //cc = Current Considered
            while (cc < newArray.length && openers != closers) {
              if (newArray[cc].type === "Closer") {
                ++closers;
              } else if (newArray[cc].type === "Opener") {
                ++openers;
              }
              //console.log("Values are = openers: " + openers + "; closers: " + closers + "; cc: " + cc + ". Current cc: " + newArray[cc].name + " - " + newArray[cc].type)
              cc = cc +1;
            }
            newArray[i].children = hierarchify(newArray.slice(i+1, cc-1));
            result.push(newArray[i]);
            i = cc;

          } else if (newArray[i].type === "Standalone") {
            result.push(newArray[i]);
            ++i;

          } else {
            console.log("CLOSER");
            ++i;
          }
        }

      }
      
      return result;
  }
function parseForConst(str: string): Consts[] {

  var patt1 = /const\s*\w+\s*=\s*(createAppContainer|createSwitchNavigator|createBottomTabNavigator|createStackNavigator)\s*\([^\)]*\)/g //Catches a navigation component
  var patt2 = /const\s*\w+\s*=\s*{[^}]*}/g //Catches an object, usually a route
  var patt3 = /const\s*\w+\s*=\s*\([^)]*\)\s*=>\s*/g // Catches functional components (but NOT what's in their parentheses, just the header)
  var patt4 = /\w+/ // Catches the first word.
  var result: Consts[] = [];
  var obj1 = str.match(patt1);
  if (obj1) { // Looks for navigation components, extracts their name and the first argument (routes)
    obj1.forEach(item => {
      var name = patt4.exec(item.slice(5));
      var content = patt4.exec(Helper.balancedParentheses(item, "("));
      var type = "Navigation component"
      if (name && content)
      result.push({
        name: name[0],
        content: content[0],
        type: type
      })
    })
  }
  var obj2 = str.match(patt2);
  if (obj2) { // Looks for generic objects, hoping they are routes
    obj2.forEach(item => {
      var name = patt4.exec(item.slice(5));
      var content = Helper.balancedParentheses(item, "{");
      var type = "General object"
      if (name)
      result.push({
        name: name[0],
        content: content,
        type: type
      })
    })
  }
  var match;
  while ((match = patt3.exec(str)) != null) { // Looks for functional components (components defined as functions)
    var stringedName = match.toString();
    var name = patt4.exec(stringedName.slice(5));
    var content = Helper.balancedParentheses(str.slice(match.index + match.length), "{");
    var type = "Functional element";
    if (name) {
      result.push({
        name: name[0],
        content: content,
        type: type
      })
    }
  }
  return result;
}

function internalNavigation(components: Node[] | any[], consts: Consts[]): Node[] {
var navs = consts.filter( function(item) {if (item.type==="Navigation component") return item}) // Filters out all navigation components produced
var routes = consts.filter( function(item) {if (item.type==="General object") return item}) // Filters out all possible routes objects encountered
var result = components;
result.forEach(item => {
  if (!item.origin && item.follow === true) { // check if its a possible navigation component
    var possibleNavs = navs.filter(function(i) {if (item.name === i.name) return i}) // check if its defined among navigation components
    if (possibleNavs[0]) {
      var newChild = [{ // creates new child that substitutes the current
        id: item.id+1,
        name: possibleNavs[0].content,
        type: "Navigational",
        children: item.children,
        origin: undefined,
        follow: true
      }]
      item.origin = "react-navigation";  // the current component doesn't need any more processing
      item.follow = false;
      item.children = newChild;
    } else {
      var possibleRoutes = routes.filter(function(i) {if (item.name === i.name) return i}) // if it's not a navigation component maybe it's a route object
      if (possibleRoutes[0]) {
        item.origin = "react-navigation"
        item.follow = "false"
        item.children = processRoutes(possibleRoutes[0].content, item.id)
      } else {
        item.origin = undefined;
        item.follow = false;
      }
    } 
  }
  if (item.children.length > 0) { // recursively repeat this for the new children we've just created :-)
    internalNavigation(item.children, consts);
  }
})

return result;

}