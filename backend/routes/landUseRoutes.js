
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND USE / ZONING ROUTES
   ========================================================= */


const express = require("express");

const landUseData =
    require("../data/landuse");


const router =
    express.Router();


/* =========================================================
   GET ALL LAND USE RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: landUseData.length,

        data: landUseData

    });

});


/* =========================================================
   GET LAND USE FOR ONE PARCEL
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const landUse =
        landUseData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!landUse) {

        return res.status(404).json({

            success: false,

            message:
                "Land use record not found"

        });

    }


    res.json({

        success: true,

        data: landUse

    });

});


module.exports = router;

