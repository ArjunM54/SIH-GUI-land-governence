/* =========================================================
   LANDGOV GIS
   RESTRICTIONS ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const restrictionsData = require("../data/restrictions");
const { requireAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

router.get("/", requirePermission("restrictions.view"), (req, res) => {
    const authorized = restrictionsData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

router.get("/:parcelId", requirePermission("restrictions.view"), (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access restrictions for this parcel."
        });
    }

    const record = restrictionsData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "Restriction record not found"
        });
    }

    res.json({
        success: true,
        data: record
    });
});

module.exports = router;
