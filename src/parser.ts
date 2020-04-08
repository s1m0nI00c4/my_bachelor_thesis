import {processImports, processRoutes} from "./processor";
import * as Helper from "./helper";

export function parseDoc(str: string) {

    var imports = parseForImports(str, []);
    //console.log(imports);
    var processedImports = processImports(imports);
    //console.log(processedImports);
  
    var myClass = parseForClass(str, "App");
    var myRender = parseForRender(myClass);
    var myComponents = parseForComponents(myRender);

    var myConsts = parseForConst(str);
    //console.log(myConsts);
    
    var componentsToFollow = followComponents(myComponents, processedImports);
    //console.log(componentsToFollow);
    var withNavigation = internalNavigation(componentsToFollow, myConsts);
    console.log(withNavigation);

  
}


function followComponents(components: {id: number, name: string, content: string, type: string, children?: any[], origin?: string, follow?: boolean}[] | any[], imports: { name: string; origin: string; all: boolean; follow?: boolean; type?: string }[]): {id: number, name: string, content: string, type: string, children?: any[], origin?: string, follow?: boolean}[] {

  var result =  components;
  result?.forEach(item => {

      var targetImport = imports.filter(function(elem) {return elem.name === item.name});
      if (targetImport[0]) {
        item.origin = targetImport[0].origin;
        item.follow = targetImport[0].follow;
      }
      else {
        item.origin = undefined;
        item.follow = true;
      }
      item.children = followComponents(item.children, imports); //Add children
  })

  return result;

}
  
/*This function that parses all 'imports' within a Javascript file, returning them in an array of strings*/
function parseForImports(str: string, arr: Array<string>): { name: string; origin: string; all: boolean }[] {
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
  
  function findDependencies(arr: Array<string>) {
    var result: { name: string; origin: string; all: boolean }[] = [];
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
  
  function parseForRender(stringToParse: string) {
    var result = "";
    var regex = new RegExp("render()[\\s\\S]*return[\\s\\S]*");
    var obj = stringToParse.match(regex);
    if (obj) {
      const newStringToParse = Helper.balancedParentheses(obj[0], "{");
      regex = new RegExp("return[\\s\\S]*")
      if (newStringToParse) {
        var newObj = newStringToParse.match(regex);
        if (newObj)
          result = Helper.balancedParentheses(newObj[0], "(");
      }     
    }
    return result;
  }
  /* This function parses all components inside a render method, puts them in the correct hierarchy and returns them as a JSON file */
  function parseForComponents(stringToParse: string) : {id: number, name: string, content: string, type: string, children?: any[]}[] {
    var patt1 = /(<\w+[^>]*>|<\w+ [\s\S]*\/>|<\/\w+>)/gs // Any component
    var patt2 = /<\w+[^\/>]*>/; //Opener of a wrapper
    var patt3 = /<\w+ [^\/]*\/>/; //Standalone component
    var patt4 = /<\/\w+>/; //Closer of a wrapper
    var JSONResult: {id: number, name: string, content: string, type: string}[] = [];
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
              }
            );
          } else {
            if (name)
            JSONResult.push(
              {
                id: id++,
                name: name[0],
                content: item,
                type: "Closer",
              }
            );
          }
        }
      });
    return hierarchify(JSONResult);
  }
  
  // This helper function takes a plain array of JSX Tags and, according to its rules, creates a JSON object representing the hierarchy of components
  function hierarchify(plainArray: {id: number, name: string, content: string, type: string}[] ): {id: number, name: string, content: string, type: string, children?: any[]}[] {
      var newArray: {id: number, name: string, content: string, type: string, children?: any[]}[]  = plainArray;
      var result: {id: number, name: string, content: string, type: string, children?: any[]}[] = [];
      if (newArray[0].type === "Opener") {  //In case the next element is a wrapper
        var closerIndex = -1;
        var i = 1;
        var nested = 0;
        while (i < newArray.length && closerIndex < 0) {  //Check for nested wrappers, find the matching closing tag using the "nested" index
          if (newArray[i].type === "Opener" && newArray[i].name === newArray[0].name) {
            nested++;
          } else if (newArray[i].type === "Closer" && newArray[i].name === newArray[0].name) {
            if (nested === 0) {
              closerIndex = i;
            } else {
              nested--;
            }
          }
          i++;
        }
        newArray[0].children = hierarchify(newArray.slice(1, closerIndex)); // Recursively hierarchify all elements inside the wrapper and set them as its children
        result.push(newArray[0]); // Hierarchify remaining elements after this one, if present
        if (newArray.length > closerIndex+1) {
          result.concat(hierarchify(newArray.slice(closerIndex+1)));
        }
      } else {  // In case the next element is a standalone
        newArray[0].children = [];  // Standalone elements are childless!
        result.push(newArray[0]);
        if (newArray.length > 1) {  // Hierarchify remaining elements after this one, if present
          result.concat(hierarchify(newArray.slice(1)));
        }
      }
      return result;
  }
function parseForConst(str: string) {

  var patt1 = /const\s*\w+\s*=\s*(createAppContainer|createSwitchNavigator|createBottomTabNavigator|createStackNavigator)\s*\([^\)]*\)/g //Catches a navigation component
  var patt2 = /const\s*\w+\s*=\s*{[^}]*}/g //Catches an object, usually a route
  var patt3 = /const\s*\w+\s*=\s*\([^)]*\)\s*=>\s*/g // Catches functional components (but NOT what's in their parentheses, just the header)
  var patt4 = /\w+/
  var result: any[] = [];
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

function internalNavigation(components: {id: number, name: string, content: string, type: string, children?: any[], origin?: string, follow?: boolean}[] | any[], consts: {name: string, content: string, type: string}[]) {
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



