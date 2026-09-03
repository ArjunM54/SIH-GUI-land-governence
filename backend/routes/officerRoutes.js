const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole, requirePermission } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const { requireParcelAccess } = require("../middleware/parcelAccessMiddleware");
const cadastralData = require("../data/cadastral");
const rorData = require("../data/ror");
const registrationData = require("../data/registration");
const landUseData = require("../data/landuse");
const restrictionsData = require("../data/restrictions");
const buildingPermissionData = require("../data/BuildingPermission");
const propertyTaxData = require("../data/PropertyTax");
const auditService = require("../services/auditService");
const documentService = require("../services/documentService");

// Enforce authentication for all officer department routes
router.use(requireAuth);

// --- 1. CADASTRAL & SURVEY OFFICER ---

// Get Cadastral Department Overview & Work Queue (filtered by officer authorization)
router.get("/cadastral/overview", requirePermission("cadastral.view"), (req, res) => {
    const authorizedParcels = cadastralData.filter(item => canAccessParcel(req.user, item.parcelId));

    const pendingBoundaryVerification = authorizedParcels.filter(
        p => (p.boundaryStatus || "").toLowerCase().includes("pending")
    ).length;

    const verifiedBoundaries = authorizedParcels.filter(
        p => (p.boundaryStatus || "").toLowerCase() === "verified"
    ).length;

    const boundaryConflicts = authorizedParcels.reduce(
        (sum, p) => sum + (Array.isArray(p.conflicts) ? p.conflicts.length : 0), 0
    );

    const pendingSurveyRequests = authorizedParcels.reduce(
        (sum, p) => sum + (Array.isArray(p.requests) ? p.requests.filter(r => r.status === "PENDING").length : 0), 0
    );

    const workQueue = authorizedParcels.map(p => ({
        parcelId: p.parcelId,
        surveyNo: p.surveyNumber,
        village: p.village,
        area: p.area,
        task: p.boundaryStatus === "Verified" ? "Survey Audit" : "Boundary Verification",
        priority: p.conflicts && p.conflicts.length > 0 ? "HIGH" : (p.boundaryStatus === "Verified" ? "MEDIUM" : "HIGH"),
        status: p.boundaryStatus || "Pending",
        owner: p.owner,
        district: p.district,
        landType: p.landType,
        surveyDate: p.surveyDate
    }));

    // Collect all cases and requests from authorized parcels
    const allCases = authorizedParcels.flatMap(p => p.cases || []);
    const allRequests = authorizedParcels.flatMap(p => p.requests || []);
    const allConflicts = authorizedParcels.flatMap(p => p.conflicts || []);

    res.json({
        success: true,
        department: "Cadastral & Survey Department",
        officer: {
            uid: req.user.uid,
            officerId: req.user.officerId || "OFF-CAD-001",
            name: req.user.name,
            email: req.user.email,
            department: req.user.department || "Cadastral & Survey Department"
        },
        stats: {
            assignedParcels: authorizedParcels.length,
            pendingBoundaryVerification,
            verifiedBoundaries,
            boundaryConflicts,
            pendingSurveyRequests
        },
        workQueue,
        assignedParcels: authorizedParcels,
        cases: allCases,
        requests: allRequests,
        conflicts: allConflicts
    });
});

// GET list of authorized cadastral parcels
router.get("/cadastral/parcels", requirePermission("cadastral.view"), (req, res) => {
    const authorized = cadastralData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

// GET single parcel cadastral details (enforcing parcel authorization)
router.get("/cadastral/parcels/:parcelId", requirePermission("cadastral.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const record = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId);

    if (!record) {
        return res.status(404).json({
            success: false,
            message: `Cadastral record for parcel ${parcelId} not found.`
        });
    }

    // Include associated documents & audits
    const documents = documentService.getDocumentsByParcelId(parcelId);
    const auditTrail = auditService.getAuditsByParcel(parcelId);

    res.json({
        success: true,
        data: {
            ...record,
            documents,
            auditTrail
        }
    });
});

// POST Verify Boundary
router.post("/cadastral/parcels/:parcelId/verify-boundary", requirePermission("cadastral.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { verificationResult, remarks } = req.body;

    const record = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!record) {
        return res.status(404).json({ success: false, message: "Parcel record not found." });
    }

    const timestamp = new Date().toISOString();
    const resultStatus = verificationResult || "Verified";

    // Update backend state
    record.boundaryStatus = resultStatus;
    record.boundaryVerifiedBy = req.user.officerId || req.user.name || req.user.email;
    record.boundaryVerifiedAt = timestamp;
    record.boundaryRemarks = remarks || "Boundary verification completed by officer.";

    // Append to survey history
    if (!record.surveyHistory) record.surveyHistory = [];
    record.surveyHistory.unshift({
        date: timestamp.split("T")[0],
        action: `Boundary Verification (${resultStatus})`,
        officer: req.user.officerId || req.user.name,
        status: resultStatus,
        notes: remarks || "Boundary verification action executed."
    });

    // Create audit event
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "CADASTRAL_BOUNDARY_VERIFIED",
        result: "SUCCESS",
        details: {
            verificationResult: resultStatus,
            remarks: remarks || "",
            verifiedBy: req.user.officerId || req.user.email,
            timestamp
        }
    });

    res.json({
        success: true,
        message: `Boundary verification for ${parcelId} updated to '${resultStatus}' successfully.`,
        data: record
    });
});

// PUT Update Survey Information
router.put("/cadastral/parcels/:parcelId/survey", requirePermission("cadastral.update"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const record = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!record) {
        return res.status(404).json({ success: false, message: "Parcel record not found." });
    }

    const {
        surveyNumber, surveyDate, area, surveyType, surveyReference,
        northBoundary, southBoundary, eastBoundary, westBoundary, surveyRemarks
    } = req.body;

    if (surveyNumber) record.surveyNumber = surveyNumber;
    if (surveyDate) record.surveyDate = surveyDate;
    if (area) record.area = area;
    if (surveyReference) record.surveyReference = surveyReference;
    if (northBoundary) record.northBoundary = northBoundary;
    if (southBoundary) record.southBoundary = southBoundary;
    if (eastBoundary) record.eastBoundary = eastBoundary;
    if (westBoundary) record.westBoundary = westBoundary;

    const timestamp = new Date().toISOString();
    if (!record.surveyHistory) record.surveyHistory = [];
    record.surveyHistory.unshift({
        date: surveyDate || timestamp.split("T")[0],
        action: `Survey Record Updated (${surveyType || 'Regular Survey'})`,
        officer: req.user.officerId || req.user.name,
        status: record.boundaryStatus || "Verified",
        notes: surveyRemarks || `Survey updated. Ref: ${surveyReference || 'N/A'}`
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "SURVEY_UPDATED",
        result: "SUCCESS",
        details: { surveyNumber, surveyDate, area, surveyReference, surveyRemarks }
    });

    res.json({
        success: true,
        message: `Survey details for ${parcelId} updated successfully.`,
        data: record
    });
});

// POST Report Boundary Conflict
router.post("/cadastral/parcels/:parcelId/conflicts", requirePermission("cadastral.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const record = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!record) {
        return res.status(404).json({ success: false, message: "Parcel record not found." });
    }

    const { type, severity, description } = req.body;
    const conflictId = `CONF-${Date.now()}`;
    const newConflict = {
        conflictId,
        parcelId,
        type: type || "Boundary Overlap",
        severity: severity || "Medium",
        description: description || "Boundary conflict reported by survey officer.",
        reportedBy: req.user.officerId || req.user.name || req.user.email,
        reportedAt: new Date().toISOString(),
        status: "OPEN"
    };

    if (!record.conflicts) record.conflicts = [];
    record.conflicts.unshift(newConflict);

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "BOUNDARY_CONFLICT_REPORTED",
        result: "SUCCESS",
        details: newConflict
    });

    res.json({
        success: true,
        message: `Boundary conflict ${conflictId} reported successfully for ${parcelId}.`,
        conflict: newConflict,
        data: record
    });
});

// POST Add Inspection Remarks
router.post("/cadastral/parcels/:parcelId/inspections", requirePermission("cadastral.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const record = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!record) {
        return res.status(404).json({ success: false, message: "Parcel record not found." });
    }

    const { inspectionDate, remarks } = req.body;
    const inspId = `INSP-${String((record.inspectionRemarks || []).length + 1).padStart(3, "0")}`;
    const newInspection = {
        id: inspId,
        date: inspectionDate || new Date().toISOString().split("T")[0],
        officer: req.user.name || "Survey Officer",
        officerId: req.user.officerId || req.user.email,
        remarks: remarks || "Field inspection completed."
    };

    if (!record.inspectionRemarks) record.inspectionRemarks = [];
    record.inspectionRemarks.unshift(newInspection);

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "INSPECTION_REMARK_ADDED",
        result: "SUCCESS",
        details: newInspection
    });

    res.json({
        success: true,
        message: "Inspection remark added successfully.",
        inspection: newInspection,
        data: record
    });
});

// POST Add Survey Document
router.post("/cadastral/parcels/:parcelId/documents", requirePermission("cadastral.update"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { title, documentType, documentNumber, description } = req.body;

    const newDoc = documentService.addDocumentRecord({
        parcelId,
        title: title || "Survey Record Map",
        documentType: documentType || "SURVEY_MAP",
        documentNumber: documentNumber || `SUR-DOC-${Date.now()}`,
        issuingDepartment: "Cadastral & Survey Department",
        description: description || "Associated survey documentation",
        status: "AVAILABLE"
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "SURVEY_DOCUMENT_ADDED",
        result: "SUCCESS",
        details: { documentId: newDoc.documentId, title: newDoc.title }
    });

    res.json({
        success: true,
        message: `Survey document ${newDoc.documentId} added and associated with parcel ${parcelId}.`,
        document: newDoc
    });
});

// POST Respond to Department Request
router.post("/cadastral/requests/:requestId/respond", requirePermission("cadastral.verify"), (req, res) => {
    const { requestId } = req.params;
    const { responseStatus, remarks } = req.body;

    let targetRequest = null;
    let targetParcel = null;

    cadastralData.forEach(p => {
        if (p.requests) {
            const reqItem = p.requests.find(r => r.requestId === requestId);
            if (reqItem) {
                targetRequest = reqItem;
                targetParcel = p;
            }
        }
    });

    if (!targetRequest) {
        return res.status(404).json({ success: false, message: "Department request not found." });
    }

    if (!canAccessParcel(req.user, targetParcel.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to respond to request for this parcel." });
    }

    targetRequest.status = responseStatus || "RESOLVED";
    targetRequest.responseRemarks = remarks;
    targetRequest.respondedBy = req.user.officerId || req.user.name;
    targetRequest.respondedAt = new Date().toISOString();

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: requestId,
        action: "DEPARTMENT_REQUEST_RESPONDED",
        result: "SUCCESS",
        details: { parcelId: targetParcel.parcelId, responseStatus, remarks }
    });

    res.json({
        success: true,
        message: `Request ${requestId} responded successfully.`,
        request: targetRequest
    });
});

// --- 2. LAND RECORDS / RoR OFFICER ---

// GET Land Records / RoR Department Overview & Work Queue (filtered by officer authorization)
router.get("/ror/overview", requirePermission("ror.view"), (req, res) => {
    const authorizedParcels = rorData.filter(item => canAccessParcel(req.user, item.parcelId));

    const pendingOwnershipVerification = authorizedParcels.filter(
        r => (r.rorStatus || "").toLowerCase().includes("pending") || (r.rorStatus || "").toLowerCase() === "under review"
    ).length;

    const allMutations = authorizedParcels.flatMap(r => r.mutations || []);
    const pendingMutations = allMutations.filter(m => m.status === "PENDING").length;
    const approvedMutations = allMutations.filter(m => m.status === "APPROVED").length;
    const rejectedMutations = allMutations.filter(m => m.status === "REJECTED").length;

    const allDisputes = authorizedParcels.flatMap(r => r.disputes || []);
    const ownershipDisputes = allDisputes.filter(d => d.status === "OPEN").length;

    const workQueue = [];

    // Ownership Verification tasks
    authorizedParcels.forEach(r => {
        if (r.rorStatus !== "VERIFIED") {
            workQueue.push({
                parcelId: r.parcelId,
                surveyNo: r.surveyNumber,
                owner: r.ownerName || r.rightsHolder,
                task: "Ownership Verification",
                priority: r.disputes && r.disputes.length > 0 ? "HIGH" : "MEDIUM",
                status: r.rorStatus || "Pending",
                recordNumber: r.recordNumber,
                actionType: "VERIFY_OWNERSHIP"
            });
        }
    });

    // Mutation tasks
    allMutations.forEach(m => {
        if (m.status === "PENDING") {
            workQueue.push({
                parcelId: m.parcelId,
                surveyNo: m.surveyNumber || "SUR-101",
                owner: m.currentOwner,
                proposedOwner: m.proposedOwner,
                task: `Mutation Request (${m.type})`,
                priority: m.priority || "HIGH",
                status: m.status,
                mutationId: m.mutationId,
                actionType: "PROCESS_MUTATION"
            });
        }
    });

    res.json({
        success: true,
        department: "Land Records / Record of Rights Department",
        officer: {
            uid: req.user.uid,
            officerId: req.user.officerId || "OFF-ROR-001",
            name: req.user.name,
            email: req.user.email,
            department: req.user.department || "Land Records Department"
        },
        stats: {
            assignedParcels: authorizedParcels.length,
            pendingOwnershipVerification,
            pendingMutations,
            ownershipDisputes,
            approvedMutations,
            rejectedMutations
        },
        workQueue,
        assignedParcels: authorizedParcels,
        mutations: allMutations,
        disputes: allDisputes
    });
});

// GET list of authorized RoR parcels
router.get("/ror/parcels", requirePermission("ror.view"), (req, res) => {
    const authorized = rorData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

// GET single parcel RoR details (enforcing parcel authorization & Cadastral cross-reference)
router.get("/ror/parcels/:parcelId", requirePermission("ror.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const rorRecord = rorData.find(item => item.parcelId.toUpperCase() === parcelId);

    if (!rorRecord) {
        return res.status(404).json({
            success: false,
            message: `Record of Rights for parcel ${parcelId} not found.`
        });
    }

    // Cross-reference Cadastral verification status directly from Cadastral system (No data duplication)
    const cadastralRecord = cadastralData.find(item => item.parcelId.toUpperCase() === parcelId) || {
        boundaryStatus: "Unknown",
        surveyStatus: "Unknown",
        surveyDate: "N/A",
        surveyOfficer: "N/A"
    };

    // Associated documents & audit trail
    const documents = documentService.getDocumentsByParcelId(parcelId);
    const auditTrail = auditService.getAuditsByParcel(parcelId);

    // Cross-department status summary
    const interdepartmentalStatus = {
        cadastral: cadastralRecord.boundaryStatus === "Verified" ? "VERIFIED" : (cadastralRecord.boundaryStatus || "PENDING"),
        ror: rorRecord.rorStatus || "PENDING",
        registration: "PENDING",
        landUse: "PENDING",
        propertyTax: "PENDING"
    };

    res.json({
        success: true,
        data: {
            ...rorRecord,
            cadastralVerification: {
                boundaryStatus: cadastralRecord.boundaryStatus,
                surveyStatus: cadastralRecord.surveyStatus,
                surveyDate: cadastralRecord.surveyDate,
                surveyOfficer: cadastralRecord.surveyOfficer,
                surveyNumber: cadastralRecord.surveyNumber
            },
            interdepartmentalStatus,
            documents,
            auditTrail
        }
    });
});

// POST Verify Ownership
router.post("/ror/parcels/:parcelId/verify-ownership", requirePermission("ownership.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { verificationResult, remarks } = req.body;

    const rorRecord = rorData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!rorRecord) {
        return res.status(404).json({ success: false, message: "RoR record not found." });
    }

    const timestamp = new Date().toISOString();
    const resultStatus = verificationResult || "VERIFIED";

    rorRecord.rorStatus = resultStatus;
    rorRecord.verifiedBy = req.user.officerId || req.user.name;
    rorRecord.verifiedAt = timestamp;
    rorRecord.ownershipRemarks = remarks || "Ownership verification executed by RoR officer.";

    // Log audit event
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "OWNERSHIP_VERIFIED",
        result: "SUCCESS",
        details: { verificationResult: resultStatus, remarks: remarks || "", timestamp }
    });

    res.json({
        success: true,
        message: `Ownership verification for ${parcelId} updated to '${resultStatus}' successfully.`,
        data: rorRecord
    });
});

// POST Approve Mutation (Enforces prerequisite checks!)
router.post("/ror/mutations/:mutationId/approve", requirePermission("mutation.approve"), (req, res) => {
    const { mutationId } = req.params;
    const { remarks } = req.body;

    let targetMutation = null;
    let targetRoR = null;

    rorData.forEach(r => {
        if (r.mutations) {
            const mut = r.mutations.find(m => m.mutationId === mutationId);
            if (mut) {
                targetMutation = mut;
                targetRoR = r;
            }
        }
    });

    if (!targetMutation || !targetRoR) {
        return res.status(404).json({ success: false, message: "Mutation request not found." });
    }

    if (!canAccessParcel(req.user, targetRoR.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to process mutation for this parcel." });
    }

    // Check Cadastral verification status from Cadastral Data!
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === targetRoR.parcelId.toUpperCase());
    const isCadastralVerified = cadastralRecord && (cadastralRecord.boundaryStatus === "Verified" || cadastralRecord.boundaryStatus === "VERIFIED");

    if (!isCadastralVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Mutation cannot be approved because Cadastral boundary verification is incomplete for parcel ${targetRoR.parcelId}. Current Cadastral status: '${cadastralRecord ? cadastralRecord.boundaryStatus : 'Pending'}'.`
        });
    }

    // Check Ownership verification status
    if (targetRoR.rorStatus !== "VERIFIED") {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Mutation cannot be approved because Ownership verification is incomplete for parcel ${targetRoR.parcelId}. Current RoR status: '${targetRoR.rorStatus}'.`
        });
    }

    // Check unresolved disputes
    const openDisputes = (targetRoR.disputes || []).filter(d => d.status === "OPEN" && (d.severity === "High" || d.severity === "Critical"));
    if (openDisputes.length > 0) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Mutation cannot be approved due to ${openDisputes.length} active unresolved ownership dispute(s) on parcel ${targetRoR.parcelId}.`
        });
    }

    // PREREQUISITES PASSED! Perform Mutation Approval and update backend state
    const timestamp = new Date().toISOString();
    targetMutation.status = "APPROVED";
    targetMutation.approvedBy = req.user.officerId || req.user.name;
    targetMutation.approvedAt = timestamp;
    targetMutation.approvalRemarks = remarks || "Mutation approved following complete verification.";
    targetMutation.currentStage = "RoR Update";

    if (targetMutation.stages) {
        targetMutation.stages.forEach(s => s.status = "COMPLETED");
    }

    // Update RoR rights holder & ownership history
    const previousOwner = targetRoR.rightsHolder;
    targetRoR.rightsHolder = targetMutation.proposedOwner;
    targetRoR.ownerName = targetMutation.proposedOwner;
    targetRoR.mutationStatus = "Approved";
    targetRoR.lastUpdated = timestamp.split("T")[0];
    targetRoR.updatedBy = req.user.officerId || req.user.name;

    if (!targetRoR.ownershipHistory) targetRoR.ownershipHistory = [];
    targetRoR.ownershipHistory.unshift({
        date: timestamp.split("T")[0],
        owner: targetMutation.proposedOwner,
        ownershipType: targetRoR.ownershipType || "Individual",
        document: targetMutation.supportingDocument || "Registered Transfer Deed",
        mutationNumber: targetMutation.mutationId,
        status: "Completed"
    });

    // Create Audit Event
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: mutationId,
        action: "MUTATION_APPROVED",
        result: "SUCCESS",
        details: {
            parcelId: targetRoR.parcelId,
            previousOwner,
            newOwner: targetMutation.proposedOwner,
            remarks
        }
    });

    res.json({
        success: true,
        message: `Mutation ${mutationId} approved successfully. Ownership transferred to ${targetMutation.proposedOwner}.`,
        mutation: targetMutation,
        rorRecord: targetRoR
    });
});

// POST Reject Mutation
router.post("/ror/mutations/:mutationId/reject", requirePermission("mutation.approve"), (req, res) => {
    const { mutationId } = req.params;
    const { rejectionReason, remarks } = req.body;

    let targetMutation = null;
    let targetRoR = null;

    rorData.forEach(r => {
        if (r.mutations) {
            const mut = r.mutations.find(m => m.mutationId === mutationId);
            if (mut) {
                targetMutation = mut;
                targetRoR = r;
            }
        }
    });

    if (!targetMutation || !targetRoR) {
        return res.status(404).json({ success: false, message: "Mutation request not found." });
    }

    if (!canAccessParcel(req.user, targetRoR.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to reject mutation for this parcel." });
    }

    const timestamp = new Date().toISOString();
    targetMutation.status = "REJECTED";
    targetMutation.rejectedBy = req.user.officerId || req.user.name;
    targetMutation.rejectedAt = timestamp;
    targetMutation.rejectionReason = rejectionReason || "Insufficient documentation or verification failure.";
    targetMutation.remarks = remarks || "";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: mutationId,
        action: "MUTATION_REJECTED",
        result: "SUCCESS",
        details: { parcelId: targetRoR.parcelId, rejectionReason, remarks }
    });

    res.json({
        success: true,
        message: `Mutation ${mutationId} rejected. Reason: ${rejectionReason}`,
        mutation: targetMutation
    });
});

// POST Request Information for Mutation
router.post("/ror/mutations/:mutationId/request-information", requirePermission("mutation.approve"), (req, res) => {
    const { mutationId } = req.params;
    const { infoRequired, reason } = req.body;

    let targetMutation = null;
    let targetRoR = null;

    rorData.forEach(r => {
        if (r.mutations) {
            const mut = r.mutations.find(m => m.mutationId === mutationId);
            if (mut) {
                targetMutation = mut;
                targetRoR = r;
            }
        }
    });

    if (!targetMutation || !targetRoR) {
        return res.status(404).json({ success: false, message: "Mutation request not found." });
    }

    targetMutation.status = "MORE_INFORMATION_REQUIRED";
    targetMutation.infoRequired = infoRequired;
    targetMutation.infoRequestedAt = new Date().toISOString();

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: mutationId,
        action: "MUTATION_INFORMATION_REQUESTED",
        result: "SUCCESS",
        details: { parcelId: targetRoR.parcelId, infoRequired, reason }
    });

    res.json({
        success: true,
        message: `More information requested for mutation ${mutationId}.`,
        mutation: targetMutation
    });
});

// POST Report Ownership Dispute
router.post("/ror/parcels/:parcelId/disputes", requirePermission("ror.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const rorRecord = rorData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!rorRecord) {
        return res.status(404).json({ success: false, message: "RoR record not found." });
    }

    const { type, severity, description } = req.body;
    const disputeId = `DISP-${Date.now()}`;
    const newDispute = {
        disputeId,
        parcelId,
        type: type || "Multiple Ownership Claims",
        severity: severity || "Medium",
        description: description || "Ownership dispute reported by RoR officer.",
        reportedBy: req.user.officerId || req.user.name || req.user.email,
        reportedAt: new Date().toISOString(),
        status: "OPEN"
    };

    if (!rorRecord.disputes) rorRecord.disputes = [];
    rorRecord.disputes.unshift(newDispute);

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "OWNERSHIP_DISPUTE_REPORTED",
        result: "SUCCESS",
        details: newDispute
    });

    res.json({
        success: true,
        message: `Ownership dispute ${disputeId} recorded for parcel ${parcelId}.`,
        dispute: newDispute,
        data: rorRecord
    });
});

// PUT Correct RoR Record
router.put("/ror/parcels/:parcelId/record", requirePermission("ror.update"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const rorRecord = rorData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!rorRecord) {
        return res.status(404).json({ success: false, message: "RoR record not found." });
    }

    const { ownerName, ownershipType, ownershipShare, possessionStatus, landClassification, rorNumber, correctionRemarks } = req.body;

    const oldValues = {
        ownerName: rorRecord.ownerName,
        ownershipType: rorRecord.ownershipType,
        ownershipShare: rorRecord.ownershipShare,
        possessionStatus: rorRecord.possessionStatus,
        recordNumber: rorRecord.recordNumber
    };

    if (ownerName) {
        rorRecord.ownerName = ownerName;
        rorRecord.rightsHolder = ownerName;
    }
    if (ownershipType) rorRecord.ownershipType = ownershipType;
    if (ownershipShare) rorRecord.ownershipShare = ownershipShare;
    if (possessionStatus) rorRecord.possessionStatus = possessionStatus;
    if (landClassification) rorRecord.landClassification = landClassification;
    if (rorNumber) rorRecord.recordNumber = rorNumber;

    const timestamp = new Date().toISOString();
    rorRecord.lastUpdated = timestamp.split("T")[0];
    rorRecord.updatedBy = req.user.officerId || req.user.name;

    const correctionEntry = {
        correctionId: `CORR-${Date.now()}`,
        date: timestamp,
        officer: req.user.officerId || req.user.name,
        oldValues,
        newValues: { ownerName, ownershipType, ownershipShare, possessionStatus, rorNumber },
        remarks: correctionRemarks || "Administrative RoR record correction."
    };

    if (!rorRecord.recordCorrections) rorRecord.recordCorrections = [];
    rorRecord.recordCorrections.unshift(correctionEntry);

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "ROR_RECORD_CORRECTED",
        result: "SUCCESS",
        details: { oldValues, newValues: correctionEntry.newValues, remarks: correctionRemarks }
    });

    res.json({
        success: true,
        message: `RoR record for ${parcelId} corrected successfully.`,
        data: rorRecord
    });
});

// POST Verify Supporting Document
router.post("/ror/documents/:documentId/verify", requirePermission("ror.verify"), (req, res) => {
    const { documentId } = req.params;
    const { verificationStatus, remarks } = req.body;

    const doc = documentService.getDocumentById(documentId);
    if (!doc) {
        return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (!canAccessParcel(req.user, doc.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized to verify documents for this parcel." });
    }

    doc.status = verificationStatus || "VERIFIED";
    doc.verifiedBy = req.user.officerId || req.user.name;
    doc.verifiedAt = new Date().toISOString();
    doc.verificationRemarks = remarks;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: documentId,
        action: verificationStatus === "REJECTED" ? "DOCUMENT_REJECTED" : "DOCUMENT_VERIFIED",
        result: "SUCCESS",
        details: { parcelId: doc.parcelId, verificationStatus, remarks }
    });

    res.json({
        success: true,
        message: `Document ${documentId} verification status set to '${doc.status}'.`,
        document: doc
    });
});

// --- 3. REGISTRATION OFFICER ---

// GET Overview & Metrics (filtered by parcel-level access claims)
router.get("/registration/overview", requirePermission("registration.view"), (req, res) => {
    const authorizedRecords = registrationData.filter(item => canAccessParcel(req.user, item.parcelId));

    const assignedParcelsCount = authorizedRecords.length;
    const pendingRegistrationsCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "PENDING").length;
    const transferRequestsCount = authorizedRecords.filter(r => (r.transactionType || "").toUpperCase() === "SALE" || (r.transactionType || "").toUpperCase() === "GIFT").length;
    const deedsAwaitingVerificationCount = authorizedRecords.filter(r => (r.deedStatus || "").toUpperCase() !== "VERIFIED").length;
    const encumbranceChecksCount = authorizedRecords.filter(r => (r.encumbranceStatus || "").toUpperCase() === "CHECK_REQUIRED").length;
    const approvedTransfersCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "APPROVED").length;
    const rejectedTransfersCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "REJECTED").length;

    const workQueue = authorizedRecords
        .filter(r => r.status === "PENDING" || r.status === "MORE_INFORMATION_REQUIRED")
        .map(r => ({
            registrationId: r.registrationId,
            parcelId: r.parcelId,
            surveyNo: r.surveyNumber,
            currentOwner: r.currentOwner || r.seller,
            proposedOwner: r.proposedOwner || r.buyer,
            type: r.transactionType,
            priority: r.parcelId === "LND-001" ? "HIGH" : "MEDIUM",
            status: r.status,
            currentStage: r.currentStage || "TAX_CLEARANCE"
        }));

    const assignedParcels = authorizedRecords.map(r => ({
        parcelId: r.parcelId,
        surveyNumber: r.surveyNumber,
        currentOwner: r.currentOwner || r.seller,
        proposedOwner: r.proposedOwner || r.buyer,
        registrationId: r.registrationId,
        area: r.parcelId === "LND-001" ? "2.5 Acres" : (r.parcelId === "LND-002" ? "1.2 Acres" : "0.8 Acres"),
        district: "Coimbatore",
        village: "Demo Village",
        rorStatus: r.checklist ? r.checklist.ror : "VERIFIED",
        registrationStatus: r.status,
        taxStatus: r.taxClearanceStatus
    }));

    const cases = authorizedRecords.map(r => ({
        caseId: `CASE-${r.registrationId}`,
        registrationId: r.registrationId,
        parcelId: r.parcelId,
        caseType: `Property Transfer (${r.transactionType})`,
        stage: r.currentStage || "Registration Verification",
        priority: "HIGH",
        status: r.status
    }));

    const requests = authorizedRecords.reduce((acc, r) => acc.concat(r.requests || []), []);

    res.json({
        success: true,
        department: "Registration Department",
        officer: req.user,
        stats: {
            assignedParcels: assignedParcelsCount,
            pendingRegistrations: pendingRegistrationsCount,
            transferRequests: transferRequestsCount,
            deedsAwaitingVerification: deedsAwaitingVerificationCount,
            encumbranceChecks: encumbranceChecksCount,
            approvedTransfers: approvedTransfersCount,
            rejectedTransfers: rejectedTransfersCount
        },
        workQueue,
        assignedParcels,
        cases,
        requests,
        registrations: authorizedRecords
    });
});

// GET Authorized Registration Parcels List
router.get("/registration/parcels", requirePermission("registration.view"), (req, res) => {
    const authorized = registrationData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

// GET Registration Parcel Workspace Detail with Cross-Departmental Status
router.get("/registration/parcels/:parcelId", requirePermission("registration.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();

    const regRecord = registrationData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!regRecord) {
        return res.status(404).json({ success: false, message: "Registration record not found for this parcel." });
    }

    // Cross-reference Cadastral data
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === parcelId) || {};
    const cadastralBoundaryVerified = (cadastralRecord.boundaryStatus || "").toLowerCase() === "verified";

    // Cross-reference RoR data
    const rorRecord = rorData.find(r => r.parcelId.toUpperCase() === parcelId) || {};
    const rorVerified = (rorRecord.rorStatus || "").toLowerCase() === "verified";

    // Cross-reference Documents & Audits
    const documents = documentService.getDocumentsByParcelId(parcelId);
    const auditTrail = auditService.getAuditsByParcel(parcelId);

    // Compute Checklist Statuses
    const checklist = {
        cadastral: cadastralBoundaryVerified ? "VERIFIED" : (cadastralRecord.boundaryStatus || "PENDING"),
        ror: rorVerified ? "VERIFIED" : (rorRecord.rorStatus || "PENDING"),
        deed: regRecord.deedStatus || "PENDING",
        stampDuty: regRecord.stampDutyStatus || "PENDING",
        encumbrance: regRecord.encumbranceStatus || "PENDING",
        taxClearance: regRecord.taxClearanceStatus || "PENDING",
        landUse: regRecord.landUseStatus || "VERIFIED",
        restrictions: regRecord.restrictionStatus || "CLEAR"
    };

    res.json({
        success: true,
        data: {
            ...regRecord,
            checklist,
            cadastralCrossReference: {
                boundaryStatus: cadastralRecord.boundaryStatus || "Pending",
                surveyStatus: cadastralRecord.surveyStatus || "Verified",
                surveyNumber: cadastralRecord.surveyNumber || regRecord.surveyNumber,
                area: cadastralRecord.area || "2.5 Acres"
            },
            rorCrossReference: {
                recordNumber: rorRecord.recordNumber || "ROR-2026-001",
                rightsHolder: rorRecord.rightsHolder || rorRecord.ownerName || regRecord.currentOwner,
                ownershipType: rorRecord.ownershipType || "Individual",
                rorStatus: rorRecord.rorStatus || "VERIFIED",
                disputesCount: (rorRecord.disputes || []).filter(d => d.status === "OPEN").length
            },
            documents,
            auditTrail
        }
    });
});

// POST Verify Deed
router.post("/registration/requests/:registrationId/verify-deed", requirePermission("registration.verify"), (req, res) => {
    const { registrationId } = req.params;
    const { verificationResult, remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    regRecord.deedStatus = verificationResult || "VERIFIED";
    if (regRecord.checklist) regRecord.checklist.deed = regRecord.deedStatus;
    regRecord.lastUpdated = new Date().toISOString().split("T")[0];
    regRecord.updatedBy = req.user.officerId || req.user.name;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "DEED_VERIFIED",
        result: "SUCCESS",
        details: { registrationId, verificationResult: regRecord.deedStatus, remarks }
    });

    res.json({
        success: true,
        message: `Deed verification status updated to '${regRecord.deedStatus}' for ${registrationId}.`,
        data: regRecord
    });
});

// POST Verify Stamp Duty
router.post("/registration/requests/:registrationId/verify-stamp-duty", requirePermission("registration.verify"), (req, res) => {
    const { registrationId } = req.params;
    const { paymentRef, remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    regRecord.stampDutyStatus = "VERIFIED";
    if (paymentRef) regRecord.paymentReference = paymentRef;
    if (regRecord.checklist) regRecord.checklist.stampDuty = "VERIFIED";
    regRecord.lastUpdated = new Date().toISOString().split("T")[0];

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "STAMP_DUTY_VERIFIED",
        result: "SUCCESS",
        details: { registrationId, stampDutyPaid: regRecord.stampDutyPaid, paymentReference: regRecord.paymentReference, remarks }
    });

    res.json({
        success: true,
        message: `Stamp duty payment verified for ${registrationId}.`,
        data: regRecord
    });
});

// POST Encumbrance Check
router.post("/registration/requests/:registrationId/encumbrance-check", requirePermission("registration.verify"), (req, res) => {
    const { registrationId } = req.params;
    const { remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    regRecord.encumbranceStatus = "CLEAR";
    if (regRecord.checklist) regRecord.checklist.encumbrance = "CLEAR";
    regRecord.lastUpdated = new Date().toISOString().split("T")[0];

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "ENCUMBRANCE_CHECKED",
        result: "SUCCESS",
        details: { registrationId, encumbranceStatus: "CLEAR", remarks: remarks || "No prior liens or encumbrances found." }
    });

    res.json({
        success: true,
        message: `Encumbrance check completed for ${registrationId}. Status: CLEAR.`,
        data: regRecord
    });
});

// POST Request Tax Clearance from Property Tax Department
router.post("/registration/requests/:registrationId/request-tax-clearance", requirePermission("registration.verify"), (req, res) => {
    const { registrationId } = req.params;
    const { remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    const newRequest = {
        requestId: `REQ-TAX-${Date.now()}`,
        toDepartment: "Property Tax & Municipal Department",
        fromDepartment: "Registration Department",
        parcelId: regRecord.parcelId,
        request: `Verify property tax clearance before property transfer registration ${registrationId}. ${remarks || ''}`,
        priority: "HIGH",
        status: "PENDING",
        createdAt: new Date().toISOString()
    };

    if (!regRecord.requests) regRecord.requests = [];
    regRecord.requests.unshift(newRequest);
    regRecord.taxClearanceStatus = "PENDING";
    if (regRecord.checklist) regRecord.checklist.taxClearance = "PENDING";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "TAX_CLEARANCE_REQUESTED",
        result: "SUCCESS",
        details: { registrationId, requestId: newRequest.requestId, remarks }
    });

    res.json({
        success: true,
        message: `Tax clearance request sent to Property Tax Department for ${registrationId}.`,
        request: newRequest,
        data: regRecord
    });
});

// POST Approve Registration Transfer (CHECKLIST PREREQUISITE ENFORCED)
router.post("/registration/requests/:registrationId/approve", requirePermission("transfer.approve"), (req, res) => {
    const { registrationId } = req.params;
    const { remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    // Cross-reference Cadastral & RoR statuses
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === regRecord.parcelId.toUpperCase()) || {};
    const rorRecord = rorData.find(r => r.parcelId.toUpperCase() === regRecord.parcelId.toUpperCase()) || {};

    const isCadastralVerified = (cadastralRecord.boundaryStatus || "").toLowerCase() === "verified";
    const isRoRVerified = (rorRecord.rorStatus || "").toLowerCase() === "verified";
    const isDeedVerified = (regRecord.deedStatus || "").toUpperCase() === "VERIFIED";
    const isStampDutyVerified = (regRecord.stampDutyStatus || "").toUpperCase() === "VERIFIED";
    const isEncumbranceClear = (regRecord.encumbranceStatus || "").toUpperCase() === "CLEAR";
    const isTaxCleared = (regRecord.taxClearanceStatus || "").toUpperCase() === "CLEARED";
    const isLandUseVerified = (regRecord.landUseStatus || "").toUpperCase() === "VERIFIED";
    const isRestrictionClear = (regRecord.restrictionStatus || "").toUpperCase() === "CLEAR";

    // Enforce Prerequisites
    if (!isCadastralVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot proceed because Cadastral verification is incomplete for parcel ${regRecord.parcelId}.`
        });
    }

    if (!isRoRVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot proceed until RoR ownership verification is completed for parcel ${regRecord.parcelId}.`
        });
    }

    if (!isDeedVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot be approved: Deed document verification is pending.`
        });
    }

    if (!isStampDutyVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot be approved: Stamp duty verification is pending.`
        });
    }

    if (!isEncumbranceClear) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot be approved: Encumbrance check is required.`
        });
    }

    if (!isTaxCleared) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Registration cannot be approved: Tax clearance is still pending from Property Tax Department.`
        });
    }

    // ALL PREREQUISITES PASSED! Perform Approval
    const timestamp = new Date().toISOString();
    regRecord.status = "APPROVED";
    regRecord.currentStage = "COMPLETED";
    regRecord.approvedBy = req.user.officerId || req.user.name;
    regRecord.approvedAt = timestamp;
    regRecord.approvalRemarks = remarks || "Property registration and transfer approved following complete checklist verification.";

    if (regRecord.checklist) {
        Object.keys(regRecord.checklist).forEach(k => {
            if (regRecord.checklist[k] !== "VERIFIED" && regRecord.checklist[k] !== "CLEARED" && regRecord.checklist[k] !== "CLEAR") {
                regRecord.checklist[k] = "VERIFIED";
            }
        });
    }

    // Update Property Transaction History
    if (!regRecord.transactionHistory) regRecord.transactionHistory = [];
    regRecord.transactionHistory.unshift({
        year: timestamp.split("-")[0],
        type: regRecord.transactionType || "Sale",
        seller: regRecord.currentOwner,
        buyer: regRecord.proposedOwner,
        docRef: regRecord.registrationId,
        consideration: regRecord.considerationAmount,
        status: "Approved & Transfer Executed"
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "REGISTRATION_APPROVED",
        result: "SUCCESS",
        details: { registrationId, seller: regRecord.currentOwner, buyer: regRecord.proposedOwner, remarks }
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.registrationId,
        action: "TRANSFER_APPROVED",
        result: "SUCCESS",
        details: { parcelId: regRecord.parcelId, proposedOwner: regRecord.proposedOwner }
    });

    res.json({
        success: true,
        message: `Property registration and transfer ${registrationId} approved successfully! Notification sent to RoR Department for title mutation.`,
        data: regRecord
    });
});

// POST Reject Registration
router.post("/registration/requests/:registrationId/reject", requirePermission("transfer.approve"), (req, res) => {
    const { registrationId } = req.params;
    const { rejectionReason, remarks } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    const timestamp = new Date().toISOString();
    regRecord.status = "REJECTED";
    regRecord.rejectionReason = rejectionReason || "Invalid Deed";
    regRecord.rejectedBy = req.user.officerId || req.user.name;
    regRecord.rejectedAt = timestamp;
    regRecord.rejectionRemarks = remarks || "Registration request rejected by officer.";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "REGISTRATION_REJECTED",
        result: "SUCCESS",
        details: { registrationId, rejectionReason, remarks }
    });

    res.json({
        success: true,
        message: `Registration ${registrationId} rejected. Reason: ${regRecord.rejectionReason}`,
        data: regRecord
    });
});

// POST Request Additional Information
router.post("/registration/requests/:registrationId/request-information", requirePermission("registration.verify"), (req, res) => {
    const { registrationId } = req.params;
    const { infoRequired, reason } = req.body;

    const regRecord = registrationData.find(r => r.registrationId.toUpperCase() === registrationId.toUpperCase());
    if (!regRecord) return res.status(404).json({ success: false, message: "Registration request not found." });

    if (!canAccessParcel(req.user, regRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    regRecord.status = "MORE_INFORMATION_REQUIRED";
    regRecord.infoRequired = infoRequired;
    regRecord.infoReason = reason;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regRecord.parcelId,
        action: "REGISTRATION_INFORMATION_REQUESTED",
        result: "SUCCESS",
        details: { registrationId, infoRequired, reason }
    });

    res.json({
        success: true,
        message: `Information request logged for ${registrationId}. Status: MORE_INFORMATION_REQUIRED.`,
        data: regRecord
    });
});

// --- 4. LAND USE & PLANNING OFFICER ---

// GET Overview & Metrics (filtered by parcel-level access claims)
router.get("/land-use/overview", requirePermission("landuse.view"), (req, res) => {
    const authorizedRecords = landUseData.filter(item => canAccessParcel(req.user, item.parcelId));

    const assignedParcelsCount = authorizedRecords.length;
    const pendingConversionsCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "PENDING").length;
    const pendingReviewsCount = authorizedRecords.filter(r => (r.environmentalStatus || "").toUpperCase() === "PENDING" || (r.roadAccessStatus || "").toUpperCase() === "PENDING").length;
    const zoningConflictsCount = authorizedRecords.filter(r => (r.zoningStatus || "").toUpperCase() === "INCOMPATIBLE").length;
    const restrictionAlertsCount = authorizedRecords.filter(r => (r.restrictionStatus || "").toUpperCase() === "RESTRICTED").length;
    
    const authorizedBuildingPermissions = buildingPermissionData.filter(bp => canAccessParcel(req.user, bp.parcelId));
    const buildingReviewsCount = authorizedBuildingPermissions.filter(bp => (bp.buildingPermissionStatus || "").toLowerCase().includes("review") || (bp.buildingPermissionStatus || "").toLowerCase().includes("pending")).length;
    
    const approvedConversionsCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "APPROVED").length;
    const rejectedConversionsCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "REJECTED").length;

    const workQueue = authorizedRecords
        .filter(r => r.status === "PENDING" || r.status === "MORE_INFORMATION_REQUIRED")
        .map(r => ({
            requestId: r.requestId,
            parcelId: r.parcelId,
            surveyNo: r.surveyNumber,
            currentUse: r.currentLandUse,
            requestedUse: r.requestedLandUse,
            zone: r.requestedZone || r.currentZone,
            priority: r.priority || "HIGH",
            status: r.status,
            currentStage: r.currentStage || "ENVIRONMENTAL_CHECK"
        }));

    const assignedParcels = authorizedRecords.map(r => ({
        parcelId: r.parcelId,
        surveyNumber: r.surveyNumber,
        owner: r.parcelId === "LND-001" ? "Demo Agricultural Owner" : (r.parcelId === "LND-002" ? "Industrial Infra Ltd" : "Demo Land Owner"),
        area: r.parcelId === "LND-001" ? "2.5 Acres" : (r.parcelId === "LND-002" ? "1.2 Acres" : "0.8 Acres"),
        district: "Coimbatore",
        village: "Demo Village",
        currentLandUse: r.currentLandUse,
        masterPlanZone: r.currentZone,
        restrictionStatus: r.restrictionStatus,
        planningStatus: r.status
    }));

    const cases = authorizedRecords.map(r => ({
        caseId: `CASE-${r.requestId}`,
        requestId: r.requestId,
        parcelId: r.parcelId,
        caseType: `Land Use Conversion (${r.currentLandUse} -> ${r.requestedLandUse})`,
        stage: r.currentStage || "Planning Review",
        priority: r.priority || "HIGH",
        status: r.status
    }));

    const requests = authorizedRecords.reduce((acc, r) => acc.concat(r.requests || []), []);

    res.json({
        success: true,
        department: "Land Use & Planning Department",
        officer: req.user,
        stats: {
            assignedParcels: assignedParcelsCount,
            pendingConversions: pendingConversionsCount,
            pendingReviews: pendingReviewsCount,
            zoningConflicts: zoningConflictsCount,
            restrictionAlerts: restrictionAlertsCount,
            buildingReviews: buildingReviewsCount,
            approvedConversions: approvedConversionsCount,
            rejectedConversions: rejectedConversionsCount
        },
        workQueue,
        assignedParcels,
        cases,
        buildingPermissions: authorizedBuildingPermissions,
        requests,
        conversions: authorizedRecords
    });
});

// GET Authorized Land Use Parcels List
router.get("/land-use/parcels", requirePermission("landuse.view"), (req, res) => {
    const authorized = landUseData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

// GET Land Use Parcel Workspace Detail
router.get("/land-use/parcels/:parcelId", requirePermission("landuse.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();

    const landRecord = landUseData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!landRecord) {
        return res.status(404).json({ success: false, message: "Land use record not found for this parcel." });
    }

    // Cross-reference Cadastral data
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === parcelId) || {};
    const cadastralBoundaryVerified = (cadastralRecord.boundaryStatus || "").toLowerCase() === "verified";

    // Cross-reference RoR data
    const rorRecord = rorData.find(r => r.parcelId.toUpperCase() === parcelId) || {};
    const rorVerified = (rorRecord.rorStatus || "").toLowerCase() === "verified";

    // Cross-reference Restrictions & Building Permissions
    const restrictionsRecord = restrictionsData.find(r => r.parcelId.toUpperCase() === parcelId) || {};
    const buildingPermissionRecord = buildingPermissionData.find(bp => bp.parcelId.toUpperCase() === parcelId) || {};

    const documents = documentService.getDocumentsByParcelId(parcelId);
    const auditTrail = auditService.getAuditsByParcel(parcelId);

    // Compute Checklist Statuses
    const checklist = {
        cadastral: cadastralBoundaryVerified ? "VERIFIED" : (cadastralRecord.boundaryStatus || "PENDING"),
        ror: rorVerified ? "VERIFIED" : (rorRecord.rorStatus || "PENDING"),
        zoning: landRecord.zoningStatus || "CONDITIONAL",
        masterPlan: (landRecord.masterPlanStatus || "").includes("Approved") ? "VERIFIED" : "REVIEWED",
        environmental: landRecord.environmentalStatus || "PENDING",
        roadAccess: landRecord.roadAccessStatus || "PENDING",
        restrictions: landRecord.restrictionStatus || "CLEAR"
    };

    res.json({
        success: true,
        data: {
            ...landRecord,
            checklist,
            cadastralCrossReference: {
                boundaryStatus: cadastralRecord.boundaryStatus || "Pending",
                surveyStatus: cadastralRecord.surveyStatus || "Verified",
                surveyNumber: cadastralRecord.surveyNumber || landRecord.surveyNumber,
                area: cadastralRecord.area || "2.5 Acres"
            },
            rorCrossReference: {
                recordNumber: rorRecord.recordNumber || "ROR-2026-001",
                rightsHolder: rorRecord.rightsHolder || rorRecord.ownerName || "Demo Land Owner",
                ownershipType: rorRecord.ownershipType || "Individual",
                rorStatus: rorRecord.rorStatus || "VERIFIED"
            },
            restrictionsInfo: restrictionsRecord,
            buildingPermission: buildingPermissionRecord,
            documents,
            auditTrail
        }
    });
});

// POST Environmental Status Verification
router.post("/land-use/parcels/:parcelId/environmental-check", requirePermission("landuse.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { environmentalStatus, remarks } = req.body;

    const landRecord = landUseData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!landRecord) return res.status(404).json({ success: false, message: "Land use record not found." });

    landRecord.environmentalStatus = environmentalStatus || "CLEAR";
    if (landRecord.checklist) landRecord.checklist.environmental = landRecord.environmentalStatus;
    landRecord.lastUpdated = new Date().toISOString().split("T")[0];
    landRecord.updatedBy = req.user.officerId || req.user.name;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "ENVIRONMENTAL_CHECKED",
        result: "SUCCESS",
        details: { environmentalStatus: landRecord.environmentalStatus, remarks }
    });

    res.json({
        success: true,
        message: `Environmental status updated to '${landRecord.environmentalStatus}' for parcel ${parcelId}.`,
        data: landRecord
    });
});

// POST Road Access Verification
router.post("/land-use/parcels/:parcelId/road-access", requirePermission("landuse.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { roadAccessStatus, roadWidth, remarks } = req.body;

    const landRecord = landUseData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!landRecord) return res.status(404).json({ success: false, message: "Land use record not found." });

    landRecord.roadAccessStatus = roadAccessStatus || "AVAILABLE";
    if (roadWidth) landRecord.roadWidth = roadWidth;
    if (landRecord.checklist) landRecord.checklist.roadAccess = landRecord.roadAccessStatus;
    landRecord.lastUpdated = new Date().toISOString().split("T")[0];

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "ROAD_ACCESS_VERIFIED",
        result: "SUCCESS",
        details: { roadAccessStatus: landRecord.roadAccessStatus, roadWidth: landRecord.roadWidth, remarks }
    });

    res.json({
        success: true,
        message: `Road access status updated to '${landRecord.roadAccessStatus}' (${landRecord.roadWidth}) for parcel ${parcelId}.`,
        data: landRecord
    });
});

// POST Report Planning Conflict
router.post("/land-use/parcels/:parcelId/conflicts", requirePermission("landuse.verify"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();
    const { type, severity, description } = req.body;

    const conflict = {
        conflictId: `CONF-LU-${Date.now()}`,
        parcelId,
        type: type || "Zoning Incompatibility",
        severity: severity || "High",
        description: description || "Requested land use conflicts with master plan zoning regulations.",
        reportedBy: req.user.officerId || req.user.name,
        reportedAt: new Date().toISOString(),
        status: "OPEN"
    };

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "PLANNING_CONFLICT_REPORTED",
        result: "SUCCESS",
        details: { conflictId: conflict.conflictId, type: conflict.type, severity: conflict.severity, description }
    });

    res.json({
        success: true,
        message: `Planning conflict ${conflict.conflictId} recorded for parcel ${parcelId}.`,
        conflict
    });
});

// POST Building Permission Review
router.post("/land-use/building-permissions/:applicationId/review", requirePermission("landuse.approve"), (req, res) => {
    const { applicationId } = req.params;
    const { status, remarks } = req.body;

    const bp = buildingPermissionData.find(b => (b.applicationNumber || "").toUpperCase() === applicationId.toUpperCase());
    if (!bp) return res.status(404).json({ success: false, message: "Building permission application not found." });

    if (!canAccessParcel(req.user, bp.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    bp.buildingPermissionStatus = status || "Approved";
    bp.approvalDate = new Date().toISOString().split("T")[0];
    bp.lastUpdated = bp.approvalDate;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: bp.parcelId,
        action: status === "Rejected" ? "BUILDING_PERMISSION_REJECTED" : "BUILDING_PERMISSION_APPROVED",
        result: "SUCCESS",
        details: { applicationId, status: bp.buildingPermissionStatus, remarks }
    });

    res.json({
        success: true,
        message: `Building permission ${applicationId} status set to '${bp.buildingPermissionStatus}'.`,
        data: bp
    });
});

// POST Approve Land Use Conversion Request (CHECKLIST PREREQUISITE ENFORCED)
router.post("/land-use/conversions/:requestId/approve", requirePermission("landuse.approve"), (req, res) => {
    const { requestId } = req.params;
    const { remarks } = req.body;

    const landRecord = landUseData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase());
    if (!landRecord) return res.status(404).json({ success: false, message: "Land use conversion request not found." });

    if (!canAccessParcel(req.user, landRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    // Cross-reference Cadastral & RoR statuses
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === landRecord.parcelId.toUpperCase()) || {};
    const rorRecord = rorData.find(r => r.parcelId.toUpperCase() === landRecord.parcelId.toUpperCase()) || {};

    const isCadastralVerified = (cadastralRecord.boundaryStatus || "").toLowerCase() === "verified";
    const isRoRVerified = (rorRecord.rorStatus || "").toLowerCase() === "verified";
    const isZoningCompatible = (landRecord.zoningStatus || "").toUpperCase() !== "INCOMPATIBLE";
    const isEnvironmentalClear = (landRecord.environmentalStatus || "").toUpperCase() === "CLEAR";
    const isRoadAccessAvailable = (landRecord.roadAccessStatus || "").toUpperCase() === "AVAILABLE";
    const isRestrictionClear = (landRecord.restrictionStatus || "").toUpperCase() === "CLEAR";

    // Enforce Prerequisites
    if (!isCadastralVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot proceed because Cadastral boundary verification is incomplete for parcel ${landRecord.parcelId}.`
        });
    }

    if (!isRoRVerified) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot proceed until RoR ownership verification is completed for parcel ${landRecord.parcelId}.`
        });
    }

    if (!isZoningCompatible) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot be approved: Zoning incompatibility detected between ${landRecord.currentZone} and ${landRecord.requestedZone}.`
        });
    }

    if (!isEnvironmentalClear) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot be approved because environmental verification is pending or requires review for parcel ${landRecord.parcelId}.`
        });
    }

    if (!isRoadAccessAvailable) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot be approved: Road access verification is pending for parcel ${landRecord.parcelId}.`
        });
    }

    if (!isRestrictionClear) {
        return res.status(400).json({
            success: false,
            error: "PREREQUISITE_FAILED",
            message: `Conversion cannot be approved due to active development restrictions on parcel ${landRecord.parcelId}.`
        });
    }

    // ALL PREREQUISITES PASSED! Perform Approval
    const timestamp = new Date().toISOString();
    const previousLandUse = landRecord.currentLandUse;
    landRecord.status = "APPROVED";
    landRecord.currentStage = "COMPLETED";
    landRecord.currentLandUse = landRecord.requestedLandUse || landRecord.currentLandUse;
    landRecord.currentZone = landRecord.requestedZone || landRecord.currentZone;
    landRecord.approvedBy = req.user.officerId || req.user.name;
    landRecord.approvedAt = timestamp;
    landRecord.approvalRemarks = remarks || "Land use conversion approved following complete planning checklist verification.";

    if (landRecord.checklist) {
        Object.keys(landRecord.checklist).forEach(k => {
            if (landRecord.checklist[k] !== "VERIFIED" && landRecord.checklist[k] !== "CLEAR" && landRecord.checklist[k] !== "AVAILABLE") {
                landRecord.checklist[k] = "VERIFIED";
            }
        });
    }

    // Update Land Use History
    if (!landRecord.landUseHistory) landRecord.landUseHistory = [];
    landRecord.landUseHistory.unshift({
        year: timestamp.split("-")[0],
        landUse: landRecord.currentLandUse,
        zone: landRecord.currentZone,
        officer: req.user.officerId || req.user.name,
        docRef: landRecord.requestId,
        status: "Approved Conversion"
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: landRecord.parcelId,
        action: "LAND_USE_CONVERSION_APPROVED",
        result: "SUCCESS",
        details: { requestId, previousLandUse, newLandUse: landRecord.currentLandUse, remarks }
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: landRecord.parcelId,
        action: "LAND_USE_VERIFIED",
        result: "SUCCESS",
        details: { landUse: landRecord.currentLandUse, zone: landRecord.currentZone }
    });

    res.json({
        success: true,
        message: `Land use conversion ${requestId} approved successfully! Parcel ${landRecord.parcelId} classification updated to '${landRecord.currentLandUse}'. Notification sent to Property Tax / Municipal Department.`,
        data: landRecord
    });
});

// POST Reject Land Use Conversion
router.post("/land-use/conversions/:requestId/reject", requirePermission("landuse.approve"), (req, res) => {
    const { requestId } = req.params;
    const { rejectionReason, remarks } = req.body;

    const landRecord = landUseData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase());
    if (!landRecord) return res.status(404).json({ success: false, message: "Land use conversion request not found." });

    if (!canAccessParcel(req.user, landRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    const timestamp = new Date().toISOString();
    landRecord.status = "REJECTED";
    landRecord.rejectionReason = rejectionReason || "Zoning incompatibility";
    landRecord.rejectedBy = req.user.officerId || req.user.name;
    landRecord.rejectedAt = timestamp;
    landRecord.rejectionRemarks = remarks || "Land use conversion request rejected by planning officer.";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: landRecord.parcelId,
        action: "CONVERSION_REJECTED",
        result: "SUCCESS",
        details: { requestId, rejectionReason, remarks }
    });

    res.json({
        success: true,
        message: `Land use conversion ${requestId} rejected. Reason: ${landRecord.rejectionReason}`,
        data: landRecord
    });
});

// POST Request Additional Information
router.post("/land-use/conversions/:requestId/request-information", requirePermission("landuse.verify"), (req, res) => {
    const { requestId } = req.params;
    const { infoRequired, reason } = req.body;

    const landRecord = landUseData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase());
    if (!landRecord) return res.status(404).json({ success: false, message: "Land use conversion request not found." });

    if (!canAccessParcel(req.user, landRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    landRecord.status = "MORE_INFORMATION_REQUIRED";
    landRecord.infoRequired = infoRequired;
    landRecord.infoReason = reason;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: landRecord.parcelId,
        action: "CONVERSION_INFORMATION_REQUESTED",
        result: "SUCCESS",
        details: { requestId, infoRequired, reason }
    });

    res.json({
        success: true,
        message: `Information request logged for conversion ${requestId}. Status: MORE_INFORMATION_REQUIRED.`,
        data: landRecord
    });
});

// --- 5. PROPERTY TAX & MUNICIPAL OFFICER ---

// GET Overview & Metrics (filtered by parcel-level access claims)
router.get("/property-tax/overview", requirePermission("tax.view"), (req, res) => {
    const authorizedRecords = propertyTaxData.filter(item => canAccessParcel(req.user, item.parcelId));

    const assignedParcelsCount = authorizedRecords.length;
    const pendingTaxVerificationCount = authorizedRecords.filter(r => (r.assessmentStatus || "").toUpperCase() === "UNDER_REVIEW").length;
    const outstandingTaxCasesCount = authorizedRecords.filter(r => (r.outstandingAmount || 0) > 0).length;
    const taxClearanceRequestsCount = authorizedRecords.filter(r => (r.status || "").toUpperCase() === "PENDING").length;
    const pendingAssessmentsCount = pendingTaxVerificationCount;
    
    const authorizedBuildingPermissions = buildingPermissionData.filter(bp => canAccessParcel(req.user, bp.parcelId));
    const buildingReviewsCount = authorizedBuildingPermissions.filter(bp => (bp.buildingPermissionStatus || "").toLowerCase().includes("review") || (bp.buildingPermissionStatus || "").toLowerCase().includes("pending")).length;
    
    const clearedParcelsCount = authorizedRecords.filter(r => (r.taxClearanceStatus || "").toUpperCase() === "CLEARED").length;
    const overdueTaxCasesCount = authorizedRecords.filter(r => (r.penalty || 0) > 0 || (r.outstandingAmount || 0) > 0).length;

    const workQueue = authorizedRecords
        .filter(r => r.status === "PENDING" || (r.outstandingAmount || 0) > 0 || r.assessmentStatus === "UNDER_REVIEW")
        .map(r => ({
            requestId: r.requestId || `CLR-${r.parcelId}`,
            assessmentId: r.assessmentId,
            parcelId: r.parcelId,
            surveyNo: r.surveyNumber,
            owner: r.parcelId === "LND-001" ? "Demo Agricultural Owner" : (r.parcelId === "LND-002" ? "Industrial Infra Ltd" : "Demo Land Owner"),
            propertyType: r.propertyType,
            taxDemand: r.taxDemand || r.annualTax,
            amountPaid: r.amountPaid,
            outstandingAmount: r.outstandingAmount,
            priority: r.priority || "HIGH",
            status: r.status,
            currentStage: r.currentStage || "ASSESSMENT_REVIEW"
        }));

    const assignedParcels = authorizedRecords.map(r => ({
        parcelId: r.parcelId,
        surveyNumber: r.surveyNumber,
        owner: r.parcelId === "LND-001" ? "Demo Agricultural Owner" : (r.parcelId === "LND-002" ? "Industrial Infra Ltd" : "Demo Land Owner"),
        district: "Coimbatore",
        village: "Demo Village",
        landType: r.parcelId === "LND-001" ? "Agricultural" : (r.parcelId === "LND-002" ? "Commercial" : "Agricultural"),
        currentLandUse: r.propertyType,
        taxStatus: r.taxClearanceStatus,
        outstandingAmount: r.outstandingAmount,
        assessmentStatus: r.assessmentStatus,
        municipalStatus: "VERIFIED"
    }));

    const cases = authorizedRecords.map(r => ({
        caseId: `CASE-${r.assessmentId}`,
        requestId: r.requestId,
        parcelId: r.parcelId,
        caseType: `Property Tax Assessment (${r.propertyType})`,
        stage: r.currentStage || "Tax Verification",
        priority: r.priority || "HIGH",
        status: r.status
    }));

    const requests = authorizedRecords.reduce((acc, r) => acc.concat(r.clearanceRequests || []), []);

    res.json({
        success: true,
        department: "Property Tax & Municipal Department",
        officer: req.user,
        stats: {
            assignedParcels: assignedParcelsCount,
            pendingTaxVerification: pendingTaxVerificationCount,
            outstandingTaxCases: outstandingTaxCasesCount,
            taxClearanceRequests: taxClearanceRequestsCount,
            pendingAssessments: pendingAssessmentsCount,
            buildingReviews: buildingReviewsCount,
            clearedParcels: clearedParcelsCount,
            overdueTaxCases: overdueTaxCasesCount
        },
        workQueue,
        assignedParcels,
        cases,
        buildingPermissions: authorizedBuildingPermissions,
        requests,
        taxRecords: authorizedRecords
    });
});

// GET Authorized Property Tax Parcels List
router.get("/property-tax/parcels", requirePermission("tax.view"), (req, res) => {
    const authorized = propertyTaxData.filter(item => canAccessParcel(req.user, item.parcelId));
    res.json({
        success: true,
        count: authorized.length,
        data: authorized
    });
});

// GET Property Tax Parcel Workspace Detail
router.get("/property-tax/parcels/:parcelId", requirePermission("tax.view"), requireParcelAccess("parcelId"), (req, res) => {
    const parcelId = req.params.parcelId.trim().toUpperCase();

    const taxRecord = propertyTaxData.find(item => item.parcelId.toUpperCase() === parcelId);
    if (!taxRecord) {
        return res.status(404).json({ success: false, message: "Property tax record not found for this parcel." });
    }

    // Cross-reference Cadastral, RoR, Registration, Land Use, Building Permissions
    const cadastralRecord = cadastralData.find(c => c.parcelId.toUpperCase() === parcelId) || {};
    const rorRecord = rorData.find(r => r.parcelId.toUpperCase() === parcelId) || {};
    const registrationRecord = registrationData.find(r => r.parcelId.toUpperCase() === parcelId) || {};
    const landRecord = landUseData.find(l => l.parcelId.toUpperCase() === parcelId) || {};
    const buildingPermissionRecord = buildingPermissionData.find(bp => bp.parcelId.toUpperCase() === parcelId) || {};

    const documents = documentService.getDocumentsByParcelId(parcelId);
    const auditTrail = auditService.getAuditsByParcel(parcelId);

    // Verification Panel Checkstatuses
    const verificationStatus = {
        cadastral: (cadastralRecord.boundaryStatus || "").toLowerCase() === "verified" ? "PASS" : "PENDING",
        ror: (rorRecord.rorStatus || "").toLowerCase() === "verified" ? "PASS" : "PENDING",
        registration: registrationRecord ? (registrationRecord.status || "VERIFIED") : "PASS",
        landUse: landRecord ? (landRecord.status || "APPROVED") : "PASS",
        assessment: taxRecord.assessmentStatus === "VERIFIED" ? "PASS" : "PENDING",
        taxClearance: taxRecord.outstandingAmount === 0 ? "PASS" : "FAILED",
        buildingPermission: buildingPermissionRecord ? (buildingPermissionRecord.buildingPermissionStatus || "Approved") : "PASS"
    };

    res.json({
        success: true,
        data: {
            ...taxRecord,
            verificationStatus,
            cadastralCrossReference: cadastralRecord,
            rorCrossReference: rorRecord,
            registrationCrossReference: registrationRecord,
            landUseCrossReference: landRecord,
            buildingPermission: buildingPermissionRecord,
            documents,
            auditTrail
        }
    });
});

// POST Verify Tax Assessment
router.post("/property-tax/assessments/:assessmentId/verify", requirePermission("tax.verify"), (req, res) => {
    const { assessmentId } = req.params;
    const { remarks } = req.body;

    const taxRecord = propertyTaxData.find(r => (r.assessmentId || "").toUpperCase() === assessmentId.toUpperCase());
    if (!taxRecord) return res.status(404).json({ success: false, message: "Property tax assessment not found." });

    if (!canAccessParcel(req.user, taxRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    taxRecord.assessmentStatus = "VERIFIED";
    taxRecord.lastUpdated = new Date().toISOString().split("T")[0];
    taxRecord.updatedBy = req.user.officerId || req.user.name;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_ASSESSMENT_VERIFIED",
        result: "SUCCESS",
        details: { assessmentId, remarks }
    });

    res.json({
        success: true,
        message: `Property tax assessment ${assessmentId} verified successfully for parcel ${taxRecord.parcelId}.`,
        data: taxRecord
    });
});

// POST Verify Tax Payment Record
router.post("/property-tax/payments/:paymentId/verify", requirePermission("tax.verify"), (req, res) => {
    const { paymentId } = req.params;
    const { remarks } = req.body;

    const taxRecord = propertyTaxData.find(r => (r.paymentReference || "").toUpperCase() === paymentId.toUpperCase() || (r.parcelId || "").toUpperCase() === paymentId.toUpperCase());
    if (!taxRecord) return res.status(404).json({ success: false, message: "Tax payment record not found." });

    if (!canAccessParcel(req.user, taxRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    taxRecord.amountPaid = taxRecord.taxDemand || taxRecord.annualTax;
    taxRecord.outstandingAmount = 0;
    taxRecord.penalty = 0;
    taxRecord.totalDue = 0;
    taxRecord.paymentStatus = "Paid";
    taxRecord.taxClearanceStatus = "CLEARED";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_PAYMENT_VERIFIED",
        result: "SUCCESS",
        details: { paymentId, amountPaid: taxRecord.amountPaid, remarks }
    });

    res.json({
        success: true,
        message: `Tax payment verified for parcel ${taxRecord.parcelId}. Dues cleared in full.`,
        data: taxRecord
    });
});

// POST Approve Tax Clearance Request (STRICT OUTSTANDING DUES CHECK)
router.post("/property-tax/clearance-requests/:requestId/approve", requirePermission("tax.verify"), (req, res) => {
    const { requestId } = req.params;
    const { remarks } = req.body;

    const taxRecord = propertyTaxData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase() || (r.parcelId || "").toUpperCase() === requestId.toUpperCase());
    if (!taxRecord) return res.status(404).json({ success: false, message: "Property tax clearance request not found." });

    if (!canAccessParcel(req.user, taxRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    // STRICT CHECK: Outstanding Dues Must Be ZERO
    if ((taxRecord.outstandingAmount || 0) > 0) {
        return res.status(400).json({
            success: false,
            error: "TAX_OUTSTANDING",
            message: `Property tax clearance cannot be issued: Parcel ${taxRecord.parcelId} has ₹ ${(taxRecord.outstandingAmount || 0).toLocaleString()} in outstanding tax dues. Dues must be cleared before issuing clearance.`
        });
    }

    // Perform Approval
    const timestamp = new Date().toISOString();
    taxRecord.taxClearanceStatus = "CLEARED";
    taxRecord.status = "CLEARED";
    taxRecord.currentStage = "COMPLETED";
    taxRecord.approvedBy = req.user.officerId || req.user.name;
    taxRecord.approvedAt = timestamp;
    taxRecord.approvalRemarks = remarks || "Property tax clearance issued following zero outstanding dues verification.";

    if (taxRecord.clearanceRequests) {
        taxRecord.clearanceRequests.forEach(cr => {
            cr.status = "CLEARED";
        });
    }

    // Update matching Registration record tax clearance checklist
    registrationData.forEach(reg => {
        if (reg.parcelId.toUpperCase() === taxRecord.parcelId.toUpperCase()) {
            reg.taxClearanceStatus = "CLEARED";
            if (reg.checklist) reg.checklist.taxClearance = "CLEARED";
            if (reg.requests) {
                reg.requests.forEach(reqItem => {
                    if (reqItem.toDepartment.includes("Property Tax")) {
                        reqItem.status = "RESPONDED";
                    }
                });
            }
        }
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_CLEARANCE_APPROVED",
        result: "SUCCESS",
        details: { requestId, parcelId: taxRecord.parcelId, remarks }
    });

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_CLEARANCE_VERIFIED",
        result: "SUCCESS",
        details: { clearedAmount: taxRecord.amountPaid, remarks }
    });

    res.json({
        success: true,
        message: `Property tax clearance ${requestId} approved successfully! Parcel ${taxRecord.parcelId} status updated to CLEARED. Registration clearance checklist updated.`,
        data: taxRecord
    });
});

// POST Reject Tax Clearance Request
router.post("/property-tax/clearance-requests/:requestId/reject", requirePermission("tax.verify"), (req, res) => {
    const { requestId } = req.params;
    const { rejectionReason, remarks } = req.body;

    const taxRecord = propertyTaxData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase() || (r.parcelId || "").toUpperCase() === requestId.toUpperCase());
    if (!taxRecord) return res.status(404).json({ success: false, message: "Property tax clearance request not found." });

    if (!canAccessParcel(req.user, taxRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    const timestamp = new Date().toISOString();
    taxRecord.taxClearanceStatus = "REJECTED";
    taxRecord.status = "REJECTED";
    taxRecord.rejectionReason = rejectionReason || "Outstanding Municipal Dues";
    taxRecord.rejectedBy = req.user.officerId || req.user.name;
    taxRecord.rejectedAt = timestamp;
    taxRecord.rejectionRemarks = remarks || "Tax clearance rejected by municipal tax officer.";

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_CLEARANCE_REJECTED",
        result: "SUCCESS",
        details: { requestId, rejectionReason, remarks }
    });

    res.json({
        success: true,
        message: `Property tax clearance request ${requestId} rejected. Reason: ${taxRecord.rejectionReason}`,
        data: taxRecord
    });
});

// POST Request Additional Information / Correction
router.post("/property-tax/clearance-requests/:requestId/more-info", requirePermission("tax.verify"), (req, res) => {
    const { requestId } = req.params;
    const { infoRequired, reason } = req.body;

    const taxRecord = propertyTaxData.find(r => (r.requestId || "").toUpperCase() === requestId.toUpperCase() || (r.parcelId || "").toUpperCase() === requestId.toUpperCase());
    if (!taxRecord) return res.status(404).json({ success: false, message: "Property tax clearance request not found." });

    if (!canAccessParcel(req.user, taxRecord.parcelId)) {
        return res.status(403).json({ success: false, message: "Unauthorized parcel access." });
    }

    taxRecord.status = "MORE_INFORMATION_REQUIRED";
    taxRecord.infoRequired = infoRequired;
    taxRecord.infoReason = reason;

    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: taxRecord.parcelId,
        action: "TAX_CLEARANCE_INFORMATION_REQUESTED",
        result: "SUCCESS",
        details: { requestId, infoRequired, reason }
    });

    res.json({
        success: true,
        message: `Information request logged for tax clearance ${requestId}. Status: MORE_INFORMATION_REQUIRED.`,
        data: taxRecord
    });
});

module.exports = router;
