/* =========================================================
   LANDGOV GIS
   SIH26014 - Integrated Land Governance

   LAYERS.JS

   GIS data layers:
   - Land Parcels
   - Cadastral Boundaries
   - Roads
   - Buildings
   - Land Use / Zoning
   - Water Infrastructure
   - Electricity Infrastructure
   - Restrictions

   NOTE:
   These are prototype/demo layers.
   Real government GIS layers will later come
   through APIs / GIS services.
   ========================================================= */


/* =========================================================
   1. LAYER GROUPS
   ========================================================= */

const cadastralLayer = L.layerGroup();

const roadsLayer = L.layerGroup();

const buildingsLayer = L.layerGroup();

const zoningLayer = L.layerGroup();

const waterLayer = L.layerGroup();

const electricityLayer = L.layerGroup();

const restrictionsLayer = L.layerGroup();


/* =========================================================
   2. CADASTRAL BOUNDARIES
   ========================================================= */

const cadastralLines = [

    [
        [11.0200, 76.9500],
        [11.0200, 76.9570]
    ],

    [
        [11.0175, 76.9500],
        [11.0175, 76.9570]
    ],

    [
        [11.0155, 76.9500],
        [11.0155, 76.9570]
    ]

];


cadastralLines.forEach(
    function (line) {

        L.polyline(
            line,
            {
                color: "#7c3aed",
                weight: 2,
                dashArray: "6 5"
            }
        ).addTo(cadastralLayer);

    }
);


/* =========================================================
   3. ROAD LAYER
   ========================================================= */

const demoRoad = L.polyline(

    [
        [11.0120, 76.9480],
        [11.0140, 76.9520],
        [11.0170, 76.9560],
        [11.0220, 76.9600]
    ],

    {
        color: "#475569",
        weight: 7
    }

);


demoRoad.addTo(roadsLayer);


/* =========================================================
   4. BUILDING LAYER
   ========================================================= */

const buildings = [

    [11.0188, 76.9510],
    [11.0188, 76.9550],
    [11.0145, 76.9515],
    [11.0145, 76.9560]

];


buildings.forEach(
    function (coordinate) {

        L.rectangle(

            [
                [
                    coordinate[0] - 0.0004,
                    coordinate[1] - 0.0004
                ],

                [
                    coordinate[0] + 0.0004,
                    coordinate[1] + 0.0004
                ]
            ],

            {
                color: "#b45309",
                weight: 1,
                fillOpacity: 0.5
            }

        ).addTo(buildingsLayer);

    }
);


/* =========================================================
   5. ZONING / LAND USE LAYER
   ========================================================= */

const residentialZone = L.polygon(

    [
        [11.0215, 76.9490],
        [11.0215, 76.9540],
        [11.0180, 76.9540],
        [11.0180, 76.9490]
    ],

    {
        color: "#16a34a",
        weight: 1,
        fillOpacity: 0.15
    }

);


residentialZone.bindPopup(
    "<strong>Residential Zone</strong><br>" +
    "Permitted land use: Residential"
);


residentialZone.addTo(zoningLayer);


/* =========================================================
   6. WATER INFRASTRUCTURE
   ========================================================= */

const waterLine = L.polyline(

    [
        [11.0120, 76.9510],
        [11.0150, 76.9530],
        [11.0180, 76.9560],
        [11.0220, 76.9580]
    ],

    {
        color: "#0284c7",
        weight: 4
    }

);


waterLine.bindPopup(
    "<strong>Water Infrastructure</strong><br>" +
    "Demo water pipeline"
);


waterLine.addTo(waterLayer);


/* =========================================================
   7. ELECTRICITY INFRASTRUCTURE
   ========================================================= */

const electricityLine = L.polyline(

    [
        [11.0130, 76.9490],
        [11.0160, 76.9520],
        [11.0190, 76.9550],
        [11.0220, 76.9590]
    ],

    {
        color: "#ca8a04",
        weight: 3,
        dashArray: "8 5"
    }

);


electricityLine.bindPopup(
    "<strong>Electricity Infrastructure</strong><br>" +
    "Demo electricity line"
);


electricityLine.addTo(electricityLayer);


/* =========================================================
   8. LAND RESTRICTION ZONE
   ========================================================= */

const restrictionZone = L.polygon(

    [
        [11.0115, 76.9570],
        [11.0115, 76.9610],
        [11.0150, 76.9610],
        [11.0150, 76.9570]
    ],

    {
        color: "#dc2626",
        weight: 2,
        fillOpacity: 0.2
    }

);


restrictionZone.bindPopup(

    "<strong>Restricted Area</strong><br>" +
    "Development restrictions may apply."

);


restrictionZone.addTo(restrictionsLayer);


/* =========================================================
   9. ADD GIS LAYERS TO MAP CONTROL
   ========================================================= */

const gisLayers = {

    "Cadastral Boundaries":
        cadastralLayer,

    "Roads":
        roadsLayer,

    "Buildings":
        buildingsLayer,

    "Land Use / Zoning":
        zoningLayer,

    "Water Infrastructure":
        waterLayer,

    "Electricity Infrastructure":
        electricityLayer,

    "Land Restrictions":
        restrictionsLayer

};


/* =========================================================
   10. ADD LAYERS TO MAP
   ========================================================= */

Object.entries(gisLayers).forEach(
    function ([name, layer]) {

        layer.addTo(map);

    }
);


/* =========================================================
   11. UPDATE LAYER CONTROL
   ========================================================= */

/*
   Find existing Leaflet layer control
   and add the new GIS layers.

   map.js already creates the control.
*/

if (window.layerControl) {

    Object.entries(gisLayers).forEach(
        function ([name, layer]) {

            window.layerControl.addOverlay(
                layer,
                name
            );

        }
    );

}


/* =========================================================
   12. LAYER READY
   ========================================================= */

console.log(
    "GIS data layers initialized."
);

console.log(
    "Available GIS layers:",
    Object.keys(gisLayers)
);
