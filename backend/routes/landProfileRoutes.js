/* =========================================================
   LANDGOV GIS
   UNIFIED LAND PROFILE ROUTES (PROTECTED & FILTERED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel, filterParcelsForUser } = require("../services/parcelAccessService");
const { getVisibleLandProfile } = require("../services/accessControlService");
const auditService = require("../services/auditService");

/**
 * @route   GET /api/land-profile
 * @desc    Get all land profiles for authorized parcels
 */
router.get("/", requireAuth, (req, res) => {
    const allProfiles = getAllLandProfiles();
    const authorizedProfiles = allProfiles
        .filter(p => canAccessParcel(req.user, p.parcelId))
        .map(p => getVisibleLandProfile(req.user, p))
        .filter(Boolean);

    res.json({
        success: true,
        count: authorizedProfiles.length,
        data: authorizedProfiles
    });
});

/**
 * @route   GET /api/land-profile/:parcelId
 * @desc    Get complete land profile filtered by role & permissions
 */
router.get("/:parcelId", requireAuth, (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's land profile."
        });
    }

    const rawProfile = getLandProfile(parcelId);

    if (!rawProfile) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Land profile not found"
        });
    }

    const filteredProfile = getVisibleLandProfile(req.user, rawProfile);

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: parcelId,
        action: "VIEW_LAND_PROFILE",
        result: "SUCCESS",
        details: { role: req.user.role }
    });

    res.json({
        success: true,
        parcelId: filteredProfile.parcelId,
        data: filteredProfile
    });
});

module.exports = router;
