/* =========================================================
   LANDGOV GIS
   UTILITIES ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const utilitiesData = require("../data/utilities");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

router.get("/", (req, res) => {
    const authorized = utilitiesData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

router.get("/:parcelId", (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access utilities for this parcel."
        });
    }

    const record = utilitiesData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "Utility record not found"
        });
    }

    res.json({
        success: true,
        data: record
    });
});

module.exports = router;
