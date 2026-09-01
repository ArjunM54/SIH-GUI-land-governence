/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   SPATIAL LAND-USE & RESTRICTION CONFLICT DETECTION ENGINE

   Analyzes unified land profile and governance validation
   results deterministically to identify potential land-use,
   development, and restriction conflicts.
   ========================================================= */

const { validateLandGovernance } = require("./governanceValidator");

/**
 * Detects land use, development, and legal restrictions conflicts.
 *
 * @param {Object} profile - Complete land profile object from getLandProfile
 * @param {Object} [governanceResult] - Optional land governance assessment result
 * @returns {Object} Structured conflict detection report
 */
function detectLandConflicts(profile, governanceResult) {
    if (!profile || !profile.parcel) {
        return {
            hasConflicts: false,
            conflictCount: 0,
            highestSeverity: "LOW",
            conflicts: [],
            summary: "Invalid land profile data provided."
        };
    }

    // Ensure governance validation is available
    const govResult = governanceResult || validateLandGovernance(profile);

    const conflicts = [];
    const seenKeys = new Set();
    let conflictCounter = 1;

    /**
     * Helper to push a unique conflict entry
     */
    function addConflict({ category, severity, status, title, description, affectedData, recommendation }) {
        const uniqueKey = `${category}:${title}`;
        if (seenKeys.has(uniqueKey)) {
            return;
        }
        seenKeys.add(uniqueKey);

        const id = `CONFLICT-${String(conflictCounter).padStart(3, "0")}`;
        conflictCounter++;

        conflicts.push({
            id,
            category,
            severity,
            status,
            title,
            description,
            affectedData,
            recommendation
        });
    }

    /* =========================================================
       1. LAND USE & ZONING CONFLICTS
       ========================================================= */
    const landUse = profile.landUse;
    const parcelLandUse = profile.parcel ? profile.parcel.landUse : null;

    if (landUse && parcelLandUse) {
        const zoningLandUse = landUse.landUseType;
        if (zoningLandUse && parcelLandUse.toLowerCase() !== zoningLandUse.toLowerCase()) {
            addConflict({
                category: "LAND_USE",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Land Use Mismatch",
                description: `Parcel recorded land use (${parcelLandUse}) differs from authoritative land-use zoning (${zoningLandUse}).`,
                affectedData: `Parcel Land Use: ${parcelLandUse}, Authoritative Zoning: ${zoningLandUse}`,
                recommendation: "Reconcile land-use records with local planning authority."
            });
        }
    }

    if (landUse && landUse.masterPlanStatus) {
        const mpStatus = landUse.masterPlanStatus;
        if (mpStatus.toLowerCase().includes("protection") || mpStatus.toLowerCase().includes("restricted")) {
            addConflict({
                category: "LAND_USE",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Master Plan Zone Conflict",
                description: `Parcel falls under a restricted master-plan zone (${mpStatus}). Proposed/non-conforming development is restricted.`,
                affectedData: `Master Plan Status: ${mpStatus}`,
                recommendation: "Reconcile master plan classification with planning authority."
            });
        }
    }

    /* =========================================================
       2. DEVELOPMENT RESTRICTION CONFLICTS
       ========================================================= */
    if (landUse) {
        const devStatus = (landUse.developmentStatus || "").toLowerCase();
        const devRest = landUse.developmentRestriction || "";

        if (devStatus === "restricted" || (devRest && !devRest.toLowerCase().includes("standard"))) {
            addConflict({
                category: "DEVELOPMENT",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Development Restriction",
                description: `Development restriction applies: ${devRest || "Land development status is marked as Restricted."}`,
                affectedData: `Development Status: ${landUse.developmentStatus || "Restricted"}, Restriction: ${devRest || "None specified"}`,
                recommendation: "Review applicable development rules and obtain necessary conversion/clearance approvals."
            });
        }
    }

    /* =========================================================
       3. RESTRICTION LAYER CONFLICTS
       ========================================================= */
    const rest = profile.restrictions;
    if (rest) {
        // Water Body Restriction
        if (rest.waterBodyRestriction === true) {
            addConflict({
                category: "RESTRICTION",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Water Body Restriction",
                description: "Development may be restricted as the parcel contains or adjoins an active water-body buffer zone. Official verification is required.",
                affectedData: "Water Body Restriction: Active",
                recommendation: "Verify applicable water body buffer regulations and restrictions with official authorities before development."
            });
        }

        // Government Acquisition
        if (rest.governmentAcquisition === true) {
            addConflict({
                category: "RESTRICTION",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Government Acquisition",
                description: "Parcel is marked under active government acquisition status.",
                affectedData: "Government Acquisition Status: Active",
                recommendation: "Verify acquisition status with the relevant authority before proceeding."
            });
        }

        // Environmental Restriction
        if (rest.environmentalRestriction === true) {
            addConflict({
                category: "ENVIRONMENT",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Environmental Restriction",
                description: "Active environmental protection restriction applies to this parcel. Additional environmental review may be required.",
                affectedData: "Environmental Restriction: Active",
                recommendation: "Review applicable environmental clearance requirements and consult state environmental protection authorities."
            });
        }

        // Heritage Restriction
        if (rest.heritageRestriction === true) {
            addConflict({
                category: "RESTRICTION",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Heritage Restriction",
                description: "Heritage zone conservation regulations apply to this parcel.",
                affectedData: "Heritage Restriction: Active",
                recommendation: "Verify applicable heritage protection requirements."
            });
        }

        // Road Widening Restriction
        if (rest.roadWideningRestriction === true) {
            addConflict({
                category: "RESTRICTION",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Road Widening Restriction",
                description: "The parcel may be affected by a planned road-widening restriction.",
                affectedData: "Road Widening Restriction: Active",
                recommendation: "Review applicable road widening setbacks and alignment plans."
            });
        }
    }

    /* =========================================================
       4. BUILDING PERMISSION CONFLICTS
       ========================================================= */
    const bp = profile.buildingPermission;
    if (bp) {
        const bpStatus = (bp.buildingPermissionStatus || "").toUpperCase();
        const validityStatus = (bp.validityStatus || "").toUpperCase();

        if (["REJECTED", "EXPIRED", "INVALID"].includes(bpStatus) || ["EXPIRED", "INVALID"].includes(validityStatus)) {
            addConflict({
                category: "BUILDING_PERMISSION",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Building Permission Conflict",
                description: `Building permission is rejected, expired, or invalid (Status: ${bp.buildingPermissionStatus || "N/A"}, Validity: ${bp.validityStatus || "N/A"}).`,
                affectedData: `Building Permission Status: ${bp.buildingPermissionStatus || "N/A"}, Validity: ${bp.validityStatus || "N/A"}`,
                recommendation: "Obtain valid building permission approval before undertaking construction."
            });
        } else if (["PENDING", "UNDER REVIEW"].includes(bpStatus) || ["PENDING", "UNDER REVIEW"].includes(validityStatus)) {
            addConflict({
                category: "BUILDING_PERMISSION",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Building Permission Pending Review",
                description: "Building permission application is under review or pending verification.",
                affectedData: `Application No: ${bp.applicationNumber || "N/A"}, Status: ${bp.buildingPermissionStatus || "N/A"}`,
                recommendation: "Await building permission approval before commencing construction."
            });
        }
    }

    /* =========================================================
       5. OWNERSHIP / RoR CONFLICTS
       ========================================================= */
    const ror = profile.ror;
    if (ror) {
        const ownStatus = (ror.ownershipStatus || "").toUpperCase();
        const mutStatus = (ror.mutationStatus || "").toUpperCase();
        const recStatus = (ror.recordStatus || "").toUpperCase();

        if (["DISPUTED", "LITIGATION", "CANCELLED", "INVALID"].includes(ownStatus)) {
            addConflict({
                category: "OWNERSHIP",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Ownership Dispute",
                description: `Record of Rights indicates an active ownership dispute or invalid title status (${ror.ownershipStatus}).`,
                affectedData: `Ownership Status: ${ror.ownershipStatus}`,
                recommendation: "Resolve active ownership dispute or title litigation before proceeding with transfer or development."
            });
        }

        if (["PENDING", "UNDER REVIEW", "IN PROGRESS"].includes(mutStatus)) {
            addConflict({
                category: "OWNERSHIP",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Pending Land Mutation",
                description: `Land revenue record mutation is currently pending (${ror.mutationStatus}).`,
                affectedData: `Mutation Status: ${ror.mutationStatus}`,
                recommendation: "Verify pending mutation status with revenue department."
            });
        }

        if (["INVALID", "CANCELLED"].includes(recStatus)) {
            addConflict({
                category: "OWNERSHIP",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Invalid RoR Record",
                description: `Record of Rights (RoR) status is marked as ${ror.recordStatus}.`,
                affectedData: `Record Status: ${ror.recordStatus}`,
                recommendation: "Verify land revenue records with authorized department."
            });
        }
    }

    /* =========================================================
       6. REGISTRATION & ENCUMBRANCE CONFLICTS
       ========================================================= */
    const reg = profile.registration;
    if (reg) {
        const regStatus = (reg.registrationStatus || "").toUpperCase();
        const docStatus = (reg.documentStatus || "").toUpperCase();
        const encStatus = reg.encumbranceStatus || "";

        if (["CANCELLED", "INVALID", "REJECTED"].includes(regStatus)) {
            addConflict({
                category: "REGISTRATION",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Invalid Property Registration",
                description: `Property registration deed status is ${reg.registrationStatus}.`,
                affectedData: `Registration Status: ${reg.registrationStatus}`,
                recommendation: "Contact the Sub-Registrar Office regarding registration validity."
            });
        } else if (regStatus === "PENDING" || docStatus === "UNDER REVIEW") {
            addConflict({
                category: "REGISTRATION",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Pending Property Registration",
                description: "Property registration document verification is under review.",
                affectedData: `Registration Status: ${reg.registrationStatus}, Document Status: ${reg.documentStatus}`,
                recommendation: "Verify pending property registration documents with Sub-Registrar Office."
            });
        }

        if (encStatus.toLowerCase().includes("encumbrance reported") && !encStatus.toLowerCase().includes("no encumbrance")) {
            addConflict({
                category: "REGISTRATION",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Active Encumbrance Reported",
                description: `Encumbrance reported on property deed: ${encStatus}.`,
                affectedData: `Encumbrance Status: ${encStatus}`,
                recommendation: "Clear reported encumbrances with the registration office."
            });
        } else if (encStatus.toLowerCase().includes("check required") || encStatus.toLowerCase().includes("pending")) {
            addConflict({
                category: "REGISTRATION",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Encumbrance Check Required",
                description: `Encumbrance status requires official verification: ${encStatus}.`,
                affectedData: `Encumbrance Status: ${encStatus}`,
                recommendation: "Conduct an encumbrance search prior to transaction."
            });
        }
    }

    /* =========================================================
       7. PROPERTY TAX CONFLICTS
       ========================================================= */
    const tax = profile.propertyTax;
    if (tax) {
        const payStatus = tax.paymentStatus || "";
        const outstanding = tax.outstandingAmount || 0;
        const assessStatus = (tax.assessmentStatus || "").toUpperCase();

        if (["INVALID", "DISPUTED", "CANCELLED"].includes(assessStatus)) {
            addConflict({
                category: "PROPERTY_TAX",
                severity: "HIGH",
                status: "CONFLICT",
                title: "Invalid Tax Assessment",
                description: `Property tax assessment status is invalid or disputed (${tax.assessmentStatus}).`,
                affectedData: `Assessment Status: ${tax.assessmentStatus}`,
                recommendation: "Resolve property tax assessment dispute with tax authority."
            });
        } else if (payStatus.toLowerCase() !== "paid" || outstanding > 0) {
            addConflict({
                category: "PROPERTY_TAX",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Outstanding Property Tax",
                description: `Property tax payment is pending or partially outstanding (Outstanding: ₹${outstanding.toLocaleString()}).`,
                affectedData: `Outstanding Amount: ₹${outstanding.toLocaleString()}, Payment Status: ${payStatus}`,
                recommendation: "Clear outstanding property tax before proceeding."
            });
        }
    }

    /* =========================================================
       8. INFRASTRUCTURE / UTILITIES CONFLICTS
       ========================================================= */
    const util = profile.utilities;
    if (util) {
        if (util.water && util.water.available === false) {
            addConflict({
                category: "INFRASTRUCTURE",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Missing Water Utility",
                description: "Municipal water connection is unavailable for this parcel.",
                affectedData: "Water Connection: Not Available",
                recommendation: "Check utility availability for water supply connection."
            });
        }

        if (util.electricity && util.electricity.available === false) {
            addConflict({
                category: "INFRASTRUCTURE",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Missing Electricity Grid",
                description: "Electricity connection is unavailable for this parcel.",
                affectedData: "Electricity Connection: Not Available",
                recommendation: "Apply for power grid connection with electricity department."
            });
        }

        if (util.road && util.road.available === false) {
            addConflict({
                category: "INFRASTRUCTURE",
                severity: "MEDIUM",
                status: "WARNING",
                title: "Missing Direct Road Access",
                description: "Direct road access is unavailable for this parcel.",
                affectedData: "Road Access: Not Available",
                recommendation: "Verify right-of-way and access road provisions."
            });
        }

        if (util.telecom && util.telecom.available === false) {
            addConflict({
                category: "INFRASTRUCTURE",
                severity: "LOW",
                status: "WARNING",
                title: "Missing Telecom Access",
                description: "Telecom service coverage is limited or unavailable for this parcel.",
                affectedData: "Telecom Coverage: Not Available",
                recommendation: "Verify regional telecom service coverage."
            });
        }
    }

    /* =========================================================
       9. SEVERITY PRIORITY & HIGHEST SEVERITY
       ========================================================= */
    let highestSeverity = "LOW";
    if (conflicts.some(c => c.severity === "HIGH")) {
        highestSeverity = "HIGH";
    } else if (conflicts.some(c => c.severity === "MEDIUM")) {
        highestSeverity = "MEDIUM";
    } else if (conflicts.some(c => c.severity === "LOW")) {
        highestSeverity = "LOW";
    }

    /* =========================================================
       10. DYNAMIC SUMMARY GENERATION
       ========================================================= */
    let summary = "";
    if (conflicts.length === 0) {
        summary = "No significant spatial or governance conflicts were detected.";
    } else if (highestSeverity === "HIGH") {
        summary = "High-severity restrictions or governance conflicts were detected.";
    } else {
        summary = "Potential governance conflicts were detected and require administrative review.";
    }

    return {
        hasConflicts: conflicts.length > 0,
        conflictCount: conflicts.length,
        highestSeverity,
        conflicts,
        summary
    };
}

module.exports = {
    detectLandConflicts
};
