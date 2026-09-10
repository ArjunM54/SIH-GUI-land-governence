const express = require("express");
const router = express.Router();

const parcels = require("../data/parcels");

router.get("/:ulpin", (req, res) => {

    const ulpin = req.params.ulpin.trim().toUpperCase();

    const parcel = parcels.find(
        p => p.ulpin &&
            p.ulpin.toUpperCase() === ulpin
    );

    if (!parcel) {
        return res.status(404).json({
            success: false,
            message: "ULPIN not found"
        });
    }

    res.json({
        success: true,
        data: parcel
    });
});

module.exports = router;