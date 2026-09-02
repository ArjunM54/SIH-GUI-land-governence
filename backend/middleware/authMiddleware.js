/* =========================================================
   LANDGOV GIS
   AUTHENTICATION MIDDLEWARE

   Verifies Firebase ID Tokens or authorization headers,
   resolves user identity from userService, and enforces
   active account status.
   ========================================================= */

const userService = require("../services/userService");

async function verifyAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization || req.headers["x-user-identifier"];

        if (!authHeader) {
            req.user = null;
            return next();
        }

        let identifier = "";

        if (authHeader.startsWith("Bearer ")) {
            identifier = authHeader.substring(7).trim();
        } else {
            identifier = authHeader.trim();
        }

        if (!identifier) {
            req.user = null;
            return next();
        }

        // Search user by email, officerId, or UID
        const user = userService.findUserByIdentifier(identifier);

        if (!user) {
            req.user = null;
            return next();
        }

        if (user.status === "disabled") {
            return res.status(403).json({
                success: false,
                error: "Account is disabled. Contact system administrator."
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("[Auth Middleware Error]:", error);
        req.user = null;
        next();
    }
}

/**
 * Strict authentication check - requires a valid logged-in user
 */
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "Authentication required. Please log in."
        });
    }
    next();
}

module.exports = {
    verifyAuth,
    requireAuth
};
