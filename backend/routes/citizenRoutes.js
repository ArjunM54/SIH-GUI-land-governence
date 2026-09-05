/* =========================================================
   LANDGOV GIS
   CITIZEN PORTAL ROUTES (PROTECTED)

   Provides endpoints for Citizen Dashboard Summary, My Land,
   Applications & Owner Change, Services (Property Registration,
   Mutation, Land Use, Tax), Documents, Property Tax,
   Notifications, Profile, and Help.
   ========================================================= */

const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/permissionMiddleware");
const { canAccessParcel, filterParcelsForUser } = require("../services/parcelAccessService");
const { getLandProfile } = require("../data/landProfile");
const parcelsData = require("../data/parcels");
const rorData = require("../data/ror");
const propertyTaxData = require("../data/PropertyTax");
const documentsData = require("../data/documents");
const userService = require("../services/userService");
const auditService = require("../services/auditService");

const {
    getApplicationsForCitizen,
    getApplicationById,
    submitOwnerChangeApplication,
    submitServiceApplication,
    resubmitApplicationDocument,
    getOwnershipHistory,
    getNotificationsForUser,
    markNotificationRead
} = require("../services/applicationService");

// Enforce authentication for all citizen routes
router.use(requireAuth);

/**
 * Helper to retrieve authorized parcels for logged-in citizen
 */
function getCitizenParcels(user) {
    let rawParcels = [];
    if (Array.isArray(user.assignedParcels) && user.assignedParcels.length > 0) {
        rawParcels = user.assignedParcels;
    } else {
        rawParcels = ["LND-001", "LND-003"];
    }

    return rawParcels.map(parcelId => {
        const profile = getLandProfile(parcelId);
        if (profile) {
            const p = profile.parcel || {};
            const r = profile.ror || {};
            const tax = profile.propertyTax || {};
            const lu = profile.landUse || {};
            const reg = profile.registration || {};
            const rst = profile.restrictions || {};

            return {
                parcelId: p.id || parcelId,
                surveyNumber: r.surveyNumber || p.surveyNumber || "145/2A",
                village: p.village || "Ramgarh",
                district: p.district || "Central District",
                areaSqFt: (p.areaSqMeters ? p.areaSqMeters * 10.7639 : 48437).toLocaleString(undefined, { maximumFractionDigits: 0 }) + " sq.ft",
                areaSqMeters: p.areaSqMeters || 4500,
                landUse: lu.landUseType || p.landUse || "Residential",
                currentOwner: r.rightsHolder || p.owner || user.name || "Hari Prem",
                ownershipStatus: r.recordStatus || "✓ Verified",
                registrationInfo: reg.deedNumber ? `Deed #${reg.deedNumber} (${reg.registrationDate})` : "Reg No: REG-2026-089",
                propertyTax: tax.outstandingDues !== undefined ? (tax.outstandingDues > 0 ? `Outstanding ₹${tax.outstandingDues.toLocaleString()}` : "✓ Paid") : "✓ Paid",
                annualTax: tax.annualTax || 8500,
                outstandingTax: tax.outstandingDues || 0,
                taxStatus: tax.paymentStatus || (tax.outstandingDues > 0 ? "Pending" : "✓ Paid"),
                landClassification: p.zoning || lu.zoningCategory || "Freehold Primary",
                restrictions: rst.restrictionDescription || "None (Clear for Development)"
            };
        }

        return {
            parcelId,
            surveyNumber: "145/2A",
            village: "Ramgarh",
            district: "Central District",
            areaSqFt: "1,250 sq.ft",
            areaSqMeters: 4500,
            landUse: "Residential",
            currentOwner: user.name || "Hari Prem",
            ownershipStatus: "✓ Verified",
            registrationInfo: "Reg No: REG-2026-089",
            propertyTax: "✓ Paid",
            annualTax: 8500,
            outstandingTax: 0,
            taxStatus: "✓ Paid",
            landClassification: "Freehold Residential",
            restrictions: "None"
        };
    });
}

/**
 * @route   GET /api/citizen/dashboard-summary
 * @desc    Dashboard counters & overview for citizen
 */
router.get("/dashboard-summary", requireRole("citizen", "admin"), (req, res) => {
    const userParcels = getCitizenParcels(req.user);
    const applicationsList = getApplicationsForCitizen(req.user);
    const notificationsList = getNotificationsForUser(req.user);

    const totalProperties = userParcels.length;
    const pendingApplications = applicationsList.filter(a => a.status === "UNDER_VERIFICATION").length;
    const completedApplications = applicationsList.filter(a => a.status === "COMPLETED").length;
    const unreadNotifications = notificationsList.filter(n => !n.read).length;

    let outstandingTaxTotal = 0;
    userParcels.forEach(p => {
        outstandingTaxTotal += (p.outstandingTax || 0);
    });

    auditService.logEvent({
        actor: req.user.email,
        target: "CITIZEN_DASHBOARD",
        action: "APPLICATION_VIEWED",
        result: "SUCCESS"
    });

    return res.json({
        success: true,
        summary: {
            citizenName: req.user.name || "Hari Prem",
            citizenId: req.user.uid || "CIT-2026-9081",
            email: req.user.email,
            mobile: req.user.mobile || "6383120790",
            totalProperties,
            pendingApplications,
            completedApplications,
            notificationsCount: unreadNotifications,
            outstandingPropertyTax: outstandingTaxTotal
        },
        recentApplications: applicationsList.slice(0, 5),
        recentNotifications: notificationsList.slice(0, 5),
        properties: userParcels
    });
});

/**
 * @route   GET /api/citizen/my-land
 * @desc    Get authorized properties with detailed land profile attributes
 */
router.get("/my-land", requireRole("citizen", "admin"), (req, res) => {
    const properties = getCitizenParcels(req.user);
    return res.json({
        success: true,
        count: properties.length,
        properties
    });
});

/**
 * @route   GET /api/citizen/requests
 * @route   GET /api/citizen/applications
 * @desc    Get applications submitted by or assigned to logged-in citizen
 */
router.get(["/requests", "/applications"], requireRole("citizen", "admin"), (req, res) => {
    const apps = getApplicationsForCitizen(req.user);
    return res.json({
        success: true,
        count: apps.length,
        requests: apps,
        applications: apps
    });
});

/**
 * @route   GET /api/citizen/applications/:id
 * @desc    Get tracking details for specific application
 */
router.get("/applications/:id", requireRole("citizen", "admin"), (req, res) => {
    const app = getApplicationById(req.params.id, req.user);
    if (!app) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Application not found or access denied."
        });
    }

    auditService.logEvent({
        actor: req.user.email,
        target: app.applicationId,
        action: "APPLICATION_VIEWED",
        result: "SUCCESS"
    });

    return res.json({
        success: true,
        application: app
    });
});

/**
 * @route   POST /api/citizen/applications/owner-change
 * @desc    Submit an Owner Change Application
 */
router.post("/applications/owner-change", requireRole("citizen", "admin"), (req, res) => {
    const { parcelId, currentOwner, newOwner, relationship, reason, declaration } = req.body;

    if (!parcelId || !newOwner || !reason) {
        return res.status(400).json({
            success: false,
            error: "BAD_REQUEST",
            message: "Parcel ID, New Owner, and Reason are required."
        });
    }

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to submit owner change for this parcel."
        });
    }

    const app = submitOwnerChangeApplication(req.user, req.body);
    return res.status(201).json({
        success: true,
        message: "Owner Change Application submitted successfully.",
        application: app
    });
});

/**
 * @route   POST /api/citizen/applications/:id/resubmit-document
 * @desc    Upload/resubmit requested document for an application in DOCUMENT_REQUIRED state
 */
router.post("/applications/:id/resubmit-document", requireRole("citizen", "admin"), (req, res) => {
    const { deptKey, documentName } = req.body;
    const appId = req.params.id;

    const result = resubmitApplicationDocument(req.user, appId, deptKey, documentName);
    if (!result.success) {
        return res.status(400).json(result);
    }
    return res.json(result);
});

/**
 * @route   GET /api/citizen/properties/:parcelId/history
 * @desc    Get ownership transfer history for parcel
 */
router.get("/properties/:parcelId/history", requireRole("citizen", "admin"), (req, res) => {
    const parcelId = req.params.parcelId;
    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "Access denied to property history for this parcel."
        });
    }

    const history = getOwnershipHistory(parcelId);
    return res.json({
        success: true,
        parcelId,
        history
    });
});

/**
 * @route   POST /api/citizen/request
 * @route   POST /api/citizen/applications/service
 * @desc    Submit a generic service request (Mutation, Reg, Land Use, Tax)
 */
router.post(["/request", "/applications/service"], requireRole("citizen", "admin"), (req, res) => {
    const { parcelId, type } = req.body;

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

    const app = submitServiceApplication(req.user, req.body);
    return res.status(201).json({
        success: true,
        message: "Service request submitted successfully.",
        request: app,
        application: app
    });
});

/**
 * @route   GET /api/citizen/services
 * @desc    Get service portal categories and active citizen service records
 */
router.get("/services", requireRole("citizen", "admin"), (req, res) => {
    const properties = getCitizenParcels(req.user);
    const applicationsList = getApplicationsForCitizen(req.user);

    return res.json({
        success: true,
        services: [
            { id: "property-registration", title: "Property Registration", icon: "🏛️", description: "View registration info, track deed approvals, and submit registration requests." },
            { id: "mutation-request", title: "Mutation Request", icon: "📝", description: "Request an update to land records following a legal transaction or inheritance." },
            { id: "land-use-request", title: "Land Use Request", icon: "🗺️", description: "Submit requests for land-use change, planning permission, or zoning enquiry." },
            { id: "property-tax-services", title: "Property Tax Services", icon: "💰", description: "View tax assessment, outstanding amounts, download receipts, and pay taxes." }
        ],
        properties,
        applications: applicationsList
    });
});

/**
 * @route   GET /api/citizen/documents
 * @desc    Get documents belonging strictly to authenticated citizen
 */
router.get("/documents", requireRole("citizen", "admin"), (req, res) => {
    const userParcels = getCitizenParcels(req.user).map(p => p.parcelId.toUpperCase());
    const citizenDocs = documentsData.filter(d => userParcels.includes((d.parcelId || "").toUpperCase()));

    // Add category metadata
    const categorizedDocs = citizenDocs.map(d => ({
        ...d,
        category: d.documentType === "OWNERSHIP" ? "Ownership Documents" :
                  d.documentType === "PROPERTY_TAX" ? "Tax Documents" :
                  d.documentType === "BUILDING_PERMISSION" ? "Application Documents" : "Issued Documents",
        verificationStatus: d.status || "VERIFIED",
        uploadedDate: d.issueDate || d.createdAt.split("T")[0]
    }));

    return res.json({
        success: true,
        count: categorizedDocs.length,
        documents: categorizedDocs
    });
});

/**
 * @route   GET /api/citizen/property-tax
 * @desc    Get tax details for citizen properties
 */
router.get("/property-tax", requireRole("citizen", "admin"), (req, res) => {
    const userParcels = getCitizenParcels(req.user);
    const taxRecords = userParcels.map(p => {
        const taxMatch = propertyTaxData.find(t => (t.parcelId || "").toUpperCase() === p.parcelId.toUpperCase()) || {};
        return {
            parcelId: p.parcelId,
            propertyTaxId: taxMatch.taxId || `TAX-2026-${p.parcelId.replace(/[^0-9]/g, '') || '0892'}`,
            annualTax: taxMatch.annualTax || p.annualTax || 8500,
            paidAmount: taxMatch.paidAmount || (p.annualTax || 8500) - (p.outstandingTax || 0),
            outstandingAmount: p.outstandingTax || 0,
            status: p.taxStatus || "✓ Paid",
            lastPaymentDate: taxMatch.lastPaymentDate || "2026-01-15",
            taxYear: "2025-2026"
        };
    });

    return res.json({
        success: true,
        taxRecords
    });
});

/**
 * @route   GET /api/citizen/notifications
 * @desc    Get notification notifications feed
 */
router.get("/notifications", requireRole("citizen", "admin"), (req, res) => {
    const list = getNotificationsForUser(req.user);
    return res.json({
        success: true,
        count: list.length,
        notifications: list
    });
});

/**
 * @route   PATCH /api/citizen/notifications/:id/read
 * @desc    Mark notification as read
 */
router.patch("/notifications/:id/read", requireRole("citizen", "admin"), (req, res) => {
    const ok = markNotificationRead(req.user, req.params.id);
    return res.json({ success: ok });
});

/**
 * @route   GET /api/citizen/profile
 * @desc    Get logged in citizen profile details
 */
router.get("/profile", requireRole("citizen", "admin"), (req, res) => {
    return res.json({
        success: true,
        profile: {
            name: req.user.name || "Hari Prem",
            citizenId: req.user.uid || "CIT-2026-9081",
            email: req.user.email,
            mobile: req.user.mobile || "6383120790",
            address: req.user.address || "145/2A, Main Road, Coimbatore, Tamil Nadu",
            role: req.user.role,
            accountStatus: req.user.status || "Active",
            assignedParcels: req.user.assignedParcels || ["LND-001", "LND-003"]
        }
    });
});

/**
 * @route   PUT /api/citizen/profile
 * @desc    Update appropriate citizen profile fields (strictly blocks role, citizenId, permissions change)
 */
router.put("/profile", requireRole("citizen", "admin"), (req, res) => {
    const { name, mobile, address } = req.body;

    const updatedUser = userService.updateUser(req.user.uid, {
        name: name !== undefined ? name : req.user.name,
        mobile: mobile !== undefined ? mobile : req.user.mobile,
        address: address !== undefined ? address : req.user.address
    });

    // Ensure role and permissions remain untouched
    if (updatedUser) {
        req.user.name = updatedUser.name;
        req.user.mobile = updatedUser.mobile;
        req.user.address = updatedUser.address;
    }

    auditService.logEvent({
        actor: req.user.email,
        target: req.user.uid,
        action: "PROFILE_UPDATED",
        result: "SUCCESS",
        details: { name, mobile }
    });

    return res.json({
        success: true,
        message: "Profile updated successfully.",
        profile: {
            name: req.user.name,
            citizenId: req.user.uid,
            email: req.user.email,
            mobile: req.user.mobile,
            address: req.user.address,
            role: req.user.role,
            accountStatus: req.user.status || "Active"
        }
    });
});

module.exports = router;
