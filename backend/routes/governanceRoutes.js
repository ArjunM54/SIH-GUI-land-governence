/* =========================================================
   LANDGOV GIS
   GOVERNANCE API ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { validateLandGovernance } = require("../services/governanceValidator");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const { filterGovernanceData } = require("../services/accessControlService");
const auditService = require("../services/auditService");

router.get("/:parcelId", requireAuth, (req, res) => {
    const parcelId = req.params.parcelId;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to view governance information for this parcel."
        });
    }

    const profile = getLandProfile(parcelId);
    if (!profile) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Parcel not found."
        });
    }

    const rawGovernance = validateLandGovernance(profile);
    const visibleData = filterGovernanceData(req.user, { parcelId, ...rawGovernance });

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: parcelId,
        action: "VIEW_GOVERNANCE",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: visibleData
    });
});

router.get("/", requireAuth, (req, res) => {
    const profiles = getAllLandProfiles();
    const filtered = profiles
        .filter(p => canAccessParcel(req.user, p.parcelId))
        .map(p => {
            const rawGov = validateLandGovernance(p);
            return filterGovernanceData(req.user, { parcelId: p.parcelId, ...rawGov });
        });

    res.json({
        success: true,
        count: filtered.length,
        data: filtered
    });
});

module.exports = router;
