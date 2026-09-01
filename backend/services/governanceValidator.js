/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   LAND GOVERNANCE VALIDATION ENGINE

   Analyzes unified land profile data deterministically based
   on governance rules and returns a structured assessment.
   ========================================================= */

/**
 * Validates a complete land profile against governance rules.
 * 
 * @param {Object} profile - Complete land profile object (from getLandProfile)
 * @returns {Object} Structured governance assessment result
 */
function validateLandGovernance(profile) {
    if (!profile || !profile.parcel) {
        return {
            overallStatus: "CONFLICT",
            riskLevel: "HIGH",
            score: 100,
            summary: "Invalid land profile data provided.",
            checks: [],
            issues: [
                {
                    category: "GENERAL",
                    severity: "HIGH",
                    title: "Missing Land Profile",
                    message: "No valid land profile data was found for governance assessment.",
                    recommendation: "Verify the parcel ID and data integrity."
                }
            ],
            recommendations: ["Verify the parcel ID and data integrity."]
        };
    }

    const parcelId = profile.parcelId || profile.parcel.id;
    console.log(`[Governance Validator] Governance validation started: Parcel ID: ${parcelId}`);

    const checks = [];
    const issues = [];
    const recommendations = new Set();

    /* =========================================================
       1. OWNERSHIP / RoR CHECK
       ========================================================= */
    const ror = profile.ror;
    let rorStatus = "VALID";
    let rorSeverity = "LOW";
    let rorMessage = "Ownership and Record of Rights (RoR) are verified and active.";
    let rorRec = null;

    if (!ror) {
        rorStatus = "WARNING";
        rorSeverity = "MEDIUM";
        rorMessage = "Record of Rights (RoR) record is missing or unavailable.";
        rorRec = "Verify ownership records with the land revenue department.";
    } else {
        const ownershipStatus = (ror.ownershipStatus || "").toUpperCase();
        const mutationStatus = (ror.mutationStatus || "").toUpperCase();
        const recordStatus = (ror.recordStatus || "").toUpperCase();

        if (["DISPUTED", "CANCELLED", "INVALID", "LITIGATION"].includes(ownershipStatus)) {
            rorStatus = "CONFLICT";
            rorSeverity = "HIGH";
            rorMessage = `Ownership record status indicates dispute or invalid record (${ror.ownershipStatus}).`;
            rorRec = "Resolve active ownership dispute or title litigation.";
        } else if (["PENDING", "UNDER REVIEW", "IN PROGRESS"].includes(mutationStatus)) {
            rorStatus = "WARNING";
            rorSeverity = "MEDIUM";
            rorMessage = `Land record mutation is currently pending (${ror.mutationStatus}).`;
            rorRec = "Verify pending mutation before proceeding with transfer.";
        } else if (["UNDER REVIEW", "UNVERIFIED"].includes(recordStatus)) {
            rorStatus = "WARNING";
            rorSeverity = "LOW";
            rorMessage = `Record of Rights status is currently ${ror.recordStatus}.`;
            rorRec = "Verify land revenue records.";
        }
    }

    checks.push({
        category: "OWNERSHIP",
        status: rorStatus,
        title: "Ownership & Record of Rights",
        message: rorMessage,
        severity: rorSeverity
    });

    if (rorStatus !== "VALID") {
        if (rorRec) recommendations.add(rorRec);
        issues.push({
            category: "OWNERSHIP",
            severity: rorSeverity,
            title: rorStatus === "CONFLICT" ? "Ownership Dispute / Invalid Record" : "Pending Record Mutation",
            message: rorMessage,
            recommendation: rorRec || "Verify ownership records."
        });
    }

    /* =========================================================
       2. REGISTRATION CHECK
       ========================================================= */
    const reg = profile.registration;
    let regStatus = "VALID";
    let regSeverity = "LOW";
    let regMessage = "Property registration and deed documents are verified with no reported encumbrances.";
    let regRec = null;

    if (!reg) {
        regStatus = "WARNING";
        regSeverity = "MEDIUM";
        regMessage = "Property registration data is missing or unavailable.";
        regRec = "Verify deed registration with the Sub-Registrar Office.";
    } else {
        const registrationStatus = (reg.registrationStatus || "").toUpperCase();
        const encumbranceStatus = reg.encumbranceStatus || "";
        const documentStatus = (reg.documentStatus || "").toUpperCase();

        if (["CANCELLED", "INVALID", "REJECTED"].includes(registrationStatus)) {
            regStatus = "CONFLICT";
            regSeverity = "HIGH";
            regMessage = `Property registration is invalid or cancelled (${reg.registrationStatus}).`;
            regRec = "Contact the Sub-Registrar Office regarding registration validity.";
        } else if (registrationStatus === "PENDING" || documentStatus === "UNDER REVIEW") {
            regStatus = "WARNING";
            regSeverity = "MEDIUM";
            regMessage = "Property registration or document verification is currently under review.";
            regRec = "Verify pending property registration documents.";
        } else if (encumbranceStatus.toLowerCase().includes("check required") || encumbranceStatus.toLowerCase().includes("pending")) {
            regStatus = "WARNING";
            regSeverity = "MEDIUM";
            regMessage = `Encumbrance status: ${encumbranceStatus}.`;
            regRec = "Conduct an encumbrance search prior to transaction.";
        } else if (encumbranceStatus.toLowerCase().includes("encumbrance reported") && !encumbranceStatus.toLowerCase().includes("no encumbrance")) {
            regStatus = "CONFLICT";
            regSeverity = "HIGH";
            regMessage = `Encumbrance reported on property deed: ${encumbranceStatus}.`;
            regRec = "Clear reported encumbrances with the registration office.";
        }
    }

    checks.push({
        category: "REGISTRATION",
        status: regStatus,
        title: "Property Registration & Encumbrance",
        message: regMessage,
        severity: regSeverity
    });

    if (regStatus !== "VALID") {
        if (regRec) recommendations.add(regRec);
        issues.push({
            category: "REGISTRATION",
            severity: regSeverity,
            title: regStatus === "CONFLICT" ? "Registration Conflict / Active Encumbrance" : "Registration Review Required",
            message: regMessage,
            recommendation: regRec || "Verify registration record."
        });
    }

    /* =========================================================
       3. LAND USE / ZONING CHECK
       ========================================================= */
    const landUse = profile.landUse;
    const parcelLandUse = profile.parcel ? profile.parcel.landUse : null;
    let luStatus = "VALID";
    let luSeverity = "LOW";
    let luMessage = "Land use matches designated master plan zoning.";
    let luRec = null;

    if (!landUse) {
        luStatus = "WARNING";
        luSeverity = "LOW";
        luMessage = "Land use / zoning record is missing or unavailable.";
        luRec = "Review local planning authority zoning maps.";
    } else {
        const luType = landUse.landUseType || "";
        const devStatus = (landUse.developmentStatus || "").toUpperCase();
        const devRestriction = landUse.developmentRestriction || "";

        if (parcelLandUse && luType && parcelLandUse.toLowerCase() !== luType.toLowerCase()) {
            luStatus = "CONFLICT";
            luSeverity = "HIGH";
            luMessage = `Land use mismatch: Parcel recorded as ${parcelLandUse} but zoning specifies ${luType}.`;
            luRec = "Reconcile land use classification with municipal zoning authorities.";
        } else if (devStatus === "RESTRICTED" || (devRestriction && !devRestriction.toLowerCase().includes("standard"))) {
            luStatus = "WARNING";
            luSeverity = "MEDIUM";
            luMessage = `Development restriction: ${devRestriction || "Land development is restricted."}`;
            luRec = "Review applicable development restrictions.";
        }
    }

    checks.push({
        category: "LAND_USE",
        status: luStatus,
        title: "Land Use & Zoning Compliance",
        message: luMessage,
        severity: luSeverity
    });

    if (luStatus !== "VALID") {
        if (luRec) recommendations.add(luRec);
        issues.push({
            category: "LAND_USE",
            severity: luSeverity,
            title: luStatus === "CONFLICT" ? "Land Use Mismatch" : "Development Restriction",
            message: luMessage,
            recommendation: luRec || "Review zoning compliance."
        });
    }

    /* =========================================================
       4. PROPERTY TAX CHECK
       ========================================================= */
    const tax = profile.propertyTax;
    let taxStatus = "VALID";
    let taxSeverity = "LOW";
    let taxMessage = "Property tax payments are up to date.";
    let taxRec = null;

    if (!tax) {
        taxStatus = "WARNING";
        taxSeverity = "LOW";
        taxMessage = "Property tax record is missing or unavailable.";
        taxRec = "Verify property tax payment status with local authority.";
    } else {
        const paymentStatus = tax.paymentStatus || "";
        const outstanding = tax.outstandingAmount || 0;
        const assessmentStatus = (tax.assessmentStatus || "").toUpperCase();

        if (["INVALID", "DISPUTED", "CANCELLED"].includes(assessmentStatus)) {
            taxStatus = "CONFLICT";
            taxSeverity = "HIGH";
            taxMessage = `Property tax assessment status is invalid or disputed (${tax.assessmentStatus}).`;
            taxRec = "Resolve property tax assessment dispute with tax authority.";
        } else if (paymentStatus.toLowerCase() !== "paid" || outstanding > 0) {
            taxStatus = "WARNING";
            taxSeverity = "MEDIUM";
            taxMessage = `Property tax payment is pending or partially outstanding (Outstanding: ₹${outstanding.toLocaleString()}).`;
            taxRec = "Clear outstanding property tax before proceeding.";
        }
    }

    checks.push({
        category: "PROPERTY_TAX",
        status: taxStatus,
        title: "Property Tax Status",
        message: taxMessage,
        severity: taxSeverity
    });

    if (taxStatus !== "VALID") {
        if (taxRec) recommendations.add(taxRec);
        issues.push({
            category: "PROPERTY_TAX",
            severity: taxSeverity,
            title: taxStatus === "CONFLICT" ? "Tax Assessment Dispute" : "Outstanding Property Tax",
            message: taxMessage,
            recommendation: taxRec || "Clear outstanding tax."
        });
    }

    /* =========================================================
       5. BUILDING PERMISSION CHECK
       ========================================================= */
    const bp = profile.buildingPermission;
    let bpStatus = "VALID";
    let bpSeverity = "LOW";
    let bpMessage = "Building permission status verified.";
    let bpRec = null;

    if (!bp) {
        bpStatus = "WARNING";
        bpSeverity = "LOW";
        bpMessage = "Building permission record is missing or unavailable.";
        bpRec = "Verify building permission validity.";
    } else {
        const bpPermissionStatus = (bp.buildingPermissionStatus || "").toUpperCase();
        const validityStatus = (bp.validityStatus || "").toUpperCase();

        if (bpPermissionStatus === "APPROVED" && validityStatus === "VALID") {
            bpStatus = "VALID";
            bpSeverity = "LOW";
            bpMessage = "Building permission approved and valid.";
        } else if (["PENDING", "UNDER REVIEW"].includes(validityStatus) || ["UNDER REVIEW", "PENDING"].includes(bpPermissionStatus)) {
            bpStatus = "WARNING";
            bpSeverity = "MEDIUM";
            bpMessage = "Building permission application is currently under review.";
            bpRec = "Verify building permission validity.";
        } else if (validityStatus === "RESTRICTED" || bpPermissionStatus === "RESTRICTED") {
            // Note: Do not automatically mark agricultural land as a building violation.
            bpStatus = "WARNING";
            bpSeverity = "LOW";
            bpMessage = `Building permission is restricted (${bp.approvedBuildingType || "Agricultural / Restricted Use Only"}).`;
            bpRec = "Verify building permission validity.";
        } else if (["REJECTED", "EXPIRED", "INVALID"].includes(bpPermissionStatus) || ["EXPIRED", "INVALID"].includes(validityStatus)) {
            bpStatus = "CONFLICT";
            bpSeverity = "HIGH";
            bpMessage = `Building permission is rejected, expired, or invalid (${bp.buildingPermissionStatus || bp.validityStatus}).`;
            bpRec = "Obtain valid building permission approval before undertaking construction.";
        }
    }

    checks.push({
        category: "BUILDING_PERMISSION",
        status: bpStatus,
        title: "Building Permission & Approvals",
        message: bpMessage,
        severity: bpSeverity
    });

    if (bpStatus !== "VALID") {
        if (bpRec) recommendations.add(bpRec);
        issues.push({
            category: "BUILDING_PERMISSION",
            severity: bpSeverity,
            title: bpStatus === "CONFLICT" ? "Building Permission Conflict" : "Building Permission Restriction / Review",
            message: bpMessage,
            recommendation: bpRec || "Verify building permission validity."
        });
    }

    /* =========================================================
       6. RESTRICTIONS CHECK
       ========================================================= */
    const rest = profile.restrictions;
    let restStatus = "VALID";
    let restSeverity = "LOW";
    let restMessage = "No active land restrictions or acquisition notices detected.";
    let restRec = null;

    if (rest) {
        const restrictionStatus = (rest.restrictionStatus || "").toUpperCase();
        const riskLevel = (rest.riskLevel || "").toUpperCase();

        const activeRestrictions = [];

        if (rest.waterBodyRestriction) {
            activeRestrictions.push({
                type: "Water Body Restriction",
                message: "The parcel is affected by a water body buffer zone restriction.",
                rec: "Verify the applicable buffer and development regulations.",
                conflict: riskLevel === "HIGH"
            });
        }

        if (rest.governmentAcquisition) {
            activeRestrictions.push({
                type: "Government Acquisition",
                message: "The parcel is marked for potential government acquisition.",
                rec: "Conduct official verification of government acquisition status.",
                conflict: true
            });
        }

        if (rest.environmentalRestriction) {
            activeRestrictions.push({
                type: "Environmental Restriction",
                message: "Environmental protection restrictions apply to this parcel.",
                rec: "Review applicable environmental clearance requirements.",
                conflict: false
            });
        }

        if (rest.heritageRestriction) {
            activeRestrictions.push({
                type: "Heritage Restriction",
                message: "Heritage zone conservation rules apply to this parcel.",
                rec: "Verify heritage zone restrictions before development.",
                conflict: false
            });
        }

        if (rest.roadWideningRestriction) {
            activeRestrictions.push({
                type: "Road Widening",
                message: "Part of the parcel is reserved for future road widening.",
                rec: "Review applicable road widening setbacks and alignment plans.",
                conflict: false
            });
        }

        if (rest.developmentRestriction && activeRestrictions.length === 0) {
            activeRestrictions.push({
                type: "Development Restriction",
                message: rest.remarks || "General development restrictions apply to this parcel.",
                rec: "Review applicable development restrictions.",
                conflict: false
            });
        }

        if (activeRestrictions.length > 0) {
            const hasConflict = activeRestrictions.some(r => r.conflict);
            restStatus = hasConflict ? "CONFLICT" : "WARNING";
            restSeverity = hasConflict ? "HIGH" : (riskLevel === "HIGH" ? "HIGH" : "MEDIUM");
            restMessage = activeRestrictions.map(r => r.message).join(" ");
            
            activeRestrictions.forEach(r => {
                recommendations.add(r.rec);
                issues.push({
                    category: "RESTRICTION",
                    severity: r.conflict ? "HIGH" : (riskLevel === "HIGH" ? "HIGH" : "MEDIUM"),
                    title: r.type,
                    message: r.message,
                    recommendation: r.rec
                });
            });
        } else if (restrictionStatus === "RESTRICTED") {
            restStatus = "WARNING";
            restSeverity = riskLevel === "HIGH" ? "HIGH" : "MEDIUM";
            restMessage = rest.remarks || "Land restrictions are applicable.";
            restRec = "Conduct official verification of the identified restriction.";
            recommendations.add(restRec);
            issues.push({
                category: "RESTRICTION",
                severity: restSeverity,
                title: "Land Restriction",
                message: restMessage,
                recommendation: restRec
            });
        }
    }

    checks.push({
        category: "RESTRICTION",
        status: restStatus,
        title: "Land Restrictions & Encumbrances",
        message: restMessage,
        severity: restSeverity
    });

    /* =========================================================
       7. UTILITIES / INFRASTRUCTURE CHECK
       ========================================================= */
    const util = profile.utilities;
    let utilStatus = "VALID";
    let utilSeverity = "LOW";
    let utilMessage = "All basic utility connections and road access are available.";
    let utilRec = null;

    if (util) {
        const missingUtils = [];
        if (util.water && util.water.available === false) missingUtils.push("Water Supply");
        if (util.sewerage && util.sewerage.available === false) missingUtils.push("Sewerage");
        if (util.electricity && util.electricity.available === false) missingUtils.push("Electricity");
        if (util.road && util.road.available === false) missingUtils.push("Road Access");

        if (missingUtils.length > 0) {
            utilStatus = "WARNING";
            utilSeverity = "LOW";
            utilMessage = `Missing infrastructure: ${missingUtils.join(", ")} connections are not available.`;
            utilRec = `Check utility availability for ${missingUtils.join(" and ")}.`;
            recommendations.add(utilRec);
            issues.push({
                category: "UTILITIES",
                severity: "LOW",
                title: "Infrastructure Availability",
                message: utilMessage,
                recommendation: utilRec
            });
        }
    }

    checks.push({
        category: "UTILITIES",
        status: utilStatus,
        title: "Utility Services & Access",
        message: utilMessage,
        severity: utilSeverity
    });

    /* =========================================================
       SCORE & RISK CALCULATION
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
       OVERALL STATUS DETERMINATION
       ========================================================= */
    let overallStatus = "VALID";

    const hasHighConflict = checks.some(c => c.status === "CONFLICT" && c.severity === "HIGH");
    const hasAnyConflict = checks.some(c => c.status === "CONFLICT");
    const hasAnyWarning = checks.some(c => c.status === "WARNING");

    if (hasHighConflict) {
        overallStatus = "CONFLICT";
    } else if (hasAnyConflict || hasAnyWarning) {
        overallStatus = "REVIEW_REQUIRED";
    } else {
        overallStatus = "VALID";
    }

    /* =========================================================
       SUMMARY GENERATION
       ========================================================= */
    let summary = "";
    if (overallStatus === "VALID") {
        summary = "All available land governance records are consistent and no active restrictions were detected.";
    } else if (overallStatus === "CONFLICT") {
        summary = "One or more high-severity governance conflicts were detected.";
    } else {
        summary = "Some governance records require review before development or transaction.";
    }

    console.log(`[Governance Validator] Governance validation completed: Parcel ID: ${parcelId}, Risk Level: ${riskLevel}, Score: ${score}, Status: ${overallStatus}`);

    return {
        overallStatus,
        riskLevel,
        score,
        summary,
        checks,
        issues,
        recommendations: Array.from(recommendations)
    };
}

module.exports = {
    validateLandGovernance
};
