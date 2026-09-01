/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   MAP.JS

   Map is now loaded from the backend API.
   ========================================================= */


/* =========================================================
   1. CREATE MAP
   ========================================================= */

const map = L.map("map").setView(
    [11.0168, 76.9558],
    13
);


/* Make map available globally */

window.map = map;


/* =========================================================
   2. OPENSTREETMAP
   ========================================================= */

const openStreetMapLayer = L.tileLayer(

    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",

    {
        maxZoom: 19,

        attribution:
            '&copy; OpenStreetMap contributors'
    }

).addTo(map);


/* =========================================================
   3. PARCEL LAYER
   ========================================================= */

const parcelLayer =
    L.layerGroup().addTo(map);


/* Make available globally */

window.parcelLayer = parcelLayer;


/* =========================================================
   4. DRAW PARCEL
   ========================================================= */

function drawParcel(parcel) {

    const polygon =
        L.polygon(

            parcel.coordinates,

            {
                color: "#2563eb",

                weight: 2,

                fillColor: "#60a5fa",

                fillOpacity: 0.35
            }

        );


    polygon.addTo(parcelLayer);


    /* Popup */

    polygon.bindPopup(`

        <strong>
            ${parcel.id}
        </strong>

        <br><br>

        Survey Number:
        ${parcel.surveyNumber}

        <br>

        Land Use:
        ${parcel.landUse}

        <br>

        Area:
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

    `);


    /* =========================================================
       PARCEL CLICK
       ========================================================= */

    polygon.on(
        "click",
        function () {

            openCompleteLandProfile(
                parcel.id
            );

        }
    );


    /* Hover */

    polygon.on(
        "mouseover",
        function () {

            polygon.setStyle({

                fillOpacity: 0.65,

                weight: 3

            });

        }
    );


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


/* =========================================================
   5. LOAD PARCELS FROM BACKEND
   ========================================================= */

async function loadParcels() {

    try {

        console.log(
            "Loading land parcels from backend..."
        );


        const response =
            await getParcels();


        if (!response.success) {

            throw new Error(
                "Backend returned an unsuccessful response."
            );

        }


        const parcels =
            response.data;


        /*
            Store the API data globally.

            search.js and app.js can use this.
        */

        window.landParcels =
            parcels;


        /* Clear old parcels */

        parcelLayer.clearLayers();


        /* Draw parcels */

        parcels.forEach(
            function (parcel) {

                drawParcel(parcel);

            }
        );


        console.log(
            `Loaded ${parcels.length} parcels from API.`
        );


    }

    catch (error) {

        console.error(
            "Unable to load parcels:",
            error
        );

        window.landParcels = [];

    }

}


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
   7. BASE MAP
   ========================================================= */

const baseMaps = {

    "OpenStreetMap":
        openStreetMapLayer

};


/* =========================================================
   8. LAYER CONTROL
   ========================================================= */

const overlayMaps = {

    "Land Parcels":
        parcelLayer

};


const layerControl =
    L.control.layers(
        baseMaps,
        overlayMaps
    ).addTo(map);


/* Make available globally */

window.layerControl =
    layerControl;


/* =========================================================
   9. SCALE
   ========================================================= */

L.control.scale({

    imperial: false

}).addTo(map);


/* =========================================================
   10. START
   ========================================================= */

loadParcels();


console.log(
    "GIS map initialized."
);
