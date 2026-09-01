
/* =========================================================
   LANDGOV GIS
   SIH26014

   UNIFIED LAND PROFILE ROUTES

   This API combines information from:

   1. Parcel
   2. Cadastral
   3. Record of Rights (RoR)

   Example:

   GET /api/land-profile/LND-001
   ========================================================= */


const express = require("express");


/* =========================================================
   IMPORT DATA HELPERS
   ========================================================= */

const {
    getLandProfile,
    getAllLandProfiles
} = require("../data/landProfile");


/* =========================================================
   CREATE ROUTER
   ========================================================= */

const router =
    express.Router();


/* =========================================================
   GET ALL LAND PROFILES
   ========================================================= */

router.get("/", (req, res) => {

    const profiles =
        getAllLandProfiles();


    res.json({

        success: true,

        count: profiles.length,

        data: profiles

    });

});


/* =========================================================
   GET COMPLETE LAND PROFILE BY PARCEL ID
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const profile =
        getLandProfile(parcelId);


    if (!profile) {

        return res.status(404).json({

            success: false,

            message:
                "Parcel not found"

        });

    }


    res.json({

        success: true,

        parcelId: profile.parcelId,

        data: profile

    });

});


/* =========================================================
   EXPORT ROUTER
   ========================================================= */

module.exports = router;

