
/* =========================================================
   LANDGOV GIS
   SIH26014

   BUILDING PERMISSION ROUTES
   ========================================================= */


const express = require("express");

const buildingPermissionData =
    require("../data/BuildingPermission");


const router =
    express.Router();


/* =========================================================
   GET ALL BUILDING PERMISSION RECORDS
   ========================================================= */

router.get("/", (req, res) => {

    res.json({

        success: true,

        count:
            buildingPermissionData.length,

        data:
            buildingPermissionData

    });

});


/* =========================================================
   GET BUILDING PERMISSION BY PARCEL
   ========================================================= */

router.get("/:parcelId", (req, res) => {

    const parcelId =
        req.params.parcelId;


    const permission =
        buildingPermissionData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!permission) {

        return res.status(404).json({

            success: false,

            message:
                "Building permission record not found"

        });

    }


    res.json({

        success: true,

        data: permission

    });

});


module.exports = router;
