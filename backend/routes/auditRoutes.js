/* =========================================================
   LANDGOV GIS
   AUDIT TRAIL ROUTES (PROTECTED & FILTERED)

   Exposes REST endpoints for comprehensive audit record retrieval,
   metrics, filtering, parcel history, and CSV/JSON export.
   ========================================================= */

const express = require("express");
const router = express.Router();

const {
    getAuditRecord,
    getAuditsByParcel,
    queryAudits,
    getAuditMetrics,
    getDepartmentActivityMetrics,
    getOfficerActivityMetrics,
    listAudits
} = require("../services/auditService");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

/**
 * GET /api/audits
 * Returns paginated, filtered audit trail records
 */
router.get("/", (req, res) => {
    try {
        if (req.user.role === "citizen") {
            // For citizen, filter to only parcels they are authorized to access
            const userParcels = req.user.assignedParcels || ["LND-001", "LND-003"];
            const queryParams = { ...req.query };
            if (!queryParams.parcelId || queryParams.parcelId === "ALL") {
                queryParams.parcelId = userParcels[0] || "LND-001";
            } else if (!canAccessParcel(req.user, queryParams.parcelId)) {
                return res.status(403).json({
                    success: false,
                    error: "FORBIDDEN",
                    message: "You are not authorized to view audit records for this parcel."
                });
            }

            const auditQueryResult = queryAudits(queryParams);
            return res.json({
                success: true,
                ...auditQueryResult
            });
        }

        const auditQueryResult = queryAudits(req.query);
        const metrics = getAuditMetrics();

        return res.json({
            success: true,
            metrics,
            ...auditQueryResult
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
 * GET /api/audits/metrics
 * Returns audit summary metrics, department activity breakdown, and officer activity overview
 */
router.get("/metrics", (req, res) => {
    try {
        if (req.user.role === "citizen") {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Citizens are not authorized to view administrative audit metrics."
            });
        }

        const summaryMetrics = getAuditMetrics();
        const departmentActivity = getDepartmentActivityMetrics();
        const officerActivity = getOfficerActivityMetrics();

        return res.json({
            success: true,
            metrics: summaryMetrics,
            departmentActivity,
            officerActivity
        });
    } catch (error) {
        console.error("[Audit API] Error in GET /api/audits/metrics:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error retrieving audit metrics."
        });
    }
});

/**
 * GET /api/audits/export
 * Exports audit trail in CSV or JSON format
 */
router.get("/export", (req, res) => {
    try {
        if (req.user.role === "citizen") {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Citizens are not authorized to export global audit logs."
            });
        }

        const format = (req.query.format || "csv").toLowerCase();
        const queryResult = queryAudits({ ...req.query, limit: 1000 });
        const records = queryResult.data || [];

        if (format === "json") {
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Content-Disposition", `attachment; filename="landgov_audit_log_${Date.now()}.json"`);
            return res.send(JSON.stringify(records, null, 2));
        }

        // Default CSV export
        const headers = ["Audit ID", "Timestamp", "Actor", "Department", "Role", "Action", "Resource Type", "Resource ID", "Parcel ID", "Result", "Reason/Remarks"];
        const rows = records.map(r => [
            `"${r.auditId}"`,
            `"${r.createdAt}"`,
            `"${r.actor}"`,
            `"${r.department}"`,
            `"${r.role}"`,
            `"${r.action}"`,
            `"${r.resourceType}"`,
            `"${r.resourceId}"`,
            `"${r.parcelId}"`,
            `"${r.result}"`,
            `"${(r.remarks || r.reason || '').replace(/"/g, '""')}"`
        ]);

        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="landgov_audit_log_${Date.now()}.csv"`);
        return res.send(csvContent);
    } catch (error) {
        console.error("[Audit API] Error in GET /api/audits/export:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error exporting audit logs."
        });
    }
});

/**
 * GET /api/audits/parcel/:parcelId
 * Retrieves audit records for an authorized parcel.
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

        if (record.parcelId && record.parcelId !== "SYSTEM" && !canAccessParcel(req.user, record.parcelId)) {
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

