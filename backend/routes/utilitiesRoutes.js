
/* =========================================================
   LANDGOV GIS
   SIH26014

   UTILITIES / INFRASTRUCTURE ROUTES
   ========================================================= */


const express = require("express");

const utilitiesData =
    require("../data/utilities");


const router =
    express.Router();


/* =========================================================
   GET ALL UTILITY RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count:
            utilitiesData.length,

        data:
            utilitiesData

    });

});


/* =========================================================
   GET UTILITIES FOR ONE PARCEL
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const utilities =
        utilitiesData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!utilities) {

        return res.status(404).json({

            success: false,

            message:
                "Utility information not found"

        });

    }


    res.json({

        success: true,

        data: utilities

    });

});


module.exports = router;
