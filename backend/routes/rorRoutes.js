
/* =========================================================
   LANDGOV GIS
   SIH26014

   RECORD OF RIGHTS ROUTES
   ========================================================= */


const express = require("express");

const rorData =
    require("../data/ror");


const router =
    express.Router();


/* =========================================================
   GET ALL RoR RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: rorData.length,

        data: rorData

    });

});


/* =========================================================
   GET RoR BY PARCEL ID
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const record =
        rorData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!record) {

        return res.status(404).json({

            success: false,

            message:
                "RoR record not found"

        });

    }


    res.json({

        success: true,

        data: record

    });

});


module.exports = router;
