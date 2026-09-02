/* =========================================================
   LANDGOV GIS
   ADMINISTRATOR ROUTES

   Protected API routes for System Administrator:
   - Officer Account Management
   - Create Officer (1 of 5 allowed types)
   - Enable / Disable Officer
   - Permission Matrix Assignment
   - Secure Firebase Password Reset Trigger
   - Audit Trail Monitoring
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/permissionMiddleware");
const userService = require("../services/userService");
const auditService = require("../services/auditService");

// Protect all admin routes with strict admin role check
router.use(requireRole("admin"));

/**
 * @route   GET /api/admin/metrics
 * @desc    System-wide governance & user metrics
 */
router.get("/metrics", (req, res) => {
    const allUsers = userService.listUsers();
    const citizens = allUsers.filter(u => u.role === "citizen");
    const officers = allUsers.filter(u => u.role === "officer");
    const activeOfficers = officers.filter(u => u.status === "active");
    const disabledOfficers = officers.filter(u => u.status === "disabled");

    res.json({
        success: true,
        metrics: {
            totalCitizens: citizens.length,
            totalOfficers: officers.length,
            activeOfficers: activeOfficers.length,
            disabledOfficers: disabledOfficers.length,
            totalParcels: 1420,
            pendingRequests: 17,
            activeConflicts: 5,
            systemAlerts: 0
        }
    });
});

/**
 * @route   GET /api/admin/officers
 * @desc    Get list of all government officer accounts
 */
router.get("/officers", (req, res) => {
    const officers = userService.listUsers("officer");
    res.json({
        success: true,
        officers
    });
});

/**
 * @route   POST /api/admin/officers
 * @desc    Create a new Government Officer account
 */
router.post("/officers", (req, res) => {
    try {
        const { officerId, name, email, password, officerType, permissions, status } = req.body;

        if (!officerId || !name || !email || !officerType) {
            return res.status(400).json({
                success: false,
                error: "Officer ID, Full Name, Email, and Officer Type are required."
            });
        }

        const newOfficer = userService.createOfficer({
            officerId,
            name,
            email,
            password: password || "Pass123!Demo",
            officerType,
            permissions,
            status: status || "active"
        });


        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: newOfficer.officerId,
            action: "OFFICER_CREATED",
            result: "SUCCESS",
            details: { name: newOfficer.name, department: newOfficer.department, officerType: newOfficer.officerType }
        });

        res.status(201).json({
            success: true,
            message: `Officer ${newOfficer.officerId} created successfully.`,
            officer: newOfficer
        });
    } catch (error) {
        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: req.body.officerId || "UNKNOWN",
            action: "OFFICER_CREATION_FAILED",
            result: "FAILED",
            details: { error: error.message }
        });

        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   PATCH /api/admin/officers/:uid/status
 * @desc    Enable or Disable an officer account
 */
router.patch("/officers/:uid/status", (req, res) => {
    try {
        const { uid } = req.params;
        const { status } = req.body; // 'active' or 'disabled'

        if (!["active", "disabled"].includes(status)) {
            return res.status(400).json({
                success: false,
                error: "Status must be either 'active' or 'disabled'."
            });
        }

        const updated = userService.setOfficerStatus(uid, status);

        const actionName = status === "disabled" ? "OFFICER_DISABLED" : "OFFICER_ENABLED";

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: updated.officerId || updated.email,
            action: actionName,
            result: "SUCCESS",
            details: { status }
        });

        res.json({
            success: true,
            message: `Officer account ${updated.officerId || updated.email} status updated to '${status}'.`,
            officer: updated
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/admin/officers/:uid/permissions
 * @desc    Update officer permission matrix
 */
router.put("/officers/:uid/permissions", (req, res) => {
    try {
        const { uid } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({
                success: false,
                error: "Permissions must be an array of permission strings."
            });
        }

        const updated = userService.updateOfficerPermissions(uid, permissions);

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: updated.officerId || updated.email,
            action: "OFFICER_PERMISSION_CHANGED",
            result: "SUCCESS",
            details: { updatedPermissions: permissions }
        });

        res.json({
            success: true,
            message: `Permissions updated for officer ${updated.officerId || updated.email}.`,
            officer: updated
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * @route   POST /api/admin/officers/:uid/reset-password
 * @desc    Initiate secure password reset trigger for an officer (NEVER reveals passwords)
 */
router.post("/officers/:uid/reset-password", (req, res) => {
    try {
        const { uid } = req.params;
        const { newPassword } = req.body;
        const targetUser = userService.getUserByUid(uid);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                error: "Officer account not found."
            });
        }

        const resetPass = newPassword || "Pass123!Demo";
        userService.resetUserPassword(uid, resetPass);

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: targetUser.officerId || targetUser.email,
            action: "OFFICER_PASSWORD_RESET",
            result: "SUCCESS",
            details: { targetEmail: targetUser.email }
        });

        res.json({
            success: true,
            message: `Password reset successfully for ${targetUser.name} (${targetUser.email}). Stored in users.json.`
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});


/**
 * @route   GET /api/admin/citizens
 * @desc    Get list of registered citizen accounts
 */
router.get("/citizens", (req, res) => {
    const citizens = userService.listUsers("citizen");
    res.json({
        success: true,
        citizens
    });
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get system audit logs
 */
router.get("/audit-logs", (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = auditService.listAudits(limit);
    res.json({
        success: true,
        logs
    });
});

module.exports = router;
