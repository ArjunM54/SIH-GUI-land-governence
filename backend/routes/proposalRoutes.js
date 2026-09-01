
/* http://localhost:5000/api/proposals/all */
/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DEVELOPMENT PROPOSAL VALIDATION ROUTE
   ========================================================= */

const express = require("express");
const router = express.Router();

const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { validateDevelopmentProposal, VALID_ACTIVITY_TYPES, VALID_DEVELOPMENT_TYPES } = require("../services/proposalValidator");

/**
 * Helper to sanitize and format proposal input.
 */
function sanitizeProposal(inputProposal = {}) {
    const activityType = (inputProposal.activityType || "OTHER").toUpperCase();
    const developmentType = (inputProposal.developmentType || "OTHER").toUpperCase();

    let proposedArea = null;
    if (inputProposal.proposedArea !== undefined && inputProposal.proposedArea !== null) {
        proposedArea = Number(inputProposal.proposedArea);
        if (isNaN(proposedArea) || proposedArea <= 0) {
            proposedArea = null;
        }
    }

    return {
        activityType: VALID_ACTIVITY_TYPES.includes(activityType) ? activityType : "OTHER",
        developmentType: VALID_DEVELOPMENT_TYPES.includes(developmentType) ? developmentType : "OTHER",
        proposedArea
    };
}

/**
 * Helper to validate a proposal against all parcels.
 */
function validateAllParcels(proposalInput) {
    const sanitizedProposal = sanitizeProposal(proposalInput);
    const profiles = getAllLandProfiles();

    const results = profiles.map(profile => {
        const assessment = validateDevelopmentProposal(profile, sanitizedProposal);
        return {
            parcelId: profile.parcelId,
            proposal: sanitizedProposal,
            data: assessment
        };
    });

    return {
        success: true,
        count: results.length,
        proposal: sanitizedProposal,
        data: results
    };
}

/* =========================================================
   GET /api/proposals & GET /api/proposals/all
   Validates proposals across ALL parcels.
   ========================================================= */
router.get(["/", "/all", "/validate/all"], (req, res) => {
    try {
        console.log("[Proposal API] Executing bulk proposal validation for all parcels.");
        const results = validateAllParcels(req.query || {});
        return res.json(results);
    } catch (error) {
        console.error("[Proposal API] Error in GET all proposal validations:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during bulk proposal validation."
        });
    }
});

/* =========================================================
   POST /api/proposals/all & POST /api/proposals/validate/all
   Validates proposals across ALL parcels via POST body.
   ========================================================= */
router.post(["/all", "/validate/all"], (req, res) => {
    try {
        console.log("[Proposal API] Executing bulk proposal validation for all parcels via POST.");
        const { proposal } = req.body || {};
        const results = validateAllParcels(proposal || req.body || {});
        return res.json(results);
    } catch (error) {
        console.error("[Proposal API] Error in POST all proposal validations:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during bulk proposal validation."
        });
    }
});

/* =========================================================
   GET /api/proposals/validate
   Validates single parcel or all parcels via query parameters.
   ========================================================= */
router.get("/validate", (req, res) => {
    try {
        const { parcelId, activityType, developmentType, proposedArea } = req.query || {};

        if (parcelId) {
            if (parcelId.toUpperCase() === "ALL") {
                const results = validateAllParcels(req.query);
                return res.json(results);
            }

            const sanitizedActivity = (activityType || "OTHER").toUpperCase();
            const sanitizedDevelopment = (developmentType || "OTHER").toUpperCase();
            let parsedArea = null;
            if (proposedArea !== undefined && proposedArea !== null) {
                parsedArea = Number(proposedArea);
                if (isNaN(parsedArea) || parsedArea <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "'proposedArea' must be a numeric value greater than zero."
                    });
                }
            }

            if (!VALID_ACTIVITY_TYPES.includes(sanitizedActivity)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid 'activityType'. Allowed values: ${VALID_ACTIVITY_TYPES.join(", ")}.`
                });
            }

            if (!VALID_DEVELOPMENT_TYPES.includes(sanitizedDevelopment)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid 'developmentType'. Allowed values: ${VALID_DEVELOPMENT_TYPES.join(", ")}.`
                });
            }

            const profile = getLandProfile(parcelId);
            if (!profile) {
                return res.status(404).json({
                    success: false,
                    message: `Parcel '${parcelId}' not found.`
                });
            }

            const sanitizedProposal = {
                activityType: sanitizedActivity,
                developmentType: sanitizedDevelopment,
                proposedArea: parsedArea
            };

            const assessmentResult = validateDevelopmentProposal(profile, sanitizedProposal);

            return res.json({
                success: true,
                parcelId: profile.parcelId,
                proposal: sanitizedProposal,
                data: assessmentResult
            });
        }

        return res.json({
            success: true,
            message: "Proposal Validation API is running.",
            endpoints: {
                validateAllParcels: "/api/proposals/all",
                validateSingleParcel: "/api/proposals/validate?parcelId=LND-001"
            },
            usage: {
                method: "POST or GET",
                sampleGetUrlAll: "/api/proposals/all?activityType=RESIDENTIAL&developmentType=NEW_BUILDING",
                sampleGetUrlSingle: "/api/proposals/validate?parcelId=LND-001&activityType=RESIDENTIAL&developmentType=NEW_BUILDING",
                samplePostBody: {
                    parcelId: "LND-001",
                    proposal: {
                        activityType: "RESIDENTIAL",
                        developmentType: "NEW_BUILDING",
                        proposedArea: 1500
                    }
                }
            },
            allowedEnums: {
                activityTypes: VALID_ACTIVITY_TYPES,
                developmentTypes: VALID_DEVELOPMENT_TYPES
            }
        });
    } catch (error) {
        console.error("[Proposal API] Error in GET /api/proposals/validate:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during proposal validation."
        });
    }
});

/* =========================================================
   POST /api/proposals/validate
   Validates a development proposal for a specific parcel (or ALL if parcelId === 'ALL').
   ========================================================= */
router.post("/validate", (req, res) => {
    try {
        const { parcelId, proposal } = req.body || {};

        if (parcelId && parcelId.toUpperCase() === "ALL") {
            const results = validateAllParcels(proposal || req.body || {});
            return res.json(results);
        }

        if (!parcelId || typeof parcelId !== "string" || parcelId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing 'parcelId' in request body."
            });
        }

        if (!proposal || typeof proposal !== "object" || Array.isArray(proposal)) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing 'proposal' object in request body."
            });
        }

        const activityType = (proposal.activityType || "").toUpperCase();
        if (!activityType || !VALID_ACTIVITY_TYPES.includes(activityType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid or missing 'activityType'. Allowed values: ${VALID_ACTIVITY_TYPES.join(", ")}.`
            });
        }

        const developmentType = (proposal.developmentType || "").toUpperCase();
        if (!developmentType || !VALID_DEVELOPMENT_TYPES.includes(developmentType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid or missing 'developmentType'. Allowed values: ${VALID_DEVELOPMENT_TYPES.join(", ")}.`
            });
        }

        let proposedArea = null;
        if (proposal.proposedArea !== undefined && proposal.proposedArea !== null) {
            proposedArea = Number(proposal.proposedArea);
            if (isNaN(proposedArea) || proposedArea <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "'proposedArea' must be a numeric value greater than zero."
                });
            }
        }

        console.log(`[Proposal API] Received proposal validation request for Parcel ID: ${parcelId}`);
        const profile = getLandProfile(parcelId);

        if (!profile) {
            console.log(`[Proposal API] Parcel '${parcelId}' not found.`);
            return res.status(404).json({
                success: false,
                message: `Parcel '${parcelId}' not found.`
            });
        }

        const sanitizedProposal = {
            activityType,
            developmentType,
            proposedArea
        };

        const assessmentResult = validateDevelopmentProposal(profile, sanitizedProposal);

        return res.json({
            success: true,
            parcelId: profile.parcelId,
            proposal: sanitizedProposal,
            data: assessmentResult
        });

    } catch (error) {
        console.error("[Proposal API] Error executing proposal validation:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during proposal validation."
        });
    }
});

/* =========================================================
   GET /api/proposals/:parcelId
   Validates proposal for a specific parcel ID.
   ========================================================= */
router.get("/:parcelId", (req, res) => {
    try {
        const { parcelId } = req.params;
        if (parcelId.toUpperCase() === "ALL") {
            const results = validateAllParcels(req.query || {});
            return res.json(results);
        }

        const { activityType, developmentType, proposedArea } = req.query || {};
        const profile = getLandProfile(parcelId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: `Parcel '${parcelId}' not found.`
            });
        }

        const sanitizedProposal = sanitizeProposal({ activityType, developmentType, proposedArea });
        const assessmentResult = validateDevelopmentProposal(profile, sanitizedProposal);

        return res.json({
            success: true,
            parcelId: profile.parcelId,
            proposal: sanitizedProposal,
            data: assessmentResult
        });
    } catch (error) {
        console.error("[Proposal API] Error in GET /api/proposals/:parcelId:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error during proposal validation."
        });
    }
});

module.exports = router;
