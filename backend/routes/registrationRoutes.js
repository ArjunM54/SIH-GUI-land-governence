
/* =========================================================
   LANDGOV GIS
   SIH26014

   PROPERTY REGISTRATION ROUTES
   ========================================================= */


const express = require("express");

const registrationData =
    require("../data/registration");


const router =
    express.Router();


/* =========================================================
   GET ALL REGISTRATION RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: registrationData.length,

        data: registrationData

    });

});


/* =========================================================
   GET REGISTRATION BY PARCEL ID
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const registration =
        registrationData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!registration) {

        return res.status(404).json({

            success: false,

            message:
                "Registration record not found"

        });

    }


    res.json({

        success: true,

        data: registration

    });

});


module.exports = router;
