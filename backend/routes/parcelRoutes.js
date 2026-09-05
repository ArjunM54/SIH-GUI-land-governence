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
    const { getIntegratedLandProfile } = require("../data/landProfile");

    const enrichedParcels = userParcels.map(p => {
        const integrated = getIntegratedLandProfile(p.id);
        return {
            ...p,
            governanceStatus: integrated ? integrated.governance.overallStatus : "VERIFIED",
            departmentStatuses: integrated ? integrated.governance.departmentStatuses : {}
        };
    });

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: "PARCEL_LIST",
        action: "VIEW_PARCELS",
        result: "SUCCESS",
        details: { returnedCount: enrichedParcels.length }
    });

    res.json({
        success: true,
        count: enrichedParcels.length,
        data: enrichedParcels
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

/**
 * @route   GET /api/parcels/:id/integrated-profile
 * @desc    Get unified integrated land profile for parcel
 */
router.get("/:id/integrated-profile", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's integrated profile."
        });
    }

    const { getIntegratedLandProfile } = require("../data/landProfile");
    const { getVisibleLandProfile } = require("../services/accessControlService");
    const profile = getIntegratedLandProfile(parcelId);

    if (!profile) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Integrated land profile not found"
        });
    }

    const filteredProfile = getVisibleLandProfile(req.user, profile);

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_INTEGRATED_LAND_PROFILE",
        result: "SUCCESS",
        details: { role: req.user.role }
    });

    res.json({
        success: true,
        parcelId: filteredProfile.parcelId || parcelId,
        data: filteredProfile
    });
});

module.exports = router;
