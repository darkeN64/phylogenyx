function deletesvgtree() {
    d3.selectAll('svg > g > *').remove();
    $('#tree-switcher').css('visibility', 'hidden');
    document.getElementById('phylogram').innerHTML = "";
}

function getslidervalue() {
    $('#consensus-slider-value').text("Value is : " + jQuery('#consensus-slider').val() + " %");
    return jQuery('#consensus-slider').val();
}

function getHeightSlider() {

    $('#heightslider').text("Value height is : " + jQuery('#heightslider').val() + " %");
    var heightscaler = jQuery('#heightslider').val()
    return heightscaler;
}

function getWidthScaler() {

    $('#widthslider').text("Value height is : " + jQuery('#widthslider').val() + " %");
    var widthscaler = jQuery('#widthslider').val()
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

    // ??t??lovacie atrib??ty vygenerovan??ho stromu
    d3.phylogram.styleTreeNodes = function (vis) {
        // pre ka??d?? list stromu
        vis.selectAll('g.leaf.node')
            .append("svg:circle")
            .attr("r", 4.5)
            .attr('stroke', 'yellowGreen')
            .attr('fill', 'greenYellow')
            .attr('stroke-width', '2px')

        // pre ka??d?? uzol stromu
        vis.selectAll('g.root.node')
            .append('svg:circle')
            .attr("r", 4.5)
            .attr('fill', 'steelblue')
            .attr('stroke', '#369')
            .attr('stroke-width', '2px');
    }


    // ??k??lovanie d????ky vetiev
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

    // funkcia na vykreslenie fylogenetickeho stromu
    d3.phylogram.build = function buildtree(selector, nodes, options, lines_array, csrf) {

        // funkcionalita Show node trace
        // prech??dza cestu od vybratn??ho uzla po kore?? stromu a vyzna??uje ju novou farbou - rgba(0,0,0, a)
        function highlight(x, y, a) {
            var pointy = y;
            var pointx = x;
            vis.selectAll("path.link")
                .attr("y2", function (d) {
                    if (d.target.y == pointy && d.target.x == pointx) {
                        var path = d3.select(this);
                        if (typeof path[0][0].oldstroke === "undefined" || path[0][0].oldstroke === null) {
                            path[0][0].oldstroke = path.attr("stroke");
                            path.attr("stroke", "rgba(0,0,0," + a + ")");
                        } else {
                            path.attr("stroke", path[0][0].oldstroke);
                            path[0][0].oldstroke = null;
                        }
                        pointy = d.source.y;
                        pointx = d.source.x;
                        a = a - 0.04;
                        if (pointy != 0) {
                            highlight(pointx, pointy, a);
                        }
                    }
                });
        }

        // funkcia na n??jdenie sekvencie v p??vodnom zozname sekvenci??(fasta)
        function sequence_search(sequence_to_find) {
            for (var i = 0; i < lines_array.length - 1; i++) {
                if (lines_array[i].includes(sequence_to_find)) {
                    return lines_array[i + 1];
                }
            }

        }

        // definovanie ????rky a v????ky stromu
        options = options || {}
        var w = options.width || d3.select(selector).style('width') || d3.select(selector).attr('width'),
            h = options.height || d3.select(selector).style('height') || d3.select(selector).attr('height'),
            w = parseInt(w) / 16 + 1000,
            h = parseInt(h) * 12;

        // za??iatok skladania vizualiz??cie fylogenetick??ho stromu
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
            .attr("width", w * 10)
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
        //vyma??e mierku vzdialenosti za grafom
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

        //vizuali??cia
        var link = vis.selectAll("path.link")
            .data(tree.links(nodes))
            .enter().append("svg:path")
            .attr("class", "link")
            .attr("d", diagonal)
            .attr("fill", "none")
            .attr("stroke", "#cd1e1e")
            .attr("stroke-width", "4px");

         // n??jdenie uzla, na ktor?? klikol pou????vate??
        // vstup node_array je vstupn?? uzol, name je n??zov h??adan??ho uzla
        function searchInTreeForNode(node_array, name) {
            var stack = [], ii;
            stack.push(nodes[0]);

            var searchedNode;

            while (stack.length > 0) {
                node_array = stack.pop();
                if (node_array.name == name) {
                    searchedNode = node_array;
                    node_array = searchedNode;
                } else if (node_array.children && node_array.children.length) {
                    for (ii = 0; ii < node_array.children.length; ii += 1) {
                        stack.push(node_array.children[ii]);
                    }
                }
            }
            return searchedNode;

        }

        var childrenarray = [];

        // rekurz??vne preh??ad??vanie v??etk??ch dc??rskych uzlov z dan??ho uzla
        // ak n??jde zhodu, prirad??
        function gorecursive(object) {
            let fasta;
            if (!object.hasOwnProperty("children")) {
                return;
            }
            for (var i = 0; i < 2; i++) {
                if (object.children[i].name) {
                    if (!object.children[i].name.includes("Inner")) {
                        fasta = '>' + object.children[i].name;
                        childrenarray.push(fasta);
                        childrenarray.push(object.children[i].sequence);
                    }
                    if (object.children[i].hasOwnProperty("children")) {
                        if (!object.children[i].name.includes("Inner")) {
                            fasta = '>' + object.children[i].name;
                            childrenarray.push(fasta);
                            childrenarray.push(object.children[i].sequence);
                        }
                        gorecursive(object.children[i]);
                    }
                }
            }
            return childrenarray;
        }

        var menu = [
            {
                title: 'Compute subtree consensus',
                action: function consensus(elm, d, i) {

                    //n??jdenie uzla, na ktor?? klikol pou????vate??(vstup d je vstupn?? uzol, d.name je jeho meno)
                    var result = searchInTreeForNode(nodes, d.name);
                    //rekurz??vne preh??ad??vanie v??etk??ch dc??rskych poduzlov a prid??vanie ich do po??a childrenarray
                    gorecursive(result);

                    // konverzia reprezent??cie children array vo form??te JSON ---> string
                    let childrenarr = JSON.stringify(childrenarray);

                    //odstr??nenie nechcen??ch znakov
                    childrenarr = childrenarr.replaceAll('"', "\n")
                    childrenarr = childrenarr.replaceAll('\\r', "")

                    // otvorenie "processing okna"
                    $('#myModal').modal('show');

                    $.ajax({
                        url: "/upload/currentnode",
                        method: "POST",
                        headers: {'X-CSRFToken': csrf},
                        data: {'array[]': childrenarray, 'consensus': getslidervalue()},
                    }).done(function (data) {
                        // po spracovan?? v??sledku zatvorenie "processing okna"
                        $('#myModal').modal('hide');

                        // zobrazenie v??sledku v modal okne
                        $('#modal-information').modal('show');
                        $('#sequence-result').html(data);
                        $('#selected-sequencies').html(
                            childrenarr
                        );

                        // pridanie novej vypo????tanej sekvencie na Y-ov?? ??rove??
                        // uzla pre ktor?? je po????tan??, k tomu sa pripo????ta offset pre zarovnanie
                        // s ostatn??mi sekvenciami
                        vis.selectAll('g.root.node').append("svg:text")
                            .attr("height", 10)
                            .attr("position", "relative")
                            .attr("text-anchor", "start")
                            .attr('font-family', 'monospace')
                            .attr('white-space', 'pre-line')
                            .attr('font-size', '17px')
                            .attr('fill', 'red')
                            .attr("transform", function (d) {
                                return "translate(" + (w - d.y + 800) + "," + 0 + ")"
                            })
                            .text(function (f) {
                                if (f.name === d.name)
                                    f.sequence = data;
                                return f.sequence;
                            });
                    }).fail(function () {
                        $('#myModal').modal('hide');
                        alert("Processing error ocurred\n");
                    });
                    //vypr??zdnenie childrenarray pre op??tovn?? volanie funkcie
                    childrenarray = [];
                }
            },
            {
                title: 'Show node trace',
                action: function highlighter(elm, d) {
                    var pointy = d.y;
                    var pointx = d.x;
                    var a = 1;
                    highlight(pointx, pointy, a);

                }
            },
        ]
             vis.selectAll("g.node")
            .data(nodes)
            .enter().append("svg:g")
            .on('click', function (d) {
                // console.log(d);
                // click(d)

            })
            // v pr??pade vykonania contextmenu akcie sa vykon?? akcia d3.contextMenu
            // s parametrom menu(pole menu polo??iek definovan?? vy????ie)
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

        // prid??vanie popisov ku uzlom a listom stromu
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
                    return d.name.slice(0, 9);
                });

            // pridanie n??zvu sekvencie ku listu
            vis.selectAll('g.leaf.node').append("svg:text")
                .attr("dx", 8)
                .attr("dy", 3)
                .attr("text-anchor", "start")
                .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
                .attr('font-size', '11px')
                .attr('fill', 'black')
                .text(function (d) {
                    //skr??tenie sekvencie na 90 znakov
                    return d.name.slice(0, 90);
                });

            // pridanie hodnoty sekvencie ku listu
            vis.selectAll('g.leaf.node').append("svg:text")
                .attr("height", 10)
                .attr("position", "relative")
                .attr("text-anchor", "start")
                .attr('font-family', 'monospace')
                .attr('white-space', 'pre-line')
                .attr('font-size', '17px')
                .attr('fill', 'black')
                .attr("transform", function (d) {
                    // poz??cia pridanej sekvencie
                    return "translate(" + (w - d.y + 800) + "," + 0 + ")"
                })
                .text(function (d) {
                    d.sequence = sequence_search(d.name)
                    return d.sequence
                });
        }

        // export stromu do PNG s??boru
        d3.select('#saveTree')
            .on('click', function () {
                var svgString = getSVGString(vis.node());
                svgString2Image(svgString, 6 * w, h + 300, 'png', save);
                function save(dataBlob, filesize) {
                    saveAs(dataBlob, 'tree.png'); // d3_toImage.sj -> FileSaver.js function
                }
            });

        return {tree: tree, vis: vis}
    }
}());



