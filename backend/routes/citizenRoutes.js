/* =========================================================
   LANDGOV GIS
   CITIZEN PORTAL ROUTES (PROTECTED)

   Provides endpoints for Citizen Requests, Land Overview,
   and Property Status tracking.
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");

router.use(requireAuth);

// Simulated citizen requests store
const citizenRequests = [
    {
        requestId: "REQ-2026-001",
        citizenEmail: "citizen@landgov.gov",
        parcelId: "LND-001",
        type: "Mutation Request",
        department: "Land Records Department",
        status: "Pending Verification",
        createdAt: "2026-02-15T14:30:00Z"
    },
    {
        requestId: "REQ-2026-002",
        citizenEmail: "citizen@landgov.gov",
        parcelId: "LND-003",
        type: "Land Use Conversion",
        department: "Land Use & Planning Department",
        status: "Under Review",
        createdAt: "2026-02-20T09:15:00Z"
    }
];

/**
 * @route   GET /api/citizen/requests
 * @desc    Get requests belonging to logged-in citizen
 */
router.get("/requests", requireRole("citizen", "admin"), (req, res) => {
    const userEmail = req.user.email;
    const userRequests = citizenRequests.filter(r => req.user.role === "admin" || r.citizenEmail === userEmail);
    return res.json({
        success: true,
        requests: userRequests
    });
});

/**
 * @route   POST /api/citizen/request
 * @desc    Submit a new citizen land request for authorized parcel
 */
router.post("/request", requireRole("citizen", "admin"), (req, res) => {
    const { parcelId, type, department, description } = req.body;

    if (!parcelId || !type) {
        return res.status(400).json({
            success: false,
            error: "BAD_REQUEST",
            message: "Parcel ID and Request Type are required."
        });
    }

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to submit requests for this parcel."
        });
    }

    const newReq = {
        requestId: `REQ-${Date.now().toString().slice(-6)}`,
        citizenEmail: req.user.email,
        parcelId,
        type,
        department: department || "Land Records Department",
        description: description || "",
        status: "Pending Verification",
        createdAt: new Date().toISOString()
    };

    citizenRequests.push(newReq);

    return res.status(201).json({
        success: true,
        message: "Land request submitted successfully.",
        request: newReq
    });
});

module.exports = router;
