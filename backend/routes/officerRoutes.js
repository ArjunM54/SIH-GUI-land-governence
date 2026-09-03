/* =========================================================
   LANDGOV GIS
   OFFICER DEPARTMENT ROUTES (PROTECTED)

   Protected API routes for all 5 Officer Departments:
   1. Cadastral & Survey
   2. Land Records / RoR
   3. Registration
   4. Land Use & Planning
   5. Property Tax & Municipal
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole, requirePermission } = require("../middleware/permissionMiddleware");
const auditService = require("../services/auditService");

// Enforce authentication for all officer department routes
router.use(requireAuth);

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
            { surveyNo: "SUR-101", parcelId: "LND-001", village: "Ramgarh", areaSqM: 4500, verified: true, status: "Verified" },
            { surveyNo: "SUR-102", parcelId: "LND-002", village: "Ramgarh", areaSqM: 12000, verified: false, status: "Pending Survey Verification" },
            { surveyNo: "SUR-103", parcelId: "LND-003", village: "Ramgarh", areaSqM: 3200, verified: true, status: "Verified" }
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
            totalRoRRecords: 1420,
            pendingMutations: 12,
            verifiedOwnerships: 1408,
            disputedRoR: 2
        },
        mutations: [
            { mutationId: "MUT-2026-001", parcelId: "LND-001", owner: "Ramesh Sharma", requestedChange: "Inheritance Mutation", status: "Pending Approval" },
            { mutationId: "MUT-2026-002", parcelId: "LND-002", owner: "Industrial Infra Ltd", requestedChange: "Ownership Transfer", status: "Pending Approval" }
        ]
    });
});

router.post("/ror/approve-mutation", requirePermission("mutation.approve"), (req, res) => {
    const { mutationId, status, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: mutationId,
        action: "ROR_MUTATION_DECISION",
        result: "SUCCESS",
        details: { status, remarks }
    });
    res.json({
        success: true,
        message: `Mutation ${mutationId} status set to '${status || 'APPROVED'}' by ${req.user.name}.`
    });
});

// --- 3. REGISTRATION OFFICER ---

router.get("/registration/overview", requirePermission("registration.view"), (req, res) => {
    res.json({
        success: true,
        department: "Registration Department",
        officer: req.user,
        stats: {
            registeredDeeds: 1420,
            pendingDeedApproval: 5,
            totalStampDutyCollected: "₹ 4.2 Cr",
            encumbranceCertificates: 340
        },
        registrations: [
            { regNo: "REG-2026-089", parcelId: "LND-001", buyer: "Ramesh Sharma", seller: "Vikram Singh", stampDutyPaid: true, status: "Under Deed Verification" }
        ]
    });
});

router.post("/registration/approve-transfer", requirePermission("transfer.approve"), (req, res) => {
    const { regNo, decision, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: regNo,
        action: "DEED_REGISTRATION_DECISION",
        result: "SUCCESS",
        details: { decision, remarks }
    });
    res.json({
        success: true,
        message: `Registration ${regNo} ${decision || 'APPROVED'} successfully.`
    });
});

// --- 4. LAND USE & PLANNING OFFICER ---

router.get("/land-use/overview", requirePermission("landuse.view"), (req, res) => {
    res.json({
        success: true,
        department: "Land Use & Planning Department",
        officer: req.user,
        stats: {
            masterPlanZones: 12,
            pendingZoningConversions: 4,
            ecoSensitiveRestrictions: 45,
            proposalValidationsRun: 128
        },
        conversions: [
            { conversionId: "CONV-2026-004", parcelId: "LND-002", currentZone: "AGRICULTURAL", requestedZone: "COMMERCIAL", status: "In Technical Review" }
        ]
    });
});

router.post("/land-use/approve-conversion", requirePermission("landuse.approve"), (req, res) => {
    const { conversionId, decision, zoningCode } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: conversionId,
        action: "LANDUSE_CONVERSION_DECISION",
        result: "SUCCESS",
        details: { decision, zoningCode }
    });
    res.json({
        success: true,
        message: `Land use conversion ${conversionId} updated to ${decision || 'APPROVED'}.`
    });
});

// --- 5. PROPERTY TAX & MUNICIPAL OFFICER ---

router.get("/property-tax/overview", requirePermission("tax.view"), (req, res) => {
    res.json({
        success: true,
        department: "Property Tax & Municipal Department",
        officer: req.user,
        stats: {
            assessedProperties: 1420,
            taxClearanceRate: "94.2%",
            pendingBuildingPermits: 9,
            utilityConnectionRequests: 14
        },
        taxRecords: [
            { parcelId: "LND-001", annualTax: 4500, outstanding: 0, status: "Paid", buildingPermit: "Approved" },
            { parcelId: "LND-002", annualTax: 185000, outstanding: 25000, status: "Partial Dues", buildingPermit: "Under Review" }
        ]
    });
});

router.post("/property-tax/verify-clearance", requirePermission("tax.verify"), (req, res) => {
    const { parcelId, clearedAmount, remarks } = req.body;
    auditService.logEvent({
        actor: req.user.officerId || req.user.email,
        target: parcelId,
        action: "TAX_CLEARANCE_VERIFIED",
        result: "SUCCESS",
        details: { clearedAmount, remarks }
    });
    res.json({
        success: true,
        message: `Property tax clearance verified for parcel ${parcelId}.`
    });
});

module.exports = router;
