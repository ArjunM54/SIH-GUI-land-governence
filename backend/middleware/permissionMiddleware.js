/* =========================================================
   LANDGOV GIS
   ROLE & PERMISSION MIDDLEWARE

   Enforces Role-Based Access Control (RBAC) and fine-grained
   permission validation on protected backend API endpoints.
   ========================================================= */

/**
 * Ensures the authenticated user has one of the specified roles.
 * @param {...string} allowedRoles - E.g. 'admin', 'officer', 'citizen'
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized access. Authentication token missing or invalid."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: `Forbidden access. Role '${req.user.role}' is not authorized for this resource.`
            });
        }

        next();
    };
}

/**
 * Ensures the authenticated user possesses a specific permission string (or admin override).
 * @param {string} permission - E.g. 'cadastral.verify', 'ror.update', 'registration.approve'
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized access. Authentication token missing or invalid."
            });
        }

        // Admin override
        if (req.user.role === "admin" || (req.user.permissions && req.user.permissions.includes("admin.all"))) {
            return next();
        }

        const userPermissions = req.user.permissions || [];

        if (!userPermissions.includes(permission)) {
            return res.status(403).json({
                success: false,
                error: `Forbidden access. Missing required permission: '${permission}'.`
            });
        }

        next();
    };
}

/**
 * Ensures user is an officer of a specific department/type
 * @param {string} officerType - E.g. 'cadastral_officer', 'land_records_officer'
 */
function requireOfficerType(officerType) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized access. Please log in."
            });
        }

        if (req.user.role === "admin") {
            return next();
        }

        if (req.user.role !== "officer" || req.user.officerType !== officerType) {
            return res.status(403).json({
                success: false,
                error: `Forbidden access. Requires ${officerType} privileges.`
            });
        }

        next();
    };
}

module.exports = {
    requireRole,
    requirePermission,
    requireOfficerType
};
