/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   UNIFIED GOVERNANCE DASHBOARD SUMMARY SERVICE (PHASE 12N)
   ========================================================= */

const { getAllLandProfiles } = require("../data/landProfile");
const { validateLandGovernance } = require("./governanceValidator");
const { canAccessParcel } = require("./parcelAccessService");
const { getAllRequests } = require("../data/departmentRequests");
const { getAllConflicts } = require("../data/conflicts");
const auditService = require("./auditService");
const cadastralData = require("../data/cadastral");
const rorData = require("../data/ror");
const registrationData = require("../data/registration");
const landUseData = require("../data/landuse");
const propertyTaxData = require("../data/PropertyTax");
const buildingPermissionData = require("../data/BuildingPermission");
const restrictionsData = require("../data/restrictions");
const { getAllDocuments } = require("../data/documents");

function getGovernanceSummary(user) {
    const profiles = getAllLandProfiles().filter(p => canAccessParcel(user, p.parcelId));
    const allRequests = getAllRequests();
    const allConflicts = getAllConflicts();
    const allDocs = getAllDocuments ? getAllDocuments() : [];
    const auditLogs = auditService.getAuditLogs ? auditService.getAuditLogs() : [];
    const now = new Date();

    let verifiedCount = 0;
    let reviewRequiredCount = 0;
    let conflictCount = 0;
    let pendingVerificationCount = 0;
    let dataIncompleteCount = 0;

    const parcelsRequiringAttention = [];

    profiles.forEach(p => {
        const govAssessment = validateLandGovernance(p);
        const status = govAssessment.centralizedStatus || "VERIFIED";

        if (status === "VERIFIED") verifiedCount++;
        else if (status === "REVIEW REQUIRED") reviewRequiredCount++;
        else if (status === "CONFLICT DETECTED") conflictCount++;
        else if (status === "PENDING VERIFICATION") pendingVerificationCount++;
        else if (status === "DATA INCOMPLETE") dataIncompleteCount++;

        const parcelConflicts = allConflicts.filter(c => c.parcelId === p.parcelId && c.status !== "RESOLVED");
        const parcelRequests = allRequests.filter(r => r.parcelId === p.parcelId && !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status));
        const overdueParcelRequests = parcelRequests.filter(r => r.dueAt && new Date(r.dueAt) < now);

        let priorityScore = 0;
        if (parcelConflicts.some(c => (c.severity || "").toUpperCase() === "CRITICAL")) priorityScore += 1000;
        else if (parcelConflicts.some(c => (c.severity || "").toUpperCase() === "HIGH")) priorityScore += 500;
        else if (overdueParcelRequests.length > 0) priorityScore += 300;
        else if (status === "PENDING VERIFICATION") priorityScore += 200;
        else if (status === "DATA INCOMPLETE") priorityScore += 100;
        else if (parcelConflicts.length > 0) priorityScore += 50;

        parcelsRequiringAttention.push({
            parcelId: p.parcelId,
            surveyNumber: p.parcel ? p.parcel.surveyNumber : "SUR-101",
            district: p.parcel ? p.parcel.district : "Central District",
            village: p.parcel ? p.parcel.village : "Village Area",
            owner: p.ror ? p.ror.currentOwner : (p.parcel ? p.parcel.owner : "N/A"),
            governanceStatus: status,
            openConflicts: parcelConflicts.length,
            pendingRequests: parcelRequests.length,
            lastUpdated: p.parcel ? (p.parcel.lastUpdated || p.parcel.createdAt || "2026-09-07") : "2026-09-07",
            healthScore: govAssessment.healthScore || 100,
            priorityScore
        });
    });

    parcelsRequiringAttention.sort((a, b) => b.priorityScore - a.priorityScore);

    const totalParcelsCount = profiles.length;
    const governanceStatusBreakdown = {
        VERIFIED: { count: verifiedCount, percentage: totalParcelsCount > 0 ? Math.round((verifiedCount / totalParcelsCount) * 100) : 0 },
        REVIEW_REQUIRED: { count: reviewRequiredCount, percentage: totalParcelsCount > 0 ? Math.round((reviewRequiredCount / totalParcelsCount) * 100) : 0 },
        CONFLICT_DETECTED: { count: conflictCount, percentage: totalParcelsCount > 0 ? Math.round((conflictCount / totalParcelsCount) * 100) : 0 },
        PENDING_VERIFICATION: { count: pendingVerificationCount, percentage: totalParcelsCount > 0 ? Math.round((pendingVerificationCount / totalParcelsCount) * 100) : 0 },
        DATA_INCOMPLETE: { count: dataIncompleteCount, percentage: totalParcelsCount > 0 ? Math.round((dataIncompleteCount / totalParcelsCount) * 100) : 0 }
    };

    // Filter requests
    const pendingReqs = allRequests.filter(r => r.status === "PENDING").length;
    const inProgressReqs = allRequests.filter(r => r.status === "IN_PROGRESS").length;
    const completedTodayReqs = allRequests.filter(r => r.status === "COMPLETED" && r.completedAt && new Date(r.completedAt).toDateString() === now.toDateString()).length;
    const overdueReqs = allRequests.filter(r => !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status) && r.dueAt && new Date(r.dueAt) < now).length;
    const conflictRelatedReqs = allRequests.filter(r => r.reason && r.reason.toLowerCase().includes("conflict")).length;

    // Filter conflicts
    const criticalConflicts = allConflicts.filter(c => (c.severity || "").toUpperCase() === "CRITICAL" && c.status !== "RESOLVED").length;
    const highConflicts = allConflicts.filter(c => (c.severity || "").toUpperCase() === "HIGH" && c.status !== "RESOLVED").length;
    const mediumConflicts = allConflicts.filter(c => (c.severity || "").toUpperCase() === "MEDIUM" && c.status !== "RESOLVED").length;
    const lowConflicts = allConflicts.filter(c => (c.severity || "").toUpperCase() === "LOW" && c.status !== "RESOLVED").length;
    const openConflicts = allConflicts.filter(c => c.status === "OPEN").length;
    const underReviewConflicts = allConflicts.filter(c => c.status === "UNDER_REVIEW" || c.status === "IN_PROGRESS").length;
    const resolvedConflicts = allConflicts.filter(c => c.status === "RESOLVED").length;

    // Department Workload & Health across 8 departments
    const deptList = [
        { name: "Cadastral", fullName: "Cadastral & Survey Department", data: cadastralData },
        { name: "RoR", fullName: "Land Records Department", data: rorData },
        { name: "Registration", fullName: "Registration Department", data: registrationData },
        { name: "Land Use", fullName: "Land Use & Planning Department", data: landUseData },
        { name: "Property Tax", fullName: "Property Tax & Municipal Department", data: propertyTaxData },
        { name: "Building / Municipal", fullName: "Building Permission Department", data: buildingPermissionData },
        { name: "Restrictions", fullName: "Restrictions & Regulatory Department", data: restrictionsData },
        { name: "Documents", fullName: "Document Management Department", data: allDocs }
    ];

    const departmentWorkload = {};
    const departmentDataHealth = {};

    deptList.forEach(dept => {
        const deptReqs = allRequests.filter(r => (r.to && r.to.department === dept.fullName) || (r.from && r.from.department === dept.fullName));
        const deptConflicts = allConflicts.filter(c => (c.affectedDepartments || []).includes(dept.fullName) || c.assignedDepartment === dept.fullName);
        const pReq = deptReqs.filter(r => r.status === "PENDING").length;
        const ipReq = deptReqs.filter(r => r.status === "IN_PROGRESS").length;
        const compReq = deptReqs.filter(r => r.status === "COMPLETED").length;
        const ovReq = deptReqs.filter(r => !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status) && r.dueAt && new Date(r.dueAt) < now).length;

        departmentWorkload[dept.name] = {
            pending: pReq,
            inProgress: ipReq,
            completed: compReq,
            overdue: ovReq,
            conflicts: deptConflicts.filter(c => c.status !== "RESOLVED").length
        };

        const records = Array.isArray(dept.data) ? dept.data : [];
        departmentDataHealth[dept.name] = {
            recordsAvailable: records.length || profiles.length,
            verified: Math.max(0, (records.length || profiles.length) - pReq - deptConflicts.length),
            pending: pReq,
            conflicts: deptConflicts.filter(c => c.status !== "RESOLVED").length,
            missingData: Math.max(0, profiles.length - (records.length || profiles.length))
        };
    });

    // Recent System Activity
    const recentActivity = auditLogs.slice(0, 15).map(log => ({
        id: log.id || `ACT-${Math.floor(Math.random()*10000)}`,
        timestamp: log.timestamp || new Date().toISOString(),
        action: log.action || "SYSTEM_EVENT",
        actor: log.actor || "System",
        parcelId: log.target || log.parcelId || "LND-001",
        description: log.notes || `${log.action} performed on ${log.target || 'system'}`,
        targetType: log.action.includes("REQUEST") ? "REQUEST" : (log.action.includes("CONFLICT") ? "CONFLICT" : (log.action.includes("DOC") ? "DOCUMENT" : "PARCEL"))
    }));

    // Recently accessed parcels for logged-in user
    const recentlyAccessed = profiles.slice(0, 10).map(p => ({
        parcelId: p.parcelId,
        surveyNumber: p.parcel ? p.parcel.surveyNumber : "SUR-101",
        owner: p.ror ? p.ror.currentOwner : (p.parcel ? p.parcel.owner : "N/A"),
        lastUpdated: p.parcel ? (p.parcel.lastUpdated || "2026-09-07") : "2026-09-07",
        status: validateLandGovernance(p).centralizedStatus
    }));

    const totalDocumentsReview = allDocs.filter(d => (d.verificationStatus || d.status || "").toUpperCase() === "PENDING" || (d.verificationStatus || d.status || "").toUpperCase() === "UNDER_REVIEW").length;
    const totalPendingVerifications = pendingVerificationCount + pendingReqs;

    return {
        overview: {
            totalParcels: totalParcelsCount,
            verifiedParcels: verifiedCount,
            reviewRequired: reviewRequiredCount,
            conflicts: conflictCount,
            pendingRequests: pendingReqs,
            overdueRequests: overdueReqs,
            pendingVerifications: totalPendingVerifications,
            documentsRequiringReview: totalDocumentsReview
        },
        governanceStatusBreakdown,
        parcelsRequiringAttention,
        departmentWorkload,
        departmentDataHealth,
        requestSummary: {
            pending: pendingReqs,
            inProgress: inProgressReqs,
            completedToday: completedTodayReqs,
            overdue: overdueReqs,
            conflictRelated: conflictRelatedReqs
        },
        conflictSummary: {
            critical: criticalConflicts,
            high: highConflicts,
            medium: mediumConflicts,
            low: lowConflicts,
            open: openConflicts,
            underReview: underReviewConflicts,
            resolved: resolvedConflicts
        },
        recentActivity,
        recentlyAccessed
    };
}

module.exports = {
    getGovernanceSummary
};
