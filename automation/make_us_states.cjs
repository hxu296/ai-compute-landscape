#!/usr/bin/env node
/* One-off generator for data/us_states.js: US state outlines as SVG paths in an Albers USA projection fitted to 960 wide (about 600 high),
   plus the projected positions of the cities named in research/us-sites.json (address cities and reviewed-override cities).

   Run once (the output is committed; the site never loads these packages):
     mkdir -p /tmp/usgeo && (cd /tmp/usgeo && npm init -y && npm install d3-geo@3 topojson-client@3 topojson-simplify@3 us-atlas@3)
     node automation/make_us_states.cjs --modules /tmp/usgeo/node_modules

   Geometry: us-atlas 3.0.1 states-10m.json (https://github.com/topojson/us-atlas), ISC license, Copyright 2013-2019
   Michael Bostock. It is derived from the U.S. Census Bureau 2017 cartographic boundary shapefiles (1:10,000,000),
   a U.S. Government work in the public domain. Projection and path code: d3-geo 3 (ISC); topology decoding and
   simplification: topojson-client 3 / topojson-simplify 3 (ISC).

   City positions: U.S. Census Bureau 2024 Gazetteer Files (public domain),
   https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_place_national.zip
   (INTPTLAT/INTPTLONG internal point of the incorporated place or CDP). Four cities are not Census places; they use
   the internal point of the ZIP Code Tabulation Area named in the site's Epoch address, from
   https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip
   (Pryor, OK uses the Census place "Pryor Creek city"). Toney, AL is neither a Census place nor given with a ZIP, so it
   has no marker; its site still counts in Alabama. A city marker is a locator for the city, not the site's exact parcel.
*/
const fs = require('fs'), path = require('path'), {createRequire} = require('module'), {pathToFileURL} = require('url');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const modules = path.resolve(arg('--modules', '/tmp/usgeo/node_modules'));
const req = createRequire(path.join(modules, 'noop.js'));
const topojson = req('topojson-client'), simplify = req('topojson-simplify');
const ROOT = path.resolve(__dirname, '..');
const W = 960, M = 6; // width and margin; the height is fitted to the projected outline (about 600)

const ABBR = {'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR','California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE',
  'District of Columbia':'DC','Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID','Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD','Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV','New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
  'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK','Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI',
  'South Carolina':'SC','South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT','Vermont':'VT','Virginia':'VA','Washington':'WA',
  'West Virginia':'WV','Wisconsin':'WI','Wyoming':'WY'};
// [lat, lon] from the 2024 Census Gazetteer (place file unless marked zcta).
const CITIES = {
  'Abilene, TX': [32.454514, -99.738147], 'Afton, TX': [33.766958, -100.764319, 'zcta 79220'], 'Atlanta, GA': [33.762909, -84.422675],
  'Barker, NY': [43.328328, -78.553535], 'Berwick, PA': [41.05499, -76.25101], 'Bowling Green, OH': [41.377677, -83.649584],
  'Bristow, VA': [38.729834, -77.544163, 'zcta 20136'], 'Canton, MS': [32.598419, -90.032191], 'Cedar Rapids, IA': [41.96419, -91.67917],
  'Chester, VA': [37.352045, -77.433695], 'Cheyenne, WY': [41.128702, -104.790778], 'Claude, TX': [35.107367, -101.362882],
  'Columbus, OH': [39.983938, -82.984882], 'Council Bluffs, IA': [41.235987, -95.853163], 'Cumming, IA': [41.484719, -93.761921],
  'Dalton, GA': [34.767898, -84.972812], 'Denton, TX': [33.217449, -97.141346], 'Eagle Mountain, UT': [40.31432, -112.011708],
  'Ellendale, ND': [46.004354, -98.525354], 'Kansas City, MO': [39.125155, -94.550313], 'Fairfax, IA': [41.925493, -91.777812], 'Fayetteville, GA': [33.449099, -84.472824],
  'Fort Wayne, IN': [41.088193, -85.142791], 'Gallatin, TN': [36.381524, -86.467021], 'Goodyear, AZ': [33.254031, -112.366472],
  'Hillsboro, OR': [45.526798, -122.935395], 'Holly Ridge, LA': [32.440635, -91.793784, 'zcta 71269'], 'Jeffersonville, IN': [38.332415, -85.696087],
  'Kuna, ID': [43.52484, -116.403639], 'Lancaster, OH': [39.725228, -82.605246], 'Lancaster, PA': [40.042061, -76.30099],
  'Lincoln, NE': [40.810284, -96.674856], 'Los Lunas, NM': [34.80087, -106.788691], 'Manassas, VA': [38.746808, -77.482633],
  'Marble, NC': [35.176954, -83.926523], 'Mesa, AZ': [33.400626, -111.716487], 'Memphis, TN': [35.109164, -89.968511], 'Midlothian, TX': [32.469436, -96.99067],
  'Montgomery, AL': [32.348503, -86.267307], 'Mount Pleasant, WI': [42.708832, -87.884894], 'Muskogee, OK': [35.743797, -95.356405],
  'New Albany, OH': [40.09, -82.776349], 'New Carlisle, IN': [41.706572, -86.507154], 'Omaha, NE': [41.262705, -96.053475],
  'Papillion, NE': [41.143374, -96.078088], 'Port Washington, WI': [43.384921, -87.884134], 'Pryor, OK': [36.299675, -95.311286, 'place Pryor Creek city'], 'Red Oak, TX': [32.509552, -96.78398],
  'Ridgeland, MS': [32.423676, -90.161773], 'Rosemount, MN': [44.745814, -93.068864], 'San Antonio, TX': [29.462809, -98.524635],
  'Sandston, VA': [37.513062, -77.313008], 'Springfield, NE': [41.107246, -96.148539], 'Sterling, VA': [39.004733, -77.405368],
  'Temple, TX': [31.104936, -97.388512], 'The Dalles, OR': [45.598386, -121.152411], 'Trenton, SC': [33.740557, -81.840937],
  'Vineland, NJ': [39.465007, -74.997115], 'Warren, OH': [41.239564, -80.816015]};

(async () => {
const d3 = await import(pathToFileURL(path.join(modules, 'd3-geo/dist/d3-geo.mjs')).href);
let topo = JSON.parse(fs.readFileSync(path.join(modules, 'us-atlas/states-10m.json'), 'utf8'));
topo = simplify.simplify(simplify.presimplify(topo, simplify.sphericalTriangleArea), +arg('--min-weight', 5e-7));
const states = topojson.feature(topo, topo.objects.states).features.filter(f => ABBR[f.properties.name]);
const all = {type: 'FeatureCollection', features: states};
const projection = d3.geoAlbersUsa().fitWidth(W - 2 * M, all);
const [[, y0], [, y1]] = d3.geoPath(projection).bounds(all), [tx, ty] = projection.translate();
projection.translate([tx + M, ty - y0 + M]);
const H = Math.ceil(y1 - y0 + 2 * M);
const geoPath = d3.geoPath(projection).digits(1);
const out = {};
for (const f of states.sort((a, b) => ABBR[a.properties.name].localeCompare(ABBR[b.properties.name]))) {
  const [cx, cy] = geoPath.centroid(f);
  out[ABBR[f.properties.name]] = {name: f.properties.name, fips: f.id, c: [Math.round(cx), Math.round(cy)], d: geoPath(f)};
}
const cities = {};
for (const [k, [lat, lon]] of Object.entries(CITIES)) {
  const p = projection([lon, lat]);
  if (!p) throw new Error('City outside the projection: ' + k);
  if (p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) throw new Error('City outside the frame: ' + k);
  cities[k] = [+p[0].toFixed(1), +p[1].toFixed(1)];
}
const meta = {width: W, height: H, projection: `d3.geoAlbersUsa fitted to width ${W} (${M}px margin), height ${H}`,
  geometry: `us-atlas 3.0.1 states-10m (ISC; from U.S. Census Bureau cartographic boundaries, public domain), simplified to spherical triangle area >= ${arg('--min-weight', 5e-7)} sr`,
  cities: 'U.S. Census Bureau 2024 Gazetteer place / ZCTA internal points (public domain)'};
const js = '// Generated once by automation/make_us_states.cjs; do not edit by hand.\n' +
  'window.US_MAP_META = ' + JSON.stringify(meta) + ';\n' +
  'window.US_STATES = ' + JSON.stringify(out) + ';\n' +
  'window.US_CITIES = ' + JSON.stringify(cities) + ';\n';
fs.writeFileSync(path.join(ROOT, 'data/us_states.js'), js);
console.log(`Wrote data/us_states.js: ${Object.keys(out).length} states, ${Object.keys(cities).length} cities, ${(js.length / 1024).toFixed(1)} KB`);
})().catch(e => { console.error(e); process.exit(1); });
