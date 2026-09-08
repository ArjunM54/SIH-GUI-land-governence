/* =========================================================
   LANDGOV GIS
   APPLICATION & MULTI-OFFICER VERIFICATION SERVICE

   Manages Citizen Applications (Owner Change, Mutation,
   Property Registration, Land Use Request, Property Tax Services),
   tracks 5-Department officer approvals, updates ownership,
   and handles notifications & audit trails.
   ========================================================= */

const auditService = require("./auditService");
const rorData = require("../data/ror");
const parcelsData = require("../data/parcels");

const applications = [];


// In-memory notifications store
const notifications = [];

// In-memory application timeline store
const applicationTimeline = [];

// In-memory inter-department requests store
const departmentRequests = [];

/**
 * Generates unique Application Number (e.g., LAND-2026-000142)
 */

function generateAppId(type = "Owner Change") {
    const year = new Date().getFullYear();
    const seq = String(applications.length + 1).padStart(6, "0");
    return `LAND-${year}-${seq}`;
}

/**
 * Get applications belonging to a citizen user.
 */
function getApplicationsForCitizen(user) {
    if (!user) return [];
    if (user.role === "admin") return applications;

    // Filter by user's email or assigned parcels
    const userEmail = (user.email || "").toLowerCase();
    const assigned = Array.isArray(user.assignedParcels) ? user.assignedParcels.map(p => p.toUpperCase()) : [];

    return applications.filter(app => {
        const matchesEmail = app.citizenEmail.toLowerCase() === userEmail;
        const matchesParcel = assigned.includes((app.parcelId || "").toUpperCase());
        return matchesEmail || matchesParcel;
    });
}

/**
 * Get single application by ID
 */
function getApplicationById(appId, user) {
    const app = applications.find(a => a.applicationId.toUpperCase() === String(appId).trim().toUpperCase());
    if (!app) return null;

    if (user && user.role !== "admin") {
        const userEmail = (user.email || "").toLowerCase();
        const assigned = Array.isArray(user.assignedParcels) ? user.assignedParcels.map(p => p.toUpperCase()) : [];
        const isOwner = app.citizenEmail.toLowerCase() === userEmail;
        const isAssigned = assigned.includes((app.parcelId || "").toUpperCase());
        const isOfficer = user.role === "officer";

        if (!isOwner && !isAssigned && !isOfficer) {
            return null;
        }
    }
    return app;
}

const { getDocumentRequirementsForType } = require("../config/documentRequirements");
const { addDocumentRecord, getDocumentsByApplicationId } = require("./documentService");

/**
 * Submit a new Owner Change application
 */
function submitOwnerChangeApplication(user, data) {
    const { parcelId, currentOwner, newOwner, relationship, reason, uploadedDocumentsMap, supportingDocs, declaration } = data;

    const appId = generateAppId("Owner Change");
    const now = new Date().toISOString();

    const reqConfig = getDocumentRequirementsForType("OWNER_CHANGE");

    const newApp = {
        applicationId: appId,
        citizenEmail: user.email,
        parcelId: (parcelId || "LND-001").toUpperCase(),
        surveyNumber: data.surveyNumber || "145/2A",
        type: "Owner Change",
        serviceCategory: "Property Registration",
        currentOwner: currentOwner || "Existing Owner",
        newOwner: newOwner || "New Owner",
        relationship: relationship || "Property Transfer",
        reason: reason || "Ownership change application submitted by citizen",
        supportingDocs:
            Array.isArray(supportingDocs)
                ? supportingDocs
                : [],
        declaration: !!declaration,
        status: "UNDER_VERIFICATION",
        submittedDate: now,
        lastUpdated: now,
        requiredDocumentsChecklist: reqConfig.map(req => ({
            ...req,
            status: "UPLOADED",
            fileName: (uploadedDocumentsMap && uploadedDocumentsMap[req.documentType]) || `${req.documentType.toLowerCase()}.pdf`
        })),
        verifications: {
            cadastral: { department: "Cadastral & Survey Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            ror: { department: "Land Records Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            registration: { department: "Registration Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            landUse: { department: "Land Use & Planning Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            propertyTax: { department: "Property Tax & Municipal Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null }
        }
    };

    // Auto-create document metadata records mapped to responsible departments
    reqConfig.forEach(req => {
        const customFileName = (uploadedDocumentsMap && uploadedDocumentsMap[req.documentType]) || `${req.documentType.toLowerCase()}.pdf`;
        addDocumentRecord({
            applicationId: appId,
            parcelId: newApp.parcelId,
            documentType: req.documentType,
            title: req.title,
            originalFileName: customFileName,
            fileName: customFileName,
            required: req.required,
            responsibleDepartments: req.responsibleDepartments,
            verificationStatus: "PENDING",
            uploadedBy: user.email,
            uploadedAt: now,
            description: req.description
        });
    });

    applications.unshift(newApp);

    // Add initial timeline events
    addTimelineEvent(appId, user.email, "citizen", "Citizen Portal", "APPLICATION_SUBMITTED", "DRAFT", "SUBMITTED", `Application ${appId} submitted for parcel ${newApp.parcelId}.`);
    addTimelineEvent(appId, "System Engine", "system", "LandGov Core", "ROUTED_TO_DEPARTMENTS", "SUBMITTED", "UNDER_VERIFICATION", `Documents and tasks assigned to 5 officer departments.`);

    // Audit record
    auditService.logEvent({
        actor: user.email,
        target: appId,
        action: "APPLICATION_SUBMITTED",
        result: "SUCCESS",
        details: { parcelId: newApp.parcelId, type: newApp.type, newOwner: newApp.newOwner }
    });

    // Initial notification
    notifications.unshift({
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        citizenEmail: user.email,
        title: "📝 Owner Change Application Submitted",
        message: `Your Owner Change Application (${appId}) for Parcel ${newApp.parcelId} has been successfully submitted with required documents routed to responsible officer departments.`,
        applicationId: appId,
        read: false,
        timestamp: now
    });

    return newApp;
}

/**
 * Submit generic land service request
 */
function submitServiceApplication(user, data) {
    const { parcelId, type, serviceCategory, description, currentLandUse, requestedLandUse, reason } = data;

    const appId = generateAppId(type || "Mutation Request");
    const now = new Date().toISOString();

    const newApp = {
        applicationId: appId,
        citizenEmail: user.email,
        parcelId: (parcelId || "LND-001").toUpperCase(),
        surveyNumber: data.surveyNumber || "SUR-101",
        type: type || "Land Service Request",
        serviceCategory: serviceCategory || type || "Mutation Request",
        description: description || reason || "Land service request submitted.",
        currentLandUse: currentLandUse || "Residential",
        requestedLandUse: requestedLandUse || null,
        status: "UNDER_VERIFICATION",
        submittedDate: now,
        lastUpdated: now,
        verifications: {
            cadastral: { department: "Cadastral & Survey Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            ror: { department: "Land Records Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            registration: { department: "Registration Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            landUse: { department: "Land Use & Planning Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null },
            propertyTax: { department: "Property Tax & Municipal Department", status: "PENDING", officerId: null, officerName: null, date: null, remarks: null }
        }
    };

    applications.unshift(newApp);

    // Add initial timeline events
    addTimelineEvent(appId, user.email, "citizen", "Citizen Portal", "APPLICATION_SUBMITTED", "DRAFT", "SUBMITTED", `Service application ${appId} submitted for parcel ${newApp.parcelId}.`);
    addTimelineEvent(appId, "System Engine", "system", "LandGov Core", "ROUTED_TO_DEPARTMENTS", "SUBMITTED", "UNDER_VERIFICATION", `Documents and service request assigned for departmental review.`);

    auditService.logEvent({
        actor: user.email,
        target: appId,
        action: "APPLICATION_CREATED",
        result: "SUCCESS",
        details: { parcelId: newApp.parcelId, type: newApp.type }
    });

    notifications.unshift({
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        citizenEmail: user.email,
        title: "🛎️ Service Request Submitted",
        message: `Your request (${appId}) for ${newApp.type} on Parcel ${newApp.parcelId} has been received.`,
        applicationId: appId,
        read: false,
        timestamp: now
    });

    return newApp;
}

// In-memory parcel ownership history map
const ownershipHistoryStore = {
    "LND-001": [
        {
            parcelId: "LND-001",
            previousOwner: "Ramesh Sharma",
            newOwner: "Arun Kumar",
            applicationId: "OWN-2025-000088",
            transferDate: "2025-06-15",
            verificationStatus: "5/5 Approved",
            remarks: "Initial title transfer verified."
        }
    ],
    "LND-002": [
        {
            parcelId: "LND-002",
            previousOwner: "State Government",
            newOwner: "Demo Property Owner",
            applicationId: "OWN-2024-000042",
            transferDate: "2024-11-20",
            verificationStatus: "5/5 Approved",
            remarks: "Government allotment deed."
        }
    ],
    "LND-003": [
        {
            parcelId: "LND-003",
            previousOwner: "Kailash Agricultural Society",
            newOwner: "Demo Agricultural Owner",
            applicationId: "OWN-2025-000102",
            transferDate: "2025-01-10",
            verificationStatus: "5/5 Approved",
            remarks: "Agricultural land transfer."
        }
    ]
};

function getOwnershipHistory(parcelId) {
    if (!parcelId) return [];
    const pid = String(parcelId).trim().toUpperCase();
    return ownershipHistoryStore[pid] || [
        {
            parcelId: pid,
            previousOwner: "Initial Land Registrar",
            newOwner: "Hari Prem",
            applicationId: "LEGACY-REG-001",
            transferDate: "2024-01-01",
            verificationStatus: "5/5 Approved",
            remarks: "Original land title registration."
        }
    ];
}

/**
 * Officer Verification Handler for any of the 5 officer types.
 */
function updateVerificationStage(officerUser, appIdOrParcel, deptKey, decision, remarks, requestedDocumentName = "") {
    const targetKey = String(appIdOrParcel).trim().toUpperCase();
    let app = applications.find(a =>
        (a.applicationId || "").toUpperCase() === targetKey ||
        (a.parcelId || "").toUpperCase() === targetKey
    );

    if (!app) {
        return { success: false, message: `No matching active application found for ID/Parcel '${appIdOrParcel}'.` };
    }

    const now = new Date().toISOString();
    const validDeptKeys = ["cadastral", "ror", "registration", "landUse", "propertyTax"];

    if (!validDeptKeys.includes(deptKey)) {
        return { success: false, message: "Invalid verification department key." };
    }

    const statusVal = (decision || "APPROVED").toUpperCase();
    let stageStatus = "APPROVED";
    if (statusVal === "REJECTED") {
        stageStatus = "REJECTED";
    } else if (statusVal === "DOCUMENT_REQUIRED" || statusVal === "REQUEST_DOCUMENT") {
        stageStatus = "DOCUMENT_REQUIRED";
    }

    app.verifications[deptKey] = {
        department: app.verifications[deptKey].department,
        status: stageStatus,
        officerId: officerUser.officerId || officerUser.email,
        officerName: officerUser.name || "Government Officer",
        date: now,
        remarks: remarks || `${officerUser.name || 'Officer'} updated verification status.`,
        requestedDocument: stageStatus === "DOCUMENT_REQUIRED" ? (requestedDocumentName || remarks || "Additional Document") : null
    };
    app.lastUpdated = now;

    const previousStage =
        app.verifications[deptKey] || {};

    const oldStageStatus =
        previousStage.status || "PENDING";

    const departmentNames = {
        cadastral:
            "Cadastral & Survey Department",

        ror:
            "Land Records / RoR Department",

        registration:
            "Registration Department",

        landUse:
            "Land Use & Planning Department",

        propertyTax:
            "Property Tax & Municipal Department"
    };

    app.verifications[deptKey] = {

        department:
            previousStage.department ||
            departmentNames[deptKey],

        status:
            stageStatus,

        officerId:
            officerUser.officerId ||
            officerUser.email,

        officerName:
            officerUser.name ||
            "Government Officer",

        date:
            now,

        remarks:
            remarks ||
            `${officerUser.name || "Officer"} updated verification status.`,

        requestedDocument:
            stageStatus === "DOCUMENT_REQUIRED"
                ? (
                    requestedDocumentName ||
                    remarks ||
                    "Additional Document"
                )
                : null
    };

    app.lastUpdated = now;

    addTimelineEvent(
        app.applicationId,

        officerUser.name ||
        officerUser.officerId ||
        officerUser.email,

        "officer",

        departmentNames[deptKey] ||
        officerUser.department ||
        deptKey,

        stageStatus === "APPROVED"
            ? "OFFICER_APPROVED"
            : stageStatus === "REJECTED"
                ? "OFFICER_REJECTED"
                : "DOCUMENT_REQUIRED",

        oldStageStatus,

        stageStatus,

        remarks ||
        `${departmentNames[deptKey]} verification updated.`
    );

    // Handle DOCUMENT_REQUIRED
    if (stageStatus === "DOCUMENT_REQUIRED") {
        app.status = "DOCUMENT_REQUIRED";

        auditService.logEvent({
            actor: officerUser.officerId || officerUser.email,
            target: app.applicationId,
            action: "OFFICER_DOCUMENT_REQUESTED",
            result: "SUCCESS",
            details: { department: deptKey, remarks, requestedDocument: requestedDocumentName }
        });

        notifications.unshift({
            id: `NOTIF-${Date.now().toString().slice(-6)}`,
            citizenEmail: app.citizenEmail,
            title: "📄 Additional Document Required",
            message: `Department: ${officerUser.department || deptKey}. Application (${app.applicationId}) requires additional document: ${requestedDocumentName || remarks || 'Supporting Document'}. Please upload it via your Applications dashboard.`,
            applicationId: app.applicationId,
            read: false,
            timestamp: now
        });

        return { success: true, status: "DOCUMENT_REQUIRED", message: `Document request recorded for ${deptKey}. Citizen notified.` };
    }

    // Calculate total approved count out of 5
    const approvedCount = Object.values(app.verifications).filter(v => v.status === "APPROVED").length;
    const hasRejection = Object.values(app.verifications).some(v => v.status === "REJECTED");
    const hasDocReq = Object.values(app.verifications).some(v => v.status === "DOCUMENT_REQUIRED");

    if (hasRejection) {
        app.status = "REJECTED";

        auditService.logEvent({
            actor: officerUser.officerId || officerUser.email,
            target: app.applicationId,
            action: "OFFICER_REJECTION",
            result: "REJECTED",
            details: { department: deptKey, remarks }
        });

        notifications.unshift({
            id: `NOTIF-${Date.now().toString().slice(-6)}`,
            citizenEmail: app.citizenEmail,
            title: "❌ Application Rejected",
            message: `Your application (${app.applicationId}) has been rejected by ${officerUser.department || deptKey}. Reason: ${remarks || 'Verification criteria not met'}. Ownership remains unchanged.`,
            applicationId: app.applicationId,
            read: false,
            timestamp: now
        });

        return { success: true, status: "REJECTED", approvedCount, message: "Application rejected." };
    }

    if (approvedCount === 5) {
        app.status = "COMPLETED";

        // Execute Final Ownership Update & Record Sync
        if (app.type === "Owner Change" && app.newOwner) {
            // Update RoR record for parcel
            const rorRecord = rorData.find(r => (r.parcelId || "").toUpperCase() === app.parcelId.toUpperCase());
            if (rorRecord) {
                rorRecord.rightsHolder = app.newOwner;
                rorRecord.lastUpdated = now.split("T")[0];
                rorRecord.mutationStatus = "Updated";
                rorRecord.recordStatus = "Verified";
            }

            // Update parcel owner if exists
            const parcelObj = parcelsData.find(p => (p.id || "").toUpperCase() === app.parcelId.toUpperCase());
            if (parcelObj) {
                parcelObj.owner = app.newOwner;
            }

            // Record Ownership History Entry
            const pid = app.parcelId.toUpperCase();
            if (!ownershipHistoryStore[pid]) {
                ownershipHistoryStore[pid] = [];
            }
            ownershipHistoryStore[pid].unshift({
                parcelId: pid,
                previousOwner: app.currentOwner || "Previous Owner",
                newOwner: app.newOwner,
                applicationId: app.applicationId,
                transferDate: now.split("T")[0],
                verificationStatus: "5/5 Approved",
                remarks: `Owner change completed following 5/5 departmental verification. Reason: ${app.reason || 'Sale Agreement'}`
            });

            auditService.logEvent({
                actor: "GOVERNANCE_SYSTEM",
                target: app.parcelId,
                action: "OWNERSHIP_UPDATED",
                result: "SUCCESS",
                details: { previousOwner: app.currentOwner, newOwner: app.newOwner, applicationId: app.applicationId }
            });

            auditService.logEvent({
                actor: "GOVERNANCE_SYSTEM",
                target: app.parcelId,
                action: "MUTATION_COMPLETED",
                result: "SUCCESS",
                details: { applicationId: app.applicationId }
            });

            auditService.logEvent({
                actor: "GOVERNANCE_SYSTEM",
                target: app.parcelId,
                action: "REGISTRATION_UPDATED",
                result: "SUCCESS",
                details: { applicationId: app.applicationId }
            });

            notifications.unshift({
                id: `NOTIF-${Date.now().toString().slice(-6)}`,
                citizenEmail: app.citizenEmail,
                title: "✓ Owner Change Completed",
                message: `Application: ${app.applicationId}. Previous Owner: ${app.currentOwner}. New Owner: ${app.newOwner}. Property: ${app.parcelId}. Status: Completed. All 5 required departmental verifications have been completed successfully.`,
                applicationId: app.applicationId,
                read: false,
                timestamp: now
            });
        } else {
            auditService.logEvent({
                actor: "GOVERNANCE_SYSTEM",
                target: app.applicationId,
                action: "APPLICATION_APPROVED",
                result: "SUCCESS",
                details: { type: app.type }
            });

            notifications.unshift({
                id: `NOTIF-${Date.now().toString().slice(-6)}`,
                citizenEmail: app.citizenEmail,
                title: "✓ Application Approved & Completed",
                message: `Your request (${app.applicationId}) has received all 5 departmental approvals and is now marked as Completed.`,
                applicationId: app.applicationId,
                read: false,
                timestamp: now
            });
        }

        return { success: true, status: "COMPLETED", approvedCount: 5, message: "All 5 verifications completed. Status updated to COMPLETED." };
    }

    // Status is UNDER_VERIFICATION if no pending doc requirements or rejections
    app.status = hasDocReq ? "DOCUMENT_REQUIRED" : "UNDER_VERIFICATION";

    auditService.logEvent({
        actor: officerUser.officerId || officerUser.email,
        target: app.applicationId,
        action: "OFFICER_APPROVAL",
        result: "SUCCESS",
        details: { department: deptKey, approvedCount }
    });

    notifications.unshift({
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        citizenEmail: app.citizenEmail,
        title: "✓ Departmental Verification Approved",
        message: `${officerUser.department || deptKey} has approved your application ${app.applicationId}. ${approvedCount} of 5 departmental verifications are now completed.`,
        applicationId: app.applicationId,
        read: false,
        timestamp: now
    });

    return { success: true, status: app.status, approvedCount, message: `Officer verification recorded (${approvedCount}/5 approved).` };
}

/**
 * Citizen document resubmission in response to DOCUMENT_REQUIRED
 */
function resubmitApplicationDocument(user, appId, deptKey, docName) {
    const app = getApplicationById(appId, user);
    if (!app) {
        return { success: false, message: "Application not found or access denied." };
    }

    const now = new Date().toISOString();
    const targetDept = deptKey || Object.keys(app.verifications).find(k => app.verifications[k].status === "DOCUMENT_REQUIRED") || "registration";

    if (app.verifications[targetDept]) {
        app.verifications[targetDept].status = "DOCUMENT_SUBMITTED";
        app.verifications[targetDept].remarks = `Citizen uploaded requested document: ${docName || 'Updated Document'}`;
        app.verifications[targetDept].date = now;
    }

    if (!Array.isArray(app.supportingDocs)) app.supportingDocs = [];
    app.supportingDocs.push(docName || "Resubmitted_Document.pdf");
    app.lastUpdated = now;

    // Recalculate status
    const hasDocReq = Object.values(app.verifications).some(v => v.status === "DOCUMENT_REQUIRED");
    app.status = hasDocReq ? "DOCUMENT_REQUIRED" : "UNDER_VERIFICATION";

    auditService.logEvent({
        actor: user.email,
        target: app.applicationId,
        action: "DOCUMENT_RESUBMITTED",
        result: "SUCCESS",
        details: { department: targetDept, docName }
    });

    notifications.unshift({
        id: `NOTIF-${Date.now().toString().slice(-6)}`,
        citizenEmail: app.citizenEmail,
        title: "📤 Document Resubmitted",
        message: `Requested document (${docName || 'Supporting Document'}) for application ${app.applicationId} has been successfully submitted and forwarded to the officer for review.`,
        applicationId: app.applicationId,
        read: false,
        timestamp: now
    });

    return { success: true, message: "Document resubmitted successfully.", application: app };
}

/**
 * Get notifications for logged-in citizen
 */
function getNotificationsForUser(user) {
    if (!user) return [];
    const userEmail = (user.email || "").toLowerCase();
    return notifications.filter(n => n.citizenEmail.toLowerCase() === userEmail || user.role === "admin");
}

/**
 * Adds an event to the persistent Application Timeline
 */
function addTimelineEvent(appId, actor, role, department, action, oldStatus, newStatus, remarks = "") {
    const event = {
        id: `EVT-${Date.now().toString().slice(-8)}`,
        applicationId: appId,
        actor: actor || "System",
        role: role || "system",
        department: department || "System Engine",
        action: action,
        oldStatus: oldStatus || null,
        newStatus: newStatus || null,
        remarks: remarks || "",
        timestamp: new Date().toISOString()
    };
    applicationTimeline.unshift(event);
    return event;
}

/**
 * Retrieves the full timeline for a given application
 */
function getApplicationTimeline(appId) {
    if (!appId) return [];
    const appKey = String(appId).trim().toUpperCase();
    return applicationTimeline.filter(t => (t.applicationId || "").toUpperCase() === appKey);
}

/**
 * Creates an Inter-Department Request between officer departments
 */
function createDepartmentRequest(fromUser, appId, toDepartment, requestType, message, priority = "HIGH") {
    const app = applications.find(a => a.applicationId.toUpperCase() === String(appId).trim().toUpperCase());
    if (!app) {
        return { success: false, message: "Matching application not found." };
    }

    const now = new Date().toISOString();
    const reqId = `REQ-${Date.now().toString().slice(-6)}`;
    const reqRecord = {
        id: reqId,
        requestNumber: reqId,
        applicationId: app.applicationId,
        parcelId: app.parcelId,
        fromDepartment: fromUser.department || fromUser.officerType || "Land Records Department",
        toDepartment: toDepartment,
        fromOfficer: fromUser.name || fromUser.officerId || fromUser.email,
        toOfficer: null,
        requestType: requestType || "Document Verification",
        message: message || "Please review and verify submitted records.",
        priority: (priority || "HIGH").toUpperCase(),
        status: "PENDING",
        createdAt: now,
        respondedAt: null,
        responseRemarks: null
    };

    departmentRequests.unshift(reqRecord);

    const oldStatus = app.status;
    app.status = "INTER_DEPARTMENT_REVIEW";
    app.lastUpdated = now;

    addTimelineEvent(
        app.applicationId,
        fromUser.name || fromUser.email,
        "officer",
        fromUser.department || "Officer Department",
        "INTER_DEPARTMENT_REQUEST_SENT",
        oldStatus,
        "INTER_DEPARTMENT_REVIEW",
        `Requested verification from ${toDepartment}. Message: ${message}`
    );

    auditService.logEvent({
        actor: fromUser.email || fromUser.officerId,
        target: app.applicationId,
        action: "INTER_DEPARTMENT_REQUEST_CREATED",
        result: "SUCCESS",
        details: { toDepartment, requestType, reqId }
    });

    return { success: true, message: `Inter-department request (${reqId}) sent to ${toDepartment}.`, request: reqRecord };
}

/**
 * Gets incoming/outgoing department requests for an officer user
 */
function getDepartmentRequestsForUser(user) {
    if (!user) return { incoming: [], outgoing: [] };
    const dept = (user.department || user.officerType || "").toLowerCase();
    const officerName = (user.name || user.email || "").toLowerCase();

    const incoming = departmentRequests.filter(r =>
        r.toDepartment.toLowerCase().includes(dept) ||
        dept.includes(r.toDepartment.toLowerCase()) ||
        user.role === "admin"
    );
    const outgoing = departmentRequests.filter(r =>
        (r.fromOfficer || "").toLowerCase() === officerName ||
        user.role === "admin"
    );

    return { incoming, outgoing, total: departmentRequests.length };
}

/**
 * Responds to / resolves an Inter-Department Request
 */
function respondDepartmentRequest(user, requestId, decision = "APPROVED", remarks = "") {
    const reqRecord = departmentRequests.find(r => r.id === requestId || r.requestNumber === requestId);
    if (!reqRecord) {
        return { success: false, message: "Department request record not found." };
    }

    const now = new Date().toISOString();
    reqRecord.status = (decision || "APPROVED").toUpperCase() === "REJECTED" ? "REJECTED" : "COMPLETED";
    reqRecord.toOfficer = user.name || user.email;
    reqRecord.respondedAt = now;
    reqRecord.responseRemarks = remarks || "Inter-department review completed.";

    const app = applications.find(a => a.applicationId.toUpperCase() === reqRecord.applicationId.toUpperCase());
    if (app) {
        app.lastUpdated = now;
        addTimelineEvent(
            app.applicationId,
            user.name || user.email,
            "officer",
            user.department || reqRecord.toDepartment,
            "INTER_DEPARTMENT_RESPONSE_SUBMITTED",
            app.status,
            app.status,
            `Responded to ${reqRecord.fromDepartment}: ${remarks || decision}`
        );
    }

    return { success: true, message: "Department request response recorded.", request: reqRecord };
}

/**
 * Get notifications for logged-in citizen
 */
function getNotificationsForUser(user) {
    if (!user) return [];
    const userEmail = (user.email || "").toLowerCase();
    return notifications.filter(n => n.citizenEmail.toLowerCase() === userEmail || user.role === "admin");
}

/**
 * Mark notification as read
 */
function markNotificationRead(user, notifId) {
    const notif = notifications.find(n => n.id === notifId);
    if (notif && (notif.citizenEmail.toLowerCase() === user.email.toLowerCase() || user.role === "admin")) {
        notif.read = true;
        return true;
    }
    return false;
}

module.exports = {
    applications,
    notifications,
    applicationTimeline,
    departmentRequests,
    getApplicationsForCitizen,
    getApplicationById,
    submitOwnerChangeApplication,
    submitServiceApplication,
    updateVerificationStage,
    resubmitApplicationDocument,
    getOwnershipHistory,
    getNotificationsForUser,
    markNotificationRead,
    addTimelineEvent,
    getApplicationTimeline,
    createDepartmentRequest,
    getDepartmentRequestsForUser,
    respondDepartmentRequest
};

