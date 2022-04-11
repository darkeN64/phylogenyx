function deletesvgtree() {
  // if ( $('#options').css('visibility') == 'visible' )
  //   $('#options').css('visibility','hidden');
  // else if ( $('#options').css('visibility') == 'hidden' )
  //   $('#options').css('visibility','visible');
    d3.selectAll('svg > g > *').remove();
    $('#tree-switcher').css('visibility','hidden');

    document.getElementById('phylogram').innerHTML="";

}

      function getslidervalue() {
                $('#consensus-slider-value').text("Value is : " + jQuery('#consensus-slider').val() + " %");
                return jQuery('#consensus-slider').val();
            }

            function getHeightSlider() {

                $('#heightslider').text("Value height is : " + jQuery('#heightslider').val() + " %");
                var heightscaler = jQuery('#heightslider').val()
                console.log('inner function height scaler \n' + heightscaler)
                return heightscaler;
            }

            function getWidthScaler() {

                $('#widthslider').text("Value height is : " + jQuery('#widthslider').val() + " %");
                var widthscaler = jQuery('#widthslider').val()
                console.log('inner function height scaler \n' + widthslider)
                return widthscaler;
            }



if (!d3) {
    throw "d3 wasn't included!"
}
(function () {


    d3.phylogram = {}
    d3.phylogram.rightAngleDiagonal = function () {
        var projection = function (d) {
            return [d.y, d.x];
        }

        var path = function (pathData) {
            return "M" + pathData[0] + ' ' + pathData[1] + " " + pathData[2];
        }

        function diagonal(diagonalPath, i) {
            var source = diagonalPath.source,
                target = diagonalPath.target,
                midpointX = (source.x + target.x) / 2,
                midpointY = (source.y + target.y) / 2,
                pathData = [source, {x: target.x, y: source.y}, target];
            pathData = pathData.map(projection);
            return path(pathData)
        }

        diagonal.projection = function (x) {
            if (!arguments.length) return projection;
            projection = x;
            return diagonal;
        };

        diagonal.path = function (x) {
            if (!arguments.length) return path;
            path = x;
            return diagonal;
        };

        return diagonal;
    }

    d3.phylogram.radialRightAngleDiagonal = function () {
        return d3.phylogram.rightAngleDiagonal()
            .path(function (pathData) {
                var src = pathData[0],
                    mid = pathData[1],
                    dst = pathData[2],
                    radius = Math.sqrt(src[0] * src[0] + src[1] * src[1]),
                    srcAngle = d3.phylogram.coordinateToAngle(src, radius),
                    midAngle = d3.phylogram.coordinateToAngle(mid, radius),
                    clockwise = Math.abs(midAngle - srcAngle) > Math.PI ? midAngle <= srcAngle : midAngle > srcAngle,
                    rotation = 0,
                    largeArc = 0,
                    sweep = clockwise ? 0 : 1;
                return 'M' + src + ' ' +
                    "A" + [radius, radius] + ' ' + rotation + ' ' + largeArc + ',' + sweep + ' ' + mid +
                    'L' + dst;
            })
            .projection(function (d) {
                var r = d.y, a = (d.x - 90) / 180 * Math.PI;
                return [r * Math.cos(a), r * Math.sin(a)];
            })
    }

    // Convert XY and radius to angle of a circle centered at 0,0
    d3.phylogram.coordinateToAngle = function (coord, radius) {
        var wholeAngle = 2 * Math.PI,
            quarterAngle = wholeAngle / 4

        var coordQuad = coord[0] >= 0 ? (coord[1] >= 0 ? 1 : 2) : (coord[1] >= 0 ? 4 : 3),
            coordBaseAngle = Math.abs(Math.asin(coord[1] / radius))

        // Since this is just based on the angle of the right triangle formed
        // by the coordinate and the origin, each quad will have different
        // offsets
        switch (coordQuad) {
            case 1:
                coordAngle = quarterAngle - coordBaseAngle
                break
            case 2:
                coordAngle = quarterAngle + coordBaseAngle
                break
            case 3:
                coordAngle = 2 * quarterAngle + quarterAngle - coordBaseAngle
                break
            case 4:
                coordAngle = 3 * quarterAngle + coordBaseAngle
        }
        return coordAngle
    }

    d3.phylogram.styleTreeNodes = function (vis) {
        vis.selectAll('g.leaf.node')
            .append("svg:circle")
            .attr("r", 4.5)
            .attr('stroke', 'yellowGreen')
            .attr('fill', 'greenYellow')
            .attr('stroke-width', '2px')


        vis.selectAll('g.root.node')
            .append('svg:circle')
            .attr("r", 4.5)
            .attr('fill', 'steelblue')
            .attr('stroke', '#369')
            .attr('stroke-width', '2px');
    }

    function scaleBranchLengths(nodes, w) {
        // Visit all nodes and adjust y pos width distance metric
        var visitPreOrder = function (root, callback) {
            callback(root)
            if (root.children) {
                for (var i = root.children.length - 1; i >= 0; i--) {
                    visitPreOrder(root.children[i], callback)
                }
                ;
            }
        }
        visitPreOrder(nodes[0], function (node) {
            node.rootDist = (node.parent ? node.parent.rootDist : 0) + (node.length || 0)
        })
        var rootDists = nodes.map(function (n) {
            return n.rootDist;
        });
        var yscale = d3.scale.linear()
            .domain([0, d3.max(rootDists)])
            .range([0, w]);
        visitPreOrder(nodes[0], function (node) {
            node.y = yscale(node.rootDist)
        })
        return yscale
    }


    d3.phylogram.build = function buildtree (selector, nodes, options, lines_array, csrf) {

        function click(d) {
            console.log('redraw');
            if (nodes.children == d.children) {
                nodes._children = nodes.children;
                nodes.children = null;
                   deletesvgtree();
            buildtree(selector, nodes, options,lines_array,csrf);
            } else {
                nodes.children = nodes._children;
                nodes._children = null;
                   deletesvgtree();
            buildtree(selector, nodes, options,lines_array,csrf);
            }

        }

          function highlight(x, y, a) {
	   var pointy = y;
	   var pointx = x;
   		vis.selectAll("path.link")
			.attr("y2", function(d) {
				if(d.target.y == pointy && d.target.x == pointx) {
					var path = d3.select(this);
          if( typeof path[0][0].oldstroke === "undefined" || path[0][0].oldstroke === null){
            path[0][0].oldstroke = path.attr("stroke");
    				path.attr("stroke", "rgba(0,0,0,"+a+")");
          } else {
            path.attr("stroke", path[0][0].oldstroke);
            path[0][0].oldstroke = null;
          }
					pointy = d.source.y;
					pointx = d.source.x;
					a = a-0.04;
					if (pointy!=0) {
    					highlight(pointx, pointy,a);
					}
				}
			});
	}

        function sequence_search(sequence_to_find) {
            for (var i = 0; i < lines_array.length - 1; i++) {
                // console.log('lines array\n ' + lines_array[i])
                if (lines_array[i].includes(sequence_to_find)) {
                    // console.log("match");
                    // console.log(lines_array[i])
                    // console.log("sequence is: \n" + lines_array[i + 1])
                    return lines_array[i + 1];
                }
            }

        }

        console.log('options width\n'+options.width);

        console.log('options height\n'+options.height);

        options = options || {}
        var w = options.width || d3.select(selector).style('width') || d3.select(selector).attr('width'),
            h = options.height || d3.select(selector).style('height') || d3.select(selector).attr('height'),
            w = parseInt(w)/16 +1000,
            h = parseInt(h) * 12;





        var tree = options.tree || d3.layout.cluster()
            .size([h, w])
            .sort(function (node) {
                return node.children ? node.children.length : -1;
            })
            .children(options.children || function (node) {
                return node.branchset
            });
        var diagonal = options.diagonal || d3.phylogram.rightAngleDiagonal();
        var vis = options.vis || d3.select(selector).append("svg:svg")
            .attr("width", w*10)
            .attr("height", h + 300)
            .append("svg")
            .attr("transform", "translate(20, 20)");
        var nodes = tree(nodes);



        if (options.skipBranchLengthScaling) {
            var yscale = d3.scale.linear()
                .domain([0, w])
                .range([0, w]);
        } else {
            var yscale = scaleBranchLengths(nodes, w)
        }

        if (!options.skipTicks) {
            vis.selectAll('line')
                .data(yscale.ticks(10))
                .enter().append('svg:line')
                .attr('y1', 0)
                .attr('y2', h)
                .attr('x1', yscale)
                .attr('x2', yscale)
                .attr("stroke", "#ddd");

            vis.selectAll("text.rule")
                .data(yscale.ticks(10))
                .enter().append("svg:text")
                .attr("class", "rule")
                .attr("x", yscale)
                .attr("y", 0)
                .attr("dy", -3)
                .attr("text-anchor", "middle")
                .attr('font-size', '8px')
                .attr('fill', '#ccc')
                .text(function (d) {
                    return Math.round(d * 100) / 100;
                });

        }

        var link = vis.selectAll("path.link")
            .data(tree.links(nodes))
            .enter().append("svg:path")
            .attr("class", "link")
            .attr("d", diagonal)
            .attr("fill", "none")
            .attr("stroke", "#cd1e1e")
            .attr("stroke-width", "4px");


        function searchInTreeForNode(noder, name) {
            var stack = [], ii;
            stack.push(nodes[0]);

            var searchedNode;

            while (stack.length > 0) {
                noder = stack.pop();
                if (noder.name == name) {
                    // console.log("found it");
                    // console.log("node is: " + noder.name);
                    // console.log(noder);
                    searchedNode = noder;
                    noder = searchedNode;
                } else if (noder.children && noder.children.length) {
                    for (ii = 0; ii < noder.children.length; ii += 1) {
                        stack.push(noder.children[ii]);
                    }
                }
            }
            return searchedNode;

        }

        var childrenarray = [];

        function gorecursive(object) {


            let fasta;
            if (!object.hasOwnProperty("children")) {
                // console.log("no children");
                return;
            }

            for (var i = 0; i < 2; i++) {
                // console.log("actual parent is :: " + object.name);
                if (object.children[i].name) {
                    // console.log("children.name " + object.children[i].name);
                    if (!object.children[i].name.includes("Inner")) {
                        fasta = '>' + object.children[i].name;
                        childrenarray.push(fasta);
                        childrenarray.push(object.children[i].sequence);
                    }
                    if (object.children[i].hasOwnProperty("children")) {
                        // console.log("children.name " + object.children[i].name);
                        if (!object.children[i].name.includes("Inner")) {
                            fasta = '>' + object.children[i].name;
                            childrenarray.push(fasta);
                            childrenarray.push(object.children[i].sequence);
                        }

                        gorecursive(object.children[i]);
                    }
                }
            }
            console.log('childrenarray length is: \n' + childrenarray.length);

            console.log('childrenarray is: \n');
            for (var i = 0; i < childrenarray.length; i++) {
                // console.log(childrenarray[i] + '\n');
            }

            return childrenarray;
        }

        var menu = [
            {
                title: 'Compute subtree consensus',
                action: function consensus(elm, d, i) {
                                        console.log(d.name)

                    var result = searchInTreeForNode(nodes, d.name);
                    gorecursive(result);
                    console.log(d)
                    let childrenarr = JSON.stringify(childrenarray);
                    childrenarr = childrenarr.replaceAll('"', "\n")
                    childrenarr = childrenarr.replaceAll('\\r',"")

                  let slidervalue = getslidervalue();
                    console.log('getslidervalue\n'+slidervalue);
                     console.log(childrenarr);
                     $('#myModal').modal('show');
                    $.ajax({

                        url: "/upload/currentnode",
                        method: "POST",
                        headers: {'X-CSRFToken': csrf},
                        data: {'array[]': childrenarray,'consensus': getslidervalue()},
                    }).done(function (data) {
                        console.log("end function")
                        $('#myModal').modal('hide');
                        $('#modal-information').modal('show');
                        $('#sequence-result').html(data);
                        //?????? TODO
                                                $('#selected-sequencies').html(
                                                    childrenarr
                                                );


                        vis.selectAll('g.root.node').append("svg:text")
                            .attr("height", 10)
                            .attr("position", "relative")
                            .attr("text-anchor", "start")
                            .attr('font-family', 'monospace')
                            .attr('white-space', 'pre-line')
                            .attr('font-size', '17px')
                            .attr('fill', 'red')
                            .attr("transform", function (d) {
                                return "translate(" + (w  - d.y + 800) + "," + 0 + ")"
                            })
                            .text(function (f) {
                                if (f.name === d.name)
                                    f.sequence = data;
                                return f.sequence;
                            });


                        console.log('data ' + data);
                        var simpleData = (data);
                    }).fail(function () {
                        $('#myModal').modal('hide');
                        alert("Processing error ocurred\n");
                    });
                    childrenarray = [];
                }
            },
            {
                title: 'Show node trace',
                action:   function highlighter(elm,d) {
                    console.log(d.name)
	                var pointy = d.y;
  		            var pointx = d.x;
  		            var a = 1;
  		         highlight(pointx, pointy, a);

                }
            },
        ]

        var node = vis.selectAll("g.node")
            .data(nodes)
            .enter().append("svg:g")
            .on('click', function (d) {
                // console.log(d);
                // click(d)

            })


            .on('contextmenu', d3.contextMenu(menu))
            .attr("class", function (n) {
                if (n.children) {
                    if (n.depth == 0) {
                        return "root node"
                    } else {
                        return "root node"
                    }
                } else {
                    return "leaf node"
                }
            })
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            })
            .append("svg:text")
            .attr("dx", -6)
            .attr("dy", -6)
            .attr("text-anchor", 'end')
            .attr('font-size', '8px')
            .attr('fill', '#ccc')
            .text(function (d) {
                return d.length;
            });

        d3.phylogram.styleTreeNodes(vis)

        if (!options.skipLabels) {
            vis.selectAll('g.root.node')
                .append("svg:text")
                .attr("dx", 40)
                .attr("dy", 5)
                .attr("text-anchor", 'end')
                .attr('font-size', '8px')
                .attr('fill', '#ccc')
                .text(function (d) {
                    return d.name;
                })
                .text(function (d) {
                    // console.log(d);
                    return d.name.slice(0,9);

                });

            vis.selectAll('g.leaf.node').append("svg:text")
                .attr("dx", 8)
                .attr("dy", 3)
                .attr("text-anchor", "start")
                .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
                .attr('font-size', '11px')
                .attr('fill', 'black')
                .text(function (d) {
                    // console.log(d);
                    return d.name.slice(0,90);
                });
            vis.selectAll('g.leaf.node').append("svg:text")
                .attr("height", 10)
                .attr("position", "relative")
                .attr("text-anchor", "start")
                .attr('font-family', 'monospace')
                .attr('white-space', 'pre-line')
                .attr('font-size', '17px')
                .attr('fill', 'black')
                .attr("transform", function (d) {
                    return "translate(" + (w - d.y + 800) + "," + 0 + ")"
                })
                .text(function (d) {

                    d.sequence = sequence_search(d.name)
                    return d.sequence
                });
        }
  d3.select('#saveTree')
      .on('click', function(){
                    console.log('download');
	                var svgString = getSVGString(vis.node());
                    console.log('svgstring\n'+svgString);
	                    svgString2Image( svgString, 6*w, h+300, 'png', save ); // passes Blob and filesize String to the callback

	function save( dataBlob, filesize ){
	    	    	   console.log('save')

		saveAs( dataBlob, 'tree.png' ); // FileSaver.js function
	}
});

        return {tree: tree, vis: vis}
    }
}());



