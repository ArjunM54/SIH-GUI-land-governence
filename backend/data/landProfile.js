
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND PROFILE DATA

   This file combines:

   1. Parcel data
   2. Cadastral data
   3. RoR data

   The actual source data is maintained separately.

   This module provides a reusable function for
   generating a unified land profile.
   ========================================================= */


const parcels =
    require("./parcels");

const cadastralData =
    require("./cadastral");

const rorData =
    require("./ror");

const landUseData =
    require("./landuse");

const registrationData =
    require("./registration");

const propertyTaxData =
    require("./PropertyTax");

const buildingPermissionData =
    require("./BuildingPermission");

const restrictionsData =
    require("./restrictions");

const utilitiesData =
    require("./utilities");


/* =========================================================
   GET LAND PROFILE
   ========================================================= */

function getLandProfile(parcelId) {

    /* -----------------------------------------------------
       Find parcel
       ----------------------------------------------------- */

    const parcel =
        parcels.find(
            item =>
                item.id.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!parcel) {

        return null;

    }


    /* -----------------------------------------------------
       Find cadastral record
       ----------------------------------------------------- */

    const cadastral =
        cadastralData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* -----------------------------------------------------
       Find RoR record
       ----------------------------------------------------- */

    const ror =
        rorData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );

    /* -----------------------------------------------------
       Find registration record
       ----------------------------------------------------- */

    const registration =
        registrationData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );


    /* -----------------------------------------------------
       Find Land Use record
       ----------------------------------------------------- */

    const landUse =
        landUseData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );

    /* -----------------------------------------------------
       Find Property Tax record
       ----------------------------------------------------- */

    const propertyTax =
        propertyTaxData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );

    /* -----------------------------------------------------
       Find Building Permission record
       ----------------------------------------------------- */

    const buildingPermission = buildingPermissionData.find(
        item =>
            item.parcelId.toLowerCase() ===
            parcelId.toLowerCase()
    );

    /* -----------------------------------------------------
       Find restrictions record
       ----------------------------------------------------- */

    const restrictions =
        restrictionsData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );

    /* -----------------------------------------------------
       Find utilities record
       ----------------------------------------------------- */

    const utilities =
        utilitiesData.find(
            item =>
                item.parcelId.toLowerCase() ===
                parcelId.toLowerCase()
        );

    /* -----------------------------------------------------
       Create unified profile
       ----------------------------------------------------- */

    const landProfile = {

        parcelId: parcel.id,

        parcel: parcel,

        cadastral:
            cadastral || null,

        ror:
            ror || null,

        landUse:
            landUse || null,

        registration:
            registration || null,

        propertyTax:
            propertyTax || null,

        buildingPermission:
            buildingPermission || null,

        restrictions:
            restrictions || null,

        utilities:
            utilities || null,

        ownershipHistory:
            (require("../services/applicationService").getOwnershipHistory(parcel.id)) || []
    };


    return landProfile;

}


/* =========================================================
   GET INTEGRATED LAND PROFILE
   ========================================================= */
function formatApplicationTimelineTitle(event) {

    const titles = {

        APPLICATION_SUBMITTED:
            "Citizen Application Submitted",

        ROUTED_TO_DEPARTMENTS:
            "Application Routed to Departments",

        OFFICER_APPROVED:
            "Department Verification Approved",

        OFFICER_REJECTED:
            "Department Verification Rejected",

        DOCUMENT_REQUIRED:
            "Additional Document Requested",

        INTER_DEPARTMENT_REQUEST_SENT:
            "Inter-Department Verification Requested",

        INTER_DEPARTMENT_RESPONSE_SUBMITTED:
            "Inter-Department Response Submitted"
    };

    return (
        titles[event.action] ||
        event.action ||
        "Application Status Updated"
    );
}

function getIntegratedLandProfile(parcelId) {
    const raw = getLandProfile(parcelId);
    if (!raw) return null;

    const documentsData = require("./documents");
    const docs = documentsData.filter(d => d.parcelId && d.parcelId.toLowerCase() === parcelId.toLowerCase());

    const auditService = require("../services/auditService");
    const logs = auditService.getLogsForTarget ? auditService.getLogsForTarget(parcelId) : [];

    const { validateLandGovernance } = require("../services/governanceValidator");
    const govAssessment = validateLandGovernance(raw);

    const { detectLandConflicts } = require("../services/conflictDetector");
    const detectedConflicts = detectLandConflicts(raw, govAssessment);

    const allConflicts = [...(detectedConflicts.conflicts || [])];

    if (raw.cadastral && Array.isArray(raw.cadastral.conflicts)) {
        raw.cadastral.conflicts.forEach(c => {
            if (!allConflicts.some(e => e.id === c.conflictId)) {
                allConflicts.push({
                    id: c.conflictId,
                    category: "CADASTRAL",
                    severity: (c.severity || "MEDIUM").toUpperCase(),
                    status: c.status || "OPEN",
                    title: c.type || "Boundary Conflict",
                    description: c.description,
                    affectedData: `Cadastral Survey ${c.parcelId}`,
                    recommendation: "Investigate boundary overlap with survey office."
                });
            }
        });
    }

    if (raw.ror && Array.isArray(raw.ror.disputes)) {
        raw.ror.disputes.forEach(d => {
            if (!allConflicts.some(e => e.id === d.disputeId)) {
                allConflicts.push({
                    id: d.disputeId,
                    category: "OWNERSHIP",
                    severity: (d.severity || "MEDIUM").toUpperCase(),
                    status: d.status || "OPEN",
                    title: d.type || "Ownership Dispute",
                    description: d.description,
                    affectedData: `RoR Record ${d.parcelId}`,
                    recommendation: "Resolve active title objection or court dispute."
                });
            }
        });
    }

    // Department Verification Statuses
    const cadastralStatus = (raw.cadastral?.boundaryStatus === "Verified" && raw.cadastral?.surveyStatus === "Verified")
        ? "VERIFIED"
        : (raw.cadastral?.conflicts?.length > 0 ? "CONFLICT" : "REVIEW REQUIRED");

    const rorStatus = (raw.ror?.rorStatus === "VERIFIED" || (raw.ror?.ownershipStatus === "Verified" && raw.ror?.mutationStatus === "Updated" && !raw.ror?.disputes?.length))
        ? "VERIFIED"
        : (raw.ror?.disputes?.length > 0 ? "CONFLICT" : "REVIEW REQUIRED");

    const registrationStatus = (raw.registration?.status === "APPROVED" || raw.registration?.deedStatus === "VERIFIED")
        ? "VERIFIED"
        : (["CANCELLED", "REJECTED"].includes(raw.registration?.status) ? "CONFLICT" : "REVIEW REQUIRED");

    const landUseStatus = (raw.landUse?.zoningStatus === "COMPATIBLE" || raw.landUse?.status === "APPROVED")
        ? "VERIFIED"
        : (raw.landUse?.zoningStatus === "INCOMPATIBLE" ? "CONFLICT" : "REVIEW REQUIRED");

    const taxStatus = (raw.propertyTax?.taxClearanceStatus === "CLEARED" && (raw.propertyTax?.outstandingAmount || 0) === 0)
        ? "VERIFIED"
        : ((raw.propertyTax?.outstandingAmount || 0) > 0 ? "REVIEW REQUIRED" : (raw.propertyTax?.assessmentStatus === "DISPUTED" ? "CONFLICT" : "REVIEW REQUIRED"));

    const buildingStatus = (raw.buildingPermission?.buildingPermissionStatus === "Approved" && raw.buildingPermission?.validityStatus === "Valid")
        ? "VERIFIED"
        : (raw.buildingPermission ? (["Rejected", "Expired"].includes(raw.buildingPermission.buildingPermissionStatus) ? "CONFLICT" : "REVIEW REQUIRED") : "NOT AVAILABLE");

    const restrictionsStatus = (raw.restrictions?.restrictionStatus === "Clear" || (!raw.restrictions?.waterBodyRestriction && !raw.restrictions?.governmentAcquisition && !raw.restrictions?.environmentalRestriction && !raw.restrictions?.roadWideningRestriction))
        ? "CLEAR"
        : (raw.restrictions?.riskLevel === "High" ? "RESTRICTED" : "RESTRICTED");

    // Overall Status Calculation
    let overallGovernanceStatus = "VERIFIED";
    const hasCriticalConflict = allConflicts.some(c => c.severity === "HIGH" || c.status === "CONFLICT");
    const hasPendingReview = [cadastralStatus, rorStatus, registrationStatus, landUseStatus, taxStatus, buildingStatus].includes("REVIEW REQUIRED") || (raw.propertyTax?.outstandingAmount || 0) > 0;

    if (hasCriticalConflict) {
        overallGovernanceStatus = "CONFLICT DETECTED";
    } else if (hasPendingReview) {
        overallGovernanceStatus = "REVIEW REQUIRED";
    } else {
        overallGovernanceStatus = "VERIFIED";
    }

    // Timeline Construction
    const timeline = [];
    // =====================================================
    // LIVE CITIZEN APPLICATION TIMELINE
    // =====================================================

    const applicationService = require("../services/applicationService");
    const parcelApplications =
        applicationService.applications.filter(
            app =>
                String(app.parcelId || "")
                    .trim()
                    .toUpperCase() ===
                String(parcelId)
                    .trim()
                    .toUpperCase()
        );

    const applicationTimelineEvents = [];

    parcelApplications.forEach(app => {

        const events =
            applicationService.getApplicationTimeline(
                app.applicationId
            );

        events.forEach(event => {

            applicationTimelineEvents.push({

                date:
                    event.timestamp
                        ? event.timestamp.split("T")[0]
                        : "",

                timestamp:
                    event.timestamp,

                year:
                    event.timestamp
                        ? event.timestamp.substring(0, 4)
                        : "2026",

                title:
                    formatApplicationTimelineTitle(
                        event
                    ),

                department:
                    event.department ||
                    "LandGov",

                officer:
                    event.actor ||
                    "System",

                details:
                    [
                        `Application: ${event.applicationId}`,

                        event.oldStatus
                            ? `Status: ${event.oldStatus} → ${event.newStatus}`
                            : `Status: ${event.newStatus || ""}`,

                        event.remarks
                            ? `Remarks: ${event.remarks}`
                            : ""
                    ]
                        .filter(Boolean)
                        .join(" | "),

                applicationId:
                    event.applicationId,

                eventType:
                    event.action
            });

        });

    });
    timeline.push(
        ...applicationTimelineEvents
    );


    timeline.sort((a, b) => {

        const dateA =
            a.timestamp ||
            a.date ||
            `${a.year || "1900"}-01-01`;

        const dateB =
            b.timestamp ||
            b.date ||
            `${b.year || "1900"}-01-01`;

        return String(dateB)
            .localeCompare(String(dateA));
    });
    return {
        ...raw,
        ownership: raw.ror || null,
        building: raw.buildingPermission || null,
        tax: raw.propertyTax || null,
        documents: docs,
        conflicts: allConflicts,
        timeline: timeline,
        audit: logs,
        governance: {
            overallStatus: overallGovernanceStatus,
            departmentStatuses: {
                cadastral: cadastralStatus,
                ror: rorStatus,
                registration: registrationStatus,
                landUse: landUseStatus,
                propertyTax: taxStatus,
                building: buildingStatus,
                restrictions: restrictionsStatus
            },
            lastUpdated: raw.parcel?.lastUpdated || "2026-09-03",
            dataSources: [
                "Cadastral Department",
                "RoR Department",
                "Registration Department",
                "Land Use & Planning Department",
                "Property Tax & Municipal Department",
                "Local Planning Authority"
            ],
            summary: govAssessment.summary,
            checks: govAssessment.checks || []
        }
    };
}


/* =========================================================
   GET ALL LAND PROFILES
   ========================================================= */

function getAllLandProfiles() {

    return parcels.map(parcel => getIntegratedLandProfile(parcel.id));

}


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {

    getLandProfile,

    getIntegratedLandProfile,

    getAllLandProfiles

};


