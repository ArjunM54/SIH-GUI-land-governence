/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   AUDIT TRAIL SERVICE

   Provides audit trail record creation, retrieval, and
   parcel history tracking for development proposal validations.
   ========================================================= */

// In-memory store for audit records during server lifetime
const auditStore = [];
let auditCounter = 0;

/**
 * Generates a unique, incremental audit ID.
 * Format: AUD-00001, AUD-00002, etc.
 */
function generateAuditId() {
    auditCounter += 1;
    return `AUD-${String(auditCounter).padStart(5, "0")}`;
}

/**
 * Determines which evidence/governance datasets were evaluated
 * during proposal validation.
 */
function extractEvidenceCategories(profile = {}, proposal = {}) {
    const categories = [];

    if (!profile) return categories;

    // LAND_USE zoning & classification alignment
    if (profile.landUse || (profile.parcel && profile.parcel.landUse)) {
        categories.push("LAND_USE");
    }

    // Development & regulatory restrictions
    if (profile.restrictions || (profile.landUse && profile.landUse.developmentRestriction)) {
        categories.push("RESTRICTIONS");
    }

    // Building permissions (construction activity or building permission record)
    const developmentType = (proposal.developmentType || "").toUpperCase();
    const isConstruction = ["NEW_BUILDING", "EXTENSION"].includes(developmentType);
    if (isConstruction || profile.buildingPermission) {
        categories.push("BUILDING_PERMISSION");
    }

    // Property Tax clearance
    if (profile.propertyTax) {
        categories.push("PROPERTY_TAX");
    }

    // Ownership & Record of Rights (RoR)
    if (profile.ror) {
        categories.push("OWNERSHIP");
    }

    // Property Registration validity
    if (profile.registration) {
        categories.push("REGISTRATION");
    }

    // Utilities data
    if (profile.utilities) {
        categories.push("UTILITIES");
    }

    return categories;
}

/**
 * Creates an immutable audit record for a successful proposal validation.
 *
 * @param {Object} validationInput - { parcelId, proposal, profile }
 * @param {Object} validationResult - Assessment result from proposalValidator
 * @returns {Object} Created audit record
 */
function createAuditRecord(validationInput = {}, validationResult = {}) {
    const { parcelId, proposal = {}, profile = {} } = validationInput;

    const auditId = generateAuditId();
    const createdAt = new Date().toISOString();
    const categories = extractEvidenceCategories(profile, proposal);

    const auditRecord = {
        auditId,
        parcelId: parcelId || profile.parcelId || "UNKNOWN",
        proposal: {
            activityType: (proposal.activityType || "OTHER").toUpperCase(),
            developmentType: (proposal.developmentType || "OTHER").toUpperCase(),
            proposedArea: proposal.proposedArea !== undefined && proposal.proposedArea !== null ? Number(proposal.proposedArea) : null
        },
        result: {
            decision: validationResult.decision || "PROCEED",
            riskLevel: validationResult.riskLevel || "LOW",
            score: validationResult.score !== undefined ? validationResult.score : 0,
            summary: validationResult.summary || "",
            checks: validationResult.checks || [],
            issues: validationResult.issues || [],
            recommendations: validationResult.recommendations || []
        },
        evidence: {
            categories
        },
        createdAt
    };

    auditStore.push(auditRecord);
    console.log(`[Audit Service] Created Audit Record: ${auditId} for Parcel: ${auditRecord.parcelId}`);
    return auditRecord;
}

/**
 * Retrieves a single audit record by audit ID.
 *
 * @param {string} auditId
 * @returns {Object|null} Audit record or null if not found
 */
function getAuditRecord(auditId) {
    if (!auditId || typeof auditId !== "string") return null;
    const targetId = auditId.trim().toUpperCase();
    return auditStore.find(record => record.auditId.toUpperCase() === targetId) || null;
}

/**
 * Retrieves all audit records for a given parcel ID, ordered newest first.
 *
 * @param {string} parcelId
 * @returns {Array} Array of audit records
 */
function getAuditsByParcel(parcelId) {
    if (!parcelId || typeof parcelId !== "string") return [];
    const targetParcel = parcelId.trim().toUpperCase();
    return auditStore
        .filter(record => (record.parcelId || "").toUpperCase() === targetParcel)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Lists audit records across all parcels with an optional limit (newest first).
 *
 * @param {number} [limit=20]
 * @returns {Array} Array of audit records
 */
function listAudits(limit = 20) {
    let parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
        parsedLimit = 20;
    }
    if (parsedLimit > 100) {
        parsedLimit = 100;
    }

    return [...auditStore]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, parsedLimit);
}

/**
 * Helper to reset/clear store (useful for testing if needed)
 */
function clearAuditStore() {
    auditStore.length = 0;
    auditCounter = 0;
}

module.exports = {
    createAuditRecord,
    getAuditRecord,
    getAuditsByParcel,
    listAudits,
    clearAuditStore
};
