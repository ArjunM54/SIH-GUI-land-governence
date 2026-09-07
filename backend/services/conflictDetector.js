/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   SPATIAL & CROSS-DEPARTMENT CONFLICT DETECTION ENGINE
   (PHASE 12K)
   ========================================================= */

const { validateLandGovernance } = require("./governanceValidator");
const { getConflictsByParcel } = require("../data/conflicts");

/**
 * Detects cross-departmental, spatial, ownership, area, land-use, and restriction conflicts.
 *
 * @param {Object} profile - Complete land profile object from getLandProfile
 * @param {Object} [governanceResult] - Optional land governance assessment result
 * @param {Object} [options] - Options (e.g. areaTolerance: 0.01)
 * @returns {Object} Structured conflict detection report
 */
function detectLandConflicts(profile, governanceResult, options = {}) {
    if (!profile || !profile.parcel) {
        return {
            hasConflicts: false,
            conflictCount: 0,
            highestSeverity: "LOW",
            conflicts: [],
            summary: "Invalid land profile data provided."
        };
    }

    const areaTolerance = options.areaTolerance !== undefined ? Number(options.areaTolerance) : 0.01;
    const govResult = governanceResult || validateLandGovernance(profile);
    const conflicts = [];
    const seenKeys = new Set();
    let conflictCounter = 1;

    function addConflict({ id, type, category, severity, status, title, description, affectedData, recommendation, sources, evidence, affectedDepartments }) {
        const uniqueKey = `${type}:${title}`;
        if (seenKeys.has(uniqueKey)) return;
        seenKeys.add(uniqueKey);

        const conflictId = id || `CON-${String(conflictCounter).padStart(3, "0")}`;
        conflictCounter++;

        conflicts.push({
            id: conflictId,
            parcelId: profile.parcelId,
            surveyNumber: profile.parcel.surveyNumber || "SUR-101",
            type: type || "DATA MISMATCH",
            category: category || "OTHER",
            severity: severity || "MEDIUM",
            status: status || "OPEN",
            title: title || "Governance Data Mismatch",
            description,
            affectedData,
            recommendation,
            sources: sources || [],
            evidence: evidence || [],
            affectedDepartments: affectedDepartments || ["Governance Administration"],
            detectedAt: new Date().toISOString()
        });
    }

    /* =========================================================
       1. OWNER MISMATCH (RoR vs Registration vs Tax vs Municipal)
       ========================================================= */
    const rorOwner = profile.ror ? (profile.ror.currentOwner || profile.ror.ownerName || profile.ror.primaryOwner) : null;
    const regOwner = profile.registration ? (profile.registration.proposedOwner || profile.registration.buyerName || profile.registration.latestOwner || profile.registration.ownerName) : null;
    const taxOwner = profile.propertyTax ? (profile.propertyTax.ownerName || profile.propertyTax.assessedOwner) : null;

    if (rorOwner && regOwner && rorOwner.toLowerCase().trim() !== regOwner.toLowerCase().trim()) {
        addConflict({
            type: "OWNER MISMATCH",
            category: "OWNERSHIP",
            severity: "HIGH",
            status: "OPEN",
            title: "Record of Rights vs Registration Owner Mismatch",
            description: `RoR current owner (${rorOwner}) does not match latest registered transferee (${regOwner}).`,
            affectedData: `RoR Owner: ${rorOwner} | Registration Owner: ${regOwner}`,
            recommendation: "Request RoR verification to confirm revenue mutation record against Sub-Registrar deed.",
            sources: [
                { department: "RoR Department", field: "Current Owner", value: rorOwner, status: "VERIFIED" },
                { department: "Registration Department", field: "Registered Transferee", value: regOwner, status: "REGISTERED" }
            ],
            evidence: [
                { source: "RoR Ledger", type: "RoR", tab: "ownership" },
                { source: "Deed Document", type: "Registration", tab: "registration" }
            ],
            affectedDepartments: ["Land Records Department", "Registration Department"]
        });
    }

    if (taxOwner && rorOwner && taxOwner.toLowerCase().trim() !== rorOwner.toLowerCase().trim()) {
        addConflict({
            type: "TAX / RoR MISMATCH",
            category: "PROPERTY_TAX",
            severity: "HIGH",
            status: "OPEN",
            title: "Property Tax Assessment vs RoR Owner Mismatch",
            description: `Assessed Property Tax owner (${taxOwner}) differs from RoR ledger owner (${rorOwner}).`,
            affectedData: `Property Tax Owner: ${taxOwner} | RoR Owner: ${rorOwner}`,
            recommendation: "Request RoR & Municipal Tax assessment reconciliation.",
            sources: [
                { department: "Property Tax Department", field: "Assessed Tax Owner", value: taxOwner, status: "CLEARED" },
                { department: "RoR Department", field: "Current Owner", value: rorOwner, status: "VERIFIED" }
            ],
            evidence: [
                { source: "Tax Demand Ledger", type: "PropertyTax", tab: "tax" },
                { source: "RoR Ledger", type: "RoR", tab: "ownership" }
            ],
            affectedDepartments: ["Property Tax & Municipal Department", "Land Records Department"]
        });
    }

    /* =========================================================
       2. AREA MISMATCH (Cadastral vs RoR vs Tax vs Municipal vs GIS)
       ========================================================= */
    const cadastralArea = profile.cadastral ? parseFloat(profile.cadastral.areaAcres || profile.cadastral.totalArea || 0) : 0;
    const taxArea = profile.propertyTax ? parseFloat(profile.propertyTax.recordedAreaAcres || profile.propertyTax.assessedArea || 0) : 0;
    const rorArea = profile.ror ? parseFloat(profile.ror.areaAcres || profile.ror.extent || 0) : 0;

    if (cadastralArea > 0 && taxArea > 0) {
        const diff = Math.abs(cadastralArea - taxArea);
        if (diff > areaTolerance) {
            addConflict({
                type: "AREA MISMATCH",
                category: "CADASTRAL",
                severity: "MEDIUM",
                status: "OPEN",
                title: "Cadastral Survey vs Property Tax Area Discrepancy",
                description: `Cadastral survey records ${cadastralArea.toFixed(2)} acres while Municipal Tax ledger reflects ${taxArea.toFixed(2)} acres (Difference: ${diff.toFixed(2)} acres, Tolerance: ${areaTolerance} acres).`,
                affectedData: `Cadastral Area: ${cadastralArea} acres | Tax Area: ${taxArea} acres (Diff: ${diff.toFixed(2)})`,
                recommendation: "Request Cadastral resurvey confirmation or update municipal tax assessment ledger.",
                sources: [
                    { department: "Cadastral Department", field: "GIS Survey Area", value: `${cadastralArea} acres`, status: "VERIFIED" },
                    { department: "Property Tax Department", field: "Tax Ledger Area", value: `${taxArea} acres`, status: "REVIEW REQUIRED" }
                ],
                evidence: [
                    { source: "Cadastral GIS Boundary", type: "Cadastral", tab: "gis" },
                    { source: "Tax Assessment Demand", type: "PropertyTax", tab: "tax" }
                ],
                affectedDepartments: ["Cadastral & Survey Department", "Property Tax & Municipal Department"]
            });
        }
    }

    /* =========================================================
       3. LAND USE & BUILDING USE MISMATCH
       ========================================================= */
    const landUse = profile.landUse;
    const parcelLandUse = profile.parcel ? profile.parcel.landUse : null;
    const buildingUse = profile.buildingPermission ? (profile.buildingPermission.proposedUse || profile.buildingPermission.buildingType || profile.buildingPermission.occupancyType) : null;

    if (landUse && parcelLandUse) {
        const zoningLandUse = landUse.landUseType;
        if (zoningLandUse && parcelLandUse.toLowerCase().trim() !== zoningLandUse.toLowerCase().trim()) {
            addConflict({
                type: "LAND USE MISMATCH",
                category: "LAND_USE",
                severity: "HIGH",
                status: "OPEN",
                title: "Parcel Recorded Land Use vs Authoritative Zoning Mismatch",
                description: `Parcel recorded land use (${parcelLandUse}) differs from master plan zoning (${zoningLandUse}).`,
                affectedData: `Parcel Land Use: ${parcelLandUse} | Authoritative Zoning: ${zoningLandUse}`,
                recommendation: "Reconcile land-use records with local planning authority.",
                sources: [
                    { department: "Land Use Department", field: "Zoning Designation", value: zoningLandUse, status: "COMPATIBLE" },
                    { department: "Parcel Master Record", field: "Recorded Land Use", value: parcelLandUse, status: "REVIEW REQUIRED" }
                ],
                evidence: [
                    { source: "Master Plan Zoning Map", type: "LandUse", tab: "landUse" }
                ],
                affectedDepartments: ["Land Use & Planning Department"]
            });
        }
    }

    if (landUse && buildingUse) {
        const zoningLandUse = (landUse.landUseType || parcelLandUse || "").toUpperCase();
        const bUse = String(buildingUse).toUpperCase();
        if ((zoningLandUse.includes("RESIDENTIAL") && bUse.includes("COMMERCIAL")) ||
            (zoningLandUse.includes("AGRICULTURAL") && (bUse.includes("COMMERCIAL") || bUse.includes("INDUSTRIAL")))) {
            addConflict({
                type: "BUILDING / LAND USE MISMATCH",
                category: "LAND_USE",
                severity: "MEDIUM",
                status: "OPEN",
                title: "Building Permit Use vs Zoning Classification Mismatch",
                description: `Building structure use (${bUse}) conflicts with authoritative zoning designation (${zoningLandUse}).`,
                affectedData: `Zoning Designation: ${zoningLandUse} | Building Permit Use: ${bUse}`,
                recommendation: "Request Municipal Building verification to inspect zoning variance compliance.",
                sources: [
                    { department: "Land Use Department", field: "Zoning Classification", value: zoningLandUse, status: "COMPATIBLE" },
                    { department: "Building Municipal Dept", field: "Building Permission Use", value: bUse, status: "UNDER REVIEW" }
                ],
                evidence: [
                    { source: "Master Plan Record", type: "LandUse", tab: "landUse" },
                    { source: "Building Permit Record", type: "BuildingPermission", tab: "building" }
                ],
                affectedDepartments: ["Land Use & Planning Department", "Property Tax & Municipal Department"]
            });
        }
    }

    /* =========================================================
       4. RESTRICTION LAYER CONFLICTS
       ========================================================= */
    const rest = profile.restrictions;
    if (rest) {
        if (rest.waterBodyRestriction === true) {
            addConflict({
                type: "RESTRICTION CONFLICT",
                category: "RESTRICTION",
                severity: "CRITICAL",
                status: "OPEN",
                title: "Water Body Buffer Restriction Conflict",
                description: "Development is restricted as parcel falls within an active water-body buffer protection zone.",
                affectedData: "Water Body Restriction: ACTIVE | Risk Level: HIGH",
                recommendation: "Verify environmental and water resource buffer regulations before approving development.",
                sources: [
                    { department: "Restrictions & Environmental", field: "Water Body Buffer", value: "ACTIVE", status: "RESTRICTED" }
                ],
                evidence: [
                    { source: "Environmental GIS Buffer Map", type: "Restrictions", tab: "restrictions" }
                ],
                affectedDepartments: ["Restrictions Department", "Land Use & Planning Department"]
            });
        }

        if (rest.governmentAcquisition === true) {
            addConflict({
                type: "RESTRICTION CONFLICT",
                category: "RESTRICTION",
                severity: "CRITICAL",
                status: "OPEN",
                title: "Active Government Acquisition Status",
                description: "Parcel is marked under active government land acquisition process.",
                affectedData: "Government Acquisition: ACTIVE",
                recommendation: "Freeze transfer and development approvals pending acquisition clearance.",
                sources: [
                    { department: "Restrictions Department", field: "Government Acquisition", value: "ACTIVE", status: "RESTRICTED" }
                ],
                evidence: [
                    { source: "Acquisition Gazette Notification", type: "Restrictions", tab: "restrictions" }
                ],
                affectedDepartments: ["Restrictions Department", "Registration Department"]
            });
        }
    }

    /* =========================================================
       5. BUILDING PERMISSION DEVIATION
       ========================================================= */
    const bp = profile.buildingPermission;
    if (bp) {
        const approvedFloors = bp.approvedFloors || bp.permittedFloors;
        const recordedFloors = bp.recordedFloors || bp.actualFloors;
        if (approvedFloors && recordedFloors && Number(recordedFloors) > Number(approvedFloors)) {
            addConflict({
                type: "BUILDING PERMISSION DEVIATION",
                category: "BUILDING_PERMISSION",
                severity: "HIGH",
                status: "OPEN",
                title: "Building Height / Floor Permission Deviation",
                description: `Constructed/recorded floors (${recordedFloors}) exceed approved floors (${approvedFloors}) per municipal building permit.`,
                affectedData: `Approved Floors: ${approvedFloors} | Recorded Floors: ${recordedFloors}`,
                recommendation: "Issue municipal inspection order and request building compliance verification.",
                sources: [
                    { department: "Building Municipal Dept", field: "Approved Floors", value: String(approvedFloors), status: "APPROVED" },
                    { department: "Municipal Inspection", field: "Constructed Floors", value: String(recordedFloors), status: "DEVIATION" }
                ],
                evidence: [
                    { source: "Building Permit Sanction", type: "BuildingPermission", tab: "building" }
                ],
                affectedDepartments: ["Property Tax & Municipal Department"]
            });
        }
    }

    /* =========================================================
       6. RECONCILE WITH PERSISTENT CONFLICT STORE
       ========================================================= */
    const storedConflicts = getConflictsByParcel(profile.parcelId);
    
    // Replace or merge with stored conflicts if user has taken action (e.g. RESOLVED, UNDER_REVIEW, REQUEST_SENT)
    storedConflicts.forEach(stored => {
        const existingIdx = conflicts.findIndex(c => c.type === stored.type || c.id === stored.id);
        if (existingIdx !== -1) {
            conflicts[existingIdx] = {
                ...conflicts[existingIdx],
                ...stored,
                // Preserve stored status and assigned info
                status: stored.status,
                assignedOfficer: stored.assignedOfficer,
                resolutionRemark: stored.resolutionRemark,
                timeline: stored.timeline || conflicts[existingIdx].timeline
            };
        } else {
            conflicts.push(stored);
        }
    });

    /* =========================================================
       7. SEVERITY & SUMMARY
       ========================================================= */
    let highestSeverity = "LOW";
    const activeConflicts = conflicts.filter(c => !["RESOLVED", "DISMISSED"].includes(c.status));

    if (activeConflicts.some(c => c.severity === "CRITICAL")) {
        highestSeverity = "CRITICAL";
    } else if (activeConflicts.some(c => c.severity === "HIGH")) {
        highestSeverity = "HIGH";
    } else if (activeConflicts.some(c => c.severity === "MEDIUM")) {
        highestSeverity = "MEDIUM";
    }

    let summary = "";
    if (activeConflicts.length === 0) {
        summary = "No open spatial or departmental data conflicts detected.";
    } else if (highestSeverity === "CRITICAL" || highestSeverity === "HIGH") {
        summary = `High/Critical priority governance conflicts detected (${activeConflicts.length} open). Action required.`;
    } else {
        summary = `Minor/Medium data inconsistencies detected (${activeConflicts.length} open). Review recommended.`;
    }

    return {
        hasConflicts: activeConflicts.length > 0,
        conflictCount: conflicts.length,
        openConflictCount: activeConflicts.length,
        highestSeverity,
        conflicts,
        summary
    };
}

module.exports = {
    detectLandConflicts
};
