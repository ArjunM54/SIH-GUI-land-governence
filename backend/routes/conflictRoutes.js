/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   CONFLICT DETECTION ROUTE
   ========================================================= */

const express = require("express");
const router = express.Router();

const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { validateLandGovernance } = require("../services/governanceValidator");
const { detectLandConflicts } = require("../services/conflictDetector");

/* =========================================================
   GET /api/conflicts
   Returns spatial land-use & restriction conflict analysis for ALL parcels.
   ========================================================= */
router.get("/", (req, res) => {
    try {
        console.log("[Conflict API] Received request for all parcel conflict assessments");
        const profiles = getAllLandProfiles();
        const results = profiles.map(profile => {
            const governanceResult = validateLandGovernance(profile);
            const conflictData = detectLandConflicts(profile, governanceResult);
            return {
                parcelId: profile.parcelId,
                data: conflictData
            };
        });

        return res.json({
            success: true,
            count: results.length,
            data: results
        });
    } catch (error) {
        console.error("[Conflict API] Error executing bulk conflict detection:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during conflict detection."
        });
    }
});

/* =========================================================
   GET /api/conflicts/:parcelId
   Returns conflict detection result for a specific parcel.
   ========================================================= */
router.get("/:parcelId", (req, res) => {
    try {
        const parcelId = req.params.parcelId;

        console.log(`[Conflict API] Received conflict detection request for Parcel ID: ${parcelId}`);

        const profile = getLandProfile(parcelId);

        if (!profile) {
            console.log(`[Conflict API] Parcel '${parcelId}' not found.`);
            return res.status(404).json({
                success: false,
                message: `Parcel '${parcelId}' not found.`
            });
        }

        const governanceAssessment = validateLandGovernance(profile);
        const conflictData = detectLandConflicts(profile, governanceAssessment);

        return res.json({
            success: true,
            parcelId: profile.parcelId,
            data: conflictData
        });

    } catch (error) {
        console.error("[Conflict API] Error executing conflict detection:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during conflict detection."
        });
    }
});

module.exports = router;
