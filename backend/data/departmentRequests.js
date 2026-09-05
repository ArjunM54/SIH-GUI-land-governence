/* =========================================================
   LANDGOV GIS
   INTER-DEPARTMENTAL PARCEL VERIFICATION REQUEST DATA STORE
   (PHASE 11F)
   ========================================================= */

const departmentRequestsStore = [
    {
        requestId: "REQ-00021",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        from: {
            officerId: "OFF-REG-001",
            officerName: "Priya Registrar",
            department: "Registration Department"
        },
        to: {
            department: "Cadastral & Survey Department",
            officerId: null
        },
        requestType: "VERIFY",
        requiredWork: "VERIFY_BOUNDARY",
        priority: "HIGH",
        reason: "Please verify cadastral boundary before completing registration.",
        expectedResponse: "Cadastral boundary clearance",
        status: "PENDING",
        createdAt: "2026-09-05T09:00:00.000Z",
        dueAt: "2026-09-07T09:00:00.000Z",
        acceptedAt: null,
        acceptedBy: null,
        startedAt: null,
        completedAt: null,
        completedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        escalatedAt: null,
        cancelledAt: null,
        response: null,
        timeline: [
            {
                timestamp: "2026-09-05T09:00:00.000Z",
                event: "Request created",
                actor: "Priya Registrar (OFF-REG-001)",
                notes: "Initial verification request submitted to Cadastral Department."
            }
        ]
    },
    {
        requestId: "REQ-00022",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        from: {
            officerId: "OFF-REG-001",
            officerName: "Priya Registrar",
            department: "Registration Department"
        },
        to: {
            department: "Land Records Department",
            officerId: null
        },
        requestType: "VERIFY",
        requiredWork: "VERIFY_CURRENT_OWNER",
        priority: "NORMAL",
        reason: "Verify current owner record in RoR ledger before deed approval.",
        expectedResponse: "Ownership confirmation",
        status: "IN_PROGRESS",
        createdAt: "2026-09-04T10:00:00.000Z",
        dueAt: "2026-09-07T10:00:00.000Z",
        acceptedAt: "2026-09-04T11:00:00.000Z",
        acceptedBy: "OFF-ROR-001",
        startedAt: "2026-09-04T11:30:00.000Z",
        completedAt: null,
        completedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        escalatedAt: null,
        cancelledAt: null,
        response: null,
        timeline: [
            {
                timestamp: "2026-09-04T10:00:00.000Z",
                event: "Request created",
                actor: "Priya Registrar (OFF-REG-001)",
                notes: "Ownership verification requested."
            },
            {
                timestamp: "2026-09-04T11:00:00.000Z",
                event: "Request accepted",
                actor: "Kumar LandRecords (OFF-ROR-001)",
                notes: "Assigned to RoR desk."
            },
            {
                timestamp: "2026-09-04T11:30:00.000Z",
                event: "Verification started",
                actor: "Kumar LandRecords (OFF-ROR-001)",
                notes: "Cross-referencing mutation records."
            }
        ]
    },
    {
        requestId: "REQ-00023",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        from: {
            officerId: "OFF-REG-001",
            officerName: "Priya Registrar",
            department: "Registration Department"
        },
        to: {
            department: "Property Tax & Municipal Department",
            officerId: null
        },
        requestType: "CLEARANCE",
        requiredWork: "PROPERTY_TAX_CLEARANCE",
        priority: "NORMAL",
        reason: "Property tax clearance required for deed registration.",
        expectedResponse: "Tax payment status and outstanding dues report",
        status: "PENDING",
        createdAt: "2026-09-05T08:30:00.000Z",
        dueAt: "2026-09-08T08:30:00.000Z",
        acceptedAt: null,
        acceptedBy: null,
        startedAt: null,
        completedAt: null,
        completedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        escalatedAt: null,
        cancelledAt: null,
        response: null,
        timeline: [
            {
                timestamp: "2026-09-05T08:30:00.000Z",
                event: "Request created",
                actor: "Priya Registrar (OFF-REG-001)",
                notes: "Tax clearance verification initiated."
            }
        ]
    }
];

let requestCounter = 23;

function normalizeDeptName(dept) {
    if (!dept) return "";
    const lower = String(dept).toLowerCase().trim();
    if (lower.includes("cadastral") || lower.includes("survey")) return "Cadastral & Survey Department";
    if (lower.includes("record") || lower.includes("ror")) return "Land Records Department";
    if (lower.includes("registration")) return "Registration Department";
    if (lower.includes("use") || lower.includes("planning") || lower.includes("zoning")) return "Land Use & Planning Department";
    if (lower.includes("tax") || lower.includes("municipal")) return "Property Tax & Municipal Department";
    if (lower.includes("admin") || lower.includes("governance")) return "Governance Administration";
    return dept;
}

function generateRequestId() {
    requestCounter += 1;
    return `REQ-${String(requestCounter).padStart(5, "0")}`;
}

function getAllRequests() {
    return departmentRequestsStore;
}

function getRequestById(requestId) {
    if (!requestId) return null;
    const targetId = String(requestId).trim().toUpperCase();
    return departmentRequestsStore.find(r => r.requestId.toUpperCase() === targetId) || null;
}

function getRequestsByParcel(parcelId) {
    if (!parcelId) return [];
    const targetParcel = String(parcelId).trim().toUpperCase();
    return departmentRequestsStore.filter(r => r.parcelId.toUpperCase() === targetParcel);
}

function checkDuplicateActiveRequest(parcelId, fromDept, toDept, requiredWork) {
    const normFrom = normalizeDeptName(fromDept);
    const normTo = normalizeDeptName(toDept);
    const targetParcel = String(parcelId).trim().toUpperCase();
    const targetWork = String(requiredWork || "").trim().toUpperCase();

    const activeStatuses = ["PENDING", "ACCEPTED", "IN_PROGRESS", "MORE_INFORMATION_REQUIRED", "ESCALATED"];

    return departmentRequestsStore.some(r =>
        r.parcelId.toUpperCase() === targetParcel &&
        normalizeDeptName(r.from.department) === normFrom &&
        normalizeDeptName(r.to.department) === normTo &&
        String(r.requiredWork || "").toUpperCase() === targetWork &&
        activeStatuses.includes(r.status)
    );
}

function createDepartmentRequest(data) {
    const requestId = generateRequestId();
    const now = new Date();
    
    // Calculate SLA due date based on priority
    let dueHours = 72; // NORMAL: 3 days
    if ((data.priority || "").toUpperCase() === "URGENT") dueHours = 24; // 1 day
    else if ((data.priority || "").toUpperCase() === "HIGH") dueHours = 48; // 2 days

    const dueAt = new Date(now.getTime() + dueHours * 60 * 60 * 1000).toISOString();

    const newRequest = {
        requestId,
        parcelId: String(data.parcelId).trim().toUpperCase(),
        surveyNumber: data.surveyNumber || "N/A",
        from: {
            officerId: data.fromOfficerId || "SYSTEM",
            officerName: data.fromOfficerName || "Officer",
            department: normalizeDeptName(data.fromDepartment)
        },
        to: {
            department: normalizeDeptName(data.toDepartment),
            officerId: data.toOfficerId || null
        },
        requestType: (data.requestType || "VERIFY").toUpperCase(),
        requiredWork: (data.requiredWork || "VERIFY_INFORMATION").toUpperCase(),
        priority: (data.priority || "NORMAL").toUpperCase(),
        reason: data.reason || "",
        expectedResponse: data.expectedResponse || "",
        status: "PENDING",
        createdAt: now.toISOString(),
        dueAt,
        acceptedAt: null,
        acceptedBy: null,
        startedAt: null,
        completedAt: null,
        completedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        escalatedAt: null,
        cancelledAt: null,
        response: null,
        timeline: [
            {
                timestamp: now.toISOString(),
                event: "Request created",
                actor: `${data.fromOfficerName || 'Officer'} (${data.fromOfficerId || 'OFF-001'})`,
                notes: data.reason ? `Reason: ${data.reason}` : "Department action request created."
            }
        ]
    };

    departmentRequestsStore.push(newRequest);
    return newRequest;
}

function updateRequest(requestId, updates = {}) {
    const request = getRequestById(requestId);
    if (!request) return null;

    Object.assign(request, updates);
    return request;
}

module.exports = {
    getAllRequests,
    getRequestById,
    getRequestsByParcel,
    checkDuplicateActiveRequest,
    createDepartmentRequest,
    updateRequest,
    normalizeDeptName
};
