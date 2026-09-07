/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   UNIFIED PARCEL TIMELINE SERVICE (PHASE 12L)

   Aggregates chronological events across all 7 departments,
   Inter-Departmental requests, conflicts, and audit trail.
   ========================================================= */

const { getIntegratedLandProfile } = require("../data/landProfile");
const { getRequestsByParcel } = require("../data/departmentRequests");
const { getConflictsByParcel } = require("../data/conflicts");
const { getAuditsByParcel } = require("./auditService");

/**
 * Returns icon emoji for event type
 */
function getEventIcon(eventType = "", department = "") {
    const typeUpper = (eventType || "").toUpperCase();
    const deptUpper = (department || "").toUpperCase();

    if (typeUpper.includes("CONFLICT")) return "⚠️";
    if (typeUpper.includes("REQUEST") || typeUpper.includes("VERIFICATION_REQUESTED")) return "📤";
    if (typeUpper.includes("VERIFIED") || typeUpper.includes("COMPLETED")) return "✓";
    if (typeUpper.includes("REJECTED") || typeUpper.includes("DENIED")) return "❌";
    if (typeUpper.includes("GIS") || typeUpper.includes("CADASTRAL") || deptUpper.includes("CADASTRAL")) return "🗺️";
    if (typeUpper.includes("ROR") || typeUpper.includes("OWNERSHIP") || typeUpper.includes("MUTATION") || deptUpper.includes("RECORD")) return "📜";
    if (typeUpper.includes("REGISTRATION") || typeUpper.includes("DEED") || deptUpper.includes("REGISTRATION")) return "🖋️";
    if (typeUpper.includes("LAND_USE") || typeUpper.includes("ZONING") || deptUpper.includes("LAND USE")) return "🏛️";
    if (typeUpper.includes("TAX") || typeUpper.includes("CLEARANCE") || deptUpper.includes("TAX")) return "💰";
    if (typeUpper.includes("BUILDING") || typeUpper.includes("MUNICIPAL") || deptUpper.includes("MUNICIPAL")) return "🏢";
    if (typeUpper.includes("RESTRICTION")) return "🚧";
    if (typeUpper.includes("DOCUMENT")) return "📄";
    return "📋";
}

/**
 * Aggregates all timeline events for a given parcel.
 *
 * @param {string} parcelId
 * @param {Object} [options] - { department, eventType, status, dateRange, search, sortOrder }
 * @returns {Object} Aggregated timeline object with parcelId, totalEvents, and events array
 */
function getParcelTimeline(parcelId, options = {}, profileInput = null) {
    if (!parcelId || typeof parcelId !== "string") {
        return { parcelId: "UNKNOWN", totalEvents: 0, events: [] };
    }

    const targetParcelId = parcelId.trim().toUpperCase();
    const { getLandProfile } = require("../data/landProfile");
    const rawProfile = profileInput || getLandProfile(targetParcelId);

    if (!rawProfile) {
        return { parcelId: targetParcelId, totalEvents: 0, events: [] };
    }

    const events = [];
    let counter = 0;
    const makeEventId = (prefix) => `EVT-${prefix}-${String(++counter).padStart(4, "0")}`;

    const parcel = rawProfile.parcel || {};
    const cadastral = rawProfile.cadastral || {};
    const ror = rawProfile.ror || rawProfile.ownership || {};
    const registration = rawProfile.registration || {};
    const landUse = rawProfile.landUse || {};
    const propertyTax = rawProfile.propertyTax || rawProfile.tax || {};
    const building = rawProfile.buildingPermission || rawProfile.building || {};
    const restrictions = rawProfile.restrictions || {};
    const docs = rawProfile.documents || [];

    // 1. PARCEL CREATION BASE EVENT
    if (parcel.createdDate || parcel.id) {
        events.push({
            eventId: makeEventId("BASE"),
            parcelId: targetParcelId,
            eventType: "PARCEL_CREATED",
            title: `Parcel ${targetParcelId} Record Initialized`,
            description: `Digital Land Parcel record created. Survey No: ${parcel.surveyNumber || 'N/A'}, Classification: ${parcel.classification || 'Private'}`,
            department: "Cadastral & Survey Department",
            actor: "SYSTEM",
            timestamp: parcel.createdDate ? `${parcel.createdDate}T09:00:00Z` : "2024-01-01T09:00:00Z",
            source: "Cadastral GIS Registry",
            referenceId: parcel.surveyNumber || targetParcelId,
            status: "INFO",
            severity: "LOW",
            icon: "🗺️",
            navigation: { type: "cadastral", id: targetParcelId }
        });
    }

    // 2. CADASTRAL SURVEY HISTORY EVENTS
    if (Array.isArray(cadastral.surveyHistory)) {
        cadastral.surveyHistory.forEach(h => {
            events.push({
                eventId: makeEventId("CAD"),
                parcelId: targetParcelId,
                eventType: "CADASTRAL_UPDATED",
                title: h.action || "Cadastral Survey Record Updated",
                description: h.notes || `Survey verification completed for Survey No: ${cadastral.surveyNumber || parcel.surveyNumber}`,
                department: "Cadastral & Survey Department",
                actor: h.officer || "OFF-CAD-001",
                timestamp: h.date ? `${h.date}T10:00:00Z` : "2024-06-15T10:00:00Z",
                source: "Cadastral Department",
                referenceId: cadastral.surveyNumber || targetParcelId,
                status: "VERIFIED",
                severity: "LOW",
                icon: "🗺️",
                navigation: { type: "cadastral", id: targetParcelId }
            });
        });
    }

    // 3. ROR OWNERSHIP HISTORY & MUTATION EVENTS
    if (Array.isArray(ror.ownershipHistory)) {
        ror.ownershipHistory.forEach(h => {
            events.push({
                eventId: makeEventId("ROR"),
                parcelId: targetParcelId,
                eventType: "ROR_CREATED",
                title: `Record of Rights (RoR) Created: ${h.owner}`,
                description: `RoR Title registered for owner '${h.owner}'. Document Ref: ${h.document || 'RoR-REG-01'}`,
                department: "Land Records Department",
                actor: "OFF-ROR-001",
                timestamp: h.date ? `${h.date}T11:00:00Z` : "2024-08-01T11:00:00Z",
                source: "Land Records System",
                referenceId: h.document || `ROR-${targetParcelId}`,
                status: h.status === "ACTIVE" ? "VERIFIED" : "INFO",
                severity: "LOW",
                icon: "📜",
                navigation: { type: "ownership", id: targetParcelId }
            });
        });
    }

    if (Array.isArray(ror.mutations)) {
        ror.mutations.forEach(m => {
            events.push({
                eventId: makeEventId("MUT"),
                parcelId: targetParcelId,
                eventType: "MUTATION_RECORDED",
                title: `Ownership Mutation: ${m.type || 'Title Transfer'}`,
                description: `Mutation Application ${m.mutationId || ''}: ${m.previousOwner || 'Previous Owner'} → ${m.newOwner || 'New Owner'}. Status: ${m.status}`,
                department: "Land Records Department",
                actor: m.processedBy || "OFF-ROR-001",
                timestamp: m.applicationDate ? `${m.applicationDate}T12:00:00Z` : "2025-02-10T12:00:00Z",
                source: "RoR Mutation Registry",
                referenceId: m.mutationId || `MUT-${targetParcelId}`,
                status: m.status === "APPROVED" ? "COMPLETED" : (m.status === "REJECTED" ? "REJECTED" : "PENDING"),
                severity: "MEDIUM",
                icon: "📜",
                navigation: { type: "ownership", id: targetParcelId }
            });
        });
    }

    // 4. REGISTRATION TRANSACTION EVENTS
    if (Array.isArray(registration.transactionHistory)) {
        registration.transactionHistory.forEach(h => {
            events.push({
                eventId: makeEventId("REG"),
                parcelId: targetParcelId,
                eventType: "REGISTRATION_RECORDED",
                title: `Deed Registration: ${h.type || 'Sale Deed'}`,
                description: `Property registration deed recorded. Seller: ${h.seller}, Buyer: ${h.buyer}, Consideration Amount: ₹${(h.consideration || 0).toLocaleString()}`,
                department: "Registration Department",
                actor: "OFF-REG-001",
                timestamp: h.year ? `${h.year}-03-15T14:30:00Z` : "2025-03-15T14:30:00Z",
                source: "Registration Department",
                referenceId: h.docRef || `REG-${targetParcelId}`,
                status: "VERIFIED",
                severity: "LOW",
                icon: "🖋️",
                navigation: { type: "registration", id: targetParcelId }
            });
        });
    }

    // 5. LAND USE & ZONING EVENTS
    if (Array.isArray(landUse.landUseHistory)) {
        landUse.landUseHistory.forEach(h => {
            events.push({
                eventId: makeEventId("LU"),
                parcelId: targetParcelId,
                eventType: "LAND_USE_UPDATED",
                title: `Land Use Classification: ${h.landUse || 'Residential'}`,
                description: `Master Plan Zoning designated as '${h.zone || 'R1-Residential'}'. Approved By: ${h.officer || 'Planning Authority'}`,
                department: "Land Use & Planning Department",
                actor: h.officer || "OFF-LU-001",
                timestamp: h.year ? `${h.year}-05-01T10:00:00Z` : "2026-01-10T10:00:00Z",
                source: "Land Use & Planning Department",
                referenceId: `LU-${targetParcelId}`,
                status: "VERIFIED",
                severity: "LOW",
                icon: "🏛️",
                navigation: { type: "landuse", id: targetParcelId }
            });
        });
    }

    // 6. PROPERTY TAX ASSESSMENT EVENTS
    if (Array.isArray(propertyTax.taxHistory)) {
        propertyTax.taxHistory.forEach(h => {
            events.push({
                eventId: makeEventId("TAX"),
                parcelId: targetParcelId,
                eventType: "TAX_ASSESSMENT_CREATED",
                title: `Property Tax Assessment (${h.year || '2025-26'})`,
                description: `Tax demand assessed: ₹${(h.demand || 0).toLocaleString()}. Amount Paid: ₹${(h.paid || 0).toLocaleString()}. Status: ${h.status}`,
                department: "Property Tax & Municipal Department",
                actor: "OFF-TAX-001",
                timestamp: h.year ? `${h.year.substring(0, 4)}-04-01T09:00:00Z` : "2026-04-01T09:00:00Z",
                source: "Property Tax Department",
                referenceId: `TAX-${h.year || targetParcelId}`,
                status: h.status === "PAID" || h.status === "CLEARED" ? "VERIFIED" : "PENDING",
                severity: h.status === "UNPAID" ? "MEDIUM" : "LOW",
                icon: "💰",
                navigation: { type: "tax", id: targetParcelId }
            });
        });
    }

    // 7. BUILDING PERMISSION EVENTS
    if (building && building.buildingPermissionStatus) {
        events.push({
            eventId: makeEventId("BLD"),
            parcelId: targetParcelId,
            eventType: "BUILDING_PERMISSION_UPDATED",
            title: `Building Permission: ${building.buildingPermissionStatus.toUpperCase()}`,
            description: `Plan approval ref: ${building.applicationNo || building.permissionNumber || 'BP-2026-01'}. Proposed structure: ${building.proposedStructure || building.buildingType || 'Residential'}. Status: ${building.buildingPermissionStatus}`,
            department: "Property Tax & Municipal Department",
            actor: building.approvedBy || "OFF-TAX-001",
            timestamp: building.approvalDate ? `${building.approvalDate}T11:00:00Z` : "2026-02-15T11:00:00Z",
            source: "Municipal Building Authority",
            referenceId: building.applicationNo || building.permissionNumber || `BP-${targetParcelId}`,
            status: building.buildingPermissionStatus.toLowerCase() === "approved" ? "COMPLETED" : "REVIEW REQUIRED",
            severity: building.buildingPermissionStatus.toLowerCase() === "approved" ? "LOW" : "HIGH",
            icon: "🏢",
            navigation: { type: "building", id: targetParcelId }
        });
    }

    // 8. RESTRICTIONS EVENTS
    if (restrictions && restrictions.restrictionsList && Array.isArray(restrictions.restrictionsList)) {
        restrictions.restrictionsList.forEach(r => {
            events.push({
                eventId: makeEventId("RST"),
                parcelId: targetParcelId,
                eventType: "RESTRICTION_ADDED",
                title: `Regulatory Restriction: ${r.type || 'Encumbrance Notice'}`,
                description: `Restriction registered: ${r.description || r.type}. Risk Level: ${r.severity || restrictions.riskLevel || 'MEDIUM'}`,
                department: "Land Use & Planning Department",
                actor: r.authority || "OFF-LU-001",
                timestamp: r.date ? `${r.date}T10:00:00Z` : "2026-03-01T10:00:00Z",
                source: "Land Regulatory Board",
                referenceId: r.restrictionId || `RST-${targetParcelId}`,
                status: "CONFLICT",
                severity: (r.severity || "MEDIUM").toUpperCase(),
                icon: "🚧",
                navigation: { type: "restrictions", id: targetParcelId }
            });
        });
    }

    // 9. DOCUMENT EVENTS
    docs.forEach(d => {
        events.push({
            eventId: makeEventId("DOC"),
            parcelId: targetParcelId,
            eventType: d.status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_UPLOADED",
            title: `Document ${d.status === "VERIFIED" ? 'Verified' : 'Uploaded'}: ${d.documentType || d.name || 'Land Document'}`,
            description: `Document Ref: ${d.documentId}. Category: ${d.category || d.documentType}. Status: ${d.status || 'PENDING'}`,
            department: d.department || "Land Governance Registry",
            actor: d.uploadedBy || "OFF-GOVT-001",
            timestamp: d.uploadedAt || d.createdAt || "2026-05-10T14:00:00Z",
            source: "Document Management System",
            referenceId: d.documentId,
            status: d.status === "VERIFIED" ? "VERIFIED" : (d.status === "REJECTED" ? "REJECTED" : "PENDING"),
            severity: "LOW",
            icon: "📄",
            navigation: { type: "document", id: d.documentId }
        });
    });

    // 10. INTER-DEPARTMENTAL REQUEST EVENTS
    const deptRequests = getRequestsByParcel(targetParcelId) || [];
    deptRequests.forEach(r => {
        // Request Created event
        events.push({
            eventId: makeEventId("REQ"),
            parcelId: targetParcelId,
            eventType: "REQUEST_CREATED",
            title: `Inter-Department Verification Requested: ${r.requestType}`,
            description: `Request ${r.requestId}: ${r.from.department} → ${r.to.department}. Required Work: ${r.requiredWork}. Priority: ${r.priority}`,
            department: r.from.department,
            actor: `${r.from.officerName} (${r.from.officerId})`,
            timestamp: r.createdAt || "2026-09-06T10:00:00Z",
            source: "Inter-Departmental Request Engine",
            referenceId: r.requestId,
            status: "PENDING",
            severity: r.priority === "URGENT" || r.priority === "HIGH" ? "HIGH" : "MEDIUM",
            icon: "📤",
            navigation: { type: "request", id: r.requestId }
        });

        // Request Completed event if finished
        if (r.status === "COMPLETED" && r.response) {
            events.push({
                eventId: makeEventId("REQ_CMP"),
                parcelId: targetParcelId,
                eventType: "REQUEST_COMPLETED",
                title: `Inter-Department Verification Completed: ${r.requestId}`,
                description: `Verification Result: ${r.response.result}. Completed by ${r.response.completedByName || r.response.completedBy}. Remarks: ${r.response.remarks}`,
                department: r.to.department,
                actor: r.response.completedByName || r.response.completedBy,
                timestamp: r.completedAt || r.updatedAt || new Date().toISOString(),
                source: "Inter-Departmental Request Engine",
                referenceId: r.requestId,
                status: "COMPLETED",
                severity: "LOW",
                icon: "✓",
                navigation: { type: "request", id: r.requestId }
            });
        }
    });

    // 11. LAND DATA CONFLICT EVENTS
    const conflicts = getConflictsByParcel(targetParcelId) || [];
    conflicts.forEach(c => {
        // Conflict Detected event
        events.push({
            eventId: makeEventId("CON"),
            parcelId: targetParcelId,
            eventType: "CONFLICT_DETECTED",
            title: `Land Data Conflict Detected: ${c.title || c.type}`,
            description: c.description || `Discrepancy detected between department datasets. ${c.affectedData || ''}`,
            department: c.sourceDepartment || c.assignedDepartment || "Land Governance System",
            actor: "Automated Consistency Detector",
            timestamp: c.detectedAt || c.createdAt || "2026-09-06T10:30:00Z",
            source: "Land Data Conflict Engine",
            referenceId: c.conflictId || c.id,
            status: c.status === "RESOLVED" ? "RESOLVED" : "CONFLICT",
            severity: (c.severity || "HIGH").toUpperCase(),
            icon: "⚠️",
            navigation: { type: "conflict", id: c.conflictId || c.id }
        });

        // Conflict Resolved event if resolved
        if (c.status === "RESOLVED" && c.resolvedAt) {
            events.push({
                eventId: makeEventId("CON_RES"),
                parcelId: targetParcelId,
                eventType: "CONFLICT_RESOLVED",
                title: `Land Data Conflict Resolved: ${c.conflictId || c.id}`,
                description: `Conflict resolved. Resolution remarks: ${c.resolutionRemark || 'Verified and synchronized across department records.'}`,
                department: c.assignedDepartment || "Land Records Department",
                actor: c.resolvedBy || "OFF-ROR-001",
                timestamp: c.resolvedAt,
                source: "Land Data Conflict Engine",
                referenceId: c.conflictId || c.id,
                status: "RESOLVED",
                severity: "LOW",
                icon: "✓",
                navigation: { type: "conflict", id: c.conflictId || c.id }
            });
        }
    });

    // 12. PARCEL AUDIT EVENTS
    const auditLogs = getAuditsByParcel(targetParcelId) || [];
    auditLogs.forEach(a => {
        if (!["PARCEL_CREATED", "CONFLICT_DETECTED", "REQUEST_CREATED"].includes(a.action)) {
            events.push({
                eventId: a.auditId,
                parcelId: targetParcelId,
                eventType: a.action,
                title: `Audit Action: ${a.action.replace(/_/g, " ")}`,
                description: `Action executed by ${a.actor}. Result: ${a.result}. Details: ${typeof a.details === 'object' ? JSON.stringify(a.details) : (a.details || '')}`,
                department: a.details?.department || a.department || "Governance System",
                actor: a.actor || "OFF-GOVT-001",
                timestamp: a.createdAt || new Date().toISOString(),
                source: "System Audit Trail",
                referenceId: a.auditId,
                status: a.result === "SUCCESS" ? "INFO" : (a.result === "DENIED" ? "REJECTED" : "PENDING"),
                severity: a.result === "DENIED" ? "HIGH" : "LOW",
                icon: "📋",
                navigation: { type: "audit", id: a.auditId }
            });
        }
    });

    // 13. GOVERNANCE STATUS CHANGE EVENTS
    const govStatus = rawProfile.governance?.overallStatus || "VERIFIED";
    events.push({
        eventId: makeEventId("GOV"),
        parcelId: targetParcelId,
        eventType: "VERIFICATION_COMPLETED",
        title: `Overall Governance Status: ${govStatus}`,
        description: `Land Governance assessment completed. Cadastral: ${rawProfile.governance?.departmentStatuses?.cadastral}, RoR: ${rawProfile.governance?.departmentStatuses?.ror}, Registration: ${rawProfile.governance?.departmentStatuses?.registration}`,
        department: "Digital Land Governance Portal",
        actor: "SYSTEM",
        timestamp: new Date().toISOString(),
        source: "Governance Integrity Evaluator",
        referenceId: targetParcelId,
        status: govStatus === "VERIFIED" ? "VERIFIED" : (govStatus === "CONFLICT DETECTED" ? "CONFLICT" : "PENDING"),
        severity: govStatus === "CONFLICT DETECTED" ? "HIGH" : "LOW",
        icon: "✓",
        navigation: { type: "overview", id: targetParcelId }
    });

    // FILTERING LOGIC
    let filteredEvents = events;

    // Department Filter
    if (options.department && options.department !== "ALL") {
        const deptFilter = options.department.toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
            (e.department || "").toLowerCase().includes(deptFilter) ||
            (e.source || "").toLowerCase().includes(deptFilter) ||
            (e.eventType || "").toLowerCase().includes(deptFilter)
        );
    }

    // Event Type Filter
    if (options.eventType && options.eventType !== "ALL") {
        filteredEvents = filteredEvents.filter(e => e.eventType === options.eventType);
    }

    // Status Filter
    if (options.status && options.status !== "ALL") {
        filteredEvents = filteredEvents.filter(e => e.status === options.status);
    }

    // Date Range Filter
    if (options.dateRange && options.dateRange !== "ALL_TIME") {
        const now = new Date();
        let cutoff = new Date(0);

        if (options.dateRange === "TODAY") {
            cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        } else if (options.dateRange === "LAST_7_DAYS") {
            cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (options.dateRange === "LAST_30_DAYS") {
            cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (options.dateRange === "LAST_6_MONTHS") {
            cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        } else if (options.dateRange === "LAST_YEAR") {
            cutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }

        filteredEvents = filteredEvents.filter(e => new Date(e.timestamp) >= cutoff);
    }

    // Text Search
    if (options.search && options.search.trim()) {
        const term = options.search.trim().toLowerCase();
        filteredEvents = filteredEvents.filter(e =>
            (e.eventId || "").toLowerCase().includes(term) ||
            (e.referenceId || "").toLowerCase().includes(term) ||
            (e.title || "").toLowerCase().includes(term) ||
            (e.description || "").toLowerCase().includes(term) ||
            (e.department || "").toLowerCase().includes(term) ||
            (e.actor || "").toLowerCase().includes(term)
        );
    }

    // Sorting (Default: Newest First)
    const sortOrder = options.sortOrder === "OLDEST_FIRST" ? "OLDEST_FIRST" : "NEWEST_FIRST";
    filteredEvents.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === "OLDEST_FIRST" ? timeA - timeB : timeB - timeA;
    });

    return {
        parcelId: targetParcelId,
        surveyNumber: parcel.surveyNumber || cadastral.surveyNumber || "SUR-101",
        totalEvents: filteredEvents.length,
        events: filteredEvents
    };
}

module.exports = {
    getParcelTimeline,
    getEventIcon
};
