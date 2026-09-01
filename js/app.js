/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   APP.JS

   Application-level JavaScript.
   GIS/map functionality is handled by map.js.
   ========================================================= */


/* =========================================================
   1. GLOBAL PARCEL SELECTOR (COMPATIBILITY FALLBACK)
   ========================================================= */

/*
    Forward any legacy selectParcel calls directly to
    openCompleteLandProfile.
*/

window.selectParcel = function (parcelId) {

    openCompleteLandProfile(parcelId);

};


/* =========================================================
   2. APPLICATION START
   ========================================================= */

console.log(
    "LandGov application initialized."
);
