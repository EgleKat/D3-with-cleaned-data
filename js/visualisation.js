 //Based on https://www.youtube.com/watch?v=aNbgrqRuoiE


 let dataset = d3.csv("data/final_data.csv", function(){}, function(){

 	console.log("done");
 });
d3.queue()
	.defer(d3.json, "data/world-countries.json")
	.defer(d3.csv, "data/final_data.csv")
	.await(ready);


 var width = 1300;
 var height = 900;

var map = d3.select("div#d3-visualisation").append("svg")
    .attr("width", width)
    .attr("height", height);


var scale = 200;

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
		.attr("r",2)
		.attr("cx", function(d){
			var coords = projection([d.longitude, d.latitude]);
			return coords[0];
		})
		.attr("cy", function(d) {
			var coords = projection([d.longitude, d.latitude]);
			return coords[1];
		});



	console.log(data);
}