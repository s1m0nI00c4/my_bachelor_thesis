  /*This is a helper function that escapes any RegEx string so I don't have to think about that!*/
  export function regExpEscape(s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };
  
  /*This is a helper function that returns the content within the first occurrence of a certain type of matching parentheses*/
  export function balancedParentheses(stringToParse: string, char: string) {
    var result = "";
    if (char === "(" || "{" || "[" || "<") {
  
      var offset = null;
      
  
      if (char === "(")
        offset = 1;
      else
        offset = 2;
  
      const target = String.fromCharCode(char.charCodeAt(0) + offset);
  
      var openedParentheses = 0;
      var closedParentheses = 0;
      var index = 0;
      var start = 0;
  
      while (index < stringToParse.length) {
        if (stringToParse.charAt(index) === char) {
          if (openedParentheses === 0) {
            start = index;
          }
          openedParentheses++;
        } else if (stringToParse.charAt(index) === target) {
          closedParentheses++;
          if (openedParentheses === closedParentheses) 
            return stringToParse.slice(start+1, index);
        }
        index++;
      }
    }
    return result;
  }