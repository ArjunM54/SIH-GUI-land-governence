/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DEVELOPMENT PROPOSAL VALIDATION ENGINE

   Analyzes proposed land activity against existing unified
   land profile data deterministically to generate administrative
   decision-support assessments.
   ========================================================= */

/**
 * Allowed Proposal Enums
 */
const VALID_ACTIVITY_TYPES = [
    "RESIDENTIAL",
    "COMMERCIAL",
    "INDUSTRIAL",
    "AGRICULTURAL",
    "PUBLIC",
    "OTHER"
];

const VALID_DEVELOPMENT_TYPES = [
    "NEW_BUILDING",
    "EXTENSION",
    "CHANGE_OF_USE",
    "OTHER"
];

/**
 * Validates a development proposal against a complete land profile.
 *
 * @param {Object} profile - Complete land profile object from getLandProfile
 * @param {Object} proposal - Proposed activity specifications
 * @returns {Object} Structured proposal validation assessment result
 */
function validateDevelopmentProposal(profile, proposal) {
    if (!profile || !profile.parcel) {
        return {
            decision: "CONFLICT",
            riskLevel: "HIGH",
            score: 100,
            summary: "Invalid land profile data provided.",
            checks: [],
            issues: [
                {
                    category: "GENERAL",
                    severity: "HIGH",
                    title: "Missing Land Profile",
                    message: "No valid land profile data was found for proposal assessment.",
                    recommendation: "Verify the parcel ID and land profile integrity."
                }
            ],
            recommendations: ["Verify the parcel ID and land profile integrity."]
        };
    }

    const checks = [];
    const issues = [];
    const recommendations = new Set();

    const activityType = (proposal.activityType || "OTHER").toUpperCase();
    const developmentType = (proposal.developmentType || "OTHER").toUpperCase();
    const proposedArea = proposal.proposedArea ? Number(proposal.proposedArea) : null;

    /* =========================================================
       1. CURRENT LAND USE & ACTIVITY ALIGNMENT CHECK
       ========================================================= */
    const parcelLandUse = profile.parcel ? profile.parcel.landUse : "";
    const zoningLandUse = profile.landUse ? profile.landUse.landUseType : "";
    const existingLandUse = zoningLandUse || parcelLandUse || "Unspecified";

    let luStatus = "VALID";
    let luSeverity = "LOW";
    let luMessage = `Proposed ${activityType} activity is compatible with current land records (${existingLandUse}).`;
    let luRec = null;

    const isNonAgriProposed = ["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"].includes(activityType);
    const isAgriExisting = existingLandUse.toLowerCase().includes("agri");

    if (isAgriExisting && isNonAgriProposed) {
        luStatus = "WARNING";
        luSeverity = "MEDIUM";
        luMessage = `Proposed activity (${activityType}) may require verification against the parcel's current land-use classification (${existingLandUse}).`;
        luRec = "Verify land-use conversion requirements with local revenue and planning authorities.";
    }

    checks.push({
        category: "LAND_USE",
        status: luStatus,
        title: "Land Use Compatibility",
        message: luMessage,
        severity: luSeverity
    });

    if (luStatus !== "VALID") {
        if (luRec) recommendations.add(luRec);
        issues.push({
            category: "LAND_USE",
            severity: luSeverity,
            title: "Land Use Classification Review",
            message: luMessage,
            recommendation: luRec || "Verify land-use zoning compliance."
        });
    }

    /* =========================================================
       2. DEVELOPMENT RESTRICTION CHECK
       ========================================================= */
    const landUseData = profile.landUse;
    let devStatus = "VALID";
    let devSeverity = "LOW";
    let devMessage = "No active development restrictions detected.";
    let devRec = null;

    if (landUseData) {
        const dStatus = (landUseData.developmentStatus || "").toUpperCase();
        const dRest = landUseData.developmentRestriction || "";

        if (dStatus === "RESTRICTED" || (dRest && !dRest.toLowerCase().includes("standard"))) {
            if (dRest.toLowerCase().includes("prohibited")) {
                devStatus = "CONFLICT";
                devSeverity = "HIGH";
                devMessage = `Development restriction explicitly prohibits proposed development: ${dRest}.`;
                devRec = "Proposed activity is not permitted under current development restrictions.";
            } else {
                devStatus = "WARNING";
                devSeverity = "MEDIUM";
                devMessage = `Development restriction applicable: ${dRest || "Land development status is Restricted."}`;
                devRec = "Review applicable development rules and obtain necessary conversion/clearance approvals.";
            }
        }
    }

    checks.push({
        category: "DEVELOPMENT",
        status: devStatus,
        title: "Development Restriction Compliance",
        message: devMessage,
        severity: devSeverity
    });

    if (devStatus !== "VALID") {
        if (devRec) recommendations.add(devRec);
        issues.push({
            category: "DEVELOPMENT",
            severity: devSeverity,
            title: devStatus === "CONFLICT" ? "Development Prohibited" : "Development Restriction Review",
            message: devMessage,
            recommendation: devRec || "Review development restriction terms."
        });
    }

    /* =========================================================
       3. WATER BODY RESTRICTION CHECK
       ========================================================= */
    const rest = profile.restrictions;
    if (rest && rest.waterBodyRestriction === true) {
        const isConstruction = ["NEW_BUILDING", "EXTENSION"].includes(developmentType);
        const wbStatus = isConstruction ? "CONFLICT" : "WARNING";
        const wbSeverity = isConstruction ? "HIGH" : "MEDIUM";
        const wbMessage = "Parcel contains or adjoins an active water-body buffer restriction zone.";
        const wbRec = "Verify applicable water body buffer regulations and restrictions with official authorities before development.";

        checks.push({
            category: "RESTRICTION",
            status: wbStatus,
            title: "Water Body Restriction",
            message: wbMessage,
            severity: wbSeverity
        });

        recommendations.add(wbRec);
        issues.push({
            category: "RESTRICTION",
            severity: wbSeverity,
            title: "Water Body Buffer Restriction",
            message: wbMessage,
            recommendation: wbRec
        });
    }

    /* =========================================================
       4. GOVERNMENT ACQUISITION CHECK
       ========================================================= */
    if (rest && rest.governmentAcquisition === true) {
        const acqMessage = "Parcel is marked under active government acquisition status.";
        const acqRec = "Verify acquisition status with the relevant authority before proceeding.";

        checks.push({
            category: "RESTRICTION",
            status: "WARNING",
            title: "Government Acquisition Notice",
            message: acqMessage,
            severity: "HIGH"
        });

        recommendations.add(acqRec);
        issues.push({
            category: "RESTRICTION",
            severity: "HIGH",
            title: "Government Acquisition Notice",
            message: acqMessage,
            recommendation: acqRec
        });
    }

    /* =========================================================
       5. ENVIRONMENTAL RESTRICTION CHECK
       ========================================================= */
    if (rest && rest.environmentalRestriction === true) {
        const envStatus = isNonAgriProposed ? "CONFLICT" : "WARNING";
        const envSeverity = "HIGH";
        const envMessage = "Active environmental protection restriction applies to this parcel.";
        const envRec = "Review applicable environmental clearance requirements and consult state environmental protection authorities.";

        checks.push({
            category: "ENVIRONMENT",
            status: envStatus,
            title: "Environmental Restriction",
            message: envMessage,
            severity: envSeverity
        });

        recommendations.add(envRec);
        issues.push({
            category: "ENVIRONMENT",
            severity: envSeverity,
            title: envStatus === "CONFLICT" ? "Environmental Restriction Conflict" : "Environmental Clearance Required",
            message: envMessage,
            recommendation: envRec
        });
    }

    /* =========================================================
       6. HERITAGE RESTRICTION CHECK
       ========================================================= */
    if (rest && rest.heritageRestriction === true) {
        const herMessage = "Heritage zone conservation regulations apply to this parcel.";
        const herRec = "Verify applicable heritage protection requirements.";

        checks.push({
            category: "RESTRICTION",
            status: "WARNING",
            title: "Heritage Conservation Restriction",
            message: herMessage,
            severity: "MEDIUM"
        });

        recommendations.add(herRec);
        issues.push({
            category: "RESTRICTION",
            severity: "MEDIUM",
            title: "Heritage Protection Review",
            message: herMessage,
            recommendation: herRec
        });
    }

    /* =========================================================
       7. BUILDING PERMISSION CHECK
       ========================================================= */
    const isConstruction = ["NEW_BUILDING", "EXTENSION"].includes(developmentType);
    if (isConstruction) {
        const bp = profile.buildingPermission;
        let bpStatus = "VALID";
        let bpSeverity = "LOW";
        let bpMessage = "Building permission status verified.";
        let bpRec = null;

        if (!bp) {
            bpStatus = "WARNING";
            bpSeverity = "MEDIUM";
            bpMessage = "Building permission information is unavailable for this proposal.";
            bpRec = "Verify building permission records with the planning authority.";
        } else {
            const pStatus = (bp.buildingPermissionStatus || "").toUpperCase();
            const vStatus = (bp.validityStatus || "").toUpperCase();

            if (pStatus === "APPROVED" && vStatus === "VALID") {
                bpStatus = "VALID";
                bpSeverity = "LOW";
                bpMessage = "Approved building permission verified.";
            } else if (["PENDING", "UNDER REVIEW"].includes(pStatus) || ["PENDING", "UNDER REVIEW"].includes(vStatus)) {
                bpStatus = "WARNING";
                bpSeverity = "MEDIUM";
                bpMessage = "Building permission application is currently under review.";
                bpRec = "Await building permission approval before commencing construction.";
            } else if (["REJECTED", "EXPIRED", "INVALID"].includes(pStatus) || ["EXPIRED", "INVALID"].includes(vStatus)) {
                bpStatus = "CONFLICT";
                bpSeverity = "HIGH";
                bpMessage = `Building permission status is rejected, expired, or invalid (${bp.buildingPermissionStatus || bp.validityStatus}).`;
                bpRec = "Obtain valid building permission approval before undertaking construction.";
            } else if (vStatus === "RESTRICTED" || pStatus === "RESTRICTED") {
                bpStatus = "WARNING";
                bpSeverity = "MEDIUM";
                bpMessage = `Building permission is restricted (${bp.approvedBuildingType || "Restricted Building Use"}).`;
                bpRec = "Verify building permission terms for proposed construction.";
            }
        }

        checks.push({
            category: "BUILDING_PERMISSION",
            status: bpStatus,
            title: "Building Permission Status",
            message: bpMessage,
            severity: bpSeverity
        });

        if (bpStatus !== "VALID") {
            if (bpRec) recommendations.add(bpRec);
            issues.push({
                category: "BUILDING_PERMISSION",
                severity: bpSeverity,
                title: bpStatus === "CONFLICT" ? "Building Permission Conflict" : "Building Permission Review Required",
                message: bpMessage,
                recommendation: bpRec || "Verify building permission records."
            });
        }
    }

    /* =========================================================
       8. PROPERTY TAX CHECK
       ========================================================= */
    const tax = profile.propertyTax;
    if (tax) {
        const payStatus = tax.paymentStatus || "";
        const outstanding = tax.outstandingAmount || 0;

        if (payStatus.toLowerCase() !== "paid" || outstanding > 0) {
            const taxMessage = `Property tax payment is pending or partially outstanding (Outstanding: ₹${outstanding.toLocaleString()}).`;
            const taxRec = "Clear outstanding property tax dues before proceeding with proposal.";

            checks.push({
                category: "PROPERTY_TAX",
                status: "WARNING",
                title: "Property Tax Clearance",
                message: taxMessage,
                severity: "MEDIUM"
            });

            recommendations.add(taxRec);
            issues.push({
                category: "PROPERTY_TAX",
                severity: "MEDIUM",
                title: "Outstanding Property Tax Dues",
                message: taxMessage,
                recommendation: taxRec
            });
        }
    }

    /* =========================================================
       9. OWNERSHIP / RoR CHECK
       ========================================================= */
    const ror = profile.ror;
    if (ror) {
        const ownStatus = (ror.ownershipStatus || "").toUpperCase();
        const mutStatus = (ror.mutationStatus || "").toUpperCase();

        if (["DISPUTED", "LITIGATION", "CANCELLED", "INVALID"].includes(ownStatus)) {
            const ownMessage = `Ownership record status indicates an active dispute or invalid status (${ror.ownershipStatus}).`;
            const ownRec = "Resolve active ownership dispute or title litigation before proceeding with proposal.";

            checks.push({
                category: "OWNERSHIP",
                status: "CONFLICT",
                title: "Ownership & Title Dispute",
                message: ownMessage,
                severity: "HIGH"
            });

            recommendations.add(ownRec);
            issues.push({
                category: "OWNERSHIP",
                severity: "HIGH",
                title: "Ownership Dispute Reported",
                message: ownMessage,
                recommendation: ownRec
            });
        } else if (["PENDING", "UNDER REVIEW", "IN PROGRESS"].includes(mutStatus)) {
            const mutMessage = `Land revenue record mutation is currently pending (${ror.mutationStatus}).`;
            const mutRec = "Verify pending mutation status with land revenue department.";

            checks.push({
                category: "OWNERSHIP",
                status: "WARNING",
                title: "Pending Land Record Mutation",
                message: mutMessage,
                severity: "MEDIUM"
            });

            recommendations.add(mutRec);
            issues.push({
                category: "OWNERSHIP",
                severity: "MEDIUM",
                title: "Pending Record Mutation",
                message: mutMessage,
                recommendation: mutRec
            });
        }
    }

    /* =========================================================
       10. REGISTRATION CHECK
       ========================================================= */
    const reg = profile.registration;
    if (reg) {
        const regStatus = (reg.registrationStatus || "").toUpperCase();
        const docStatus = (reg.documentStatus || "").toUpperCase();

        if (["CANCELLED", "INVALID", "REJECTED"].includes(regStatus)) {
            const regMessage = `Property registration status is marked as ${reg.registrationStatus}.`;
            const regRec = "Contact the Sub-Registrar Office regarding deed validity.";

            checks.push({
                category: "REGISTRATION",
                status: "CONFLICT",
                title: "Property Registration Validity",
                message: regMessage,
                severity: "HIGH"
            });

            recommendations.add(regRec);
            issues.push({
                category: "REGISTRATION",
                severity: "HIGH",
                title: "Invalid Property Registration",
                message: regMessage,
                recommendation: regRec
            });
        } else if (regStatus === "PENDING" || docStatus === "UNDER REVIEW") {
            const regMessage = "Property registration document verification is under review.";
            const regRec = "Verify pending property registration documents with Sub-Registrar Office.";

            checks.push({
                category: "REGISTRATION",
                status: "WARNING",
                title: "Pending Property Registration",
                message: regMessage,
                severity: "MEDIUM"
            });

            recommendations.add(regRec);
            issues.push({
                category: "REGISTRATION",
                severity: "MEDIUM",
                title: "Registration Review Required",
                message: regMessage,
                recommendation: regRec
            });
        }
    }

    /* =========================================================
       11. DETERMINISTIC SCORE & RISK CALCULATION
       ========================================================= */
    let rawScore = 0;

    checks.forEach(check => {
        if (check.status === "WARNING") {
            if (check.severity === "HIGH") {
                rawScore += 20;
            } else {
                rawScore += 10;
            }
        } else if (check.status === "CONFLICT") {
            if (check.severity === "HIGH") {
                rawScore += 40;
            } else {
                rawScore += 30;
            }
        }
    });

    const score = Math.min(100, rawScore);

    let riskLevel = "LOW";
    if (score >= 50) {
        riskLevel = "HIGH";
    } else if (score >= 20) {
        riskLevel = "MEDIUM";
    } else {
        riskLevel = "LOW";
    }

    /* =========================================================
       12. DECISION LOGIC & SUMMARY GENERATION
       ========================================================= */
    let decision = "PROCEED";

    const hasConflict = checks.some(c => c.status === "CONFLICT");
    const hasWarning = checks.some(c => c.status === "WARNING");

    if (hasConflict) {
        decision = "CONFLICT";
    } else if (hasWarning) {
        decision = "REVIEW_REQUIRED";
    } else {
        decision = "PROCEED";
    }

    let summary = "";
    if (decision === "PROCEED") {
        summary = "The proposed development aligns with existing land records and no active governance restrictions were detected.";
    } else if (decision === "CONFLICT") {
        summary = "The proposed development conflicts with existing land governance restrictions or zoning regulations.";
    } else {
        summary = "Administrative review is recommended before proceeding with the proposed development.";
    }

    return {
        decision,
        riskLevel,
        score,
        summary,
        checks,
        issues,
        recommendations: Array.from(recommendations)
    };
}

module.exports = {
    validateDevelopmentProposal,
    VALID_ACTIVITY_TYPES,
    VALID_DEVELOPMENT_TYPES
};
