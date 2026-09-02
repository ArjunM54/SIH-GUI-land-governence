/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   AUDIT TRAIL ROUTES

   Exposes REST endpoints for audit record retrieval and history.
   ========================================================= */

const express = require("express");
const router = express.Router();

const {
    getAuditRecord,
    getAuditsByParcel,
    listAudits
} = require("../services/auditService");

/* =========================================================
   GET /api/audits
   Lists audit records (newest first, limit max 100).
   ========================================================= */
router.get("/", (req, res) => {
    try {
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

/* =========================================================
   GET /api/audits/parcel/:parcelId
   Retrieves all validation audit records for a specific parcel.
   ========================================================= */
router.get("/parcel/:parcelId", (req, res) => {
    try {
        const { parcelId } = req.params;
        if (!parcelId || parcelId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Missing 'parcelId' parameter."
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

/* =========================================================
   GET /api/audits/:auditId
   Retrieves a single audit record by Audit ID.
   ========================================================= */
router.get("/:auditId", (req, res) => {
    try {
        const { auditId } = req.params;
        if (!auditId || auditId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Missing 'auditId' parameter."
            });
        }

        const record = getAuditRecord(auditId);
        if (!record) {
            return res.status(404).json({
                success: false,
                message: `Audit record '${auditId}' not found.`
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
