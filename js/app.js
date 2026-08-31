/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   APP.JS

   Application-level JavaScript.
   GIS/map functionality is handled by map.js.
   ========================================================= */


/* =========================================================
   1. LAND INFORMATION PANEL
   ========================================================= */

const landInfoPanel =
    document.getElementById("land-info");

const landDetails =
    document.getElementById("land-details");

const closePanel =
    document.getElementById("close-panel");


/* =========================================================
   2. SHOW LAND INFORMATION
   ========================================================= */

function showLandInformation(parcel) {

    if (!parcel) {
        console.error("No parcel data received.");
        return;
    }


    landDetails.innerHTML = `

        <div class="land-details-content">

            <div class="land-title">

                <h4>
                    ${parcel.id}
                </h4>

                <p>
                    Survey Number: ${parcel.surveyNumber}
                </p>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Owner
                </div>

                <div class="info-card-value">
                    ${parcel.owner}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Land Type
                </div>

                <div class="info-card-value">
                    ${parcel.landType}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Area
                </div>

                <div class="info-card-value">
                    ${parcel.area}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Land Use
                </div>

                <div class="info-card-value">
                    ${parcel.landUse}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    District
                </div>

                <div class="info-card-value">
                    ${parcel.district}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Village
                </div>

                <div class="info-card-value">
                    ${parcel.village}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Property Tax
                </div>

                <div class="info-card-value">
                    ${parcel.taxStatus}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Building Permission
                </div>

                <div class="info-card-value">
                    ${parcel.buildingPermission}
                </div>

            </div>


            <div class="info-card">

                <div class="info-card-label">
                    Restrictions
                </div>

                <div class="info-card-value">
                    ${parcel.restrictions}
                </div>

            </div>

        </div>

    `;


    landInfoPanel.style.display = "block";
}


/* =========================================================
   3. RESET INFORMATION PANEL
   ========================================================= */

function resetLandInformation() {

    landDetails.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                📍
            </div>

            <h4>
                Select a land parcel
            </h4>

            <p>
                Click anywhere on the map
                to view available land
                information.
            </p>

        </div>

    `;
}


/* =========================================================
   4. CLOSE PANEL
   ========================================================= */

closePanel.addEventListener(
    "click",
    function () {

        resetLandInformation();

    }
);


/* =========================================================
   5. GLOBAL PARCEL SELECTOR
   ========================================================= */

/*
    map.js uses this function when the user
    clicks "View Details" inside a popup.
*/

window.selectParcel = function (parcelId) {

    const parcel =
        window.landParcels.find(
            item => item.id === parcelId
        );


    if (!parcel) {

        console.error(
            "Parcel not found:",
            parcelId
        );

        return;
    }


    showLandInformation(parcel);
};


/* =========================================================
   6. APPLICATION START
   ========================================================= */

console.log(
    "LandGov application initialized."
);
