
/* =========================================================
   LANDGOV GIS
   SIH26014

   PROPERTY TAX ROUTES
   ========================================================= */


const express = require("express");

const propertyTaxData =
    require("../data/PropertyTax");


const router =
    express.Router();


/* =========================================================
   GET ALL PROPERTY TAX RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: propertyTaxData.length,

        data: propertyTaxData

    });

});


/* =========================================================
   GET PROPERTY TAX BY PARCEL ID
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const taxRecord =
        propertyTaxData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!taxRecord) {

        return res.status(404).json({

            success: false,

            message:
                "Property tax record not found"

        });

    }


    res.json({

        success: true,

        data: taxRecord

    });

});


module.exports = router;
