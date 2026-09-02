/* =========================================================
   LANDGOV GIS
   CITIZEN PORTAL ROUTES

   Provides endpoints for Citizen Requests, Land Overview,
   and Property Status tracking.
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/permissionMiddleware");

// Simulated citizen requests store
const citizenRequests = [
    {
        requestId: "REQ-2026-001",
        citizenEmail: "citizen@landgov.gov",
        parcelId: "P-101",
        type: "Mutation Request",
        department: "Land Records Department",
        status: "Pending Verification",
        createdAt: "2026-02-15T14:30:00Z"
    },
    {
        requestId: "REQ-2026-002",
        citizenEmail: "citizen@landgov.gov",
        parcelId: "P-102",
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
    const userEmail = req.user ? req.user.email : "citizen@landgov.gov";
    const userRequests = citizenRequests.filter(r => req.user.role === "admin" || r.citizenEmail === userEmail);
    return res.json({
        success: true,
        requests: userRequests
    });
});

/**
 * @route   POST /api/citizen/request
 * @desc    Submit a new citizen land request
 */
router.post("/request", requireRole("citizen", "admin"), (req, res) => {
    const { parcelId, type, department, description } = req.body;

    if (!parcelId || !type) {
        return res.status(400).json({
            success: false,
            error: "Parcel ID and Request Type are required."
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
