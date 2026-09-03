/* =========================================================
   LANDGOV GIS
   PARCEL ACCESS CONTROL MIDDLEWARE

   Enforces parcel-level authorization on backend endpoints.
   ========================================================= */

const { canAccessParcel } = require("../services/parcelAccessService");

/**
 * Middleware factory enforcing parcel-level access control.
 * @param {string} paramName - Name of the parameter containing parcel ID (default: 'parcelId' or 'id')
 */
function requireParcelAccess(paramName = "parcelId") {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: "UNAUTHORIZED",
                message: "Authentication required."
            });
        }

        const parcelId = req.params[paramName] || req.params.id || req.params.parcelId || req.body?.parcelId || req.query?.parcelId;

        if (!parcelId) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Parcel ID parameter is missing."
            });
        }

        const hasAccess = canAccessParcel(req.user, parcelId);
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to access this parcel."
            });
        }

        next();
    };
}

module.exports = {
    requireParcelAccess
};
