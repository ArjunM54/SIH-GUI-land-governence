/* =========================================================
   LANDGOV GIS
   AUTHENTICATION ROUTES (PHASE 10 JWT & SECURITY)

   Handles Citizen Registration, JWT Login, Password Verification,
   Profile identification, and Auth verification.
   ========================================================= */

const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const auditService = require("../services/auditService");

/**
 * @route   POST /api/auth/register-citizen
 * @desc    Public Citizen Registration (Creates role = citizen)
 */
router.post("/register-citizen", (req, res) => {
    try {
        const { name, email, password, confirmPassword, mobile } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Email and password are required."
            });
        }

        if (password !== confirmPassword && confirmPassword !== undefined) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Password and Confirm Password do not match."
            });
        }

        const newUser = userService.registerCitizen({
            name: name || "Citizen User",
            email,
            password,
            mobile: mobile || ""
        });

        const token = userService.generateToken(newUser);

        auditService.logEvent({
            actor: newUser.email,
            target: newUser.uid,
            action: "CITIZEN_REGISTER_SUCCESS",
            result: "SUCCESS",
            details: { email: newUser.email }
        });

        return res.status(201).json({
            success: true,
            message: "Citizen registered successfully.",
            token,
            user: newUser
        });
    } catch (error) {
        auditService.logEvent({
            actor: req.body.email || "UNKNOWN",
            target: "CITIZEN_REGISTRATION",
            action: "CITIZEN_REGISTER_FAILED",
            result: "FAILED",
            details: { error: error.message }
        });

        return res.status(400).json({
            success: false,
            error: "REGISTRATION_FAILED",
            message: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Unified JWT Login by Email or Officer ID with bcrypt password verification
 */
router.post("/login", (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "Email or Officer ID and password are required."
            });
        }

        const user = userService.findUserByIdentifier(identifier);

        if (!user) {
            auditService.logEvent({
                actor: identifier,
                target: "SYSTEM",
                action: "LOGIN_FAILED",
                result: "FAILED",
                details: { reason: "User not found" }
            });

            return res.status(401).json({
                success: false,
                error: "INVALID_CREDENTIALS",
                message: "Invalid email/Officer ID or password."
            });
        }

        // Validate password with bcrypt
        const isPasswordValid = userService.verifyPassword(password, user);
        if (!isPasswordValid) {
            auditService.logEvent({
                actor: identifier,
                target: user.uid,
                action: "LOGIN_FAILED",
                result: "FAILED",
                details: { reason: "Incorrect password" }
            });

            return res.status(401).json({
                success: false,
                error: "INVALID_CREDENTIALS",
                message: "Invalid email/Officer ID or password."
            });
        }

        if (user.status === "disabled" || user.active === false) {
            auditService.logEvent({
                actor: user.email || user.officerId,
                target: user.uid,
                action: "LOGIN_FAILED",
                result: "FAILED",
                details: { reason: "Account disabled" }
            });

            return res.status(403).json({
                success: false,
                error: "ACCOUNT_DISABLED",
                message: "Account is disabled. Please contact system administrator."
            });
        }

        // Issue JWT Token
        const token = userService.generateToken(user);

        auditService.logEvent({
            actor: user.email || user.officerId,
            target: user.uid,
            action: "LOGIN_SUCCESS",
            result: "SUCCESS",
            details: { role: user.role, officerType: user.officerType }
        });

        return res.json({
            success: true,
            message: "Login successful.",
            token,
            user
        });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            error: "SERVER_ERROR",
            message: "Internal server error during authentication."
        });
    }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get active user session profile
 */
router.get("/me", (req, res) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            error: "UNAUTHORIZED",
            message: "Not authenticated."
        });
    }
    return res.json({
        success: true,
        user: req.user
    });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout event logging
 */
router.post("/logout", (req, res) => {
    if (req.user) {
        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: req.user.uid,
            action: "LOGOUT",
            result: "SUCCESS"
        });
    }
    return res.json({
        success: true,
        message: "Logged out successfully."
    });
});

module.exports = router;
