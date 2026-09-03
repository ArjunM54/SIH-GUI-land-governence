/* =========================================================
   LANDGOV GIS
   RECORD OF RIGHTS (RoR) ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const rorData = require("../data/ror");
const { requireAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

router.get("/", requirePermission("ror.view"), (req, res) => {
    const authorized = rorData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

router.get("/:parcelId", requirePermission("ror.view"), (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access RoR data for this parcel."
        });
    }

    const record = rorData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "Record of Rights not found"
        });
    }

    res.json({
        success: true,
        data: record
    });
});

module.exports = router;
