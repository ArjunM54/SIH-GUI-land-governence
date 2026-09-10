/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   IMAGERY & CHANGE DETECTION ROUTES

   Endpoints for satellite/drone imagery, comparison,
   change detection, and verification requests.
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const auditService = require("../services/auditService");
const parcels = require("../data/parcels");
const imageryData = require("../data/imagery");
const MockImageryProvider = require("../services/imagery/mockImageryProvider");
const { detectChanges, getChangeTimeline, CHANGE_CATEGORIES } = require("../services/imagery/changeDetectionService");
const { createDepartmentRequest } = require("../data/departmentRequests");
const cadastralData = require("../data/cadastral");

/* All routes require authentication */
router.use(requireAuth);

/* Initialize mock provider */
const imageryProvider = new MockImageryProvider();

/* =========================================================
   1. GET /api/imagery/:parcelId
   Get all imagery records for a parcel
   ========================================================= */

router.get("/:parcelId", async (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view imagery for this parcel."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const imagery = await imageryProvider.getImageryForParcel(targetParcelId);
        const satelliteImagery = imagery.filter(i => i.source === "SATELLITE");
        const droneImagery = imagery.filter(i => i.source === "DRONE");

        const changes = imageryData.getChangeDetection(targetParcelId);

        /* Audit: imagery viewed */
        auditService.logEvent({
            actor: req.user.officerId || req.user.uid || "CITIZEN",
            target: targetParcelId,
            action: "IMAGERY_VIEWED",
            result: "SUCCESS",
            details: {
                role: req.user.role,
                imageryCount: imagery.length,
                satelliteCount: satelliteImagery.length,
                droneCount: droneImagery.length
            }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            parcel: {
                id: parcel.id,
                surveyNumber: parcel.surveyNumber,
                location: `${parcel.village}, ${parcel.district}`,
                latitude: parcel.coordinates ? parcel.coordinates[0][0] : null,
                longitude: parcel.coordinates ? parcel.coordinates[0][1] : null,
                landUse: parcel.landUse,
                area: parcel.area
            },
            provider: imageryProvider.getInfo(),
            imagery: imagery.map(img => ({
                ...img,
                // Citizens see limited info
                ...(req.user.role === "citizen" ? {
                    surveyMetadata: undefined,
                    metadata: undefined
                } : {})
            })),
            satelliteCount: satelliteImagery.length,
            droneCount: droneImagery.length,
            hasChanges: changes.length > 0,
            isDemo: true,
            disclaimer: "Demo imagery data. Real satellite/drone integration pending."
        });
    } catch (e) {
        console.error("[Imagery GET Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   2. GET /api/imagery/:parcelId/timeline
   Get land-use change timeline for a parcel
   ========================================================= */

router.get("/:parcelId/timeline", async (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view this timeline."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const timelineResult = getChangeTimeline(targetParcelId);
        const imagery = await imageryProvider.getSatelliteImagery(targetParcelId);

        auditService.logEvent({
            actor: req.user.officerId || req.user.uid || "CITIZEN",
            target: targetParcelId,
            action: "TIMELINE_VIEWED",
            result: "SUCCESS",
            details: { role: req.user.role }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            timeline: timelineResult.data,
            imageryDates: imagery.map(i => ({ id: i.id, date: i.date, source: i.source, provider: i.provider })),
            isDemo: true,
            disclaimer: "Demo timeline data. Based on simulated satellite analysis."
        });
    } catch (e) {
        console.error("[Imagery Timeline Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   3. GET /api/imagery/:parcelId/compare
   Compare before and after imagery
   ========================================================= */

router.get("/:parcelId/compare", async (req, res) => {
    try {
        const { parcelId } = req.params;
        const { before, after } = req.query;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to compare imagery for this parcel."
            });
        }

        if (!before || !after) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Both 'before' and 'after' query parameters are required (ISO date format)."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const comparison = imageryData.getComparisonResult(targetParcelId, before, after);

        /* Also run change detection for the date range */
        const changeResult = detectChanges(targetParcelId, before, after);

        auditService.logEvent({
            actor: req.user.officerId || req.user.uid || "CITIZEN",
            target: targetParcelId,
            action: "COMPARISON_PERFORMED",
            result: "SUCCESS",
            details: {
                role: req.user.role,
                beforeDate: before,
                afterDate: after
            }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            comparison: {
                before: comparison.before,
                after: comparison.after,
                beforeDate: before,
                afterDate: after
            },
            changeDetection: changeResult.success ? changeResult.data : null,
            changeCategories: Object.keys(CHANGE_CATEGORIES).map(key => ({
                key,
                ...CHANGE_CATEGORIES[key]
            })),
            isDemo: true,
            disclaimer: "Demo comparison data. Real imagery integration pending."
        });
    } catch (e) {
        console.error("[Imagery Compare Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   4. GET /api/imagery/:parcelId/changes
   Get detected changes for a parcel
   ========================================================= */

router.get("/:parcelId/changes", async (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view changes for this parcel."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const changes = imageryData.getChangeDetection(targetParcelId);

        auditService.logEvent({
            actor: req.user.officerId || req.user.uid || "CITIZEN",
            target: targetParcelId,
            action: "CHANGES_VIEWED",
            result: "SUCCESS",
            details: {
                role: req.user.role,
                changeCount: changes.length
            }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            changes: changes.map(c => ({
                ...c,
                changeCategories: Object.keys(CHANGE_CATEGORIES).map(key => ({
                    key,
                    ...CHANGE_CATEGORIES[key]
                }))
            })),
            changeCategories: Object.keys(CHANGE_CATEGORIES).map(key => ({
                key,
                ...CHANGE_CATEGORIES[key]
            })),
            totalChanges: changes.length,
            isDemo: true,
            disclaimer: "Demo change detection data. Not actual AI predictions."
        });
    } catch (e) {
        console.error("[Imagery Changes Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   5. GET /api/imagery/:parcelId/drone
   Get drone imagery for a parcel (officer/admin only)
   ========================================================= */

router.get("/:parcelId/drone", requireRole("officer", "admin"), async (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view drone imagery for this parcel."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const droneImagery = await imageryProvider.getDroneImagery(targetParcelId);

        auditService.logEvent({
            actor: req.user.officerId || req.user.uid,
            target: targetParcelId,
            action: "DRONE_IMAGERY_VIEWED",
            result: "SUCCESS",
            details: {
                role: req.user.role,
                officerId: req.user.officerId,
                droneCount: droneImagery.length
            }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            droneImagery: droneImagery,
            count: droneImagery.length,
            isDemo: true,
            disclaimer: "Demo drone imagery data."
        });
    } catch (e) {
        console.error("[Imagery Drone Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   6. POST /api/imagery/:parcelId/verification-request
   Create a department verification request for a detected change
   ========================================================= */

router.post("/:parcelId/verification-request", requireRole("officer", "admin"), async (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();
        const { changeId, toDepartment, reason, priority } = req.body;

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to create requests for this parcel."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        if (!toDepartment) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "toDepartment is required."
            });
        }

        /* Find survey number */
        let surveyNumber = parcel.surveyNumber || "N/A";
        const cadastral = cadastralData.find(c => c.parcelId && c.parcelId.toUpperCase() === targetParcelId);
        if (cadastral && cadastral.surveyNumber) {
            surveyNumber = cadastral.surveyNumber;
        }

        /* Determine change details if changeId provided */
        let changeDetails = null;
        if (changeId) {
            const allChanges = imageryData.getChangeDetection(targetParcelId);
            changeDetails = allChanges.find(c => c.changeId === changeId);
        }

        /* Create department request using existing system */
        const newRequest = createDepartmentRequest({
            parcelId: targetParcelId,
            surveyNumber,
            fromOfficerId: req.user.officerId || req.user.uid,
            fromOfficerName: req.user.name || "Officer",
            fromDepartment: req.user.department || "Satellite Monitoring Unit",
            toDepartment: toDepartment,
            requestType: "VERIFY",
            requiredWork: "VERIFY_IMAGERY_CHANGE",
            priority: priority || "HIGH",
            reason: reason || (changeDetails
                ? `Satellite change detection: ${changeDetails.changeLabel}. Category: ${changeDetails.changeCategory}. Confidence: ${changeDetails.confidence}%. Governance: ${changeDetails.governanceResult?.status || 'UNKNOWN'}. Requires field verification.`
                : "Imagery change detection verification request."),
            expectedResponse: "Field verification of satellite-detected change"
        });

        /* Audit: verification requested */
        auditService.logEvent({
            actor: req.user.officerId || req.user.uid,
            target: targetParcelId,
            action: "VERIFICATION_REQUESTED",
            result: "SUCCESS",
            details: {
                requestId: newRequest.requestId,
                changeId: changeId || null,
                toDepartment,
                changeCategory: changeDetails?.changeCategory || null,
                confidence: changeDetails?.confidence || null,
                role: req.user.role
            }
        });

        res.status(201).json({
            success: true,
            message: "Verification request created successfully.",
            data: {
                requestId: newRequest.requestId,
                parcelId: targetParcelId,
                changeId: changeId || null,
                toDepartment,
                status: "PENDING",
                createdAt: newRequest.createdAt
            }
        });
    } catch (e) {
        console.error("[Imagery Verification Request Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

module.exports = router;
