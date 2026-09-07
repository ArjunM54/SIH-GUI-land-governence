/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   AUDIT TRAIL SERVICE (PHASE 12M COMPREHENSIVE AUDIT)

   Provides immutable audit trail record creation, before/after tracking,
   advanced search & filtering, department & officer activity metrics,
   and CSV/JSON export capabilities.
   ========================================================= */

const { getDocumentsByParcelId } = require("./documentService");

// In-memory store for audit records during server lifetime
const auditStore = [];
let auditCounter = 0;

/**
 * Seed initial prototype audit records for realistic activity demonstration
 */
function seedInitialAuditRecords() {
    if (auditStore.length > 0) return;

    const demoRecords = [
        {
            actor: "OFF-REG-001",
            department: "Registration Department",
            role: "registration_officer",
            action: "PARCEL_VIEWED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "PARCEL",
            resourceId: "LND-001",
            result: "SUCCESS",
            details: { action: "Registration Officer accessed land profile" },
            timestamp: "2026-09-06T09:15:00.000Z"
        },
        {
            actor: "SYSTEM",
            department: "Land Governance Portal",
            role: "system",
            action: "CONFLICT_DETECTED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "CONFLICT",
            resourceId: "CON-001",
            referenceId: "CON-001",
            result: "SUCCESS",
            details: { reason: "Owner mismatch detected between RoR and Registration deed" },
            before: { rorOwner: "Ramesh Sharma", registrationBuyer: "Anil Kumar" },
            after: { status: "CONFLICT_DETECTED" },
            timestamp: "2026-09-06T10:30:00.000Z"
        },
        {
            actor: "OFF-REG-001",
            department: "Registration Department",
            role: "registration_officer",
            action: "REQUEST_CREATED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "DEPARTMENT_REQUEST",
            resourceId: "REQ-00031",
            referenceId: "REQ-00031",
            result: "SUCCESS",
            details: { requestType: "Ownership Verification", toDepartment: "Land Records Department" },
            timestamp: "2026-09-06T11:05:00.000Z"
        },
        {
            actor: "OFF-ROR-001",
            department: "Land Records Department",
            role: "land_records_officer",
            action: "REQUEST_ACCEPTED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "DEPARTMENT_REQUEST",
            resourceId: "REQ-00031",
            referenceId: "REQ-00031",
            result: "SUCCESS",
            details: { status: "ACCEPTED", acceptedBy: "Kumar LandRecords" },
            timestamp: "2026-09-06T11:20:00.000Z"
        },
        {
            actor: "OFF-ROR-001",
            department: "Land Records Department",
            role: "land_records_officer",
            action: "ROR_VERIFIED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "ROR_RECORD",
            resourceId: "LND-001",
            result: "SUCCESS",
            details: { verificationResult: "VERIFIED", remarks: "Confirmed registered deed matches official RoR Khata" },
            before: { status: "REVIEW_REQUIRED" },
            after: { status: "VERIFIED" },
            timestamp: "2026-09-06T12:00:00.000Z"
        },
        {
            actor: "OFF-ROR-001",
            department: "Land Records Department",
            role: "land_records_officer",
            action: "REQUEST_COMPLETED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "DEPARTMENT_REQUEST",
            resourceId: "REQ-00031",
            referenceId: "REQ-00031",
            result: "SUCCESS",
            details: { status: "COMPLETED", result: "VERIFIED" },
            timestamp: "2026-09-06T12:10:00.000Z"
        },
        {
            actor: "OFF-ROR-001",
            department: "Land Records Department",
            role: "land_records_officer",
            action: "CONFLICT_RESOLVED",
            target: "LND-001",
            parcelId: "LND-001",
            resourceType: "CONFLICT",
            resourceId: "CON-001",
            referenceId: "CON-001",
            result: "SUCCESS",
            details: { resolutionRemark: "Verified ownership with revenue office documents" },
            before: { status: "OPEN" },
            after: { status: "RESOLVED" },
            timestamp: "2026-09-06T12:15:00.000Z"
        }
    ];

    demoRecords.forEach(r => logEvent(r));
}

/**
 * Generates a unique, incremental audit ID.
 * Format: AUD-00001, AUD-00002, etc.
 */
function generateAuditId() {
    auditCounter += 1;
    return `AUD-${String(auditCounter).padStart(5, "0")}`;
}

/**
 * Logs a generic or structured audit event
 *
 * @param {Object} eventData - { actor, department, role, action, target, parcelId, resourceType, resourceId, referenceId, result, details, before, after, reason, remarks, timestamp }
 * @returns {Object} Created immutable audit record
 */
function logEvent(eventData = {}) {
    const auditId = generateAuditId();
    const createdAt = eventData.timestamp || new Date().toISOString();
    const targetParcel = eventData.parcelId || eventData.target || "SYSTEM";

    // Clean details to exclude sensitive keys like passwords or tokens
    let safeDetails = {};
    if (typeof eventData.details === "object" && eventData.details !== null) {
        const { password, token, jwt, secret, ...clean } = eventData.details;
        safeDetails = clean;
    } else if (eventData.details) {
        safeDetails = { message: String(eventData.details) };
    }

    const auditRecord = Object.freeze({
        auditId,
        parcelId: targetParcel,
        actor: eventData.actor || "SYSTEM",
        department: eventData.department || eventData.details?.department || "Government Department",
        role: eventData.role || eventData.details?.role || "OFFICER",
        target: targetParcel,
        action: eventData.action || "GENERAL_EVENT",
        resourceType: eventData.resourceType || "PARCEL",
        resourceId: eventData.resourceId || targetParcel,
        referenceId: eventData.referenceId || eventData.resourceId || null,
        result: eventData.result || "SUCCESS",
        before: eventData.before || null,
        after: eventData.after || null,
        reason: eventData.reason || eventData.details?.reason || null,
        remarks: eventData.remarks || eventData.details?.remarks || null,
        details: safeDetails,
        createdAt
    });

    auditStore.push(auditRecord);
    return auditRecord;
}

/**
 * Creates an audit record for proposal validation
 */
function createAuditRecord(validationInput = {}, validationResult = {}) {
    const { parcelId, proposal = {}, profile = {} } = validationInput;
    const targetParcelId = parcelId || profile.parcelId || "UNKNOWN";

    return logEvent({
        actor: "SYSTEM",
        target: targetParcelId,
        parcelId: targetParcelId,
        action: "PROPOSAL_VALIDATED",
        resourceType: "PROPOSAL",
        resourceId: targetParcelId,
        result: "SUCCESS",
        details: {
            activityType: proposal.activityType,
            developmentType: proposal.developmentType,
            decision: validationResult.decision,
            score: validationResult.score,
            summary: validationResult.summary
        }
    });
}

/**
 * Retrieves a single audit record by audit ID
 */
function getAuditRecord(auditId) {
    if (!auditId || typeof auditId !== "string") return null;
    const targetId = auditId.trim().toUpperCase();
    return auditStore.find(record => record.auditId.toUpperCase() === targetId) || null;
}

/**
 * Retrieves audit records for a parcel (newest first)
 */
function getAuditsByParcel(parcelId) {
    seedInitialAuditRecords();
    if (!parcelId || typeof parcelId !== "string") return [];
    const targetParcel = parcelId.trim().toUpperCase();
    return auditStore
        .filter(record => (record.parcelId || record.target || "").toUpperCase() === targetParcel)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Advanced query filtering for audit records
 */
function queryAudits(options = {}) {
    seedInitialAuditRecords();
    let results = [...auditStore];

    // Filter by Parcel ID
    if (options.parcelId && options.parcelId !== "ALL") {
        const p = options.parcelId.trim().toUpperCase();
        results = results.filter(r => (r.parcelId || r.target || "").toUpperCase() === p);
    }

    // Filter by Department
    if (options.department && options.department !== "ALL") {
        const d = options.department.trim().toLowerCase();
        results = results.filter(r => (r.department || "").toLowerCase().includes(d));
    }

    // Filter by Officer / Actor
    if (options.officer || options.user) {
        const actorTerm = (options.officer || options.user).trim().toLowerCase();
        results = results.filter(r => (r.actor || "").toLowerCase().includes(actorTerm));
    }

    // Filter by Role
    if (options.role && options.role !== "ALL") {
        const r = options.role.trim().toLowerCase();
        results = results.filter(r => (r.role || "").toLowerCase() === r);
    }

    // Filter by Action
    if (options.action && options.action !== "ALL") {
        const a = options.action.trim().toUpperCase();
        results = results.filter(r => r.action === a);
    }

    // Filter by Resource Type
    if (options.resource && options.resource !== "ALL") {
        const resType = options.resource.trim().toUpperCase();
        results = results.filter(r => (r.resourceType || "").toUpperCase() === resType);
    }

    // Filter by Result (SUCCESS, FAILED, DENIED)
    if (options.result && options.result !== "ALL") {
        const res = options.result.trim().toUpperCase();
        results = results.filter(r => (r.result || "").toUpperCase() === res);
    }

    // Filter by Date Range
    if (options.startDate) {
        const start = new Date(options.startDate);
        results = results.filter(r => new Date(r.createdAt) >= start);
    }
    if (options.endDate) {
        const end = new Date(options.endDate);
        results = results.filter(r => new Date(r.createdAt) <= end);
    }

    // Search query across Audit ID, Parcel ID, User, Action, Details
    if (options.search && options.search.trim()) {
        const term = options.search.trim().toLowerCase();
        results = results.filter(r =>
            (r.auditId || "").toLowerCase().includes(term) ||
            (r.parcelId || "").toLowerCase().includes(term) ||
            (r.actor || "").toLowerCase().includes(term) ||
            (r.action || "").toLowerCase().includes(term) ||
            (r.department || "").toLowerCase().includes(term) ||
            (r.referenceId || "").toLowerCase().includes(term) ||
            (r.resourceId || "").toLowerCase().includes(term) ||
            (r.reason || "").toLowerCase().includes(term) ||
            (r.remarks || "").toLowerCase().includes(term)
        );
    }

    // Sort newest first
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Pagination
    const page = parseInt(options.page, 10) || 1;
    const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 100);
    const totalRecords = results.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedData = results.slice(startIndex, startIndex + limit);

    return {
        totalRecords,
        page,
        totalPages,
        limit,
        data: paginatedData
    };
}

/**
 * Returns overall audit summary statistics
 */
function getAuditMetrics() {
    seedInitialAuditRecords();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalActivities = auditStore.length;
    const todayCount = auditStore.filter(r => new Date(r.createdAt) >= todayStart).length;
    const weekCount = auditStore.filter(r => new Date(r.createdAt) >= weekStart).length;
    const verificationActions = auditStore.filter(r => r.action.includes("VERIF")).length;
    const requestsCount = auditStore.filter(r => r.action.includes("REQUEST")).length;
    const dataChangesCount = auditStore.filter(r => r.action.includes("UPDATED") || r.action.includes("MUTATION") || r.action.includes("REGISTERED")).length;
    const conflictActionsCount = auditStore.filter(r => r.action.includes("CONFLICT")).length;
    const documentActionsCount = auditStore.filter(r => r.action.includes("DOCUMENT")).length;

    return {
        totalActivities,
        todayCount,
        weekCount,
        verificationActions,
        requestsCount,
        dataChangesCount,
        conflictActionsCount,
        documentActionsCount
    };
}

/**
 * Returns activity breakdown by department
 */
function getDepartmentActivityMetrics() {
    seedInitialAuditRecords();
    const depts = {};

    auditStore.forEach(r => {
        const dept = r.department || "General Administration";
        if (!depts[dept]) {
            depts[dept] = { total: 0, today: 0, verifications: 0, conflicts: 0 };
        }
        depts[dept].total += 1;
        if (new Date(r.createdAt) >= new Date(new Date().setHours(0, 0, 0, 0))) {
            depts[dept].today += 1;
        }
        if (r.action.includes("VERIF")) depts[dept].verifications += 1;
        if (r.action.includes("CONFLICT")) depts[dept].conflicts += 1;
    });

    return depts;
}

/**
 * Returns officer activity summary overview
 */
function getOfficerActivityMetrics() {
    seedInitialAuditRecords();
    const officers = {};

    auditStore.forEach(r => {
        const officer = r.actor || "SYSTEM";
        if (!officers[officer]) {
            officers[officer] = {
                officer,
                department: r.department || "N/A",
                totalActions: 0,
                requestsCompleted: 0,
                verifications: 0,
                conflictsResolved: 0,
                documentsVerified: 0,
                lastActivity: r.createdAt
            };
        }
        const o = officers[officer];
        o.totalActions += 1;
        if (r.action === "REQUEST_COMPLETED") o.requestsCompleted += 1;
        if (r.action.includes("VERIF")) o.verifications += 1;
        if (r.action === "CONFLICT_RESOLVED") o.conflictsResolved += 1;
        if (r.action === "DOCUMENT_VERIFIED") o.documentsVerified += 1;
        if (new Date(r.createdAt) > new Date(o.lastActivity)) {
            o.lastActivity = r.createdAt;
        }
    });

    return Object.values(officers);
}

/**
 * Lists audits (simple wrapper)
 */
function listAudits(limit = 20) {
    return queryAudits({ limit }).data;
}

/**
 * Clear audit store (for testing reset)
 */
function clearAuditStore() {
    auditStore.length = 0;
    auditCounter = 0;
}

// Initial seed
seedInitialAuditRecords();

module.exports = {
    createAuditRecord,
    logEvent,
    getAuditRecord,
    getAuditsByParcel,
    queryAudits,
    getAuditMetrics,
    getDepartmentActivityMetrics,
    getOfficerActivityMetrics,
    listAudits,
    clearAuditStore
};


