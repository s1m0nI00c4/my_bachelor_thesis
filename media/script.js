const vscode = acquireVsCodeApi();

  var legenda = [
    {
      "name": "State Management",
      "color": "red",
      "position": 1,
    },
    {
      "name": "Navigation",
      "color": "yellow",
      "position": 2,
    },
    {
      "name": "React Native",
      "color": "green",
      "position": 3,
    },
    {
      "name": "Other components",
      "color": "black",
      "position": 4,
    },
    {
      "name": "User defined",
      "color": "violet",
      "position": 5,
    }
  ];

var root;
var i = 0;
var svg;
var tree;
var margin = {top: 20, right: 20, bottom: 20, left: 440},
width = 960 + margin.right + margin.left,
height = 720 + margin.top + margin.bottom;
var newChild = [];
var displayMod = false;
var removeMod = false;

function myFunction(treeData) {


  // ************** Generate the tree diagram	 *****************

  tree = d3.layout.tree()
    .size([height, width]);
  
  d3.select("svg").remove();

  svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


  const previousState = vscode.getState();
  if (previousState) {
    console.log("INNN");
    root = previousState.source;
  } else {
    root = treeData[0];
  }

  root.x0 = width / 2;
  root.y0 = 0;
  root.children.forEach(collapse);
  
  update(root); // shows the view

  d3.select(self.frameElement).style("height", "720px");

}

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d.children.forEach(collapse);
    d.children = null;
  }
}

function click(d) {
  if (d.children) {
      d._children = d.children;
      d.children = null;
      height = height -180;
      width = width - (d._children.length-1)*180;
  } else {
    if (d._children.length > 0) {
      d.children = d._children;
      d._children = null;
      height = height + 180;
      width = width + (d.children.length-1)*180;
    }
  }
  d3.select("svg").attr("width", width)
     .attr("height", height);
  update(root);

}

function toggle(d) {
  if(d.on) {
    d.on = false;
  }
  else {
    d.on = true;
  }
  update(root);
}

function defineColor(d) {
  result = "";
  if (d._children) {
    if (d.origin === "unstated") {
      result = "red";
    } else if (d.origin === "react-native") {
      result = "green";
    } else if (d.origin === "react-navigation" || d.type === "Navigational"|| d.name === "AppContainer") {
      result = "yellow";
    } else if (d.origin === "user-defined") {
      result = "violet";
    }

  } else {
    result = "white";
  }
  return result;
}

function openDoc(d) {
  vscode.postMessage({
    command: 'alert',
    text: d.myUri.path,
  });
}

function refresh() {
  console.log("IN");
  vscode.postMessage({
    command: 'refresh',
    text: "refresh",
  });
}

function defineURL(d) {
  result = "";
  if (d.origin === "unstated") {
    result = "https://github.com/jamiebuilds/" + d.origin;
  } else if (d.origin === "react-native") {
    result = "https://reactnative.dev/docs/" + d.name.toLowerCase();
  } else if (d.origin === "react-navigation" || d.type === "Navigational" || d.name === "AppContainer") {
    result = "https://reactnavigation.org/docs/getting-started";
  } else {
  result = "https://www.google.com"
  }
  return result;
}

function addNode(d) {
var newNode = [];
if (newChild[0]) {
  newNode[0] = newChild[0];
} else {
  newNode.push({
    name: "Some component",
    id: d.id,
    type: "User defined",
    origin: "user-defined",
    content: "Some content",
    children: [],
    _children: [],
    myUri: null,
    on: false
  })
}
if (d.id === root.id) {
  console.log("ok");
  root.children.push(newNode[0]);
} 
else {
  if (root.children) {
    root.children.forEach(function(child){
      traverseToAdd(child, d, newNode[0]);
    })
  }
}
displayMod = false;       // We're not in editing mode anymore  
var x = document.getElementsByClassName("alert");
for (var i = 0; i < x.length; i++) {
  x[i].style.display = "none";
}
toggleButtons();
update(root);             // We update the view 
}

function removeNode(d) {
  if (d.id === root.id) {
    svg.selectAll(".node").remove();
    svg.selectAll(".link").remove();
  } else {
    root.children.forEach(function(child){
      traverseToRemove(root, child, d);
    })
  }
  update(root);
  toggleRemoveMode();
}

function traverseToRemove(parent, current, target) {
if (current.id === target.id) {
  var newChildren = [];

    parent.children.forEach(function(child) {
      if (child.id != target.id) {
        newChildren.push(child);
      }
    })
    parent.children = newChildren;
  
} else {
  if (current.children) {
    current.children.forEach(function(c){
      traverseToRemove(current, c, target)
    })
  }
}
}


//This method recursively traverses the tree, stops if it finds the parent and pushes a child to it, otherwise travels up to the (shown) leaves.
//If the parent node is closed, the child is added nontheless, but it's hidden (the parent needs to be opened for the child to show up).
function traverseToAdd (current, target, newNode) {
if (current.id === target.id) {
  if (current.children) {
    current.children.push(newNode);
  } else {
    current._children.push(newNode);
    click(current);
  }
} else {
  if (current.children)
  current.children.forEach(function(c) {
    traverseToAdd(c, target, newNode);
  })
}
}

function handleClick() {
  newChild = [];
  newChild.push({
    name: document.getElementById("name").value ? document.getElementById("name").value : "New name",
    content: document.getElementById("content").value ? document.getElementById("content").value : "New content",
    id: document.getElementById("id").value ? document.getElementById("id").value : 0,
    type: "User defined",
    origin: "user-defined",
    children: [],
    _children: [],
    myUri: null,
    on: false
  })
  displayMod = true;    //now we need to decide where to add our new node
  update(root); //we update the SVG
  toggleForm();         //we hide the form
  var x = document.getElementsByClassName("alert");
  for (var i = 0; i < x.length; i++) {
    x[i].style.display = "block";
  }
}

// method to show/hide the form for adding a new node. Gets shown when someone clicks on the relative button. Gets hidden as soon as someone submits the form.
var form = false;

function toggleForm() {
  var x = document.getElementsByTagName("Input");
  for (var i = 0; i < x.length; i++) {
    if (form === false) {
      x[i].style.display = "inline";
    } else {
      x[i].style.display = "none";
    }
  }
  form = !form;
} 

function toggleEditMode() {
  toggleButtons();
  toggleForm();
}

function toggleRemoveMode() {
  removeMod = !removeMod;
  update(root);
  
}

function toggleButtons() {
  var x = document.getElementsByTagName("Button");
  for (var i = 0; i < x.length; i++) {
    if (x[i].style.display === "none") {
      x[i].style.display = "inline";
    } else {
      x[i].style.display = "none";
    }
  }
}

function update(source) {

  //remove everything there was before
  svg.selectAll("*").remove();

  // Enter and style the color legend of the scheme
  var legend = svg.selectAll(".legenda")
        .data(legenda)
        .enter()
        .append("g")
          .attr("class", "legenda")
          .attr("transform", function(d) {return "translate(" + -margin.left + "," + d.position*40 + ")"});
     
  legend.append("circle")
           .attr("r", 10)
           .attr("fill", function(d) {return d.color}) 
           .attr("stroke", "white")
           .attr("stroke-width", "1px");
     
  legend.append("text")
           .text(function(d) {return d.name})
           .attr("class", "nodeName")
           .attr("transform", function(d) {return "translate(" + 15 + "," + 4 + ")";});

  // Compute the new tree layout.
  var nodes = tree.nodes(source).reverse()
  nodes.forEach(function(d){ d.y = d.depth * 180});
  var links = tree.links(nodes);

  //Enter the node data and transform their positions
  var node = svg.selectAll(".node")
                .data(nodes.reverse())
                .enter()
                .append("g")
                  .attr("class", "node")
                  .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";})
  // Every node is a circle
  node.append("circle")
      .attr("r", 10)
      .attr("fill", defineColor) 
      .attr("stroke", "white")
      .attr("stroke-width", "1px")
      .on("click", click)
      .style("cursor", "pointer");
  // + which allows to add a node as a child to this node. It is shown depending on the displaymod status, i.e. if we're in editing mode
  node.append("text")
      .text("+")
      .attr("class", "plusButton")
      .on("click", addNode)
      .attr("transform", function(d) {return "translate(" + -30 + "," + 8 + ")";})
      .style("display", function() {return displayMod ? "block" : "none"});
  node.append("text")
      .text("x")
      .attr("class", "xButton")
      .on("click", removeNode)
      .attr("transform", function(d) {return "translate(" + -30 + "," + 6 + ")";})
      .style("display", function() {return removeMod ? "block" : "none"});
  // Node name
  node.append("text")
      .text(function(d) {return d.name})
      .attr("class", "nodeName")
      .attr("transform", function(d) {return "translate(" + 15 + "," + 4 + ")";});
  // +/- symbol which hides/shows the node's details
  node.append("text")
      .text(function(d) {return d.on ? "-" : "+"})
      .attr("class", "plus")
      .attr("transform", function(d) {return "translate(" + 15 + "," + 20 + ")";})
      .on("click", toggle)
      .style("cursor", "pointer");
  // Text for the tag content
  node.append("text")
      .text(function(d) {return d.on ? d.content : ""})
      .attr("class", "nodeContent")
      .attr("transform", function(d) {return "translate(" + 15 + "," + 36 + ")";});
  // Text for the tag ID
  node.append("text")
      .text(function(d) {return d.on ? "ID: " + d.id : ""})
      .attr("class", "nodeContent")
      .attr("transform", function(d) {return "translate(" + 15 + "," + 52 + ")";});
  // Button to open the local file containing the tag
  node.append("text")
      .text(function(d) {return d.on ? "OPEN LOCAL FILE" : ""})
      .attr("transform", function(d) {return "translate(" + 15 + "," + 68 + ")";})
      .attr("class", "button")
      .on("click", openDoc)
  //Button to show outside documentation
  var nodeLinks = node.append("a")
      .attr("transform", function(d) {return "translate(" + 15 + "," + 84 + ")";})
      .attr("xlink:href", defineURL);
  nodeLinks.append("text")
      .text(function(d) {return d.on ? "OPEN DOCUMENTATION" : ""})
      .attr("class", "button")

  var diagonal = d3.svg.diagonal();

  //links.forEach(function(d) { console.log("source " + d.source.x + " " + d.source.y + " target " + d.target.x + " " + d.target.y)})

  svg.selectAll(".link")
        .data(links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "white")
        .attr("d", diagonal);

  vscode.setState({source});

}