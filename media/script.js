const vscode = acquireVsCodeApi();
  /*setInterval(() => {
              vscode.postMessage({
                  command: 'alert',
                  text: '🐛  on line '
              });
  }, 1000);*/

function myFunction(treeData) {
  
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


  // ************** Generate the tree diagram	 *****************
  var margin = {top: 20, right: 20, bottom: 20, left: 120},
    width = 960 + margin.right + margin.left,
    height = 720 + margin.top + margin.bottom;
    
  var i = 0,
    duration = 750,
    root;

  var tree = d3.layout.tree()
    .size([height, width]);
  
  d3.select("svg").remove();

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  root = treeData[0];
  root.x0 = height / 2;
  root.y0 = 0;

  root.children.forEach(collapse);
  
  update(root); // shows the view

  d3.select(self.frameElement).style("height", "720px");

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
  var y = document.getElementById("editButton");
  y.style.display = "block";
  update(root);             // We update the view
  
}
//This method recursively traverses the tree, stops if it finds the parent and pushes a child to it, otherwise travels up to the (shown) leaves.
//If the parent node is closed, the child is added nontheless, but it's hidden (the parent needs to be opened for the child to show up).
function traverseToAdd (current, target, newNode) {
  if (current.id === target.id) {
    if (current.children) {
      current.children.push(newNode);
    } else {
      current._children.push(newNode);
    }
  } else {
    if (current.children)
    current.children.forEach(function(c) {
      traverseToAdd(c, target, newNode);
    })
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
            .attr("transform", function(d) {return "translate(" + 10 + "," + d.position*40 + ")"});
       
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

    /*var legend = svg.selectAll(".legenda")
          .data(legenda)
          .enter()
          .append(text)
            .text(function(d) {return d.name})
            .attr("class", "legenda")
            .attr("transform", "translate(" + 10 + "," + d.position*20 + ")");
       
    legend.append("circle")
             .attr("r", 10)
             .attr("fill", d.color) 
             .attr("stroke", "white")
             .attr("stroke-width", "1px");
       
    legend.append("text")
             .text(function(d) {return d.name})
             .attr("class", "nodeName")
             .attr("transform", function(d) {return "translate(" + 15 + "," + 4 + ")";});*/

    /*// Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 18; });

    // Update the nodes…
    var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
      .on("click", click);

    nodeEnter.append("circle")
      .attr("r", 1e-6)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeEnter.append("text")
      .attr("x", function(d) { return d.children || d._children ? -13 : 13; })
      .attr("dy", ".35em")
      .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
      .attr("r", 10)
      .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
      .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

    nodeExit.select("circle")
      .attr("r", 1e-6);

    nodeExit.select("text")
      .style("fill-opacity", 1e-6);

    // Update the links…
    var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
      var o = {x: source.x0, y: source.y0};
      return diagonal({source: o, target: o});
      });

    // Transition links to their new position.
    link.transition()
      .duration(duration)
      .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
      var o = {x: source.x, y: source.y};
      return diagonal({source: o, target: o});
      })
      .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
    });
  }

  // Toggle children on click.
  function click(d) {
    if (d.children) {
    d._children = d.children;
    d.children = null;
    } else {
    d.children = d._children;
    d._children = null;
    }
    update(d);*/
  }

}

var newChild = [];
var displayMod = false;

function handleClick(treeData) {
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
  myFunction(treeData); //we update the SVG
  toggleForm();         //we hide the form
  var x = document.getElementsByClassName("alert");
  for (var i = 0; i < x.length; i++) {
    x[i].style.display = "block";
  }
}

// method to show/hide the form for adding a new node. Gets shown when someone clicks on the relative button. Gets hidden as soon as someone submits the form.

var form = false;

function toggleForm() {
  var x = document.getElementsByTagName("input");
  for (var i = 0; i < x.length; i++) {
    if (form === true) {
      x[i].style.display = "none";
    } else {
      x[i].style.display = "inline";
    }
  }
  form = !form;
} 

function toggleEditMode() {
  toggleForm();
  var x = document.getElementById("editButton");
  if (x.style.display === "none") {
    x.style.display = "block";
  } else {
    x.style.display = "none";
  }
}