 //Based on https://www.youtube.com/watch?v=aNbgrqRuoiE


 let dataset = d3.csv("data/final_data.csv", function(){}, function(){

 	console.log("done");
 });
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

 var map = d3.select("div#d3-visualisation").append("svg")
 .attr("width", width)
 .attr("height", height);

 var div = d3.select("#d3-visualisation").append("div")	
 .attr("class", "tooltip")				
 .style("opacity", 0);


 var scale = 200;
 var radius = 3;
 var projection = d3.geoMercator()
 .translate([width/2,height/2])
 .scale(scale);

 var path = d3.geoPath().projection(projection);



 function ready(error,worldData,data){

 	var countries = topojson.feature(worldData, worldData.objects.countries1).features

 	map.selectAll(".country")
 	.data(countries)
 	.enter().append("path")
 	.attr("class", "country")
 	.attr("d",path);

 	map.selectAll(".power-plant")
 	.data(data)
 	.enter().append("circle")
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
		return retrieveFuelColor(d["fuel1"]);
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



function retrieveFuelColor(fuel) {
	//bad
	if (fuel === "Coal" ||fuel === "Gas" || fuel === "Oil")
		return "red";
	//good
	else if (fuel === "Geothermal" || fuel=== "Hydro" || fuel=== "Solar" || fuel === "Wave and Tidal" || fuel === "Wind")
		return "green";
	//neutral
	else if (fuel === "Nuclear" || fuel === "Waste" || fuel === "Other" || fuel === "Biomass")
		return "yellow";
	else return "gray";
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