'use strict';
/*
 @author: Brooks Mershon
*/
var chart = {};

chart = (function() {

    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        padding = {top: 60, right: 60, bottom: 60, left: 120},
        outerWidth = 1200,
        outerHeight = 1200,
        innerWidth = outerWidth - margin.left - margin.right,
        innerHeight = outerHeight - margin.top - margin.bottom,
        width = innerWidth - padding.left - padding.right,
        height = innerHeight - padding.top - padding.bottom,
        bar_width = 20,
        chart_width = innerWidth,
        chart_height = 900;

    // thousands separated by commas and no decimal points
    var commaFormat = d3.format(',.0f'),
        border, wilderness,
        projection = null;

    var path = d3.geo.path()
        .projection(projection);

    var underlay = d3.select("body").append("svg")
        .attr("width", outerWidth)
        .attr("height", outerHeight)

    var svg = underlay.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var g_graphic = svg.append("g").attr("transform", "translate(" + innerWidth/2 + "," + padding.top + ")");

    var g_timeline = svg.append("g")
                        .attr("transform", "translate(" + padding.left + "," + innerHeight/4 + ")")
                        .attr("id", "g_timeline");

    d3.json("combined.json", function(error, topology) {
        if (error) throw error;

        var state = topojson.feature(topology, topology.objects.nv),
            gbnp = topojson.feature(topology, topology.objects.gbnp).features[0],
            ncaCollection = topojson.feature(topology, topology.objects.nca),
            nca = ncaCollection.features,
            basinAndRange = topojson.feature(topology, topology.objects.basin).features[0],
            areasCollection = topojson.feature(topology, topology.objects.wilderness),
            areas = areasCollection.features,
            intersectionCollection = topojson.feature(topology, topology.objects.negative),
            intersections = intersectionCollection.features;

        console.log(topology);
        var uniqueDates,
            map = d3.map();

        var shapes = areas.concat(basinAndRange).concat(intersections).concat(nca).concat(gbnp),
            numShapes = shapes.length;

        for(var i = 0; i < numShapes; i++) {
            var o = shapes[i];
            if(!map.has(o.properties.YearDesign.toString())) {
                map.set(o.properties.YearDesign.toString(), []);
            }
            map.get(o.properties.YearDesign.toString()).push(+o.properties.SQMILES);
        }

        console.log(map.entries())
        // sum areas for each year
        map.forEach(function(key, value) {
          var arr = value;
          var sum = d3.sum(arr);
          map.set(key, sum)
        });



        var areaByYear = map.entries();

        // in place sort
        areaByYear.sort(function(a, b) {
          return a.key - b.key;
        })

        uniqueDates = map.keys().sort();

        //create "metadata" to build SMALL MULTPLES of the map for each year
        var chartData = [],
            total = 0;

        var total = 0;
        for(var i = 0; i < areaByYear.length; i++) {
            total += areaByYear[i].value*640;
            chartData.push({"year": areaByYear[i].key,
                            "acres": (+areaByYear[i].value)*640,
                            "cumulative": total
                           });
        }

        console.log("Acreage since 1962 and before 2015:", commaFormat(+chartData[uniqueDates.length-2].cumulative - +chartData[0].cumulative) + " acres");

        var boundary = g_graphic.append("path")
                        .datum(state)
                        .attr("class", "outline")
                        .attr("d", path);

        var basinAndRange = g_graphic.append("path")
                        .datum(basinAndRange)
                        .attr("id", "basin")
                        .attr("d", path);

        var GreatBasinNationalPark = g_graphic.append("path")
                        .datum(gbnp)
                        .attr("id", "gbnp")
                        .attr("d", path);

        var wilderness = g_graphic.selectAll(".wilderness")
                        .data(areas)
                    .enter().append("path")
                        .attr("class", "area")
                        .attr("d", path);

        var nca = g_graphic.selectAll(".parks")
                        .data(nca)
                    .enter().append("path")
                        .attr("class", "nca")
                        .attr("d", path);

        var barScale = d3.scale.linear()
                        .domain([0, total])
                        .range([0, chart_width * 2/3]);

        var yearScale = d3.scale.linear()
                        .domain([chartData[1].year, chartData[uniqueDates.length-1].year])
                        .range([0, innerHeight * 2/3]);

        var bars = g_timeline.selectAll(".bar")
                    .data(chartData.slice(1))
                    .enter().append("g").attr("transform",
                        function(d, i) {return "translate(" + 0 + "," + yearScale(d.year) + ")"});



        bars                .append("rect")
                            .attr("width", function(d) {return barScale(d.cumulative - d.acres)})
                            .attr("class", "bar")
                            .attr("height", bar_width)
                            .attr("x", 0)
                            .attr("y", 0);

        bars                .append("rect")
                            .attr("width", function(d) {return barScale(d.acres)})
                            .attr("class", "bar-tip")
                            .attr("height", bar_width)
                            .attr("x", function(d) {return barScale(d.cumulative - d.acres)})
                            .attr("y", 0);

        bars                .append("text")
                            .style("text-anchor", "start")
                            .attr("x", function(d) {return barScale(d.cumulative) + 20})
                            .attr("y", bar_width)
                            .text(function(d) {return commaFormat(d.cumulative) + " acres"});


        bars                .append("text")
                            .attr("year", "start")
                            .attr("x", -20)
                            .attr("y", bar_width)
                            .text(function(d) {return d.year});
    });

})();
