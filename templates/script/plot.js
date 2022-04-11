function deleteCreatedGraph() {

    d3.selectAll('svg > rect > *').remove();

    svg.selectAll("*").remove();
    svg.selectAll("rect").remove();
    var div = document.getElementById('my_dataviz');
    div.remove();
    var g = document.createElement("div");
    g.setAttribute("id", "my_dataviz")
    document.getElementById('my_dataviz_parent').appendChild(g);

    if ($('#gap-switcher').css('visibility') == 'visible')
        $('#gap-switcher').css('visibility', 'hidden');


}

function download(){
    d3.select("#download")
        .on('click', function(){
    // Get the d3js SVG element and save using saveSvgAsPng.js
    saveSvgAsPng(document.getElementsByTagName("svg")[0], "plot.png", {scale: 2, backgroundColor: "#FFFFFF"});
})
}

function creategraph(csv_data, color, zoomvalue, charsettofind, input_width) {



$.getScript("https://d3js.org/d3.v4.js", function() {

    console.log('charset ' + charsettofind)


    console.log('zoom in plot\n' + zoomvalue)

    if (typeof charsettofind === "undefined")
        charsettofind = "GAPS"
    if (typeof color === "undefined")
        color = "#3a543e"
    var div = document.getElementById('my_dataviz');

    div.innerHTML += '<p style="margin-left: 2%;"> Selected charset ' + charsettofind + ', <br>Graph color:' + color + '</p>';

    if (typeof color === "undefined")
        color = "#3a543e"

    if (typeof zoomvalue === "undefined")
        zoomvalue = true

    if (typeof input_width === "undefined") {
        input_width = 5000;
        console.log('input width undefined')
    }
    else {
        console.log('input width \n'+input_width)
        input_width = input_width *3.5
                console.log('input width \n'+input_width)

    }



    if ($('#gap-switcher').css('visibility') == 'hidden')
        $('#gap-switcher').css('visibility', 'visible');

    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "black")
        .style("color", "white")
        .style("border-radius", "5px")
        .style("padding", "10px")

    var showTooltip = function (d) {
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 1)
        tooltip
            .html("Position: " + d.id + " - Occurrence : " + d.value + " %")
            // .style("left", event.clientY + "px")
            // .style("top", event.clientX + "px")
            .attr("dx", 8)
                .attr("dy", 3)
            .style("font-size", "30px")
    }
    var moveTooltip = function (d) {
        tooltip
            .style("left", 0 + "px")
            .style("top", 0 + "px")
    }
    // A function that change this tooltip when the leaves a point: just need to set opacity to 0 again
    var hideTooltip = function (d) {
        tooltip
            .transition()
            .duration(100)
            .style("opacity", 0)
    }
    var data = d3.csvParse(csv_data);
// set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 70, left: 60},
        width = input_width - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    if (zoomvalue === false || zoomvalue == "false" || zoomvalue == false) {
        svg = d3.select("#my_dataviz")
            .append("g")
            .append("svg")
            .attr("width", input_width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
    } else {
        console.log('zoom enabled' + zoomvalue)
        svg = d3.select("#my_dataviz")
            .append("rect")
            .attr("width", input_width)
            .attr("height", height)
            .style("fill", color)
            .call(d3.zoom().on("zoom", function () {
                svg.attr("transform", d3.event.transform)
            }))
            .append("g")
            .append("svg")
            .attr("width", input_width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
    }

// Parse the Data

// X axis
    var x = d3.scaleBand()
        .range([0, input_width])
        .domain(data.map(function (d) {
            return d.id;
        }))
        .padding(0.2);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,10)rotate(-90)")
        .attr("font-size", "4px")
        .attr("letter-spacing",".06rem")

        .style("text-anchor", "end");

// Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 100])
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

// Bars
    svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", function (d) {
            return x(d.id);
        })
        .attr("y", function (d) {
            return y(d.value);
        })
        .attr("width", x.bandwidth())
        .attr("height", function (d) {
            return height - y(d.value);
        })
        .attr("fill", color)
        .on("mouseover", showTooltip)
        .on("mouseleave", hideTooltip)
        .on("mousemove", moveTooltip);

    d3.select('#saveGraph').on('click', function(){
	var svgString = getSVGString(svg.node());
	svgString2Image( svgString, 2*width, 2*height, 'png', save ); // passes Blob and filesize String to the callback
console.log('svg\n'+svgString)
	function save( dataBlob, filesize ){
		saveAs( dataBlob, 'D3 vis exported to PNG.png' ); // FileSaver.js function
	}
});
})
}

