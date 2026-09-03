/* =========================================================
   LANDGOV GIS
   PARCEL API ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const parcels = require("../data/parcels");
const { requireAuth } = require("../middleware/authMiddleware");
const { filterParcelsForUser, canAccessParcel } = require("../services/parcelAccessService");
const auditService = require("../services/auditService");

/**
 * @route   GET /api/parcels
 * @desc    Returns authorized parcels for the logged-in user context
 */
router.get("/", requireAuth, (req, res) => {
    const userParcels = filterParcelsForUser(req.user, parcels);

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: "PARCEL_LIST",
        action: "VIEW_PARCELS",
        result: "SUCCESS",
        details: { returnedCount: userParcels.length }
    });

    res.json({
        success: true,
        count: userParcels.length,
        data: userParcels
    });
});

/**
 * @route   GET /api/parcels/:id
 * @desc    Get single parcel details if authorized
 */
router.get("/:id", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    if (!parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Parcel not found"
        });
    }

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: parcelId,
        action: "VIEW_PARCEL_DETAIL",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: parcel
    });
});

module.exports = router;
