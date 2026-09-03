/* =========================================================
   LANDGOV GIS
   AUDIT TRAIL ROUTES (PROTECTED)

   Exposes REST endpoints for audit record retrieval and history.
   ========================================================= */

const express = require("express");
const router = express.Router();

const {
    getAuditRecord,
    getAuditsByParcel,
    listAudits
} = require("../services/auditService");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

/**
 * GET /api/audits
 * Lists audit records (Admin or Officer only)
 */
router.get("/", (req, res) => {
    try {
        if (req.user.role === "citizen") {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Citizens are not authorized to view global audit records."
            });
        }

        const limitParam = req.query.limit !== undefined ? req.query.limit : 20;
        const audits = listAudits(limitParam);

        return res.json({
            success: true,
            count: audits.length,
            limit: Math.min(Math.max(parseInt(limitParam, 10) || 20, 1), 100),
            data: audits
        });
    } catch (error) {
        console.error("[Audit API] Error in GET /api/audits:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error retrieving audit records."
        });
    }
});

/**
 * GET /api/audits/parcel/:parcelId
 * Retrieves validation audit records for an authorized parcel.
 */
router.get("/parcel/:parcelId", (req, res) => {
    try {
        const { parcelId } = req.params;
        if (!canAccessParcel(req.user, parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view audit history for this parcel."
            });
        }

        const audits = getAuditsByParcel(parcelId);

        return res.json({
            success: true,
            parcelId: parcelId.trim().toUpperCase(),
            count: audits.length,
            data: audits
        });
    } catch (error) {
        console.error("[Audit API] Error in GET /api/audits/parcel/:parcelId:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error retrieving parcel audit history."
        });
    }
});

/**
 * GET /api/audits/:auditId
 */
router.get("/:auditId", (req, res) => {
    try {
        const { auditId } = req.params;
        const record = getAuditRecord(auditId);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: `Audit record '${auditId}' not found.`
            });
        }

        if (record.parcelId && !canAccessParcel(req.user, record.parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view this audit record."
            });
        }

        return res.json({
            success: true,
            data: record
        });
    } catch (error) {
        console.error("[Audit API] Error in GET /api/audits/:auditId:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error retrieving audit record."
        });
    }
});

module.exports = router;
