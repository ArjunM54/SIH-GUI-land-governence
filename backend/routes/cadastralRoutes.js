
/* =========================================================
   LANDGOV GIS
   SIH26014

   CADASTRAL ROUTES
   ========================================================= */


const express = require("express");

const cadastralData =
    require("../data/cadastral");


const router =
    express.Router();


/* =========================================================
   GET ALL CADASTRAL RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count: cadastralData.length,

        data: cadastralData

    });

});


/* =========================================================
   GET CADASTRAL DATA FOR ONE PARCEL
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const cadastralRecord =
        cadastralData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!cadastralRecord) {

        return res.status(404).json({

            success: false,

            message:
                "Cadastral record not found"

        });

    }


    res.json({

        success: true,

        data: cadastralRecord

    });

});


module.exports = router;
