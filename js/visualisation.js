//Based on https://www.youtube.com/watch?v=aNbgrqRuoiE

d3.queue()
.defer(d3.json, "data/world-countries.json")
.defer(d3.csv, "data/final_data.csv", 
		//clean data
		function(data){
			//if some coordinates are missing, ignore it
			if(data["latitude"] !== "" && data["longitude"]!=="")
				return data;

		})
.await(ready);


var width = 1300;
var height = 900;
var scale = 200;
var radius = 3;
var goodColor = "#4e9621";
var badColor = "#96214e";
var neutralColor = "black";
var filterObj = {"Non-Renewable": true, 'Renewable' :true, 'Other' : true};
var filter = new Set([]);

var map = d3.select("div#d3-visualisation").append("svg")
.attr("width", width)
.attr("height", height);

var div = d3.select("#d3-visualisation").append("div")	
.attr("class", "tooltip")				
.style("opacity", 0);



var projection = d3.geoMercator()
.translate([width/2,height/2])
.scale(scale);

var path = d3.geoPath().projection(projection);



function ready(error,worldData,data){

	var countries = topojson.feature(worldData, worldData.objects.countries1).features;

 	//paint map
 	map.selectAll(".country")
 	.data(countries)
 	.enter().append("path")
 	.attr("class", "country")
 	.attr("d",path);

 	paintCircles(data, () => {return true;});

//LEGEND 
//https://d3-legend.susielu.com/
var ordinal = d3.scaleOrdinal()
.domain(["Renewable", "Non-Renewable", "Other"])
.range([ goodColor, badColor, neutralColor]);


map.append("g")
.attr("class", "legendOrdinal")
.attr("transform", "translate(20,20)");

var legendOrdinal = d3.legendColor()
	  //d3 symbol creates a path-string, for example
	  //"M0,-8.059274488676564L9.306048591020996,
	  //8.059274488676564 -9.306048591020996,8.059274488676564Z"
	  .shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
	  .shapePadding(10)
	  //use cellFilter to hide the "e" cell
	  .cellFilter(function(d){ return d.label !== "e" })
	  .scale(ordinal)
	  .on("cellclick", function(legendItem){
	  	if(filter.has(legendItem))
	  		filter.delete(legendItem);
	  	else
	  		filter.add(legendItem);
	  	filterDataAndRepaint(data);
	  });

	  map.select(".legendOrdinal")
	  .call(legendOrdinal);



	//LEGEND 2

	//Create the legend, and save it as a variable so we can access it in a moment
	// var legend = map.append("g").attr('class','legend')
	//   //We want to place our legend on the right hand side of the graph (at about (750,100))
	//   .attr("transform", function(d,i){return "translate("+(width-50)+",100)"})

	// //Draw a grey rectangle with a margin of 15 (attributes x and y) around the legend
	// legend.append("rect")
	//   .attr("x", -15)
	//   .attr("y", -15)
	//   .attr("width", 120)
	//   .attr("height", 110)
	//   .attr("fill", d3.rgb(220, 220, 220, 0.7));

	//   //Specify the items placed in the legend and add them to the legend
	// var items = legend.selectAll(".legendItem")
	//   .data(data)
	//   .enter().append("g")
	//   .attr("class","legendItem")
	//   //Move each item in the legend to the right so that we can display a line next to a label, where i is the number of the item in the list 
	//   .attr("transform", function(d,i){return "translate(0,"+i*20+")"});

	// //Add the name of each country and style the text             
	// items.append("text")
	//   .text(function(d) { return retrieveFuelTypeAndColor(d["fuel1"]).type; })
	//   .style("font", "10px sans-serif")
	//   .attr("text-anchor", "right")
	//   .attr("alignment-baseline", "middle")
	//   .attr("transform", function(d){return "translate(15,0)"});
}

function paintCircles(data) {


	var mapWithData = map.selectAll(".power-plant").data(data);

	mapWithData.exit().remove();

 	//add data points
 	mapWithData
 	.enter()
 	.append("circle")
 	.merge(mapWithData)
 	.attr("class", "power-plant")
 	.attr("r",radius)
 	.attr("cx", function(d){
 		var coords = projection([d.longitude, d.latitude]);
 		return coords[0];
 	})
 	.attr("cy", function(d) {
 		var coords = projection([d.longitude, d.latitude]);
 		return coords[1];
 	})
 	.attr("fill", function(d) {
 		return retrieveFuelTypeAndColor(d["fuel1"]).color;
 	})
	//tooltip
	.on("mouseover", function(d) {	
		//change size
		d3.select(this).attr("r",radius * 5);

		div.transition()
		.duration(200)
		.style("opacity", .9);		
		div	.html(getTooltipText(d));
	})					
	.on("mouseout", function(d) {
		//change size
		d3.select(this).attr("r",radius);

		div.transition()		
		.duration(500)		
		.style("opacity", 0);
	});
} 

function retrieveFuelTypeAndColor(fuel) {
	//non-renewable
	if (fuel === "Coal" ||fuel === "Gas" || fuel === "Oil" ||fuel === "Nuclear"){
		return {
			type:"Non-Renewable",
			color: badColor};
		}
	//renewable
	else if (fuel === "Geothermal" || fuel=== "Hydro" || fuel=== "Solar" || fuel === "Wave and Tidal" || fuel === "Wind" || fuel === "Biomass"){
		return {
			type:"Renewable",
			color: goodColor};
		}
	//neutral
	else if ( fuel === "Waste" || fuel === "Other" ){
		return {
			type:"Other",
			color: neutralColor
		};
	}
	else {return "gray"};

}

function getTooltipText(d) {
	var text = "Built in " + d["country_long"] 

	if(d["commissioning_year"] !==  "")
		text+= " (" + d["commissioning_year"]+ ")";

	text+= "<br>" + d["name"]  + "<br>Main fuel type: ";

	if(d["fuel1"] !== "")
		text+= d["fuel1"];
	else 
		text+= "unknown";


	return text;
}

function filterDataAndRepaint (unfilteredData) {

	var filteredData = unfilteredData;

	filteredData = filteredData.filter((dataRow) => {
		var fuel = dataRow["fuel1"];
		var fuelType= retrieveFuelTypeAndColor(fuel).type;
		return filter.has(fuelType)
	});
	paintCircles(filteredData);
}