/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   MAP.JS

   Responsible for:
   - Leaflet map
   - OpenStreetMap
   - Land parcels
   - Parcel interaction
   - Map clicks
   - GIS visualization
   ========================================================= */


/* =========================================================
   1. CREATE MAP
   ========================================================= */

const map = L.map("map").setView(
    [11.0168, 76.9558],
    13
);

window.map = map;


/* =========================================================
   2. OPENSTREETMAP BASE LAYER
   ========================================================= */

const openStreetMapLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,

        attribution:
            '&copy; OpenStreetMap contributors'
    }
);


openStreetMapLayer.addTo(map);


/* =========================================================
   3. DEMO LAND PARCEL DATA
   ========================================================= */

const landParcels = [

    {
        id: "LND-001",

        owner: "Demo Land Owner",

        surveyNumber: "SUR-101",

        landType: "Residential",

        area: "2,400 sq.ft",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Residential",

        taxStatus: "Paid",

        restrictions: "No major restrictions",

        buildingPermission: "Eligible",

        coordinates: [

            [11.0200, 76.9500],

            [11.0200, 76.9530],

            [11.0175, 76.9530],

            [11.0175, 76.9500]

        ]
    },


    {
        id: "LND-002",

        owner: "Demo Property Owner",

        surveyNumber: "SUR-102",

        landType: "Commercial",

        area: "4,800 sq.ft",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Commercial",

        taxStatus: "Pending",

        restrictions: "Road setback applicable",

        buildingPermission: "Requires approval",

        coordinates: [

            [11.0200, 76.9540],

            [11.0200, 76.9570],

            [11.0175, 76.9570],

            [11.0175, 76.9540]

        ]
    },


    {
        id: "LND-003",

        owner: "Demo Agricultural Owner",

        surveyNumber: "SUR-103",

        landType: "Agricultural",

        area: "1.2 Acres",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Agricultural",

        taxStatus: "Paid",

        restrictions:
            "Agricultural land restrictions",

        buildingPermission: "Restricted",

        coordinates: [

            [11.0155, 76.9500],

            [11.0155, 76.9530],

            [11.0130, 76.9530],

            [11.0130, 76.9500]

        ]
    }

];


/*
    Make parcel data available to app.js.
*/

window.landParcels = landParcels;


/* =========================================================
   4. PARCEL LAYER
   ========================================================= */

const parcelLayer =
    L.layerGroup().addTo(map);


/* =========================================================
   5. ADD PARCELS
   ========================================================= */

landParcels.forEach(
    function (parcel) {


        const polygon = L.polygon(
            parcel.coordinates,
            {

                color: "#2563eb",

                weight: 2,

                fillColor: "#60a5fa",

                fillOpacity: 0.35

            }
        );


        polygon.addTo(parcelLayer);


        /* -----------------------------------------
           Popup
           ----------------------------------------- */

        polygon.bindPopup(`

            <div>

                <strong>
                    ${parcel.id}
                </strong>

                <br><br>

                <strong>
                    Survey Number:
                </strong>

                ${parcel.surveyNumber}

                <br>

                <strong>
                    Land Use:
                </strong>

                ${parcel.landUse}

                <br>

                <strong>
                    Area:
                </strong>

                ${parcel.area}

                <br><br>

                <button
                    onclick="selectParcel('${parcel.id}')"
                    style="
                        padding: 7px 12px;
                        border: none;
                        border-radius: 6px;
                        background: #2563eb;
                        color: white;
                        cursor: pointer;
                    "
                >
                    View Details
                </button>

            </div>

        `);


        /* -----------------------------------------
           Parcel click
           ----------------------------------------- */

        polygon.on(
            "click",
            function () {

                showLandInformation(parcel);

            }
        );


        /* -----------------------------------------
           Mouse over
           ----------------------------------------- */

        polygon.on(
            "mouseover",
            function () {

                polygon.setStyle({

                    fillOpacity: 0.65,

                    weight: 3

                });

            }
        );


        /* -----------------------------------------
           Mouse out
           ----------------------------------------- */

        polygon.on(
            "mouseout",
            function () {

                polygon.setStyle({

                    fillOpacity: 0.35,

                    weight: 2

                });

            }
        );

    }
);


/* =========================================================
   6. MAP CLICK
   ========================================================= */

map.on(
    "click",
    function (event) {


        const latitude =
            event.latlng.lat.toFixed(6);

        const longitude =
            event.latlng.lng.toFixed(6);


        console.log(
            "Selected coordinates:",
            latitude,
            longitude
        );


        L.popup()

            .setLatLng(event.latlng)

            .setContent(`

                <strong>
                    Selected Location
                </strong>

                <br><br>

                Latitude:
                ${latitude}

                <br>

                Longitude:
                ${longitude}

            `)

            .openOn(map);

    }
);


/* =========================================================
   7. MAP LAYER CONTROL
   ========================================================= */

/*
    This is the beginning of our
    multi-layer GIS architecture.

    Later we can add:

    - Cadastral layer
    - Road layer
    - Building layer
    - Utility layer
    - Zoning layer
    - Flood-risk layer
*/

const baseMaps = {

    "OpenStreetMap":
        openStreetMapLayer

};


const overlayMaps = {

    "Land Parcels":
        parcelLayer

};


const layerControl = L.control.layers(
    baseMaps,
    overlayMaps
).addTo(map);

window.layerControl = layerControl;


/* =========================================================
   8. MAP SCALE
   ========================================================= */

L.control.scale({
    imperial: false
}).addTo(map);


/* =========================================================
   9. MAP READY
   ========================================================= */

console.log(
    "GIS map initialized successfully."
);

console.log(
    "Land parcels loaded:",
    landParcels.length
);
