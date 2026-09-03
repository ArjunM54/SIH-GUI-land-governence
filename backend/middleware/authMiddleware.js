/* =========================================================
   LANDGOV GIS
   AUTHENTICATION MIDDLEWARE (PHASE 10 JWT & ACCESS CONTROL)

   Verifies JWT ID Tokens from Authorization Bearer headers,
   resolves fresh user context from userService, and enforces
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

        let tokenOrIdentifier = "";

        if (authHeader.startsWith("Bearer ")) {
            tokenOrIdentifier = authHeader.substring(7).trim();
        } else {
            tokenOrIdentifier = authHeader.trim();
        }

        if (!tokenOrIdentifier) {
            req.user = null;
            return next();
        }

        let user = null;

        // Try JWT decoding first
        const decoded = userService.verifyToken(tokenOrIdentifier);
        if (decoded && (decoded.uid || decoded.email || decoded.officerId)) {
            user = userService.getUserByUid(decoded.uid) || userService.findUserByIdentifier(decoded.email || decoded.officerId);
        } else {
            // Fallback for raw identifier lookup
            user = userService.findUserByIdentifier(tokenOrIdentifier);
        }

        if (!user) {
            req.user = null;
            return next();
        }

        // Active account enforcement
        if (user.status === "disabled" || user.active === false) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Account is disabled. Contact system administrator."
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
 * Strict authentication check - requires a valid logged-in user context
 */
function requireAuth(req, res, next) {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "UNAUTHORIZED",
            message: "Authentication required. Token missing or invalid."
        });
    }
    next();
}

module.exports = {
    verifyAuth,
    requireAuth
};
