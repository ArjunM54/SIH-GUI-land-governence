/* =========================================================
   LANDGOV GIS
   INTER-DEPARTMENTAL PARCEL VERIFICATION REQUEST ROUTES
   (PHASE 11F)
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const auditService = require("../services/auditService");
const cadastralData = require("../data/cadastral");
const rorData = require("../data/ror");
const propertyTaxData = require("../data/PropertyTax");

const {
    getAllRequests,
    getRequestById,
    getRequestsByParcel,
    checkDuplicateActiveRequest,
    createDepartmentRequest,
    updateRequest,
    normalizeDeptName
} = require("../data/departmentRequests");

// All routes require authentication
router.use(requireAuth);

/**
 * Helper to verify target department authorization for responding/processing a request
 */
function isAuthorizedTargetOfficer(user, request) {
    if (!user || !request) return false;
    if (user.role === "admin") return true;

    const userDept = normalizeDeptName(user.department);
    const targetDept = normalizeDeptName(request.to.department);

    return userDept === targetDept;
}

/**
 * Helper to verify requester authorization
 */
function isAuthorizedRequester(user, request) {
    if (!user || !request) return false;
    if (user.role === "admin") return true;

    if (request.from.officerId && user.officerId && request.from.officerId === user.officerId) return true;

    const userDept = normalizeDeptName(user.department);
    const fromDept = normalizeDeptName(request.from.department);

    return userDept === fromDept;
}

/**
 * GET /api/department-requests
 * Query options: parcelId, status, fromDepartment, toDepartment, myRequests
 */
router.get("/", (req, res) => {
    try {
        let requests = getAllRequests();
        const { parcelId, status, fromDepartment, toDepartment, myRequests } = req.query;
        const now = new Date();

        // Dynamically append overdue SLA flag
        requests = requests.map(r => {
            const isCompletedOrClosed = ["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status);
            const isOverdue = !isCompletedOrClosed && r.dueAt && new Date(r.dueAt) < now;
            return {
                ...r,
                isOverdue
            };
        });

        // Filter by parcelId if specified
        if (parcelId) {
            const pid = String(parcelId).trim().toUpperCase();
            if (!canAccessParcel(req.user, pid)) {
                return res.status(403).json({
                    success: false,
                    error: "FORBIDDEN",
                    message: "You do not have permission to access this parcel."
                });
            }
            requests = requests.filter(r => r.parcelId.toUpperCase() === pid);
        }

        // Filter by status if specified
        if (status) {
            const stat = String(status).trim().toUpperCase();
            if (stat === "OVERDUE") {
                requests = requests.filter(r => r.isOverdue);
            } else {
                requests = requests.filter(r => r.status.toUpperCase() === stat);
            }
        }

        // Filter by fromDepartment / toDepartment if specified
        if (fromDepartment) {
            const normFrom = normalizeDeptName(fromDepartment);
            requests = requests.filter(r => normalizeDeptName(r.from.department) === normFrom);
        }

        if (toDepartment) {
            const normTo = normalizeDeptName(toDepartment);
            requests = requests.filter(r => normalizeDeptName(r.to.department) === normTo);
        }

        // Filter for specific officer / department queue if requested or non-admin default
        if (myRequests === "true" || req.user.role === "officer") {
            const userDept = normalizeDeptName(req.user.department);
            const userOfficerId = req.user.officerId;

            requests = requests.filter(r => {
                const isToUserDept = normalizeDeptName(r.to.department) === userDept;
                const isFromUserDept = normalizeDeptName(r.from.department) === userDept;
                const isFromUser = userOfficerId && r.from.officerId === userOfficerId;
                const isAuthorizedForParcel = canAccessParcel(req.user, r.parcelId);

                return (isToUserDept || isFromUserDept || isFromUser) && isAuthorizedForParcel;
            });
        }

        // Sort URGENT first, then newest first
        requests.sort((a, b) => {
            if (a.priority === "URGENT" && b.priority !== "URGENT") return -1;
            if (b.priority === "URGENT" && a.priority !== "URGENT") return 1;
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (e) {
        console.error("[Department Requests GET Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * GET /api/department-requests/:requestId
 */
router.get("/:requestId", (req, res) => {
    try {
        const { requestId } = req.params;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Request not found."
            });
        }

        if (!canAccessParcel(req.user, request.parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to access this parcel request."
            });
        }

        const now = new Date();
        const isCompletedOrClosed = ["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status);
        const isOverdue = !isCompletedOrClosed && request.dueAt && new Date(request.dueAt) < now;

        res.json({
            success: true,
            data: {
                ...request,
                isOverdue
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * POST /api/department-requests
 * Create a new inter-departmental verification request
 */
router.post("/", (req, res) => {
    try {
        const { parcelId, toDepartment, requestType, requiredWork, priority, reason, expectedResponse } = req.body;

        if (!parcelId || !toDepartment || !requestType || !requiredWork) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Missing required fields (parcelId, toDepartment, requestType, requiredWork)."
            });
        }

        const targetParcelId = String(parcelId).trim().toUpperCase();

        // 1. Parcel Authorization Check
        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have access to this parcel."
            });
        }

        // 2. Department Check - Prevent requesting from same department unless admin/explicit
        const userDept = normalizeDeptName(req.user.department || "Officer Department");
        const targetDept = normalizeDeptName(toDepartment);

        if (userDept === targetDept && req.user.role !== "admin") {
            return res.status(400).json({
                success: false,
                error: "INVALID_TARGET",
                message: "Inter-departmental requests cannot be sent to your own department."
            });
        }

        // 3. Prevent Duplicate Active Requests
        const isDuplicate = checkDuplicateActiveRequest(targetParcelId, userDept, targetDept, requiredWork);
        if (isDuplicate) {
            return res.status(409).json({
                success: false,
                error: "DUPLICATE_REQUEST",
                message: "An active request already exists for this parcel, target department, and required work."
            });
        }

        // Find survey number if available
        let surveyNumber = "SUR-101";
        const cadastral = cadastralData.find(c => c.parcelId.toUpperCase() === targetParcelId);
        if (cadastral && cadastral.surveyNumber) {
            surveyNumber = cadastral.surveyNumber;
        }

        // Create request record
        const newRequest = createDepartmentRequest({
            parcelId: targetParcelId,
            surveyNumber,
            fromOfficerId: req.user.officerId || req.user.uid,
            fromOfficerName: req.user.name || "Officer",
            fromDepartment: userDept,
            toDepartment: targetDept,
            requestType,
            requiredWork,
            priority,
            reason,
            expectedResponse
        });

        // Audit Trail Event
        auditService.logEvent({
            actor: req.user.officerId || req.user.uid,
            target: targetParcelId,
            action: "DEPARTMENT_REQUEST_CREATED",
            result: "SUCCESS",
            details: {
                requestId: newRequest.requestId,
                fromDepartment: userDept,
                toDepartment: targetDept,
                requestType,
                requiredWork,
                priority,
                reason
            }
        });

        res.status(201).json({
            success: true,
            message: "Request sent successfully.",
            data: newRequest
        });
    } catch (e) {
        console.error("[Department Request Create Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/accept
 */
router.put("/:requestId/accept", (req, res) => {
    try {
        const { requestId } = req.params;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        // Target Department Authorization Check
        if (!isAuthorizedTargetOfficer(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You are not authorized to process this request. Only target department officers can accept."
            });
        }

        // Status Transition Check
        if (request.status !== "PENDING") {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: `Invalid request status transition. Cannot accept request in '${request.status}' status.`
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;
        const officerName = req.user.name || "Officer";

        const timelineItem = {
            timestamp: now,
            event: "Request accepted",
            actor: `${officerName} (${officerId})`,
            notes: `Accepted by ${normalizeDeptName(req.user.department)}.`
        };

        request.status = "ACCEPTED";
        request.acceptedAt = now;
        request.acceptedBy = officerId;
        request.to.officerId = officerId;
        request.timeline.push(timelineItem);

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_ACCEPTED",
            result: "SUCCESS",
            details: { requestId: request.requestId, acceptedBy: officerId }
        });

        res.json({
            success: true,
            message: "Request accepted successfully.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/start
 */
router.put("/:requestId/start", (req, res) => {
    try {
        const { requestId } = req.params;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!isAuthorizedTargetOfficer(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You are not authorized to process this request."
            });
        }

        if (!["ACCEPTED", "MORE_INFORMATION_REQUIRED"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: `Invalid request status transition. Cannot start work on request in '${request.status}' status.`
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;
        const officerName = req.user.name || "Officer";

        request.status = "IN_PROGRESS";
        request.startedAt = request.startedAt || now;
        request.timeline.push({
            timestamp: now,
            event: "Verification work started",
            actor: `${officerName} (${officerId})`,
            notes: "Officer commenced parcel investigation."
        });

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_STARTED",
            result: "SUCCESS",
            details: { requestId: request.requestId }
        });

        res.json({
            success: true,
            message: "Verification work started.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/more-info
 */
router.put("/:requestId/more-info", (req, res) => {
    try {
        const { requestId } = req.params;
        const { notes } = req.body;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!isAuthorizedTargetOfficer(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You are not authorized to process this request."
            });
        }

        if (!["ACCEPTED", "IN_PROGRESS"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: `Cannot request more info on a request in '${request.status}' status.`
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        request.status = "MORE_INFORMATION_REQUIRED";
        request.timeline.push({
            timestamp: now,
            event: "More information requested",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: notes || "Target officer requested additional documentation or context."
        });

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_MORE_INFO",
            result: "SUCCESS",
            details: { requestId: request.requestId, notes }
        });

        res.json({
            success: true,
            message: "Information request logged.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/complete
 * Submit completion form and verification result
 */
router.put("/:requestId/complete", (req, res) => {
    try {
        const { requestId } = req.params;
        const { result, remarks, informationProvided, supportingDocument, verificationData } = req.body;

        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!isAuthorizedTargetOfficer(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You are not authorized to process this request. Only target department officers can complete."
            });
        }

        if (["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                error: "ALREADY_COMPLETED",
                message: "Request has already been completed or closed."
            });
        }

        if (!result) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Verification result is required to complete request."
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;
        const officerName = req.user.name || "Officer";

        const responseObj = {
            result: (result || "VERIFIED").toUpperCase(),
            remarks: remarks || informationProvided || "Department verification completed successfully.",
            informationProvided: informationProvided || remarks || "",
            supportingDocument: supportingDocument || null,
            verificationData: verificationData || {},
            completedBy: officerId,
            completedByName: officerName,
            completedAt: now
        };

        request.status = "COMPLETED";
        request.completedAt = now;
        request.completedBy = officerId;
        request.response = responseObj;

        request.timeline.push({
            timestamp: now,
            event: "Verification completed",
            actor: `${officerName} (${officerId})`,
            notes: `Result: ${responseObj.result}. Remarks: ${responseObj.remarks}`
        });

        // Audit Trail Event
        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_COMPLETED",
            result: "SUCCESS",
            details: {
                requestId: request.requestId,
                result: responseObj.result,
                remarks: responseObj.remarks,
                completedBy: officerId
            }
        });

        res.json({
            success: true,
            message: "Request completed successfully.",
            data: request
        });
    } catch (e) {
        console.error("[Department Request Complete Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/reject
 */
router.put("/:requestId/reject", (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason, remarks } = req.body;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!isAuthorizedTargetOfficer(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You are not authorized to reject this request."
            });
        }

        if (["COMPLETED", "REJECTED", "CANCELLED"].includes(request.status)) {
            return res.status(400).json({
                success: false,
                error: "INVALID_STATE",
                message: "Request is already closed."
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        request.status = "REJECTED";
        request.rejectedAt = now;
        request.rejectedBy = officerId;
        request.response = {
            result: "REJECTED",
            remarks: reason || remarks || "Request rejected by target department.",
            rejectedBy: officerId,
            rejectedAt: now
        };

        request.timeline.push({
            timestamp: now,
            event: "Request rejected",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: reason || remarks || "Request rejected."
        });

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_REJECTED",
            result: "SUCCESS",
            details: { requestId: request.requestId, reason: reason || remarks }
        });

        res.json({
            success: true,
            message: "Request rejected.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/escalate
 */
router.put("/:requestId/escalate", (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!canAccessParcel(req.user, request.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        request.status = "ESCALATED";
        request.escalatedAt = now;
        request.priority = "URGENT";

        request.timeline.push({
            timestamp: now,
            event: "Request escalated",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: reason || "Escalated due to priority/SLA breach."
        });

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_ESCALATED",
            result: "SUCCESS",
            details: { requestId: request.requestId, reason }
        });

        res.json({
            success: true,
            message: "Request escalated.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/department-requests/:requestId/cancel
 */
router.put("/:requestId/cancel", (req, res) => {
    try {
        const { requestId } = req.params;
        const { reason } = req.body;
        const request = getRequestById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Request not found." });
        }

        if (!isAuthorizedRequester(req.user, request)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Only the requesting officer or department can cancel this request."
            });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        request.status = "CANCELLED";
        request.cancelledAt = now;

        request.timeline.push({
            timestamp: now,
            event: "Request cancelled",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: reason || "Cancelled by requester."
        });

        auditService.logEvent({
            actor: officerId,
            target: request.parcelId,
            action: "DEPARTMENT_REQUEST_CANCELLED",
            result: "SUCCESS",
            details: { requestId: request.requestId, reason }
        });

        res.json({
            success: true,
            message: "Request cancelled.",
            data: request
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * GET /api/parcels/:parcelId/department-requests
 */
router.get("/parcels/:parcelId/department-requests", (req, res) => {
    try {
        const targetParcelId = String(req.params.parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to access requests for this parcel."
            });
        }

        const requests = getRequestsByParcel(targetParcelId);
        const now = new Date();

        const data = requests.map(r => ({
            ...r,
            isOverdue: !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status) && r.dueAt && new Date(r.dueAt) < now
        }));

        res.json({
            success: true,
            count: data.length,
            data
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

module.exports = router;
