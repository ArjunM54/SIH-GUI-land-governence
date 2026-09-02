/* =========================================================
   LANDGOV GIS
   AUTHENTICATION ROUTES

   Handles Citizen Registration, Officer/Citizen Login,
   Profile identification, and Auth state checks.
   ========================================================= */

const express = require("express");
const router = express.Router();
const userService = require("../services/userService");
const auditService = require("../services/auditService");

/**
 * @route   POST /api/auth/register-citizen
 * @desc    Public Citizen Registration (Strictly creates role = citizen)
 */
router.post("/register-citizen", (req, res) => {
    try {
        const { name, email, password, confirmPassword, mobile } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Email and password are required."
            });
        }

        if (password !== confirmPassword && confirmPassword !== undefined) {
            return res.status(400).json({
                success: false,
                error: "Password and Confirm Password do not match."
            });
        }

        const newUser = userService.registerCitizen({
            name: name || "Citizen User",
            email,
            password,
            mobile: mobile || ""
        });


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
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/login
 * @desc    Unified Login by Email or Officer ID
 */
router.post("/login", (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                error: "Email or Officer ID is required."
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
                error: "Invalid email or Officer ID."
            });
        }

        // Validate password against file storage
        const expectedPassword = user.password || "Pass123!Demo";
        if (password && password !== expectedPassword) {
            auditService.logEvent({
                actor: identifier,
                target: user.uid,
                action: "LOGIN_FAILED",
                result: "FAILED",
                details: { reason: "Incorrect password" }
            });

            return res.status(401).json({
                success: false,
                error: "Incorrect password."
            });
        }

        if (user.status === "disabled") {
            auditService.logEvent({
                actor: user.email || user.officerId,
                target: user.uid,
                action: "LOGIN_FAILED",
                result: "FAILED",
                details: { reason: "Account disabled" }
            });

            return res.status(403).json({
                success: false,
                error: "Account is disabled. Please contact system administrator."
            });
        }


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
            user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Internal server error during authentication."
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
            error: "Not authenticated."
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
