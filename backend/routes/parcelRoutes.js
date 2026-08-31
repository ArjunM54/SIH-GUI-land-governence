
/* =========================================================
   LANDGOV GIS
   SIH26014

   PARCEL ROUTES

   All parcel-related APIs are handled here.
   ========================================================= */


/* =========================================================
   1. IMPORT EXPRESS
   ========================================================= */

const express = require("express");


/* =========================================================
   2. IMPORT PARCEL DATA
   ========================================================= */

const parcels =
    require("../data/parcels");


/* =========================================================
   3. CREATE ROUTER
   ========================================================= */

const router =
    express.Router();


/* =========================================================
   4. GET ALL PARCELS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: parcels.length,

        data: parcels

    });

});


/* =========================================================
   5. GET PARCEL BY ID
   ========================================================= */

router.get("/:id", (req, res) => {

    const parcelId =
        req.params.id;


    const parcel =
        parcels.find(
            item =>
                item.id.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* Parcel not found */

    if (!parcel) {

        return res.status(404).json({

            success: false,

            message: "Parcel not found"

        });

    }


    /* Parcel found */

    res.json({

        success: true,

        data: parcel

    });

});


/* =========================================================
   6. EXPORT ROUTER
   ========================================================= */

module.exports = router;
