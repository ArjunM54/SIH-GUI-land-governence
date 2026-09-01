/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   GOVERNANCE VALIDATION ROUTE
   ========================================================= */

const express = require("express");
const router = express.Router();

const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { validateLandGovernance } = require("../services/governanceValidator");

/* =========================================================
   GET /api/governance
   Returns land governance validation assessments for ALL parcels.
   ========================================================= */
router.get("/", (req, res) => {
    try {
        console.log("[Governance API] Received request for all governance assessments");
        const profiles = getAllLandProfiles();
        const assessments = profiles.map(profile => ({
            parcelId: profile.parcelId,
            data: validateLandGovernance(profile)
        }));

        return res.json({
            success: true,
            count: assessments.length,
            data: assessments
        });
    } catch (error) {
        console.error("[Governance API] Error executing bulk governance validation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during governance validation."
        });
    }
});

/* =========================================================
   GET /api/governance/:parcelId
   Returns land governance validation assessment for a parcel.
   ========================================================= */
router.get("/:parcelId", (req, res) => {
    try {
        const parcelId = req.params.parcelId;

        console.log(`[Governance API] Received governance validation request for Parcel ID: ${parcelId}`);

        const profile = getLandProfile(parcelId);

        if (!profile) {
            console.log(`[Governance API] Parcel '${parcelId}' not found.`);
            return res.status(404).json({
                success: false,
                message: `Parcel '${parcelId}' not found.`
            });
        }

        const governanceAssessment = validateLandGovernance(profile);

        return res.json({
            success: true,
            parcelId: profile.parcelId,
            data: governanceAssessment
        });

    } catch (error) {
        console.error("[Governance API] Error executing governance validation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during governance validation."
        });
    }
});

module.exports = router;
