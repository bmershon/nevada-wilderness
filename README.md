<img src="https://github.com/bmershon/published-urls/raw/master/img/reid-nevada/reid-nevada.png" width="100%" alt="nevada-wilderness">

### Quickstart ###

Install the `node` requirements (Topojson, ).
```
npm Install
```
Download, filter, and project stuff to make maps! *This takes a while.*
```
make
```
You can use `make clean` to start afresh, and you can use `make redo` to re-project without deleting all those downloaded files that took *forever* to complete.

### Development

The goal of this project was to create a high-resolution static graphic for web and print use. The graphic found in the published links shows a map and timeline depicting the cumulative wilderness area that has been designated from 1964-2015 as a result of Harry Reid's conservation efforts.

####Pipeline:####

Government shapefiles must be downloaded and then filtered to produce the 'combined.json' file with only the necessary geometry. Ideally, only the necessary attributes will be retained when large numbers of polygons are involved, since unused attributes are duplicated.

[d3.geo][d3.geo] is used to render the geographic information as well as perform the appropriate filtering of areas based on the `YearDesign` attribute of each polygon, as well as to calculate cumulative areas for each unique year at which wilderness areas came into existence. In this particular case, the script finds the following unique years:
```
["1964", "1989", "2000", "2002", "2004", "2006", "2014", "2015"]"
```
Small multiples of Nevada depicting the different wilderness areas that are present at each of the 8 years found above can easily be produced. *Indeed, the small-multiple approach was used in earlier iterations of this project.*

The rendered map and timeline can be exported as an SVG by simply clicking the **SVG Crowbar 2** button on the bage, or by using the handy [SVG Crowbar 2][crowbar] bookmarklet that was created by the NYTimes. You should stick that puppy in your toolbar if you have not already done so.


[d3.geo]:https://github.com/mbostock/d3/wiki/Geo-Projections

[crowbar]:http://nytimes.github.io/svg-crowbar/
