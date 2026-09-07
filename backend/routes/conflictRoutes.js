/* =========================================================
   LANDGOV GIS
   LAND CONFLICT MANAGEMENT API ROUTES (PROTECTED)
   (PHASE 12K)
   ========================================================= */

const express = require("express");
const router = express.Router();
const { getLandProfile, getAllLandProfiles } = require("../data/landProfile");
const { detectLandConflicts } = require("../services/conflictDetector");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const { filterConflictData } = require("../services/accessControlService");
const auditService = require("../services/auditService");
const {
    getAllConflicts,
    getConflictById,
    getConflictsByParcel,
    updateConflict,
    createConflict
} = require("../data/conflicts");
const { createDepartmentRequest } = require("../data/departmentRequests");

router.use(requireAuth);

/**
 * GET /api/conflicts
 * List conflicts accessible by user with optional filtering
 */
router.get("/", (req, res) => {
    try {
        const { parcelId, severity, status, department, category, myConflicts } = req.query;
        let profiles = getAllLandProfiles();

        // Filter profiles by parcel authorization
        profiles = profiles.filter(p => canAccessParcel(req.user, p.parcelId));

        if (parcelId) {
            const pid = String(parcelId).trim().toUpperCase();
            if (!canAccessParcel(req.user, pid)) {
                return res.status(403).json({
                    success: false,
                    error: "FORBIDDEN",
                    message: "You do not have permission to view conflicts for this parcel."
                });
            }
            profiles = profiles.filter(p => p.parcelId.toUpperCase() === pid);
        }

        let allConflictItems = [];
        profiles.forEach(p => {
            const report = detectLandConflicts(p);
            if (report.conflicts && report.conflicts.length > 0) {
                allConflictItems.push(...report.conflicts);
            }
        });

        // Filter by severity if specified
        if (severity) {
            const sev = String(severity).trim().toUpperCase();
            allConflictItems = allConflictItems.filter(c => (c.severity || "").toUpperCase() === sev);
        }

        // Filter by status if specified
        if (status) {
            const stat = String(status).trim().toUpperCase();
            allConflictItems = allConflictItems.filter(c => (c.status || "").toUpperCase() === stat);
        }

        // Filter by department if specified
        if (department) {
            const deptLower = String(department).toLowerCase().trim();
            allConflictItems = allConflictItems.filter(c => {
                if (c.affectedDepartments && Array.isArray(c.affectedDepartments)) {
                    return c.affectedDepartments.some(d => d.toLowerCase().includes(deptLower));
                }
                return false;
            });
        }

        // Filter by officer assignment if requested
        if (myConflicts === "true") {
            const officerId = req.user.officerId || req.user.uid;
            allConflictItems = allConflictItems.filter(c => c.assignedOfficer === officerId);
        }

        res.json({
            success: true,
            count: allConflictItems.length,
            data: allConflictItems
        });
    } catch (e) {
        console.error("[Conflict API GET List Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * GET /api/conflicts/parcel/:parcelId
 */
router.get("/parcel/:parcelId", (req, res) => {
    try {
        const parcelId = req.params.parcelId;
        if (!canAccessParcel(req.user, parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view conflicts for this parcel."
            });
        }

        const profile = getLandProfile(parcelId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Parcel not found."
            });
        }

        const report = detectLandConflicts(profile);
        const visibleData = filterConflictData(req.user, { parcelId, ...report });

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: parcelId,
            action: "VIEW_CONFLICT",
            result: "SUCCESS"
        });

        res.json({
            success: true,
            data: visibleData
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * GET /api/conflicts/:conflictId
 */
router.get("/:conflictId", (req, res) => {
    try {
        const { conflictId } = req.params;
        const targetId = String(conflictId).trim().toUpperCase();

        // Find in all profiles
        const profiles = getAllLandProfiles();
        let foundConflict = null;
        let foundParcelId = null;

        for (const p of profiles) {
            const report = detectLandConflicts(p);
            const item = (report.conflicts || []).find(c => c.id.toUpperCase() === targetId);
            if (item) {
                foundConflict = item;
                foundParcelId = p.parcelId;
                break;
            }
        }

        if (!foundConflict) {
            // Check stored conflicts fallback
            const stored = getConflictById(conflictId);
            if (stored) {
                foundConflict = stored;
                foundParcelId = stored.parcelId;
            }
        }

        if (!foundConflict) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Conflict record not found."
            });
        }

        if (!canAccessParcel(req.user, foundParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view conflicts for this parcel."
            });
        }

        res.json({
            success: true,
            data: foundConflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * POST /api/conflicts/check/:parcelId
 * Run manual consistency check across all departmental data layers for a parcel
 */
router.post("/check/:parcelId", (req, res) => {
    try {
        const parcelId = String(req.params.parcelId).trim().toUpperCase();
        if (!canAccessParcel(req.user, parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have access to run consistency checks on this parcel."
            });
        }

        const profile = getLandProfile(parcelId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: "Parcel not found."
            });
        }

        const report = detectLandConflicts(profile, null, req.body || {});
        const checkedLayers = [
            "Cadastral Survey GIS",
            "Record of Rights (RoR)",
            "Property Registration",
            "Land Use & Master Plan",
            "Property Tax & Municipal",
            "Building Permission",
            "Development Restrictions",
            "Documents & Deeds",
            "Utilities & Infrastructure"
        ];

        auditService.logEvent({
            actor: req.user.officerId || req.user.email,
            target: parcelId,
            action: "CONSISTENCY_CHECK_EXECUTED",
            result: "SUCCESS",
            details: {
                totalChecked: checkedLayers.length,
                conflictsFound: report.conflictCount,
                highestSeverity: report.highestSeverity
            }
        });

        res.json({
            success: true,
            message: "Consistency check completed.",
            data: {
                parcelId,
                recordsCheckedCount: checkedLayers.length,
                checkedLayers,
                conflictsFoundCount: report.conflictCount,
                openConflictsCount: report.openConflictCount,
                highestSeverity: report.highestSeverity,
                summary: report.summary,
                conflicts: report.conflicts
            }
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/conflicts/:conflictId/assign
 */
router.put("/:conflictId/assign", (req, res) => {
    try {
        const { conflictId } = req.params;
        const { assignedOfficer, assignedDepartment } = req.body;

        let conflict = getConflictById(conflictId);
        if (!conflict) {
            // Find parcel from conflict
            const profiles = getAllLandProfiles();
            for (const p of profiles) {
                const report = detectLandConflicts(p);
                const match = (report.conflicts || []).find(c => c.id.toUpperCase() === String(conflictId).toUpperCase());
                if (match) {
                    conflict = createConflict(match);
                    break;
                }
            }
        }

        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        conflict.assignedOfficer = assignedOfficer || officerId;
        conflict.assignedDepartment = assignedDepartment || conflict.assignedDepartment;
        if (conflict.status === "OPEN") conflict.status = "UNDER_REVIEW";

        conflict.timeline.push({
            timestamp: now,
            event: "Conflict Assigned",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: `Assigned to officer ${conflict.assignedOfficer}.`
        });

        auditService.logEvent({
            actor: officerId,
            target: conflict.parcelId,
            action: "CONFLICT_ASSIGNED",
            result: "SUCCESS",
            details: { conflictId: conflict.id, assignedOfficer: conflict.assignedOfficer }
        });

        res.json({
            success: true,
            message: "Conflict assigned successfully.",
            data: conflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/conflicts/:conflictId/start-review
 */
router.put("/:conflictId/start-review", (req, res) => {
    try {
        const { conflictId } = req.params;
        let conflict = getConflictById(conflictId);

        if (!conflict) {
            const profiles = getAllLandProfiles();
            for (const p of profiles) {
                const report = detectLandConflicts(p);
                const match = (report.conflicts || []).find(c => c.id.toUpperCase() === String(conflictId).toUpperCase());
                if (match) {
                    conflict = createConflict(match);
                    break;
                }
            }
        }

        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        conflict.status = "UNDER_REVIEW";
        conflict.timeline.push({
            timestamp: now,
            event: "Review Started",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: "Officer commenced conflict review."
        });

        auditService.logEvent({
            actor: officerId,
            target: conflict.parcelId,
            action: "CONFLICT_REVIEW_STARTED",
            result: "SUCCESS",
            details: { conflictId: conflict.id }
        });

        res.json({
            success: true,
            message: "Conflict review started.",
            data: conflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * POST /api/conflicts/:conflictId/request-verification
 * Generate Phase 11F Department Request from a conflict
 */
router.post("/:conflictId/request-verification", (req, res) => {
    try {
        const { conflictId } = req.params;
        const { toDepartment, requestType, requiredWork, priority, reason } = req.body;

        let conflict = getConflictById(conflictId);
        if (!conflict) {
            const profiles = getAllLandProfiles();
            for (const p of profiles) {
                const report = detectLandConflicts(p);
                const match = (report.conflicts || []).find(c => c.id.toUpperCase() === String(conflictId).toUpperCase());
                if (match) {
                    conflict = createConflict(match);
                    break;
                }
            }
        }

        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const targetDept = toDepartment || (conflict.affectedDepartments && conflict.affectedDepartments[0]) || "Land Records Department";
        const reqType = requestType || "VERIFY";
        const reqWork = requiredWork || "CONFLICT_REVIEW";

        const newRequest = createDepartmentRequest({
            parcelId: conflict.parcelId,
            surveyNumber: conflict.surveyNumber,
            fromOfficerId: req.user.officerId || req.user.uid,
            fromOfficerName: req.user.name || "Officer",
            fromDepartment: req.user.department || "Governance Administration",
            toDepartment: targetDept,
            requestType: reqType,
            requiredWork: reqWork,
            priority: priority || conflict.severity || "HIGH",
            reason: reason || `Inter-departmental verification requested to resolve conflict ${conflict.id}: ${conflict.title}`
        });

        const now = new Date().toISOString();
        conflict.status = "REQUEST_SENT";
        conflict.relatedRequestId = newRequest.requestId;
        conflict.timeline.push({
            timestamp: now,
            event: "Verification Request Sent",
            actor: `${req.user.name || 'Officer'} (${req.user.officerId || 'OFF-001'})`,
            notes: `Created department request ${newRequest.requestId} to ${targetDept}.`
        });

        auditService.logEvent({
            actor: req.user.officerId || req.user.uid,
            target: conflict.parcelId,
            action: "CONFLICT_REQUEST_SENT",
            result: "SUCCESS",
            details: { conflictId: conflict.id, requestId: newRequest.requestId, toDepartment: targetDept }
        });

        res.status(201).json({
            success: true,
            message: "Verification request created successfully.",
            data: {
                conflict,
                request: newRequest
            }
        });
    } catch (e) {
        console.error("[Conflict Request Verification Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/conflicts/:conflictId/resolve
 */
router.put("/:conflictId/resolve", (req, res) => {
    try {
        const { conflictId } = req.params;
        const { resolutionRemark } = req.body;

        if (!resolutionRemark || String(resolutionRemark).trim() === "") {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "A resolution remark is required before resolving a conflict."
            });
        }

        let conflict = getConflictById(conflictId);
        if (!conflict) {
            const profiles = getAllLandProfiles();
            for (const p of profiles) {
                const report = detectLandConflicts(p);
                const match = (report.conflicts || []).find(c => c.id.toUpperCase() === String(conflictId).toUpperCase());
                if (match) {
                    conflict = createConflict(match);
                    break;
                }
            }
        }

        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        conflict.status = "RESOLVED";
        conflict.resolutionRemark = String(resolutionRemark).trim();
        conflict.resolvedAt = now;
        conflict.resolvedBy = officerId;

        conflict.timeline.push({
            timestamp: now,
            event: "Conflict Resolved",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: `Resolved: ${conflict.resolutionRemark}`
        });

        auditService.logEvent({
            actor: officerId,
            target: conflict.parcelId,
            action: "CONFLICT_RESOLVED",
            result: "SUCCESS",
            details: { conflictId: conflict.id, resolutionRemark: conflict.resolutionRemark }
        });

        res.json({
            success: true,
            message: "Conflict marked as resolved.",
            data: conflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/conflicts/:conflictId/dismiss
 */
router.put("/:conflictId/dismiss", (req, res) => {
    try {
        const { conflictId } = req.params;
        const { resolutionRemark } = req.body;

        if (!resolutionRemark || String(resolutionRemark).trim() === "") {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "A resolution remark is required before dismissing a conflict."
            });
        }

        let conflict = getConflictById(conflictId);
        if (!conflict) {
            const profiles = getAllLandProfiles();
            for (const p of profiles) {
                const report = detectLandConflicts(p);
                const match = (report.conflicts || []).find(c => c.id.toUpperCase() === String(conflictId).toUpperCase());
                if (match) {
                    conflict = createConflict(match);
                    break;
                }
            }
        }

        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        conflict.status = "DISMISSED";
        conflict.resolutionRemark = String(resolutionRemark).trim();
        conflict.dismissedAt = now;
        conflict.dismissedBy = officerId;

        conflict.timeline.push({
            timestamp: now,
            event: "Conflict Dismissed",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: `Dismissed: ${conflict.resolutionRemark}`
        });

        auditService.logEvent({
            actor: officerId,
            target: conflict.parcelId,
            action: "CONFLICT_DISMISSED",
            result: "SUCCESS",
            details: { conflictId: conflict.id, resolutionRemark: conflict.resolutionRemark }
        });

        res.json({
            success: true,
            message: "Conflict dismissed.",
            data: conflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/**
 * PUT /api/conflicts/:conflictId/reopen
 */
router.put("/:conflictId/reopen", (req, res) => {
    try {
        const { conflictId } = req.params;
        const { reason } = req.body;

        let conflict = getConflictById(conflictId);
        if (!conflict) {
            return res.status(404).json({ success: false, error: "NOT_FOUND", message: "Conflict not found." });
        }

        if (!canAccessParcel(req.user, conflict.parcelId)) {
            return res.status(403).json({ success: false, error: "FORBIDDEN", message: "Parcel access forbidden." });
        }

        const now = new Date().toISOString();
        const officerId = req.user.officerId || req.user.uid;

        conflict.status = "REOPENED";
        conflict.reopenedAt = now;
        conflict.timeline.push({
            timestamp: now,
            event: "Conflict Reopened",
            actor: `${req.user.name || 'Officer'} (${officerId})`,
            notes: reason || "Reopened due to recurring inconsistency."
        });

        auditService.logEvent({
            actor: officerId,
            target: conflict.parcelId,
            action: "CONFLICT_REOPENED",
            result: "SUCCESS",
            details: { conflictId: conflict.id, reason }
        });

        res.json({
            success: true,
            message: "Conflict reopened.",
            data: conflict
        });
    } catch (e) {
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

module.exports = router;
