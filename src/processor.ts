/* This function takes an array of imports and classifies them according to their name and properties, returning another array with these additional info*/
export function processImports(arr: { name: string; origin: string; all: boolean; }[]) {
 
  var result: { name: string; origin: string; all: boolean; follow?: boolean; type?: string }[] = arr;
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

export function processRoutes(routes: string, id: number) {
  var patt1 = /\w+:\s*\w+/g
  var patt2 = /\w+/g
  var result: {id: number, name: string, content: string, type: string, children?: any[], origin?: string, follow?: boolean}[] = [];
  var obj1 = routes.match(patt1);
  if(obj1) {
    obj1.forEach(item => {
      var obj2 = item.match(patt2);
      if (obj2) {
        result.push({
          id: id++,
          name: obj2[0],
          content: obj2[0],
          children: [{id: id++, name: obj2[1], content: obj2[1], type: "Navigational", children: [], origin: undefined, follow: true }],
          type: "Navigational",
          origin: "react-navigation",
          follow: true
        })

      }
    })
  }
  return result;
}