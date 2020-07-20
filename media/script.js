function myFunction(treeData) {
  
  /*var treeData = [
    {
      "name": "Top Level",
      "parent": "null",
      "children": [
        {
          "name": "Level 2: A",
          "parent": "Top Level",
          "children": [
            {
              "name": "Son of A",
              "parent": "Level 2: A"
            },
            {
              "name": "Daughter of A",
              "parent": "Level 2: A"
            }
          ]
        },
        {
          "name": "Level 2: B",
          "parent": "Top Level"
        }
      ]
    }
  ];*/


  // ************** Generate the tree diagram	 *****************
  var margin = {top: 20, right: 20, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 720 - margin.top - margin.bottom;
    
  var i = 0,
    duration = 750,
    root;

  var tree = d3.layout.tree()
    .size([height, width]);

  var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

  var svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  root = treeData[0];
  root.x0 = height / 2;
  root.y0 = 0;

  root.children.forEach(collapse);
    
  update(root);

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
      d.children = d._children;
      d._children = null;
      height = height + 180;
      console.log(d.children.length);
      width = width + (d.children.length-1)*180;
    }

    d3.select("svg").attr("width", width)
       .attr("height", height);
    update(d);

  }

  function toggle(d) {
    if(d.on) {
      d.on = false;
    }
    else {
      d.on = true;
      console.log(d.on);
    }
    update(d);
  }

  function update(source) {

    svg.selectAll("*").remove();

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse()
    nodes.forEach(function(d){ d.y = d.depth * 180});
    var links = tree.links(nodes);
 
    var node = svg.selectAll(".node")
                  .data(nodes.reverse())
                  .enter()
                  .append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";})
    node.append("circle")
        .attr("r", 10)
        .attr("fill", function(d) {return d._children ? "steelblue" : "white";}) 
        .attr("stroke", "white")
        .attr("stroke-width", "1px")
        .on("click", click)
        .style("cursor", "pointer");
    node.append("text")
        .text(function(d) {return d.name})
        .attr("class", "nodeName")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 4 + ")";});
    node.append("text")
        .text(function(d) {return d.on ? "-" : "+"})
        .attr("class", "plus")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 20 + ")";})
        .on("click", toggle)
        .style("cursor", "pointer")
    node.append("text")
        .text(function(d) {return d.on ? d.content : ""})
        .attr("class", "nodeContent")
        .attr("transform", function(d) {return "translate(" + 15 + "," + 36 + ")";});

    var diagonal = d3.svg.diagonal();

    links.forEach(function(d) { console.log("source " + d.source.x + " " + d.source.y + " target " + d.target.x + " " + d.target.y)})

    svg.selectAll(".link")
          .data(links)
          .enter()
          .append("path")
          .attr("class", "link")
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("d", diagonal);

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