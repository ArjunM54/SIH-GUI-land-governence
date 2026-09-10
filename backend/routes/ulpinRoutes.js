const express = require("express");

const router = express.Router();

const parcels = require("../data/parcels");


// GET LAND BY ULPIN
router.get("/:ulpin", (req, res) => {

    const ulpin = req.params.ulpin.trim().toUpperCase();

    const parcel = parcels.find(
        p => p.ulpin &&
            p.ulpin.toUpperCase() === ulpin
    );

    if (!parcel) {
        return res.status(404).json({
            success: false,
            message: "No land parcel found for this ULPIN"
        });
    }

    res.json({
        success: true,
        data: parcel
    });

});

module.exports = router;