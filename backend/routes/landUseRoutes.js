/* =========================================================
   LANDGOV GIS
   LAND USE ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const landUseData = require("../data/landuse");
const { requireAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

router.get("/", requirePermission("landuse.view"), (req, res) => {
    const authorized = landUseData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

router.get("/:parcelId", requirePermission("landuse.view"), (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access land use data for this parcel."
        });
    }

    const record = landUseData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "Land use record not found"
        });
    }

    res.json({
        success: true,
        data: record
    });
});

module.exports = router;
