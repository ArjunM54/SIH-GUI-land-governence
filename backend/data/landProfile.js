
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND PROFILE DATA

   This file combines:

   1. Parcel data
   2. Cadastral data
   3. RoR data

   The actual source data is maintained separately.

   This module provides a reusable function for
   generating a unified land profile.
   ========================================================= */


const parcels =
    require("./parcels");

const cadastralData =
    require("./cadastral");

const rorData =
    require("./ror");

const landUseData =
    require("./landuse");


/* =========================================================
   GET LAND PROFILE
   ========================================================= */

function getLandProfile(parcelId) {

    /* -----------------------------------------------------
       Find parcel
       ----------------------------------------------------- */

    const parcel =
        parcels.find(
            item =>
                item.id.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!parcel) {

        return null;

    }


    /* -----------------------------------------------------
       Find cadastral record
       ----------------------------------------------------- */

    const cadastral =
        cadastralData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* -----------------------------------------------------
       Find RoR record
       ----------------------------------------------------- */

    const ror =
        rorData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* -----------------------------------------------------
       Find Land Use record
       ----------------------------------------------------- */

    const landUse =
        landUseData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* -----------------------------------------------------
       Create unified profile
       ----------------------------------------------------- */

    const landProfile = {

        parcelId: parcel.id,

        parcel: parcel,

        cadastral:
            cadastral || null,

        ror:
            ror || null,

        landUse:
            landUse || null

    };


    return landProfile;

}


/* =========================================================
   GET ALL LAND PROFILES
   ========================================================= */

function getAllLandProfiles() {

    return parcels.map(parcel => getLandProfile(parcel.id));

}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {

    getLandProfile,

    getAllLandProfiles

};

