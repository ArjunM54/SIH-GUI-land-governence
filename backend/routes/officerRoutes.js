/* =========================================================
   LANDGOV GIS
   OFFICER DEPARTMENT ROUTES

   Protected API routes for all 5 Officer Departments:
   1. Cadastral & Survey
   2. Land Records / RoR
   3. Registration
   4. Land Use & Planning
   5. Property Tax & Municipal
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireRole, requirePermission } = require("../middleware/permissionMiddleware");
const auditService = require("../services/auditService");

// --- 1. CADASTRAL & SURVEY OFFICER ---

router.get("/cadastral/overview", requirePermission("cadastral.view"), (req, res) => {
    res.json({
        success: true,
        department: "Cadastral & Survey Department",
        officer: req.user,
        stats: {
            totalParcels: 1420,
            pendingBoundaryVerification: 8,
            surveyRecordsCount: 1420,
            boundaryConflicts: 3
        },
        records: [
            { surveyNo: "SUR-101", parcelId: "P-101", village: "Ramgarh", areaSqM: 4500, verified: true, status: "Verified" },
            { surveyNo: "SUR-102", parcelId: "P-102", village: "Ramgarh", areaSqM: 12000, verified: false, status: "Pending Survey Verification" },
            { surveyNo: "SUR-103", parcelId: "P-103", village: "Ramgarh", areaSqM: 3200, verified: true, status: "Verified" }
        ]
    });
});

router.post("/cadastral/verify-boundary", requirePermission("cadastral.verify"), (req, res) => {
    const { parcelId, surveyNo, verificationRemarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId || surveyNo,
        action: "CADASTRAL_BOUNDARY_VERIFIED",
        result: "SUCCESS",
        details: { verificationRemarks }
    });
    res.json({
        success: true,
        message: `Boundary verification for ${parcelId || surveyNo} updated successfully by ${req.user.name}.`
    });
});

// --- 2. LAND RECORDS / RoR OFFICER ---

router.get("/ror/overview", requirePermission("ror.view"), (req, res) => {
    res.json({
        success: true,
        department: "Land Records Department",
        officer: req.user,
        stats: {
            totalLandRecords: 1420,
            pendingVerification: 12,
            pendingMutation: 5,
            ownershipConflicts: 2
        },
        mutations: [
            { mutationId: "MUT-2026-01", parcelId: "P-101", owner: "Rajesh Sharma", requestedChange: "Inheritance Transfer", status: "Pending Approval" },
            { mutationId: "MUT-2026-02", parcelId: "P-103", owner: "Green Field Corp", requestedChange: "Ownership Sale", status: "Pending Verification" }
        ]
    });
});

router.post("/ror/approve-mutation", requirePermission("mutation.approve"), (req, res) => {
    const { mutationId, status, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: mutationId,
        action: "MUTATION_APPROVAL_UPDATED",
        result: "SUCCESS",
        details: { status, remarks }
    });
    res.json({
        success: true,
        message: `Mutation ${mutationId} status updated to '${status || "APPROVED"}' by ${req.user.name}.`
    });
});

// --- 3. REGISTRATION OFFICER ---

router.get("/registration/overview", requirePermission("registration.view"), (req, res) => {
    res.json({
        success: true,
        department: "Registration Department",
        officer: req.user,
        stats: {
            totalRegistrations: 980,
            pendingRegistrations: 6,
            pendingTransfers: 4,
            documentVerificationPending: 3
        },
        registrations: [
            { regNo: "REG-2026-89", parcelId: "P-101", buyer: "Anita Gupta", seller: "Rajesh Sharma", stampDutyPaid: true, status: "Pending Transfer Approval" },
            { regNo: "REG-2026-90", parcelId: "P-104", buyer: "Vikram Tech Ltd", seller: "Sohan Lal", stampDutyPaid: true, status: "Verified" }
        ]
    });
});

router.post("/registration/approve-transfer", requirePermission("transfer.approve"), (req, res) => {
    const { regNo, decision, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regNo,
        action: "PROPERTY_TRANSFER_APPROVED",
        result: "SUCCESS",
        details: { decision, remarks }
    });
    res.json({
        success: true,
        message: `Registration property transfer ${regNo} marked as ${decision || "APPROVED"}.`
    });
});

// --- 4. LAND USE & PLANNING OFFICER ---

router.get("/land-use/overview", requirePermission("landuse.view"), (req, res) => {
    res.json({
        success: true,
        department: "Land Use & Planning Department",
        officer: req.user,
        stats: {
            landUseDistribution: { agricultural: 65, commercial: 20, residential: 15 },
            pendingConversions: 4,
            zoningIssues: 1,
            planningRestrictionsActive: 18
        },
        conversions: [
            { conversionId: "CONV-101", parcelId: "P-102", fromZone: "Agricultural", toZone: "Commercial", status: "Under Environmental Impact Review" },
            { conversionId: "CONV-102", parcelId: "P-105", fromZone: "Residential", toZone: "Commercial", status: "Pending Approval" }
        ]
    });
});

router.post("/land-use/approve-conversion", requirePermission("landuse.approve"), (req, res) => {
    const { conversionId, decision, zoningCode } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: conversionId,
        action: "LAND_USE_CONVERSION_APPROVED",
        result: "SUCCESS",
        details: { decision, zoningCode }
    });
    res.json({
        success: true,
        message: `Land use conversion request ${conversionId} updated to ${decision || "APPROVED"}.`
    });
});

// --- 5. PROPERTY TAX & MUNICIPAL OFFICER ---

router.get("/property-tax/overview", requirePermission("tax.view"), (req, res) => {
    res.json({
        success: true,
        department: "Property Tax & Municipal Department",
        officer: req.user,
        stats: {
            totalProperties: 1420,
            taxCollected: "₹1,42,50,000",
            pendingTaxCount: 42,
            outstandingTaxAmount: "₹8,20,000",
            buildingRequestsPending: 5
        },
        taxRecords: [
            { parcelId: "P-101", annualTax: 12500, outstanding: 0, status: "Paid", buildingPermit: "Approved" },
            { parcelId: "P-102", annualTax: 35000, outstanding: 70000, status: "Overdue", buildingPermit: "Blocked due to tax default" },
            { parcelId: "P-103", annualTax: 9800, outstanding: 0, status: "Paid", buildingPermit: "Pending Inspection" }
        ]
    });
});

router.post("/property-tax/verify-clearance", requirePermission("tax.verify"), (req, res) => {
    const { parcelId, clearedAmount, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "PROPERTY_TAX_VERIFIED",
        result: "SUCCESS",
        details: { clearedAmount, remarks }
    });
    res.json({
        success: true,
        message: `Tax record & clearance for parcel ${parcelId} verified by ${req.user.name}.`
    });
});

module.exports = router;
