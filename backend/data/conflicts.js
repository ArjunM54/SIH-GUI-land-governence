/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   LAND CONFLICT DATA STORE (PHASE 12K)
   ========================================================= */

const conflictsStore = [
    {
        id: "CON-001",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        category: "OWNERSHIP",
        type: "OWNER MISMATCH",
        severity: "HIGH",
        status: "OPEN",
        title: "Record of Rights vs Registration Owner Mismatch",
        description: "RoR ledger record indicates Owner A (Rajesh Kumar), while latest registered deed indicates Owner B (Sunita Sharma).",
        detectedAt: "2026-09-04T08:30:00.000Z",
        detectedBy: "AUTOMATED_CONSISTENCY_CHECK",
        affectedDepartments: ["Land Records Department", "Registration Department", "Property Tax & Municipal Department"],
        sources: [
            { department: "RoR Department", field: "Current Owner", value: "Rajesh Kumar", status: "VERIFIED" },
            { department: "Registration Department", field: "Latest Transferee", value: "Sunita Sharma", status: "REGISTERED" },
            { department: "Property Tax Department", field: "Assessed Tax Owner", value: "Rajesh Kumar", status: "CLEARED" }
        ],
        evidence: [
            { source: "RoR Record", refId: "RoR-LND-001", type: "RoR", tab: "ownership" },
            { source: "Deed REG-2026-884", refId: "REG-2026-884", type: "Registration", tab: "registration" }
        ],
        recommendation: "Request RoR verification to confirm mutation entry against registered deed.",
        assignedOfficer: null,
        assignedDepartment: "Land Records Department",
        relatedRequestId: null,
        resolutionRemark: null,
        resolvedAt: null,
        resolvedBy: null,
        dismissedAt: null,
        dismissedBy: null,
        reopenedAt: null,
        timeline: [
            {
                timestamp: "2026-09-04T08:30:00.000Z",
                event: "Conflict Detected",
                actor: "System Audit Engine",
                notes: "Automated check detected owner discrepancy between RoR and Registration deed."
            }
        ]
    },
    {
        id: "CON-002",
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        category: "LAND_USE",
        type: "BUILDING / LAND USE MISMATCH",
        severity: "MEDIUM",
        status: "OPEN",
        title: "Commercial Building in Residential Zone",
        description: "Authoritative Master Plan zoning designates land use as RESIDENTIAL, but building permission/structure is recorded as COMMERCIAL.",
        detectedAt: "2026-09-05T10:15:00.000Z",
        detectedBy: "AUTOMATED_CONSISTENCY_CHECK",
        affectedDepartments: ["Land Use & Planning Department", "Property Tax & Municipal Department"],
        sources: [
            { department: "Land Use Department", field: "Zoning Classification", value: "RESIDENTIAL", status: "COMPATIBLE" },
            { department: "Building Municipal Dept", field: "Building Permission Use", value: "COMMERCIAL", status: "UNDER REVIEW" }
        ],
        evidence: [
            { source: "Master Plan Record", refId: "LU-LND-002", type: "LandUse", tab: "landUse" },
            { source: "Building Permit Application", refId: "BP-2026-042", type: "BuildingPermission", tab: "building" }
        ],
        recommendation: "Request Municipal Building verification to inspect zoning variance compliance.",
        assignedOfficer: null,
        assignedDepartment: "Property Tax & Municipal Department",
        relatedRequestId: null,
        resolutionRemark: null,
        resolvedAt: null,
        resolvedBy: null,
        dismissedAt: null,
        dismissedBy: null,
        reopenedAt: null,
        timeline: [
            {
                timestamp: "2026-09-05T10:15:00.000Z",
                event: "Conflict Detected",
                actor: "System Audit Engine",
                notes: "Building use commercial does not match residential zoning."
            }
        ]
    },
    {
        id: "CON-003",
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        category: "CADASTRAL",
        type: "AREA MISMATCH",
        severity: "MEDIUM",
        status: "OPEN",
        title: "Cadastral Survey vs Property Tax Area Mismatch",
        description: "Cadastral GIS parcel survey records 1.20 acres, whereas Property Tax ledger reflects 1.18 acres (difference: 0.02 acres).",
        detectedAt: "2026-09-05T11:45:00.000Z",
        detectedBy: "AUTOMATED_CONSISTENCY_CHECK",
        affectedDepartments: ["Cadastral & Survey Department", "Property Tax & Municipal Department"],
        sources: [
            { department: "Cadastral Department", field: "GIS Parcel Area", value: "1.20 acres", status: "VERIFIED" },
            { department: "Property Tax Department", field: "Recorded Taxable Area", value: "1.18 acres", status: "REVIEW REQUIRED" }
        ],
        evidence: [
            { source: "Cadastral Map GIS", refId: "CAD-LND-003", type: "Cadastral", tab: "gis" },
            { source: "Tax Assessment Demand", refId: "TAX-LND-003", type: "PropertyTax", tab: "tax" }
        ],
        recommendation: "Request Cadastral resurvey confirmation or update municipal tax assessment ledger.",
        assignedOfficer: null,
        assignedDepartment: "Cadastral & Survey Department",
        relatedRequestId: null,
        resolutionRemark: null,
        resolvedAt: null,
        resolvedBy: null,
        dismissedAt: null,
        dismissedBy: null,
        reopenedAt: null,
        timeline: [
            {
                timestamp: "2026-09-05T11:45:00.000Z",
                event: "Conflict Detected",
                actor: "System Audit Engine",
                notes: "Area discrepancy 0.02 acres exceeds 0.01 acre standard tolerance."
            }
        ]
    }
];

let conflictCounter = 3;

function generateConflictId() {
    conflictCounter += 1;
    return `CON-${String(conflictCounter).padStart(3, "0")}`;
}

function getAllConflicts() {
    return conflictsStore;
}

function getConflictById(conflictId) {
    if (!conflictId) return null;
    const target = String(conflictId).trim().toUpperCase();
    return conflictsStore.find(c => c.id.toUpperCase() === target) || null;
}

function getConflictsByParcel(parcelId) {
    if (!parcelId) return [];
    const target = String(parcelId).trim().toUpperCase();
    return conflictsStore.filter(c => c.parcelId.toUpperCase() === target);
}

function createConflict(data) {
    const id = generateConflictId();
    const now = new Date().toISOString();

    const newConflict = {
        id,
        parcelId: String(data.parcelId).trim().toUpperCase(),
        surveyNumber: data.surveyNumber || "N/A",
        category: data.category || "OTHER",
        type: data.type || "DATA MISMATCH",
        severity: (data.severity || "MEDIUM").toUpperCase(),
        status: data.status || "OPEN",
        title: data.title || "Governance Data Conflict",
        description: data.description || "",
        detectedAt: now,
        detectedBy: data.detectedBy || "CONSISTENCY_CHECK",
        affectedDepartments: data.affectedDepartments || ["Governance Administration"],
        sources: data.sources || [],
        evidence: data.evidence || [],
        recommendation: data.recommendation || "",
        assignedOfficer: data.assignedOfficer || null,
        assignedDepartment: data.assignedDepartment || null,
        relatedRequestId: data.relatedRequestId || null,
        resolutionRemark: null,
        resolvedAt: null,
        resolvedBy: null,
        dismissedAt: null,
        dismissedBy: null,
        reopenedAt: null,
        timeline: [
            {
                timestamp: now,
                event: "Conflict Detected",
                actor: data.detectedBy || "System Audit Engine",
                notes: data.description || "Conflict logged."
            }
        ]
    };

    conflictsStore.push(newConflict);
    return newConflict;
}

function updateConflict(conflictId, updates = {}) {
    const conflict = getConflictById(conflictId);
    if (!conflict) return null;

    Object.assign(conflict, updates);
    return conflict;
}

module.exports = {
    getAllConflicts,
    getConflictById,
    getConflictsByParcel,
    createConflict,
    updateConflict
};
