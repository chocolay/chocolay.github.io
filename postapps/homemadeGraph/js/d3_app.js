d3.json("js/param.json",function(err,params) {
/*params:
    charge: repulsion for the force-directed layout. Not currently being used
    linkDistance: for the force-directed layout. Not currently being used.
    maxRadius: largest radius of a node; when the self-similarity is 100
        right now this is set so the node meets the label
    minRadius: smallest radius for a node; when the self-similarity is 0
        right now this is set so a single digit can fit inside the circle
    similarityCutOff: sets the distance (in svg units) when a strength goes to 0.
    width of graph's domain (used in the svg viewBox)
    height of graph's domain (used in the svg viewBox)
*/



//constants used to determine color from position on plane
var DEGREES_TO_RADIANS = Math.PI / 180;
var RADIANS_TO_DEGREES = 180 / Math.PI;

// Determines if a node is being dragged
var isNodeDragging = false;

// Holds the currently selected node
var currentlySelectedNode = null;

// Determines if in edit mode or not
var inEditMode = false;

//used to change the font colors in the table if they're black on bright colors.
// http://www.w3.org/WAI/ER/WD-AERT/#color-contrast
function brightness(rgb) {
        return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
} //brightness

//calculate the distance between 2 nodes
function calcDistance(node1, node2) {
        //could use Math.hypot if it's compliant w/their specs; check
        //    return Math.hypot(node1.x-node2.x,node1.y,node2.y)
        var x = node1.x - node2.x;
        var y = node1.y - node2.y;
        return Math.sqrt(x * x + y * y)
} //calcDistance

//assign color based on a position p
function getInitialColor(p) {
        var x = p[0], y = p[1];
        // Map our coordinates of [0, Width] and [0, Height] to [-W/2, W/2] and [-H/2, H/2] to give a full range of HSL angles
        var coord_x = d3.scale.linear()
            .domain([0, width])
            .range([-width / 2, width / 2])(x);
        var coord_y = d3.scale.linear()
            .domain([height, 0])
            .range([-height / 2, height / 2])(y);

        // Get polar coordinates
        var radius = Math.sqrt(Math.pow(coord_x, 2) + Math.pow(coord_y, 2));
        var max_radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
        var radius_normalized = d3.scale.linear()
            .domain([0, max_radius])
            .range([0, 100])(radius);

        var theta = Math.atan2(coord_y, coord_x);
        var theta_360 = (theta > 0 ? theta : (2 * Math.PI + theta)) * 360 / (2 * Math.PI);

        // Return the HSL as hex
        var hslString = "hsl(" + theta_360 + ", " + radius_normalized + "%," + "50%)";


        var color = d3.rgb(hslString);
        return color;
    }//get InitialColor

var linkFadeScale = d3.scale.linear()
    .domain([$("#thresholdSlider").val(),100])
    .range([0,1]);

//the scale used to determine the strength of the links
//based on their distance
// always lies between 0 and 100
var simScale = d3.scale.linear()
    .clamp(true)
    .domain([+params.similarityCutoff, 1])
    .range([0, 100]);

//to adjust the radius of the circles
var radiusScale = d3.scale.linear()
    .domain([0,100])
    .range([params.minRadius,params.maxRadius]);


//make sure the numbers in the tables are integers with this format
var formatNum = d3.format("f");

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes = [];
var lastNodeId = 0;
var links = [];

// Setup height and width
var margin = {
    top: 25,
    right: 0,
    bottom: 25,
    left: 25
};

    //we're going to fix these and then use an svg viewbox to handle the responsiveness
var width = params.width;
var height = params.height;

    var force = d3.layout.force()
        .size([width, height])
        .charge(params.charge)
        .linkDistance(params.linkDistance)
        .on("tick", tick);

    /* *** *** START BEHAVIORS *** *** */
    var drag = force.drag()
    .on('dragstart', function (e) {
        isNodeDragging = true;
        })
    .on("drag", function (e) {
        //given the position, assign a color
        //change the colorpicker information to reflect this changing color
        //change the circle color (that's being dragged
        //and change the table header


        var color = getInitialColor(d3.mouse(this.parentElement));
        d3.select("#colorInput input")
            .property("value", color.toString());
        d3.select(this).select("circle")
            .style({
                "fill": color
            });
        d3.select("#colorInput .input-group-addon i")
            .style({
                "background-color": color
            });

            //update the table's colors
        d3.selectAll("th")
            .filter(function (d) {
                return d.id == e.id
            })
            .style("background-color", color)
            .style("color", function () {
                return (brightness(color) < 125) ? "#ddd" : "black"
            });


        d3.selectAll("tbody tr td#label")
            .filter(function (d) {
                return d.id == e.id
             })
            .style("background-color", color)
            .style("color", function () {
                return (brightness(color) < 125) ? "#ddd" : "black"
            });



        //highlight the self cell in the table
        d3.select("#l" + e.id + "_" + e.id)
            .classed("dragged", 1)
            .style("font-size", "125%")
            .style("font-weight", "bold")
            .style("background-color", "#eee");

        //calculate distance to all other existing nodes
        //update the table & the links with this information
        //also highlight all table cells in the same column/row

        nodes.forEach(function (oldNode) {
            var dist = calcDistance(e, oldNode);
            links.forEach(function (link) {
                var indices = d3.extent([oldNode.id, e.id]);
                if (link.source.id == indices[0] && link.target.id == indices[1] && !link.linkFrozen) {
                    link.strength = simScale(dist);

                    var cellSelection = d3.select("#l" + indices[1] + "_" + indices[0])
                        .classed("dragged", 1);

                    cellSelection.select("input")
                        .property("value",formatNum(link.strength))
                        .classed("dragged",1)
                        .style("font-size", "125%")
                        .style("font-weight", "bold")
                        .style("background-color", "#eee")
                }
                if (link.source.id == indices[0] && link.target.id == indices[1] && link.linkFrozen) {
                    d3.select("#l" + indices[1] + "_" + indices[0])
                        .classed("dragged", 1)
                        .style("font-size", "125%")
                        .style("font-weight", "bold")
                        .style("background-color", "#eee")
                }

            });
        });


            d3.selectAll(".tableInput").on("change",function() {changeTableLink(this)});
            d3.selectAll(".unfreeze").on("click", function() {unfreeze(this)});
        drawLinks();

    })
    .on('dragend', function (e) {
        isNodeDragging = false;
        //turn off the highlighting

        d3.selectAll(".dragged")
            .classed("dragged", 0)
            .style("font-size", "100%")
            .style("font-weight", "normal")
            .style("background-color", "")

    });


    //zoom will go here
    /* *** *** END BEHAVIORS *** *** */

    //define the svg container
var svg = d3.select("#scatter").append("svg")
    .attr({"viewBox": "0 0 "+ width +" " + height})
    .style("background", '#eeeeee')
    .on('mousedown', onContentMousedown);

var link = svg.selectAll(".link"),
    node = svg.append('g').selectAll('g');

force
    .nodes(nodes)
    .links(links);

    //for updating the graph
function tick() {
    link.attr({
        "x1": function (d) {
            return d.source.x
        },
        "y1": function (d) {
            return d.source.y
        },
        "x2": function (d) {
            return d.target.x
        },
        "y2": function (d) {
            return d.target.y
        }
    });

    node.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
} //tick


function initialize() {
        // Setup color picker
        $('#colorInput').colorpicker();

        // Set default values
        resetNodeManagementControls();

        // Setup event handlers
        $('#saveEditBtn').on('click', onSaveEdit);
        $('#cancelEditBtn').on('click', onCancelEdit);
        $('#deleteEditBtn').on('click', onDeleteEdit);

        $("#thresholdSlider").slider().on("change", drawContent);

        d3.select("a#saver").on("click",function() {
            //I'll temporarily create a datastructure
            //should probably have a way to specify a filename...? but we'll see what we want to do with this.
            var obj = {nodes:[],links:[]};
            var nodes = force.nodes();
            var links = force.links();
            nodes.forEach(function(node) {
                obj.nodes.push({
                    id: node.id,
                    x: node.x,
                    y: node.y,
                    fixed: node.fixed,
                    label: node.label,
                    nodeColor: node.nodeColor.toString(),
                    selfSim:node.selfSim,
                    weight: node.weight
                });
            links.forEach(function(link) {
                obj.links.push({
                    source: {id: link.source.id},
                    target: {id: link.target.id},
                    strength: link.strength
                })
            })
            })
        //stringify the object
            savedObject = JSON.stringify(obj);
            //standard file manipulation
            var blob = new Blob([savedObject], {
                type: 'application/json'
            });

            d3.select("body").append("a")
                .attr({
                    "id" : "tempbutton",
                    "href" :URL.createObjectURL(blob),
                    "download":params.filename
                })
                .style({"opacity":1e-6});
            //make sure the "download" capability is now attached to the Download button
            //and click it, the file is now downloaded
            d3.select("#tempbutton").node().click();
        })

        //Rendering
        drawContent();
        mkScaleLegend();

    d3.select("#page-wrapper")
        .transition().duration(250)
        .style("opacity",1);

    } //initialize

    //draw the legend in the lower right
    function mkScaleLegend() {
        var xScale =
            d3.scale.linear()
                .domain([0, 100])
                .range([0, params.similarityCutoff]);

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .tickValues(d3.range(0, 125, 25).reverse())
            .tickFormat(d3.format("d"));

        svg.append("g")
            .classed({"x": 1, "axis": 1})
            .attr("transform", "translate(230,220)")
            .call(xAxis);


        d3.select("g.x.axis")
            .append("text")
            .text("similarity")
            .attr({
                "dx": "1em",
                "dy": "2em"
            })
            .style("font-size", "60%")

    }


//the main rendering function that creates the graph & calls the table to be updated
function drawContent() {

    //separate function to draw all the links
    drawLinks();

    // Get node data
    node = node.data(nodes, function (d) {
        return d.id;
    });

    // update existing nodes
    node.selectAll('circle')
        .classed('selected', function (d) {
            return d === currentlySelectedNode;
        })
        .attr({
            "r": function(d) {
            return radiusScale(d.selfSim);
         }
        })
        .style('fill', function (d) {
            return d.nodeColor;
        });

    node.selectAll('text.selfSim')
        .classed("selfSim", 1)
        .attr({
            "x": 0,
            "dy": ".35em",
            "text-anchor": "middle"
        })
        .text(function (d) {
            return d.selfSim;
        });

    node.selectAll('text.label')
        .classed("label", 1)
        .attr({
            "x": 15,
            "dy": ".35em"
        })
        .text(function (d) {
            return d.label;
        })
        .style("font-size","50%");

    // add new nodes
    var g = node.enter()
        .append('g')
        .classed('nodeContainer', true)
        .classed('draggable', true)
        .on('dblclick', onRightClickNode)
        .call(drag);

    g.append('circle')
        .classed("node", 1)
        .attr({
            "r": function(d) {
                return radiusScale(d.selfSim);
            }
        })
        .style({
            "fill": function (d) {
                return d.nodeColor
            }
        });

    g.append('text')
        .classed("selfSim", 1)
        .attr({
            "x": 0,
            "dy": ".35em",
            "text-anchor": "middle"
        })
        .text(function (d) {
            return d.selfSim;
        });

    g.append('text')
        .classed("label", 1)
        .attr({
            "x": 15,
            "dy": ".35em"
        })
        .text(function (d) {
            return d.label;
        })
        .style("font-size","50%");

    // remove old nodes
    node.exit().remove();

    // Run the update

    force.start();

    //create Table
    makeTable(links);

}//drawContent

//draw the lines if their strength is greater than threshold
    //called by drawContent
function drawLinks() {
        // Add/update Links
    link = svg.selectAll(".link").data(links
                .filter(function (d) {
                    return d.strength > $("#thresholdSlider").val();
                }), //only draw the ones with a strength greater than the threshold
            function (d) {
                return d.source.id + "_" + d.target.id
            }//key function
        );
    link.enter().insert("line", "g")
            .classed("link", 1);
    link
        .style("opacity", function(d) {return linkFadeScale(d.strength)});

    link.exit().remove();
} //drawLinks


//this creates the table DOM
function drawTable(data, nodes) {
     //columns tells us the table headers
        //we need to create a new array so the nodes array doesn't get polluted by the "label" in the first column
        var columns = nodes.map(function (d) {
            return {
                id: d.id, label: d.label
            }
        });
    columns.unshift({id: 0, label: "labels"});

    //keeps the table layout hidden if there are less than 2 nodes
    d3.select("table").style("display",(columns.length>2)?"table":"none");

    var table = d3.select("table"); //this may need to be more specific if the code is incorporated in w/ other tables
    var head = table.select("thead tr")
        .selectAll('th')
        .data(columns, function (d) {
            return d.id
         });

    head.enter()
        .append('th');

        head
            .style({
                "background-color": function (d, i) {
                    return i == 0 ? "" : nodes[i - 1].nodeColor
                }
            })
            .style("color", function (d, i) {
                return i == 0 ? "black" : (brightness(nodes[i - 1].nodeColor) < 125) ? "#ddd" : "black"
            })
            .html(function (d) {
                return d.label
            });

        head.exit().remove();

        var rows = d3.select("tbody").selectAll('tr')
            .data(data, function (d) {
                return d.id
            });

        rowsE = rows.enter()
            .append('tr');


    rows.exit().remove();


        var cells = rows.selectAll('td')
            .data(function (row) {
                var rowData = nodes.map(function (node) {
                    return {id: row.id, value: row[node.id].value, id2: row[node.id].id2}
                });
                rowData.unshift({id: -1, value: row.label, id2:-1});
                return rowData
            },function(d) {return d.id2});

     cells
            .enter()
            .append('td')
            //we want a highlighter for both columns & rows ... so not using the table-hover
            .on("mouseenter", function () {
                var classes = d3.select(this).attr("class")
                    .split(" ");
                if (classes.length > 1)
                    d3.selectAll("td." + classes[0] + ",td." + classes[1] + ":not(#label)")
                        .style("background-color", "#eeeeee")
            })
            .on("mouseleave", function () {
                var classes = d3.select(this).attr("class")
                    .split(" ");
                if (classes.length > 1)
                    d3.selectAll("td." + classes[0] + ",td." + classes[1] + ":not(#label)")
                        .style("background-color", "")
            });

    //we want to make sure the ids & classes go with the new data after update
    cells.attr("id", function (d, i) {
        var l = d3.select(this.parentElement).datum().id;
        var j = nodes.filter(function (d) {
            return d.id == l
        })[0].id;
        if (i > 0) {
            return "l" + nodes[i - 1].id + "_" + j
        }
        else return "label"
        })
        .attr("class", function (d, i) {
            var l = d3.select(this.parentElement).datum().id
            var j = nodes.filter(function (d) {
                return d.id == l
            })[0].id;
            if (i > 0) {
                return "column_" + nodes[i - 1].id + " row_" + j
            }
            else { //if we use color in the table, then don't want this class
                return "row_" + j
            }
        });

    //color the first column
    d3.selectAll("tbody td#label")
        .style("background-color", function (d, i) {
            var id = d3.select(this.parentElement).datum().id;
            var color = nodes.filter(function (d) {
                return d.id == id
            })[0];
            return (color)?color.nodeColor:""
        })
        .style("color", function (d, i) {
            var id = d3.select(this.parentElement).datum().id;
            var color = nodes.filter(function (d) {
                return d.id == id
            })[0]
            return color?(brightness(color.nodeColor) < 125) ? "#ddd" : "black":""
        });

    cells.html(function (d,i) {
            var obj = fillCell(d,i,this);
            return (i==0||obj.ld)?d.value:obj.str
        });

        d3.selectAll(".tableInput").on("change",function() {changeTableLink(this)});

    cells.exit().remove();

    } //drawTable

    //this specifies what exactly goes into the table cell.
    function fillCell(d,i,elem) {
        var label = d3.select(elem).attr("id").split(/l|_/g).map(Number);
        var ld = label[2]>label[1];
        var str = "";
        //need to identify which link

        var sourceID = d.id;
        var targetID = d.id2;
        thislink = links.filter(function(link) {
            return link.target.id==targetID && link.source.id==sourceID
        })[0];

        if (sourceID== targetID) {
            str = "<input class = 'tableInput' type='number' min = '0' max = '100'  style='text-align: center' value = " + formatNum(d.value) + ">";
        }
        if (thislink) {
            str = "<input class = 'tableInput' type='number' min = '0' max = '100'  style='text-align: center' value = "+ formatNum(thislink.strength) + ">";
            if (thislink.linkFrozen) {
                str = str.concat("<i class='unfreeze fa fa-eraser' aria-hidden='true'></i>")
            }
        }
        return {ld:ld,str:str}
    }//fillCell

    function changeTableLink(elem) {
        var cell = d3.select(d3.select(elem).node().parentElement);
        var label = cell.attr("id").split(/l|_/g).map(Number);
        var obj = cell.datum();
        obj.value = +d3.select(elem).property("value");
        if (label[1] == label[2]) { //it's a node
            var index = nodes
                .map(function (n) {
                    return n.id
                })
                .indexOf(obj.id);
            nodes[index].selfSim = obj.value;
        } else { //it's a link
            //identify the two ids for source & target by noting the rows
            var sourceID = obj.id;
            var targetID = obj.id2;
            var source = nodes.filter(function (n) {
                return n.id == sourceID
            })[0];
            var target = nodes.filter(function (n) {
                return n.id == targetID
            })[0];
            links = links.map(function (l) {
                if (l.source.id == sourceID && l.target.id == targetID) {
                    l.strength = obj.value;
                    l.linkFrozen = true;
                    obj.linkFrozen = true;
                }
                cell.datum(obj);
                return l
            });
        } //link
        force.nodes(nodes)
            .links(links);
        drawContent();
        d3.selectAll(".unfreeze").on("click", function() {unfreeze(this)});
    }

    function unfreeze(elem) {
        var cell = d3.select(d3.select(elem).node().parentElement);
        var obj = cell.datum();
        var label = cell.attr("id").split(/l|_/g).map(Number);
        var sourceID = obj.id;
        var targetID = obj.id2;

        links = links.map(function (l) {
            if (l.source.id == sourceID && l.target.id == targetID) {
                l.strength = +obj.value;
                delete l.linkFrozen
            }
            return l
        });
        force.links(links);
        drawContent();
    }

//create the data for the table
function makeTable(links) {
    //need to create an array of objects for the table
    var data = [];
    for (var i = 0; i < nodes.length; i++) {
        var c1 = nodes[i].id;
        var row = {label: nodes[i].label, id: c1};
        for (var j = 0; j < nodes.length; j++) {
            c2 = nodes[j].id;
            var L = links.filter(function (l) {
                return l.target.id == c2 && l.source.id == c1
            })[0];
            if (L) { //there's a link
                row[c2] = {id2:c2, value:formatNum(L.strength)}
            }
            else if (c1 == c2)
                row[c2] = {id2:c2, value:nodes.filter(function (d) {
                    return d.id == c1
                })[0].selfSim};
            else row[c2] = {id2:c2,value:""};
        }
        data.push(row);
    }
    SS = data;
    drawTable(data, nodes);
} //makeTable

//creation of a new node on click
function onContentMousedown() {
    // Make sure a node isn't being dragged
    if (isNodeDragging) {
        return;
    }
    ;

    // make sure we aren't in edit mode
    if (inEditMode) {
        return;
    }

    // Validate inputs and exit if invalid
    var error = validateNodeManagementControls();
    if (error.length > 0) {
        toastr.error(error);
        return;
    }

    var posn = d3.mouse(this);
    // set the node color based on the mouse's position

    // Create the new node
    var node = {
        id: ++lastNodeId,
        x: posn[0],
        y: posn[1],
        fixed: true,
        label: $('#labelInput').val(),
        selfSim: parseInt($('#weightInput').val()),
        nodeColor: getInitialColor(posn)
    };

    //calculate distance to all other existing nodes
    var distances = nodes.map(function (oldNode) {
        var d = calcDistance(node, oldNode);
        links.push({
            source: oldNode,
            target: node,
            strength: simScale(d)
        });
        return d
    });
    // Add the node to the tracked list
    nodes.push(node);
    // Clear the input
    resetNodeManagementControls();

    // Redraw
    force.links(links);
    drawContent();
    //have a call to the table function in drawContent

    //  toastr.success("Node created!");
}//onContentMousedown

//This is the double click
function onRightClickNode(clickedNode) {
    // Stop normal events
    d3.event.preventDefault();

    // Exit if dragging
    if (isNodeDragging) {
        return;
    }
    // Set currently selected
    currentlySelectedNode = clickedNode;
    // Fill properties
    $('#weightInput').val(clickedNode.selfSim);
    $('#labelInput').val(clickedNode.label);
    $('#colorInput').colorpicker('setValue', clickedNode.nodeColor.toString());

    // Show save button and put in edit mode
    inEditMode = true;
    $('#saveEditBtn').show();
    $('#cancelEditBtn').show();
    $('#deleteEditBtn').show();
    $('#colorInputGroup').show();

    //Refresh
    drawContent();
} //onRightClickNode

function onSaveEdit() {
    // Validate inputs and exit if invalid
    var error = validateNodeManagementControls();
    if (error.length > 0) {
        toastr.error(error);
        return;
    };

    // Save off values
    currentlySelectedNode.label = $('#labelInput').val();
    currentlySelectedNode.selfSim = parseInt($('#weightInput').val());
    currentlySelectedNode.nodeColor = d3.rgb($('#colorInput').colorpicker('getValue'));




    // Clear the input
    resetNodeManagementControls();

    currentlySelectedNode = null;

    // Redraw
    drawContent();

    //   toastr.success("Save successful!");

} //onSaveEdit

function onCancelEdit() {
    // Clear currently selected
    currentlySelectedNode = null;


    // Clear the input
    resetNodeManagementControls();

    // Redraw
    drawContent();
} //onCancelEdit

function onDeleteEdit() {
    // Confirm
    if (!confirm("Are you sure you want to delete this node?")) {
        return;
    }

    // Delete the node
    nodes = nodes.filter(function (e) {
        return e.id != currentlySelectedNode.id
    })

    // Delete all associated links
    links = links.filter(function (d) {
        return d.source.id != currentlySelectedNode.id && d.target.id != currentlySelectedNode.id
    });

    //update the force layout
    force.nodes(nodes)
        .links(links);

    // Clear the input
    resetNodeManagementControls();

    // Redraw
    drawContent();

} //onDeleteEdit

function resetNodeManagementControls() {
    // Setup initial control values
    $('#weightInput').val('100');
    $('#labelInput').val('tag_' + (lastNodeId + 1));
    $('#saveEditBtn').hide();
    $('#cancelEditBtn').hide();
    $('#deleteEditBtn').hide();
    $('#colorInputGroup').hide();
    $('#colorInput').colorpicker('setValue', '#00aabb');
    inEditMode = false;
} //resetNodeManagementControls

function validateNodeManagementControls() {
    // Verify weight input set between 0 and 100
    var weightInput = parseInt($('#weightInput').val());
    if (!weightInput || weightInput < 0 || weightInput > 100) {
        return 'Please provide a valid weight input between 0 and 100';
    }

    // Verify label is set
    var labelInput = $('#labelInput').val();
    if (!labelInput || labelInput.length <= 0) {
        return 'Please provide a label';
    }

    // Verify label doesn't exist
    var existingLabelIndex = nodes
        .filter(function (e) {
            return (currentlySelectedNode) ? e.id != currentlySelectedNode.id : true
        })
        .map(function (e) {
            return e.label
        })
        .indexOf(labelInput);


    if (existingLabelIndex > -1) {
        return 'Please provide a unique label'
    }

    // Valid otherwise
    return '';
} //validateNodeManagementControls


$(document).ready(initialize);

})
