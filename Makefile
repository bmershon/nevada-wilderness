# @author Brooks Mershon / The Washington Post

GENERATED_FILES = \
	combined.json

all: $(GENERATED_FILES)

.PHONY: clean all

redo:
	rm build/*.json combined.json build/basin.* build/nv_nca.* build/GreatBasin_shp.* build/intersection_dissolved.*

clean:
	rm -rf -- $(GENERATED_FILES) build


### STEP 1: download###

# download wilderness areas zip file
build/Wilderness_Areas.zip:
	mkdir -p build
	curl -o $@ 'http://www.wilderness.net/GIS/Wilderness_Areas.zip'

# download
build/%.tar.gz:
	mkdir -p $(dir $@)
	curl 'http://dds.cr.usgs.gov/pub/data/nationalatlas/$(notdir $@)' -o $@

### STEP 2: unzip and remove dates ###

# remove dates from filenames like Mike Bostock do!
build/Wilderness_Areas.shp: build/Wilderness_Areas.zip
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	unzip -d $(basename $@) $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)
	touch $@

# remove dates from filenames for state shapes as well
build/states-unfiltered.shp: build/statep010_nt00798.tar.gz
	rm -rf $(basename $@)
	mkdir -p $(basename $@)
	tar -xzm -C $(basename $@) -f $<
	for file in $(basename $@)/*; do chmod 644 $$file; mv $$file $(basename $@).$${file##*.}; done
	rmdir $(basename $@)

### STEP 3: filter and/or project ###

# filter states to find Nevada
build/nv.shp: build/states-unfiltered.shp
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' -t_srs 'EPSG:32007' -where "STATE_FIPS = '32'" $@ $<

# project basin
build/basin.shp: basin/basin.shp
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' -t_srs 'EPSG:32007' $@ $<

# project Great Basin National Park
build/GreatBasin_shp.shp: GreatBasin_shp/GreatBasin_shp.shp
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' -t_srs 'EPSG:32007' $@ $<

# project Great Basin National Park
build/nv_nca.shp: nv_nca/nv_nca.shp
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' -t_srs 'EPSG:32007' $@ $<

# filter wilderness areas
build/nv_wilderness.shp: build/Wilderness_Areas.shp
	rm -f $@ && ogr2ogr -f 'ESRI Shapefile' -t_srs 'EPSG:32007' -where "STATE = 'NV'" $@ $<

### STEP 4: Project and attach external attribute table (.csv) ###

# include with external attributes
build/wilderness.json: build/nv_wilderness.shp
	node_modules/.bin/topojson -o $@ \
	--simplify=.5 -e areas.csv --id-property=+OBJECTID_1 \
	--properties -- wilderness=$<

build/nv.json: build/nv.shp
	node_modules/.bin/topojson -o $@ --simplify=.5 -- nv=$<

build/basin.json: build/basin.shp
	node_modules/.bin/topojson --properties -o $@ --simplify=.5 -- basin=$<

build/gbnp.json: build/GreatBasin_shp.shp
	node_modules/.bin/topojson --properties -o $@ --simplify=.5 -- gbnp=$<

build/nv_nca.json: build/nv_nca.shp
	node_modules/.bin/topojson --properties -o $@ --simplify=.5 -- nca=$<

build/intersection_dissolved.json:
	node_modules/.bin/topojson \
	--properties='YearDesign=YearDesign' \
	--properties='SQMILES=SQMILES' \
	-o $@ --simplify=.5 -- negative=intersection_dissolved/intersection_dissolved.shp

### STEP 5: Combine and bake-in projection for screen cooridinates ###

combined.json: build/nv.json build/wilderness.json build/basin.json build/gbnp.json build/nv_nca.json build/intersection_dissolved.json
	node_modules/.bin/topojson -o $@ --height=500 --margin 10 -s .25 \
	--properties -- nv=build/nv.json \
	wilderness=build/wilderness.json \
	basin=build/basin.json nca=build/nv_nca.json \
	gbnp=build/gbnp.json \
	negative=build/intersection_dissolved.json
