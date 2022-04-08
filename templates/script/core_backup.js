//newick parser
function parseNewick(s)
    {
        var ancestors = [];
        var tree = {};
        var tokens = s.split(/\s*(;|\(|\)|,|:)\s*/);
        for (var i=0; i<tokens.length; i++) {
            var token = tokens[i];
            switch (token) {
                case '(': // new branchset
                    var subtree = {};
                    tree.children = [subtree];
                    ancestors.push(tree);
                    tree = subtree;
                    break;
                case ',': // another branch
                    var subtree = {};
                    ancestors[ancestors.length-1].children.push(subtree);
                    tree = subtree;
                    break;
                case ')': // optional name next
                    tree = ancestors.pop();
                    break;
                case ':': // optional length next
                    break;
                default:
                    var x = tokens[i-1];
                    if (x == ')' || x == '(' || x == ',') {
                        tree.name = token;
                    } else if (x == ':') {
                        tree.length = parseFloat(token);
                    }
            }
        }
        return tree;
    }

//search in original sequence(fasta format)
function original_sequence_search() {


    var lines = "{{ original_sequence | safe  }}";    // lines is an array of strings

    // Loop through all lines
    for (var j = 0; j < lines.length; j++) {
    }
    var lines_array = [];
    var lines_object = {};
    var map = new Map();

    lines_array = lines.split('<br>');

    for (var i = 0; i < lines_array.length - 1; i++) {

        if (lines_array[i].includes("sp|A0LWS7|DNAK_ACIC1_Chaperone_protein_DnaK_OS_Acidothermus_cellulolyticus_strain_ATCC_43068_/_11B_OX_351607_GN_dnaK_PE_3_SV_1")) {
            console.log("match");
            console.log(lines_array[i])
            console.log("sequence is: \n" + lines_array[i + 1])
        }
    }

}

//find label in object ?? MAYBE NOT IMPORTANT
var findObjectByLabel = function (obj, label) {
    if (obj.label === label) {
        return obj;
    }
    for (var i in obj) {
        console.log("counter" + i);

        if (obj.hasOwnProperty(i)) {
            var foundLabel = findObjectByLabel(obj[i], label);
            if (foundLabel) {
                console.log("found label" + foundLabel);
                return foundLabel;
            }
        }
    }
    return null;
};


//search in tree for certain node with selected name
            function searchInTreeForNode(noder, name) {
                var stack = [], ii;
                stack.push(root);

                var searchedNode;

                while (stack.length > 0) {
                    noder = stack.pop();
                    if (noder.name == name) {
                        console.log("found it");
                        console.log("node is: " + noder.children);
                        console.log(noder);
                        searchedNode = noder;
                        noder=searchedNode;
                    } else if (noder.children && noder.children.length) {
                        for (ii = 0; ii < noder.children.length; ii += 1) {
                            stack.push(noder.children[ii]);
                        }
                    }
                }
                return searchedNode;

            }

            //node = all nodes
               var result = searchInTreeForNode(node,d.name);

               function gorecursive(object){
                if(!object.hasOwnProperty("children")) {
                    console.log("no children");
                    return;
                }
                for(var i=0; i<2;i++){
                    console.log("actual parent is :: " + object.name);
                    if(object.children[i].name !== undefined && object.children[i].name !== null) {
                        console.log("children.name " + object.children[i].name);
                        if(!object.children[i].name.includes("Inner"))
                            childrenarray.push(object.children[i].name);
                        if(object.children[i].hasOwnProperty("children")) {
                            console.log("children.name " + object.children[i].name);
                            if(!object.children[i].name.includes("Inner"))
                            childrenarray.push(object.children[i].name);
                            gorecursive(object.children[i]);
                        }
                    }
                }


            }

            gorecursive(result);





               //MOUSEOVER TOOLTIP
function mouseover_tooltip(d) {

    var sequence = null;
$.ajax({

    url: "upload/tooltip",
    async: false,
    method: "POST",
    headers: {'X-CSRFToken': '{{ csrf_token }}'},
    data: {'name': d.name},
  }).done(function ( data ) {
    sequence = data;
        console.log('data '+ data);
                console.log('sequence '+ sequence);

        var simpleData = (data);
    }).fail(function()  {
         $('#myModal').modal('hide');
    alert("Error ocurred\n possible fix: ensure all sequencies are at same length");
});



    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1)

        .style("position", "absolute")
        .style("background-color", "#F0F0F0")
        .style("left", event.pageX + "px")
        .style("top", event.pageY + "px")
        .style("padding", "10px")
        .style("border-radius", "10px")
        .html(
			"<table style='font-size: 15px; font-family: sans-serif;' >"+
			"<tr><td>Name: </td><td>"+d.name+"</td></tr>"+
            "<tr><td>Length: </td><td>"+d.length+"</td></tr>"+
            "<tr><td>Sequence: </td><td>"+sequence+"</td></tr>"+
            "</table>"
		);
}
function mousemove(d) {
    d3.select("body").selectAll('div.tooltip').style("opacity", 1);
}
function mouseout(d) {
    d3.select("body").selectAll('div.tooltip').remove();
}

