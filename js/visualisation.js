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
var scaleFactor = 1;
var goodColor = "#4e9621";
var badColor = "#96214e";
var neutralColor = "black";
var filter = new Set(["Non-Renewable", "Renewable", "Other"]);

var svg = d3.select("div#d3-visualisation").append("svg")
.attr("width", width)
.attr("height", height);
var map = svg.append("g").attr("class", "map");
var dataPoints = svg.append("g").attr("class", "data-points");

var div = d3.select("#d3-visualisation").append("div")	
.attr("class", "tooltip")				
.style("opacity", 0);



var projection = d3.geoMercator()
.translate([width/2,height/2])
.scale(scale);

var path = d3.geoPath().projection(projection);



function ready(error,worldData,data){

	svg
	.call(d3.zoom()
		.translateExtent([[0,0],[width+10,height+10]])
		.scaleExtent([1,40])
		.on("zoom", function () {
			map.attr("transform", d3.event.transform);
		// var dataPointTransform = d3.event.transform;
		// dataPointTransform.k = 1;
		dataPoints.attr("transform", d3.event.transform);
		scaleFactor = d3.event.transform.k;

		dataPoints.selectAll(".power-plant").attr("r", getNewCircleRadius(0.25,3));
	})

		);

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


	svg.append("g")
	.attr("class", "legendOrdinal")
	.attr("transform", "translate(20,20)");

	var legendOrdinal = d3.legendColor()
	  //d3 symbol creates a path-string, for example
	  //"M0,-8.059274488676564L9.306048591020996,
	  //8.059274488676564 -9.306048591020996,8.059274488676564Z"
	  .shape("circle")
	  //.shape("path", d3.symbol().type(d3.symbolCircle).size(150)())
	  .shapePadding(10)
	  //use cellFilter to hide the "e" cell
	  .cellFilter(function(d){ return d.label !== "e" })
	  .scale(ordinal, scaleFactor)
	  .shapePadding(10)
	  .on("cellclick", function(legendItem){
	  	if(filter.has(legendItem))
	  		filter.delete(legendItem);
	  	else
	  		filter.add(legendItem);
	  	filterDataAndRepaint(data);
	  })
	  .on("cellover", function(legendItem){
	  	var circle = d3.select(this)
	  	.selectAll(".swatch");
	  	circle.attr("r", circle.attr("r") *2);	
	  })
	  .on("cellout", function(legendItem){
	  	var circle = d3.select(this)
	  	.selectAll(".swatch");
	  	circle.attr("r", circle.attr("r") /2);	
	  });

	  

	  svg.select(".legendOrdinal")
	  .call(legendOrdinal);


	}

	function paintCircles(data) {


		var mapWithData = dataPoints.selectAll(".power-plant").data(data);

		mapWithData.exit().remove();

 	//add data points
 	mapWithData
 	.enter()
 	.append("circle")
 	.merge(mapWithData)
 	.attr("class", "power-plant")
 	.attr("r", getNewCircleRadius(0.25,3))
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
		d3.select(this).attr("r", ()=>{;
			radius = radius*5;
			var newRadius = getNewCircleRadius(0.7,10);
			radius = radius/5;
			return newRadius;
		})

		div.transition()
		.duration(200)
		.style("opacity", .9);		
		div	.html(getTooltipText(d));
	})					
	.on("mouseout", function(d) {
		//change size
		d3.select(this).attr("r", getNewCircleRadius(0.25,3));

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
	else if ( fuel === "Other" || fuel === "Waste"){
		return {
			type:"Other",
			color: neutralColor
		};
	}
	else {return {
		type:"Other",
		color: neutralColor
	};};

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
		return filter.has(fuelType);
	});
	paintCircles(filteredData);
}

function getNewCircleRadius(minRadius, maxRadius) {
	var newRadius = radius/scaleFactor;
	if(newRadius<minRadius)
		{newRadius = minRadius;}
	else if (newRadius>maxRadius)
		{newRadius = maxRadius;}
	return newRadius;
}