/* =========================================================
   LANDGOV GIS
   CADASTRAL ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const cadastralData = require("../data/cadastral");
const { requireAuth } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

router.get("/", requirePermission("cadastral.view"), (req, res) => {
    const authorized = cadastralData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

router.get("/:parcelId", requirePermission("cadastral.view"), (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access cadastral data for this parcel."
        });
    }

    const record = cadastralData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!record) {
        return res.status(404).json({
            success: false,
            message: "Cadastral record not found"
        });
    }

    res.json({
        success: true,
        data: record
    });
});

module.exports = router;
