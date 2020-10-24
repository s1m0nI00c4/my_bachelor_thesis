var form = false;
var root;
var i = 0;
var svg;
var tree;
var margin = {top: 20, right: 20, bottom: 20, left: 440},
width = 720 + margin.right + margin.left,
height = 360 + margin.top + margin.bottom;
var newChild = [];
var displayMod = false;
var editMod = false;
var removeMod = false;
var startingPointMod = false;
var startingPoint;
var myProps;

function prepareView(treeData, refreshMode) {

  // ************** Starting point	 *****************

  var body = document.getElementsByTagName("body")[0];
  var spToggle = document.createElement("p");
  spToggle.innerHTML = "Change starting point";
  spToggle.id = "spToggle";
  body.appendChild(spToggle);
  spToggle.onclick = toggleStartingPointForm;

  var SPForm = document.createElement("form");
  body.appendChild(SPForm);
  SPForm.name = "StartingPointForm";
  SPForm.onsubmit = setStartingPoint;

  var input5 = document.createElement("input");
  input5.type = "text";
  input5.id = "startingPointName";
  input5.placeholder = "Enter the starting point of your App (f.e. 'App.js')";
  input5.classList = "startingPointInput";
  input5.width = 360;
  SPForm.appendChild(input5);

  var input6 = document.createElement("input");
  input6.type = "submit";
  input6.id = "startingPointSubmit";
  input6.value = "Submit";
  input6.classList = "startingPointInput";
  SPForm.appendChild(input6);

  var spCancel = document.createElement("p");
  spCancel.innerHTML = "Cancel";
  spCancel.id = "spCancel";
  body.appendChild(spCancel);
  spCancel.onclick = toggleStartingPointForm;

  // ************** Generate the tree diagram	 *****************

  var vscode = acquireVsCodeApi();
  const previousState = vscode.getState();

  if (previousState && !refreshMode) {
      root = previousState.src;
      console.log(previousState.height + " - " + previousState.width);
      height = previousState.height;
      width = previousState.width;
      startingPoint = previousState.sp;
      console.log(startingPoint);
  } else {
      root = treeData[0];
      root.children.forEach(collapse);
  }

  setCanvas();
  setTreeSize();

  update(root); // shows the view

  // ************** Add buttons *****************

  /* Add addButton */
  var addButton = document.createElement("button");
  addButton.innerHTML = "Add node";
  body.appendChild(addButton);
  addButton.addEventListener("click", toggleAddMode);

  /* Add editButton */
  var editButton = document.createElement("button");
  editButton.innerHTML = "Edit node";
  body.appendChild(editButton);
  editButton.addEventListener("click", toggleEditMode);

  /* Add removeButton */

  var removeButton = document.createElement("button");
  removeButton.innerHTML = "Remove node";
  body.appendChild(removeButton);
  removeButton.addEventListener("click", toggleRemoveMode);

  /* Add refreshButton */

  var refreshButton = document.createElement("button");
  refreshButton.innerHTML = "Refresh tree";
  body.appendChild(refreshButton);
  refreshButton.addEventListener("click", handleRefresh);
  refreshButton.id = "refresh";

  /* Add form */

  var thisForm = document.createElement("form");
  body.appendChild(thisForm);
  thisForm.name = "myform";
  thisForm.onsubmit = handleClick;

  var input1 = document.createElement("input");
  input1.type = "number";
  input1.id = "nodeID";
  input1.classList = "addForm";
  input1.placeholder = "Node ID";
  thisForm.appendChild(input1);

  var input2 = document.createElement("input");
  input2.type = "text";
  input2.id = "name";
  input2.classList = "addForm";
  input2.placeholder = "Node name";
  thisForm.appendChild(input2);

  var input3 = document.createElement("input");
  input3.type = "text";
  input3.id = "content";
  input3.classList = "addForm";
  input3.placeholder = "Node content";
  thisForm.appendChild(input3);

  var input4 = document.createElement("input");
  input4.type = "text";
  input4.id = "props";
  input4.classList = "addForm";
  input4.placeholder = "Props (separated by single space)";
  thisForm.appendChild(input4);

  var input5 = document.createElement("input");
  input5.type = "submit";
  input5.id = "submit";
  input5.classList = "addForm";
  input5.value = "Add to graph";
  thisForm.appendChild(input5);

  /* Add alert */

  var alertText = document.createElement("p");
  alertText.classList = "alert";
  alertText.innerHTML = "Click on the blue plus to add your new node to the desired parent";
  body.appendChild(alertText);

  /* Cancel button */

  var cancelButton = document.createElement("p");
  cancelButton.classList = "cancelButton";
  cancelButton.innerHTML = "Cancel";
  cancelButton.addEventListener("click", handleCancel);
  body.appendChild(cancelButton);

  // ************** Functions	 *****************

  /* function to handle a click on a single node (expand/collapse) */
  function click(d) {
    if (d.children) { //hide children
        d._children = d.children;
        d.children = null;
        height = height -180;
        width = width - (d._children.length-1)*180;
    } else {
      if (d._children.length > 0) { //show children
        d.children = d._children;
        d._children = null;
        height = height + 180;  
        width = width + (d.children.length-1)*180;   
      }
    }
    d3.select("svg").attr("width", width)
       .attr("height", height);
    setTreeSize();
    update(root);
  }

  /* function to open/close details on a node */
  function toggle(d) {
    if(d.on) {
      d.on = false;
    }
    else {
      d.on = true;
    }
    update(root);
  }

  /* Function to open documentation on a node */
  function openDoc(d) {
    vscode.postMessage({
      command: 'alert',
      text: d.myUri.path,
    });
  }

  /*Functions to handle the refreshing of the graph */
  function handleRefresh() {
    var refButt = document.getElementById("refresh");
    refButt.innerHTML = "Loading...";
    refButt.style.background = "grey";
    refButt.style.cursor = "wait";
    refresh();
  }
  
  /* sends a message to the extension to trigger the refreshing of the graph*/
  function refresh() {
    console.log(startingPoint);
    vscode.postMessage({
      command: 'refresh',
      text: vscode.getState().sp ? vscode.getState().sp : "App.js",
    });
  }

  function setStartingPoint() {
    var subButt = document.getElementById("startingPointSubmit");
    subButt.value = "Loading...";
    subButt.style.background = "grey";
    subButt.style.color = "white";
    subButt.style.display = "inline";
    subButt.style.cursor = "wait";
    var sp = document.getElementById("startingPointName").value ? document.getElementById("startingPointName").value : "App.js";
    vscode.postMessage({
      command: 'refresh',
      text: sp,
    });
    
  }

  /*function that adds a node and updates the graph accordingly*/
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
      x[i].innerHTML = "Click on the blue plus to add your new node to the desired parent";
      x[i].style.display = "none";
    }
    toggleButtons();
    toggleCancel();
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
        click(current);
    }
    } else {
      if (current.children)
        current.children.forEach(function(c) {
          traverseToAdd(c, target, newNode);
      })
    }
  }
  /* Function to edit an existing node */

  function toggleEditMode() {
    toggleButtons();
    toggleCancel();
    editMod = !editMod;
    var x = document.getElementsByClassName("alert");
      for (var i = 0; i < x.length; i++) {
        x[i].innerHTML = "Click on the blue E next to the node you wish to edit";
        x[i].style.display = "block";
      }
      update(root);
  }

  function editNode(d) {
    var x = document.getElementsByClassName("alert");
    for (var i = 0; i < x.length; i++) {
        x[i].innerHTML = "Click on the blue plus to add your new node to the desired parent";
        x[i].style.display = "none";
    }

    toggleForm();

    var y = document.getElementsByClassName("addForm");
    for (var i = 0; i < y.length; i++) {
      if (y[i].id === "nodeID") {
        y[i].value = d.id;
      } else if (y[i].id === "name") {
        y[i].value = d.name;
      } else if (y[i].id === "content") {
        y[i].value = d.content;
      } else if (y[i].id === "props") {
        var result = "";
        d.props.forEach(item => {
          var propString = item.name + "=" + item.value + ", ";
          result = result.concat(propString);
        })
        y[i].value = result;
      }
    }

  }

  function traverseToEdit(current) {
    if (current.id === newChild[0].id) {
      current.name = newChild[0].name;
      current.content = newChild[0].content;
      current.props = newChild[0].props;
      newChild = [];
    } else {
      if (current.children) {
        current.children.forEach(item => {
          traverseToEdit(item);
        })
      } else if (current._children) {
        current._children.forEach(item => {
          traverseToEdit(item);
        })
      }
    }

  }

  /*function that opens the remove modality*/
  function toggleRemoveMode() {
    removeMod = !removeMod;
    toggleCancel();
    update(root);
    
  }

  /* Function to remove the node */
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
  
  /* This Helper function traverse the whole tree and removes the node I clicked on */
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

  /* This function handles the submission of the form containing information about the new node*/
  function handleClick() {
    childProps = document.getElementById("props").value ? document.getElementById("props").value : "";
    cpArr = childProps.split(',');
    var propArr = [];
    if (cpArr) {
      cpArr.forEach(item => {
        elements = item.split('=');
        if (elements.length === 2) {
          propArr.push({
            name: elements[0],
            value: elements[1]
          })
        }

      })
    }
    newChild = [];
    newChild.push({
      name: document.getElementById("name").value ? document.getElementById("name").value : "New name",
      content: document.getElementById("content").value ? document.getElementById("content").value : "New content",
      id: document.getElementById("nodeID").value ? document.getElementById("nodeID").value : 0,
      type: "User defined",
      origin: "user-defined",
      children: [],
      _children: [],
      props: propArr,
      myUri: null,
      on: false
    })

    if (editMod) { // then we're in Edit Mode
    editMod = !editMod;
    traverseToEdit(root);
    toggleForm();
    toggleButtons();
    toggleCancel();
    update(root);

    } else {       // then we're in Adding Mode
      displayMod = true;                                //now we need to decide where to add our new node
      toggleForm();                                     //we hide the form 
      var x = document.getElementsByClassName("alert"); //we show the alert
      for (var i = 0; i < x.length; i++) {
        x[i].style.display = "block";
      }
      update(root);
    }
  }

  /* Function associated with cancel button */

  function handleCancel() {
    if (removeMod === true) {
      removeMod = false;
    }
    if (displayMod === true) {
      displayMod = false;
      toggleButtons();
    }
    if (editMod === true) {
      editMod = false;
      toggleButtons();
    }
    var x = document.getElementsByClassName("alert");
      for (var i = 0; i < x.length; i++) {
        x[i].style.display = "none";
      }
    var y = document.getElementsByClassName("addForm");
    if (y[0].style.display === "inline") {               //If the addForm is displayed, hide it and show the buttons again
      for (var i = 0; i < y.length; i++) {
        y[i].style.display = "none";
      }
      form = !form;
      console.log("IN");
      var z = document.getElementsByTagName("Button");
      for (var e = 0; e < z.length; e++) {
        if (z[e].style.display === "none") {
          z[e].style.display = "inline";
        } 
      }
    }
    toggleCancel();
    update(root);
  }


  // This function toggles the props under-menu
  function toggleProps(d) {
    if (d.propsOpen) {
      d.propsOpen = false;
    } else {
      d.propsOpen = true;

    }
    //console.log(propsOpen);
    //console.log(JSON.stringify(myProps));
    update(root);
  }

  // This function changees dynamically the "Props" title
  function propsTextDecider(d) {
    result = ""
    if (d.on && d.props) {
      if (d.propsOpen) {
        result = "- PROPS"
      } else {
        result = "+ PROPS" + " (" + d.props.length + ")";
      }
    }
    return result;
  }

  function nameDecider(d) {
    var result = d.name;
    if (d._children) {
      result += " (" + d._children.length + ")";
    }

    return result;
  }

  function update(source) {

    // Removes the circular references which causes an error and then saves the new state
    var newSource = removeParent(source);
    var sp = source.name + ".js";
    console.log(sp);
    vscode.setState({src: newSource, height: height, width: width, sp: sp});
  
    //remove everything there was before
    svg.selectAll("*").remove();
  
    // Enter and style the color legend of the scheme
    var legend = svg.selectAll(".legenda")
          .data(legenda)
          .enter()
          .append("g")
            .attr("class", "legenda")
            .attr("transform", function(d) {return "translate(" + 0 + "," + d.position*40 + ")"});
       
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
    var nodes = tree.nodes(source);
    nodes.forEach(function(d){ d.y = d.depth * 180});
    //console.log(nodes[0].x);
    var links = tree.links(nodes);
  
    //Enter the node data and transform their positions
    var node = svg.selectAll(".node")
                  .data(nodes)
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
        .text("E")
        .attr("class", "plusButton")
        .on("click", editNode)
        .attr("transform", function(d) {return "translate(" + -30 + "," + 8 + ")";})
        .style("display", function() {return editMod ? "block" : "none"});
    node.append("text")
        .text("x")
        .attr("class", "xButton")
        .on("click", removeNode)
        .attr("transform", function(d) {return "translate(" + -30 + "," + 6 + ")";})
        .style("display", function() {return removeMod ? "block" : "none"});
    // Node name
    node.append("text")
        .text(nameDecider)
        .attr("class", "nodeName")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 4 + ")";});
    // +/- symbol which hides/shows the node's details
    node.append("text")
        .text(function(d) {return d.on ? "-" : "+"})
        .attr("class", "plus")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 20 + ")";})
        .on("click", toggle)
        .style("cursor", "pointer");
    // Button to open the local file containing the tag
    node.append("text")
        .text(function(d) {return d.on ? "OPEN LOCAL FILE" : ""})
        .attr("transform", function(d) {return "translate(" + 15 + "," + 36 + ")";})
        .attr("class", "button")
        .on("click", openDoc)
    //Button to show outside documentation
    var nodeLinks = node.append("a")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 52 + ")";})
        .attr("xlink:href", defineURL);
    nodeLinks.append("text")
        .text(function(d) {return d.on ? "OPEN DOCUMENTATION" : ""})
        .attr("class", "button")
    // Text for the tag ID
    node.append("text")
        .text(function(d) {return d.on ? "ID: " + d.id : ""})
        .attr("class", "nodeContent")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 68 + ")";});
    // Text for the tag content
    node.append("text")
        .text(function(d) {return d.on ? "CONTENT: " + d.content : ""})
        .attr("class", "nodeContent")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 84 + ")";});
    // Button to open Props
    node.append("text")
        .text(propsTextDecider)
        .attr("class", "nodeContent")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 100 + ")";})
        .on("click", toggleProps)
        .style("cursor", "pointer");


    nodes.forEach(function(myNode){
      console.log(myNode.id);
      var counter = 0;
      if (!myNode.props) {
        n.props = [];
      }
      var propGroups = svg.selectAll(".propLinks")
                       .data(myNode.props)
                       .enter()
                       .append("g")
                       //.attr("class", "propLinks")
                       .attr("transform", function() {return "translate(" + (myNode.x + 115) + "," + (myNode.y + 100 + 16*counter++) + ")";})
      var propLinks = propGroups.append("a")
                                .attr("xlink:href", function(d) {return d.doc ? d.doc : ""})
                                .attr("class", "prop")
                                .style("display", function() {return myNode.on && myNode.propsOpen ? "block" : "none"});
      var propTexts = propLinks.append("text")
                               .text(function(d) {return d.name + ": " + d.value + " ↗"})
                               .attr("class", "prop")
                               .style("display", function() {return myNode.on && myNode.propsOpen ? "block" : "none"});
    })
      
  
    var diagonal = d3.svg.diagonal();
  
    svg.selectAll(".link")
          .data(links)
          .enter()
          .append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("d", diagonal);
  }
}

function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d.children.forEach(collapse);
    d.children = null;
  }
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

// method to show/hide the form for adding a new node. Gets shown when someone clicks on the relative button. Gets hidden as soon as someone submits the form.

function toggleForm() {
  var x = document.getElementsByClassName("addForm");
  for (var i = 0; i < x.length; i++) {
    if (form === false) {
      x[i].style.display = "inline";
    } else {
      x[i].style.display = "none";
    }
    if (x[i].type != "submit") {
      x[i].value='';
    }
  }
  form = !form;
} 

function toggleAddMode() {
  toggleButtons();
  toggleForm();
  toggleCancel();
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

function toggleCancel() {
  var x = document.getElementsByClassName("cancelButton");
  console.log(x.length);
  console.log(x[0].style.display);
  for (var i = 0; i < x.length; i++) {
    if (x[i].style.display === "block") {
      x[i].style.display = "none";
    } else {
      x[i].style.display = "block";
    }
  }
}

/*This helper function removes the circular reference between parent and children which causes a rendering error*/
function removeParent(source) {
  if (source.parent) {
    source.parent = null;
  }
  if (source.children) {
    var newChildren = [];
    for (var i = 0; i < source.children.length; i++) {
      newChildren.push(removeParent(source.children[i]));
    }
  } else if (source._children) {
    var new_Children = [];
    for (var i = 0; i < source._children.length; i++) {
      new_Children.push(removeParent(source._children[i]));
    }
  }
  return source;
}

/* This function sets the size of the svg canvas */
function setCanvas() {
  
  d3.select("svg").remove();

  svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("display", "block")
    .append("g")
    .attr("transform", "translate(" + 0 + "," + margin.top + ")");
}

/* This function defines the size of the tree graph */
function setTreeSize() {
  tree = d3.layout.tree()
    .size([width, height]);
  
  root.x = width / 2;
  root.y = 0;

  //console.log("Root position: " + root.x + ", " + root.y);
  
}

function toggleStartingPointForm() {
  if (!startingPointMod) {
    var formInputs = document.getElementsByClassName("startingPointInput");
    for (var e = 0; e < formInputs.length; e++) {
      formInputs[e].style.display = "inline";
    }
    document.getElementById("spToggle").style.display = "none";
    document.getElementById("spCancel").style.display = "block";
  } else {
    var formInputs = document.getElementsByClassName("startingPointInput");
    for (var e = 0; e < formInputs.length; e++) {
      formInputs[e].style.display = "none";
    }
    document.getElementById("spToggle").style.display = "inline";
    document.getElementById("spCancel").style.display = "none";
  }
  startingPointMod = !startingPointMod;
}

var legenda = [
  {
    "name": "State Management",
    "color": "red",
    "position": 0,
  },
  {
    "name": "Navigation",
    "color": "yellow",
    "position": 1,
  },
  {
    "name": "React Native",
    "color": "green",
    "position": 2,
  },
  {
    "name": "Other components",
    "color": "black",
    "position": 3,
  },
  {
    "name": "User defined",
    "color": "violet",
    "position": 4,
  }
];