/* =========================================================
   LANDGOV GIS
   SIH26014

   SEARCH.JS

   Search land parcels by:
   - Parcel ID
   - Survey Number
   - Village
   - Land Type
   - Land Use
   ========================================================= */


/* =========================================================
   1. GET HTML ELEMENTS
   ========================================================= */

const searchInput =
    document.getElementById("parcel-search");

const searchButton =
    document.getElementById("search-btn");

const searchResults =
    document.getElementById("search-results");


/* =========================================================
   2. SEARCH FUNCTION
   ========================================================= */

function searchParcels() {

    const query =
        searchInput.value
            .trim()
            .toLowerCase();


    /* Empty search */

    if (!query) {

        searchResults.innerHTML = "";

        return;
    }


    /* Find matching parcels */

    const results =
        window.landParcels.filter(
            function (parcel) {

                return (

                    parcel.id
                        .toLowerCase()
                        .includes(query)

                    ||

                    parcel.surveyNumber
                        .toLowerCase()
                        .includes(query)

                    ||

                    (parcel.owner && parcel.owner
                        .toLowerCase()
                        .includes(query))

                    ||

                    (parcel.village && parcel.village
                        .toLowerCase()
                        .includes(query))

                    ||

                    (parcel.district && parcel.district
                        .toLowerCase()
                        .includes(query))

                    ||

                    (parcel.landType && parcel.landType
                        .toLowerCase()
                        .includes(query))

                    ||

                    (parcel.landUse && parcel.landUse
                        .toLowerCase()
                        .includes(query))

                );

            }
        );


    displaySearchResults(results);
}


/* =========================================================
   3. DISPLAY RESULTS
   ========================================================= */

function displaySearchResults(results) {


    /* No results */

    if (results.length === 0) {

        searchResults.innerHTML = `

            <div class="search-message">

                No land parcels found.

            </div>

        `;

        return;
    }


    /* Results */

    searchResults.innerHTML = `

        <div class="search-result-list">

            ${results.map(
        function (parcel) {

            return `

                        <div
                            class="search-result"
                            onclick="selectSearchParcel('${parcel.id}')"
                        >

                            <strong>
                                ${parcel.id}
                            </strong>

                            <span>
                                Survey:
                                ${parcel.surveyNumber}
                            </span>

                            <span>
                                ${parcel.landType}
                            </span>

                        </div>

                    `;

        }
    ).join("")}

        </div>

    `;
}


/* =========================================================
   4. SELECT SEARCH RESULT
   ========================================================= */

window.selectSearchParcel =
    function (parcelId) {


        const parcel =
            window.landParcels.find(
                function (item) {

                    return item.id === parcelId;

                }
            );


        if (!parcel) {

            console.error(
                "Parcel not found:",
                parcelId
            );

            return;
        }


        /* Calculate parcel center */

        const polygon =
            L.polygon(
                parcel.coordinates
            );


        const center =
            polygon.getBounds().getCenter();


        /* Zoom map */

        window.map.flyTo(
            center,
            17,
            {
                duration: 1.5
            }
        );


        /* Show information */

        openCompleteLandProfile(parcelId);


        /* Clear search results */

        searchResults.innerHTML = "";

    };


/* =========================================================
   5. SEARCH BUTTON
   ========================================================= */

searchButton.addEventListener(
    "click",
    searchParcels
);


/* =========================================================
   6. ENTER KEY SEARCH
   ========================================================= */

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            searchParcels();

        }

    }
);


/* =========================================================
   7. SEARCH READY
   ========================================================= */

console.log(
    "Land search initialized."
);
