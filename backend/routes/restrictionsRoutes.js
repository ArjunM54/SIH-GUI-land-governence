
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND RESTRICTIONS ROUTES
   ========================================================= */


const express = require("express");

const restrictionsData =
    require("../data/restrictions");


const router =
    express.Router();


/* =========================================================
   GET ALL RESTRICTION RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count:
            restrictionsData.length,

        data:
            restrictionsData

    });

});


/* =========================================================
   GET RESTRICTIONS FOR ONE PARCEL
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const restriction =
        restrictionsData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!restriction) {

        return res.status(404).json({

            success: false,

            message:
                "Restriction record not found"

        });

    }


    res.json({

        success: true,

        data: restriction

    });

});


module.exports = router;
