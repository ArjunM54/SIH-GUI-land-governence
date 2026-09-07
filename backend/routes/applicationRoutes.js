/* =========================================================
   LANDGOV GIS
   REST API ROUTES FOR APPLICATIONS & DOCUMENT VIEWING
   ========================================================= */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const {
    applications,
    getApplicationsForCitizen,
    getApplicationById,
    submitOwnerChangeApplication,
    submitServiceApplication,
    updateVerificationStage,
    resubmitApplicationDocument,
    getApplicationTimeline
} = require("../services/applicationService");

const {
    getDocumentById,
    getDocumentsByApplicationId,
    resolveStoredFilePath,
    verifyDocumentRecord
} = require("../services/documentService");

const auditService = require("../services/auditService");

router.use(requireAuth);

/**
 * GET /api/applications
 * Returns applications accessible to the authenticated citizen or officer
 */
router.get("/", (req, res) => {
    try {
        if (req.user.role === "citizen") {
            const list = getApplicationsForCitizen(req.user);
            return res.json({ success: true, count: list.length, data: list, applications: list });
        }
        // Officer or Admin view
        const list = applications.filter(a => canAccessParcel(req.user, a.parcelId));
        return res.json({ success: true, count: list.length, data: list, applications: list });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * GET /api/applications/number/:applicationNumber
 * Find application by human-readable Application Number (e.g. LAND-2026-000142)
 */
router.get("/number/:applicationNumber", (req, res) => {
    try {
        const appNum = String(req.params.applicationNumber).trim().toUpperCase();
        const app = applications.find(a => (a.applicationId || "").toUpperCase() === appNum || (a.parcelId || "").toUpperCase() === appNum);
        if (!app) {
            return res.status(404).json({ success: false, message: `Application ${appNum} not found.` });
        }
        if (!canAccessParcel(req.user, app.parcelId) && req.user.role === "citizen" && app.citizenEmail.toLowerCase() !== req.user.email.toLowerCase()) {
            return res.status(403).json({ success: false, message: "Access denied to this application." });
        }
        const timeline = getApplicationTimeline(app.applicationId);
        const docs = getDocumentsByApplicationId(app.applicationId);
        return res.json({ success: true, application: app, data: app, timeline, documents: docs });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * GET /api/applications/:id
 * Get application details by ID
 */
router.get("/:id", (req, res) => {
    try {
        const appId = String(req.params.id).trim().toUpperCase();
        const app = getApplicationById(appId, req.user);
        if (!app) {
            return res.status(404).json({ success: false, message: `Application ${appId} not found.` });
        }
        const timeline = getApplicationTimeline(app.applicationId);
        const docs = getDocumentsByApplicationId(app.applicationId);
        return res.json({ success: true, application: app, data: app, timeline, documents: docs });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * GET /api/applications/:id/timeline
 * Get vertical tracking timeline for application
 */
router.get("/:id/timeline", (req, res) => {
    try {
        const appId = String(req.params.id).trim().toUpperCase();
        const timeline = getApplicationTimeline(appId);
        return res.json({ success: true, applicationId: appId, timeline });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * POST /api/applications
 * Create/submit application
 */
router.post("/", (req, res) => {
    try {
        const { type } = req.body;
        let app;
        if (type === "Owner Change" || type === "OWNER_CHANGE") {
            app = submitOwnerChangeApplication(req.user, req.body);
        } else {
            app = submitServiceApplication(req.user, req.body);
        }
        return res.status(201).json({ success: true, message: "Application submitted successfully.", application: app });
    } catch (e) {
        return res.status(500).json({ success: false, message: e.message });
    }
});

/**
 * PATCH /api/applications/:id/status
 * Authorized application status update
 */
router.patch("/:id/status", (req, res) => {
    try {
        const appId = String(req.params.id).trim().toUpperCase();

        const {
            status,
            remarks,
            deptKey,
            requestedDocument
        } = req.body;

        if (!appId) {
            return res.status(400).json({
                success: false,
                message: "Application ID is required."
            });
        }

        if (!deptKey) {
            return res.status(400).json({
                success: false,
                message: "Department key is required."
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Application decision is required."
            });
        }

        const app = applications.find(
            a =>
                String(a.applicationId).trim().toUpperCase() === appId
        );

        if (!app) {
            return res.status(404).json({
                success: false,
                message: `Application ${appId} not found.`
            });
        }

        if (!app.verifications || !app.verifications[deptKey]) {
            return res.status(400).json({
                success: false,
                message: `Invalid verification department: ${deptKey}`
            });
        }

        const result = updateVerificationStage(
            req.user,
            appId,
            deptKey,
            status,
            remarks || "",
            requestedDocument || ""
        );

        return res.status(200).json(result);

    } catch (error) {
        console.error("Application status update error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to update application status."
        });
    }
});

module.exports = router;