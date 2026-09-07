/* =========================================================
   LANDGOV GIS
   SIH26014

   COMPLETE LAND PROFILE UI

   Uses the EXACT field names returned by:
   /api/land-profile/:parcelId
   ========================================================= */


/* =========================================================
   1. OPEN COMPLETE LAND PROFILE
   ========================================================= */

/* =========================================================
   1. OPEN INTEGRATED LAND PARCEL WORKSPACE
   ========================================================= */

async function openCompleteLandProfile(parcelId) {
    console.log("Opening Integrated Land Parcel Workspace:", parcelId);

    window.activeLandProfileParcelId = parcelId;
    if (typeof closeAuditModal === "function") {
        closeAuditModal();
    }

    createLandProfilePanel();

    const panel = document.getElementById("land-profile-panel");
    panel.classList.add("integrated-workspace", "active");

    panel.innerHTML = `
        <div class="integrated-header">
            <div class="govt-branding-row">
                <div class="govt-brand-title">
                    <span class="govt-emblem">🏛️</span>
                    <div>
                        <div class="govt-main-heading">LANDGOV</div>
                        <div class="govt-sub-heading">INTEGRATED LAND PROFILE</div>
                    </div>
                </div>
                <div class="workspace-actions-group">
                    <button class="btn-govt-print" onclick="printIntegratedLandProfile()">🖨️ PRINT LAND PROFILE</button>
                    <button class="btn-govt-close" onclick="closeLandProfile()">✕ CLOSE</button>
                </div>
            </div>
            <div class="header-metadata-grid">
                <div class="meta-field-item">
                    <span class="meta-field-label">Parcel ID</span>
                    <span class="meta-field-value">${parcelId}</span>
                </div>
                <div class="meta-field-item">
                    <span class="meta-field-label">Loading Status</span>
                    <span class="meta-field-value">Fetching Department Records...</span>
                </div>
            </div>
        </div>
        <div class="integrated-workspace-body">
            <div class="land-profile-loading">
                <div class="loading-spinner"></div>
                <p>Loading integrated land profile across all departments...</p>
            </div>
        </div>
    `;

    try {
        const token = window.AuthManager ? window.AuthManager.getToken() : "";
        const response = await fetch(`http://localhost:5000/api/parcels/${parcelId}/integrated-profile`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            let errMsg = "Unable to load integrated land profile. Please try again.";
            if (response.status === 401) errMsg = "Your session has expired. Please login again.";
            else if (response.status === 403) errMsg = "You are not authorized to view this parcel.";
            else if (response.status === 404) errMsg = "Parcel integrated profile not found.";
            throw new Error(errMsg);
        }

        const result = await response.json();
        if (!result.success) throw new Error(result.message || "Parcel not found");

        const landProfile = result.data || result;
        window.selectedLandProfile = landProfile;

        if (window.activeLandProfileParcelId !== parcelId) return;

        renderLandProfile(landProfile);
    } catch (error) {
        if (window.activeLandProfileParcelId !== parcelId) return;
        console.error("Integrated land profile error:", error);

        panel.innerHTML = `
            <div class="integrated-header">
                <div class="govt-branding-row">
                    <div class="govt-brand-title">
                        <span class="govt-emblem">🏛️</span>
                        <div>
                            <div class="govt-main-heading">LANDGOV</div>
                            <div class="govt-sub-heading">INTEGRATED LAND PROFILE</div>
                        </div>
                    </div>
                    <div class="workspace-actions-group">
                        <button class="btn-govt-close" onclick="closeLandProfile()">✕ CLOSE</button>
                    </div>
                </div>
            </div>
            <div class="integrated-workspace-body">
                <div class="land-profile-error">
                    <h3>Unable to load land profile</h3>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
    }
}

/* =========================================================
   2. CREATE PANEL
   ========================================================= */

function createLandProfilePanel() {
    if (document.getElementById("land-profile-panel")) return;

    const panel = document.createElement("div");
    panel.id = "land-profile-panel";
    document.body.appendChild(panel);
}

/* =========================================================
   3. RENDER INTEGRATED WORKSPACE
   ========================================================= */

function renderLandProfile(profile) {
    const panel = document.getElementById("land-profile-panel");
    if (!panel) return;
    panel.classList.add("integrated-workspace", "active");

    const parcel = profile.parcel || {};
    const cadastral = profile.cadastral || {};
    const ror = profile.ror || profile.ownership || {};
    const landUse = profile.landUse || {};
    const registration = profile.registration || {};
    const propertyTax = profile.propertyTax || profile.tax || {};
    const building = profile.buildingPermission || profile.building || {};
    const restrictions = profile.restrictions || {};
    const utilities = profile.utilities || {};
    const documents = Array.isArray(profile.documents) ? profile.documents : [];
    const conflicts = Array.isArray(profile.conflicts) ? profile.conflicts : [];
    const timeline = Array.isArray(profile.timeline) ? profile.timeline : [];
    const auditLogs = Array.isArray(profile.audit) ? profile.audit : [];
    const gov = profile.governance || {};

    const overallStatus = gov.overallStatus || "VERIFIED";
    let overallBadgeClass = "status-badge-verified";
    if (overallStatus === "REVIEW REQUIRED") overallBadgeClass = "status-badge-review";
    if (overallStatus === "CONFLICT DETECTED") overallBadgeClass = "status-badge-conflict";

    const deptStatuses = gov.departmentStatuses || {
        cadastral: cadastral.boundaryStatus === "Verified" ? "VERIFIED" : "REVIEW REQUIRED",
        ror: ror.rorStatus === "VERIFIED" ? "VERIFIED" : "REVIEW REQUIRED",
        registration: registration.status === "APPROVED" ? "VERIFIED" : "REVIEW REQUIRED",
        landUse: landUse.zoningStatus === "COMPATIBLE" ? "VERIFIED" : "REVIEW REQUIRED",
        propertyTax: (propertyTax.outstandingAmount || 0) === 0 ? "VERIFIED" : "REVIEW REQUIRED",
        building: building.buildingPermissionStatus === "Approved" ? "VERIFIED" : "NOT AVAILABLE",
        restrictions: restrictions.restrictionStatus === "Clear" ? "CLEAR" : "RESTRICTED"
    };

    panel.innerHTML = `
        <div class="integrated-header">
            <div class="govt-branding-row">
                <div class="govt-brand-title">
                    <span class="govt-emblem">🏛️</span>
                    <div>
                        <div class="govt-main-heading">LANDGOV</div>
                        <div class="govt-sub-heading">INTEGRATED LAND PROFILE</div>
                    </div>
                </div>
                <div class="workspace-actions-group">
                    <button class="btn-govt-primary" onclick="openCreateDepartmentRequestModal('${parcel.id || profile.parcelId}')">📤 + DEPARTMENT REQUEST</button>
                    <button class="btn-govt-print" onclick="printIntegratedLandProfile()">🖨️ PRINT LAND PROFILE</button>
                    <button class="btn-govt-close" onclick="closeLandProfile()">✕ CLOSE</button>
                </div>
            </div>

            <div class="header-metadata-grid">
                <div class="meta-field-item">
                    <span class="meta-field-label">Parcel ID</span>
                    <span class="meta-field-value">${parcel.id || profile.parcelId}</span>
                </div>
                <div class="meta-field-item">
                    <span class="meta-field-label">Survey Number</span>
                    <span class="meta-field-value">${parcel.surveyNumber || cadastral.surveyNumber || "SUR-101"}</span>
                </div>
                <div class="meta-field-item">
                    <span class="meta-field-label">Location</span>
                    <span class="meta-field-value">${parcel.village || "Demo Village"}, ${parcel.district || "Coimbatore"}</span>
                </div>
                <div class="meta-field-item">
                    <span class="meta-field-label">Overall Governance Status</span>
                    <div><span class="${overallBadgeClass}">${overallStatus}</span></div>
                </div>
            </div>
        </div>

        <div class="workspace-submeta-bar">
            <span><strong>Last Updated:</strong> ${gov.lastUpdated || "2026-09-03"}</span>
            <span><strong>Data Sources:</strong> Cadastral, RoR, Registration, Land Use, Property Tax, Municipal</span>
            <span><strong>Verification Status:</strong> ${overallStatus === "VERIFIED" ? "✓ All Department Records Synchronized" : "⚠️ Administrative Review Required"}</span>
        </div>

        <div class="workspace-nav-tabs" id="workspace-nav-tabs">
            <button class="workspace-tab-btn active" onclick="switchWorkspaceTab('overview')">OVERVIEW</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('gismap')">GIS MAP</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('ownership')">OWNERSHIP / RoR</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('registration')">REGISTRATION</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('landuse')">LAND USE</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('tax')">PROPERTY TAX</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('building')">BUILDING & MUNICIPAL</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('restrictions')">RESTRICTIONS</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('documents')">DOCUMENTS (${documents.length})</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('conflicts')">CONFLICTS (${conflicts.length})</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('deptrequests')">DEPARTMENT REQUESTS</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('timeline')">TIMELINE</button>
            <button class="workspace-tab-btn" onclick="switchWorkspaceTab('audit')">AUDIT</button>
        </div>

        <div class="integrated-workspace-body" id="integrated-workspace-body">
            <div class="tab-pane-content active" id="tab-pane-overview">
                ${renderOverviewPane(profile, overallStatus, deptStatuses, conflicts)}
            </div>

            <div class="tab-pane-content" id="tab-pane-gismap">
                ${renderGisMapPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-ownership">
                ${renderOwnershipPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-registration">
                ${renderRegistrationPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-landuse">
                ${renderLandUsePane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-tax">
                ${renderPropertyTaxPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-building">
                ${renderBuildingMunicipalPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-restrictions">
                ${renderRestrictionsPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-documents">
                ${renderDocumentsPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-conflicts">
                ${renderConflictsPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-deptrequests">
                ${renderDepartmentRequestsPane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-timeline">
                ${renderTimelinePane(profile)}
            </div>

            <div class="tab-pane-content" id="tab-pane-audit">
                ${renderAuditPane(profile)}
            </div>
        </div>
    `;

    initIntegratedWorkspaceMap(parcel);
}

function renderOverviewPane(profile, overallStatus, deptStatuses, conflicts) {
    const parcel = profile.parcel || {};
    const cadastral = profile.cadastral || {};
    const ror = profile.ror || profile.ownership || {};
    const landUse = profile.landUse || {};
    const registration = profile.registration || {};
    const propertyTax = profile.propertyTax || profile.tax || {};
    const building = profile.buildingPermission || profile.building || {};
    const restrictions = profile.restrictions || {};
    const utilities = profile.utilities || {};

    return `

        <!-- =================================================
             0. GOVERNANCE STATUS CONTAINER
             ================================================= -->
        <div id="governance-status-container" class="profile-section governance-section">
            <div class="governance-loading">
                <div class="loading-spinner-small"></div>
                <span>Analyzing land governance...</span>
            </div>
        </div>

        <!-- =================================================
             0.1 DEVELOPMENT PROPOSAL VALIDATION SECTION
             ================================================= -->
        <div id="proposal-validation-container" class="profile-section proposal-section">
            <div class="profile-section-title proposal-main-title">
                🏗️ Development Proposal Validation
            </div>

            <div class="proposal-parcel-context">
                Current Parcel: <strong>${parcel.id || profile.parcelId}</strong>
            </div>

            <form id="proposal-form" onsubmit="handleValidateProposal(event, '${parcel.id || profile.parcelId}')" class="proposal-form">
                <div class="proposal-form-group">
                    <label for="proposal-activity-type">Activity Type</label>
                    <select id="proposal-activity-type" class="proposal-input">
                        <option value="">-- Select Activity Type --</option>
                        <option value="RESIDENTIAL">RESIDENTIAL</option>
                        <option value="COMMERCIAL">COMMERCIAL</option>
                        <option value="INDUSTRIAL">INDUSTRIAL</option>
                        <option value="AGRICULTURAL">AGRICULTURAL</option>
                        <option value="PUBLIC">PUBLIC</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                </div>

                <div class="proposal-form-group">
                    <label for="proposal-development-type">Development Type</label>
                    <select id="proposal-development-type" class="proposal-input">
                        <option value="">-- Select Development Type --</option>
                        <option value="NEW_BUILDING">NEW_BUILDING</option>
                        <option value="EXTENSION">EXTENSION</option>
                        <option value="CHANGE_OF_USE">CHANGE_OF_USE</option>
                        <option value="OTHER">OTHER</option>
                    </select>
                </div>

                <div class="proposal-form-group">
                    <label for="proposal-area">Proposed Area (sq.ft)</label>
                    <input type="number" id="proposal-area" class="proposal-input" placeholder="e.g. 1500" min="1" step="any">
                </div>

                <div id="proposal-inline-error" class="proposal-inline-error" style="display: none;"></div>

                <div class="proposal-buttons-row">
                    <button type="submit" id="proposal-validate-btn" class="proposal-btn proposal-btn-primary">
                        VALIDATE PROPOSAL
                    </button>
                    <button type="button" id="proposal-clear-btn" onclick="clearProposalForm('${parcel.id || profile.parcelId}')" class="proposal-btn proposal-btn-secondary">
                        CLEAR
                    </button>
                    <button type="button" id="proposal-history-btn" onclick="showValidationHistoryModal('${parcel.id || profile.parcelId}')" class="proposal-btn proposal-btn-secondary">
                        HISTORY
                    </button>
                </div>

            </form>

            <div class="proposal-disclaimer">
                Results are based on available land-governance records and are intended for administrative review.
            </div>

            <div id="proposal-result-container" class="proposal-result-wrapper"></div>
        </div>

        <!-- =================================================
             0.2 SUPPORTING DOCUMENTS & EVIDENCE SECTION
             ================================================= -->
        <div id="supporting-documents-container" class="profile-section documents-section">
            <div class="doc-section-header-row">
                <div class="profile-section-title" style="margin: 0;">
                    📁 Supporting Documents & Evidence
                </div>
                <button type="button" class="doc-btn-upload-trigger" onclick="showUploadDocumentModal('${parcel.id || profile.parcelId}')">
                    + Upload Evidence
                </button>
            </div>
            <div id="documents-list-content">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading supporting documents...</span>
                </div>
            </div>
        </div>



        <!-- =================================================
             1. PARCEL
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                📍 Parcel Information
            </div>


            ${profileRow(
        "Parcel ID",
        parcel.id
    )}


            ${profileRow(
        "Survey Number",
        parcel.surveyNumber
    )}


            ${profileRow(
        "Owner",
        parcel.owner
    )}


            ${profileRow(
        "Land Type",
        parcel.landType
    )}


            ${profileRow(
        "Area",
        parcel.area
    )}


            ${profileRow(
        "District",
        parcel.district
    )}


            ${profileRow(
        "Village",
        parcel.village
    )}


            ${profileRow(
        "Status",
        parcel.status
    )}


            ${profileRow(
        "Land Use",
        parcel.landUse
    )}

        </div>


        <!-- =================================================
             2. CADASTRAL
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                📐 Cadastral Information
            </div>


            ${profileRow(
        "Parcel ID",
        cadastral.parcelId
    )}


            ${profileRow(
        "Survey Number",
        cadastral.surveyNumber
    )}


            ${profileRow(
        "Sub-Division Number",
        cadastral.subDivisionNumber
    )}


            ${profileRow(
        "Village",
        cadastral.village
    )}


            ${profileRow(
        "Taluk",
        cadastral.taluk
    )}


            ${profileRow(
        "District",
        cadastral.district
    )}


            ${profileRow(
        "State",
        cadastral.state
    )}


            ${profileRow(
        "Area",
        cadastral.area
    )}


            ${profileRow(
        "Boundary Status",
        cadastral.boundaryStatus
    )}


            ${profileRow(
        "Map Reference",
        cadastral.mapReference
    )}

        </div>


        <!-- =================================================
             3. RoR
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                👤 Record of Rights
            </div>


            ${profileRow(
        "Record Number",
        ror.recordNumber
    )}


            ${profileRow(
        "Rights Holder",
        ror.rightsHolder
    )}


            ${profileRow(
        "Right Type",
        ror.rightType
    )}


            ${profileRow(
        "Ownership Status",
        ror.ownershipStatus
    )}


            ${profileRow(
        "Tenure Type",
        ror.tenureType
    )}


            ${profileRow(
        "Registration Status",
        ror.registrationStatus
    )}


            ${profileRow(
        "Mutation Status",
        ror.mutationStatus
    )}


            ${profileRow(
        "Record Status",
        ror.recordStatus
    )}


            ${profileRow(
        "Last Updated",
        ror.lastUpdated
    )}

        </div>


        <!-- =================================================
             4. LAND USE
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                🏘 Land Use & Zoning
            </div>


            ${profileRow(
        "Land Use Type",
        landUse.landUseType
    )}


            ${profileRow(
        "Zoning Code",
        landUse.zoningCode
    )}


            ${profileRow(
        "Zoning Name",
        landUse.zoningName
    )}


            ${profileRow(
        "Development Status",
        landUse.developmentStatus
    )}


            ${profileList(
        "Permitted Use",
        landUse.permittedUse
    )}


            ${profileList(
        "Restricted Use",
        landUse.restrictedUse
    )}


            ${profileRow(
        "Development Restriction",
        landUse.developmentRestriction
    )}


            ${profileRow(
        "Master Plan Status",
        landUse.masterPlanStatus
    )}


            ${profileRow(
        "Last Updated",
        landUse.lastUpdated
    )}

        </div>


        <!-- =================================================
             5. REGISTRATION
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                📜 Registration
            </div>


            ${profileRow(
        "Registration Number",
        registration.registrationNumber
    )}


            ${profileRow(
        "Document Number",
        registration.documentNumber
    )}


            ${profileRow(
        "Document Type",
        registration.documentType
    )}


            ${profileRow(
        "Registration Date",
        registration.registrationDate
    )}


            ${profileRow(
        "Registration Office",
        registration.registrationOffice
    )}


            ${profileRow(
        "Transaction Type",
        registration.transactionType
    )}


            ${profileRow(
        "Registration Status",
        registration.registrationStatus
    )}


            ${profileRow(
        "Consideration Amount",
        formatCurrency(
            registration.considerationAmount
        )
    )}


            ${profileRow(
        "Encumbrance Status",
        registration.encumbranceStatus
    )}


            ${profileRow(
        "Document Status",
        registration.documentStatus
    )}


            ${profileRow(
        "Last Updated",
        registration.lastUpdated
    )}

        </div>


        <!-- =================================================
             6. PROPERTY TAX
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                💰 Property Tax
            </div>


            ${profileRow(
        "Assessment Number",
        propertyTax.assessmentNumber
    )}


            ${profileRow(
        "Property Type",
        propertyTax.propertyType
    )}


            ${profileRow(
        "Tax Year",
        propertyTax.taxYear
    )}


            ${profileRow(
        "Annual Tax",
        formatCurrency(
            propertyTax.annualTax
        )
    )}


            ${profileRow(
        "Amount Paid",
        formatCurrency(
            propertyTax.amountPaid
        )
    )}


            ${profileRow(
        "Outstanding Amount",
        formatCurrency(
            propertyTax.outstandingAmount
        )
    )}


            ${profileRow(
        "Payment Status",
        propertyTax.paymentStatus
    )}


            ${profileRow(
        "Last Payment Date",
        propertyTax.lastPaymentDate
    )}


            ${profileRow(
        "Assessment Status",
        propertyTax.assessmentStatus
    )}


            ${profileRow(
        "Last Updated",
        propertyTax.lastUpdated
    )}

        </div>


        <!-- =================================================
             7. BUILDING PERMISSION
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                🏗 Building Permission
            </div>


            ${profileRow(
        "Application Number",
        building.applicationNumber
    )}


            ${profileRow(
        "Permission Status",
        building.buildingPermissionStatus
    )}


            ${profileRow(
        "Permission Type",
        building.permissionType
    )}


            ${profileRow(
        "Approved Building Type",
        building.approvedBuildingType
    )}


            ${profileRow(
        "Maximum Floors",
        building.maximumFloors
    )}


            ${profileRow(
        "Maximum Built-up Area",
        building.maximumBuiltUpArea
    )}


            ${profileRow(
        "Setback Requirement",
        building.setbackRequirement
    )}


            ${profileRow(
        "Parking Requirement",
        building.parkingRequirement
    )}


            ${profileRow(
        "Approval Authority",
        building.approvalAuthority
    )}


            ${profileRow(
        "Application Date",
        building.applicationDate
    )}


            ${profileRow(
        "Approval Date",
        building.approvalDate
    )}


            ${profileRow(
        "Validity Status",
        building.validityStatus
    )}


            ${profileRow(
        "Document Status",
        building.documentStatus
    )}

        </div>


        <!-- =================================================
             8. RESTRICTIONS
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                ⚠️ Restrictions & Risk
            </div>


            ${profileRow(
        "Restriction Status",
        restrictions.restrictionStatus
    )}


            ${profileRow(
        "Risk Level",
        restrictions.riskLevel
    )}


            ${profileList(
        "Restrictions",
        restrictions.restrictions
    )}


            ${profileRow(
        "Flood Risk",
        restrictions.floodRisk
    )}


            ${profileRow(
        "Water Body Restriction",
        yesNo(
            restrictions.waterBodyRestriction
        )
    )}


            ${profileRow(
        "Road Widening Restriction",
        yesNo(
            restrictions.roadWideningRestriction
        )
    )}


            ${profileRow(
        "Government Acquisition",
        yesNo(
            restrictions.governmentAcquisition
        )
    )}


            ${profileRow(
        "Environmental Restriction",
        yesNo(
            restrictions.environmentalRestriction
        )
    )}


            ${profileRow(
        "Heritage Restriction",
        yesNo(
            restrictions.heritageRestriction
        )
    )}


            ${profileRow(
        "Development Restriction",
        yesNo(
            restrictions.developmentRestriction
        )
    )}


            ${profileRow(
        "Remarks",
        restrictions.remarks
    )}


            ${profileRow(
        "Last Checked",
        restrictions.lastChecked
    )}

        </div>


        <!-- =================================================
             9. UTILITIES
             ================================================= -->

        <div class="profile-section">

            <div class="profile-section-title">
                ⚡ Utilities & Infrastructure
            </div>


            ${utilityCard(
        "⚡ Electricity",
        utilities.electricity
    )}


            ${utilityCard(
        "💧 Water",
        utilities.water
    )}


            ${utilityCard(
        "🚰 Sewerage",
        utilities.sewerage
    )}


            ${utilityCard(
        "🛣 Road Access",
        utilities.road
    )}


            ${utilityCard(
        "📡 Telecom",
        utilities.telecom
    )}


            ${profileRow(
        "Overall Infrastructure Status",
        utilities.overallStatus
    )}


            ${profileRow(
        "Last Updated",
        utilities.lastUpdated
    )}

        </div>

    `;

}


/* =========================================================
   4. PROFILE ROW
   ========================================================= */

function profileRow(
    label,
    value
) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        value = "Not Available";

    }


    return `

        <div class="profile-row">

            <span class="profile-label">
                ${label}
            </span>

            <span class="profile-value">
                ${value}
            </span>

        </div>

    `;

}


/* =========================================================
   5. LIST
   ========================================================= */

function profileList(
    label,
    values
) {

    if (
        !Array.isArray(values) ||
        values.length === 0
    ) {

        return `

            <div class="profile-row">

                <span class="profile-label">
                    ${label}
                </span>

                <span class="profile-value">
                    None
                </span>

            </div>

        `;

    }


    return `

        <div class="profile-list-row">

            <div class="profile-label">
                ${label}
            </div>

            <div class="profile-list">

                ${values
            .map(
                item =>
                    `<div class="profile-list-item">
                                • ${item}
                            </div>`
            )
            .join("")
        }

            </div>

        </div>

    `;

}


/* =========================================================
   6. UTILITY CARD
   ========================================================= */

function utilityCard(
    title,
    utility
) {

    if (!utility) {

        return "";

    }


    const available =
        utility.available;


    let details = "";


    Object.keys(utility).forEach(
        function (key) {

            if (
                key === "available"
            ) {

                return;

            }


            const value =
                utility[key];


            if (
                value !== null &&
                value !== undefined &&
                value !== ""
            ) {

                details += profileRow(
                    formatLabel(key),
                    value
                );

            }

        }
    );


    return `

        <div class="utility-card">

            <div class="utility-card-header">

                <strong>
                    ${title}
                </strong>

                <span
                    class="
                        utility-status
                        ${available
            ? "available"
            : "unavailable"
        }
                    "
                >

                    ${available
            ? "Available"
            : "Not Available"
        }

                </span>

            </div>


            <div class="utility-card-body">

                ${details}

            </div>

        </div>

    `;

}


/* =========================================================
   7. FORMAT LABEL
   ========================================================= */

function formatLabel(
    key
) {

    return key
        .replace(
            /([A-Z])/g,
            " $1"
        )
        .replace(
            /^./,
            function (letter) {
                return letter.toUpperCase();
            }
        );

}


/* =========================================================
   8. YES / NO
   ========================================================= */

function yesNo(
    value
) {

    if (
        value === true
    ) {

        return "Yes";

    }


    if (
        value === false
    ) {

        return "No";

    }


    return "Not Available";

}


/* =========================================================
   9. CURRENCY
   ========================================================= */

function formatCurrency(
    amount
) {

    if (
        amount === undefined ||
        amount === null
    ) {

        return "Not Available";

    }


    return "₹ " +
        Number(amount)
            .toLocaleString("en-IN");

}


/* =========================================================
   10. CLOSE
   ========================================================= */

function closeLandProfile() {

    const panel =
        document.getElementById(
            "land-profile-panel"
        );


    if (panel) {

        panel.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   11. GLOBAL FUNCTIONS
   ========================================================= */

window.openCompleteLandProfile =
    openCompleteLandProfile;


window.closeLandProfile =
    closeLandProfile;


/* =========================================================
   12. GOVERNANCE VALIDATION INTEGRATION
   ========================================================= */

async function fetchGovernanceStatus(parcelId) {
    try {
        console.log("Fetching governance status for:", parcelId);
        const response = await fetch(`http://localhost:5000/api/governance/${parcelId}`);

        if (window.activeLandProfileParcelId !== parcelId) {
            console.log("Ignored stale governance response for:", parcelId);
            return;
        }

        if (!response.ok) {
            throw new Error(`Governance API returned HTTP ${response.status}`);
        }

        const result = await response.json();

        if (window.activeLandProfileParcelId !== parcelId) return;

        if (!result.success || !result.data) {
            throw new Error(result.message || "Invalid governance response");
        }

        const container = document.getElementById("governance-status-container");
        if (container) {
            container.innerHTML = renderGovernanceHTML(result.data);
        }
    } catch (error) {
        console.error("Governance API Error:", error);

        if (window.activeLandProfileParcelId !== parcelId) return;

        const container = document.getElementById("governance-status-container");
        if (container) {
            container.innerHTML = `
                <div class="governance-error">
                    <div class="governance-error-title">⚠️ Governance validation unavailable</div>
                    <div class="governance-error-msg">Land records are available, but governance validation could not be completed.</div>
                </div>
            `;
        }
    }
}

/* =========================================================
   12.1 DOCUMENT & EVIDENCE INTELLIGENCE INTEGRATION
   ========================================================= */

async function fetchParcelDocuments(parcelId) {
    try {
        console.log("Fetching documents for parcel:", parcelId);
        const response = await fetch(`http://localhost:5000/api/documents/parcel/${parcelId}`);

        if (window.activeLandProfileParcelId !== parcelId) {
            console.log("Ignored stale document response for:", parcelId);
            return;
        }

        if (!response.ok) {
            throw new Error(`Document API returned HTTP ${response.status}`);
        }

        const result = await response.json();

        if (window.activeLandProfileParcelId !== parcelId) return;

        const docContainer = document.getElementById("documents-list-content");
        if (!docContainer) return;

        const docs = (result && result.success && Array.isArray(result.documents)) ? result.documents : [];

        if (docs.length === 0) {
            docContainer.innerHTML = `
                <div class="governance-no-issues" style="background: #f8fafc; border-color: #e2e8f0; color: #64748b;">
                    ℹ️ No supporting documents currently registered for this parcel.
                </div>
            `;
            return;
        }

        docContainer.innerHTML = `
            <div class="documents-grid">
                ${docs.map(doc => renderDocumentCardHTML(doc)).join("")}
            </div>
        `;

    } catch (error) {
        console.error("Document API Error:", error);
        if (window.activeLandProfileParcelId !== parcelId) return;

        const docContainer = document.getElementById("documents-list-content");
        if (docContainer) {
            docContainer.innerHTML = `
                <div class="governance-error">
                    <div class="governance-error-title">⚠️ Document Intelligence service unavailable</div>
                    <div class="governance-error-msg">${error.message}</div>
                </div>
            `;
        }
    }
}

function renderDocumentCardHTML(doc) {
    let statusClass = "doc-status-available";
    if (doc.status === "PENDING") statusClass = "doc-status-pending";
    if (doc.status === "EXPIRED") statusClass = "doc-status-expired";
    if (doc.status === "UNAVAILABLE") statusClass = "doc-status-unavailable";

    const ext = doc.textExtraction || {};
    let extClass = "extraction-unavailable";
    let extLabel = "UNAVAILABLE";
    if (ext.status === "SUCCESS") {
        extClass = "extraction-success";
        extLabel = "SUCCESS";
    } else if (ext.status === "FAILED") {
        extClass = "extraction-failed";
        extLabel = "FAILED";
    }

    const hasFile = Boolean(doc.fileName);

    return `
        <div class="document-card">
            <div class="document-card-header">
                <div class="document-card-title">
                    📄 ${doc.title}
                </div>
                <span class="doc-status-badge ${statusClass}">${doc.status}</span>
            </div>
            <div class="document-card-body">
                <div class="doc-meta-item">
                    <span class="doc-meta-label">Type</span>
                    <span class="doc-meta-val">${doc.documentType}</span>
                </div>
                <div class="doc-meta-item">
                    <span class="doc-meta-label">Document No.</span>
                    <span class="doc-meta-val">${doc.documentNumber}</span>
                </div>
                <div class="doc-meta-item">
                    <span class="doc-meta-label">Department</span>
                    <span class="doc-meta-val">${doc.issuingDepartment}</span>
                </div>
                <div class="doc-meta-item">
                    <span class="doc-meta-label">Extraction</span>
                    <span class="doc-meta-val"><span class="extraction-tag ${extClass}">${extLabel}</span></span>
                </div>
            </div>
            <div class="document-card-footer">
                <button type="button" class="doc-btn-view" onclick="showDocumentDetailsModal('${doc.documentId}')">
                    🔍 View Details
                </button>
                ${hasFile ? `
                    <button type="button" class="doc-btn-open" onclick="window.open(getDocumentFileUrl('${doc.documentId}'), '_blank')">
                        📂 Open Document
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}


function renderGovernanceHTML(data) {
    const overallStatus = data.overallStatus || "VALID";
    const riskLevel = data.riskLevel || "LOW";
    const score = data.score !== undefined ? data.score : 0;
    const summary = data.summary || "";
    const checks = data.checks || [];
    const issues = data.issues || [];
    const recommendations = data.recommendations || [];

    let statusLabel = overallStatus;
    if (overallStatus === "REVIEW_REQUIRED") statusLabel = "REVIEW REQUIRED";

    let statusClass = "governance-status-valid";
    if (overallStatus === "REVIEW_REQUIRED") statusClass = "governance-status-review";
    if (overallStatus === "CONFLICT") statusClass = "governance-status-conflict";

    let riskClass = "governance-risk-low";
    if (riskLevel === "MEDIUM") riskClass = "governance-risk-medium";
    if (riskLevel === "HIGH") riskClass = "governance-risk-high";

    /* Render Governance Checks */
    let checksHTML = "";
    if (checks.length > 0) {
        checksHTML = checks.map(check => {
            let icon = "✓";
            let checkStatusClass = "governance-status-valid";
            if (check.status === "WARNING") {
                icon = "⚠️";
                checkStatusClass = "governance-status-review";
            } else if (check.status === "CONFLICT") {
                icon = "🔴";
                checkStatusClass = "governance-status-conflict";
            }

            let sevClass = "governance-sev-low";
            if (check.severity === "MEDIUM") sevClass = "governance-sev-medium";
            if (check.severity === "HIGH") sevClass = "governance-sev-high";

            return `
                <div class="governance-check-item">
                    <div class="governance-check-header">
                        <div class="governance-check-title-wrap">
                            <span class="governance-check-icon">${icon}</span>
                            <span class="governance-check-title">${check.title}</span>
                        </div>
                        <div class="governance-check-badges">
                            <span class="governance-badge-sm ${checkStatusClass}">${check.status}</span>
                            <span class="governance-badge-sm ${sevClass}">${check.severity}</span>
                        </div>
                    </div>
                    <div class="governance-check-msg">${check.message}</div>
                </div>
            `;
        }).join("");
    }

    /* Render Detected Issues */
    let issuesHTML = "";
    if (issues.length > 0) {
        issuesHTML = issues.map(issue => {
            let sevClass = "governance-sev-low";
            if (issue.severity === "MEDIUM") sevClass = "governance-sev-medium";
            if (issue.severity === "HIGH") sevClass = "governance-sev-high";

            return `
                <div class="governance-issue-item">
                    <div class="governance-issue-header">
                        <span class="governance-issue-title">⚠️ ${issue.title}</span>
                        <span class="governance-badge-sm ${sevClass}">Severity: ${issue.severity}</span>
                    </div>
                    <div class="governance-issue-msg">${issue.message}</div>
                    ${issue.recommendation ? `<div class="governance-issue-rec">💡 <strong>Recommendation:</strong> ${issue.recommendation}</div>` : ""}
                </div>
            `;
        }).join("");
    } else {
        issuesHTML = `
            <div class="governance-no-issues">
                ✓ No governance issues detected.
            </div>
        `;
    }

    /* Render Recommendations */
    let recsHTML = "";
    if (recommendations.length > 0) {
        recsHTML = `
            <div class="governance-subsection">
                <div class="governance-subsection-title">📋 Recommended Actions</div>
                <ul class="governance-recs-list">
                    ${recommendations.map(rec => `<li>${rec}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    return `
        <div class="profile-section-title governance-main-title">
            🛡️ Land Governance Status
        </div>

        <div class="governance-cards-grid">
            <div class="governance-card">
                <div class="governance-card-label">Overall Status</div>
                <div class="governance-badge ${statusClass}">${statusLabel}</div>
            </div>
            <div class="governance-card">
                <div class="governance-card-label">Risk Level</div>
                <div class="governance-badge ${riskClass}">${riskLevel}</div>
            </div>
            <div class="governance-card">
                <div class="governance-card-label">Risk Score</div>
                <div class="governance-score-val">${score} / 100</div>
            </div>
        </div>

        ${summary ? `
            <div class="governance-summary-box">
                <strong>Summary:</strong> ${summary}
            </div>
        ` : ""}

        <div class="governance-subsection">
            <div class="governance-subsection-title">🔍 Governance Checks</div>
            <div class="governance-checks-list">
                ${checksHTML}
            </div>
        </div>

        <div class="governance-subsection">
            <div class="governance-subsection-title">⚠️ Detected Issues</div>
            <div class="governance-issues-list">
                ${issuesHTML}
            </div>
        </div>

        ${recsHTML}
    `;
}

/* =========================================================
   13. DEVELOPMENT PROPOSAL VALIDATION INTEGRATION
   ========================================================= */

async function handleValidateProposal(event, parcelId) {
    if (event) {
        event.preventDefault();
    }

    const targetParcelId = parcelId || window.activeLandProfileParcelId;
    const activitySelect = document.getElementById("proposal-activity-type");
    const developmentSelect = document.getElementById("proposal-development-type");
    const areaInput = document.getElementById("proposal-area");
    const errorDiv = document.getElementById("proposal-inline-error");
    const validateBtn = document.getElementById("proposal-validate-btn");
    const resultContainer = document.getElementById("proposal-result-container");

    if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.textContent = "";
    }

    const activityType = activitySelect ? activitySelect.value : "";
    const developmentType = developmentSelect ? developmentSelect.value : "";
    const rawArea = areaInput ? areaInput.value.trim() : "";

    // 15. Frontend Input Validation
    if (!activityType) {
        showProposalInlineError("Please select an Activity Type.");
        return;
    }

    if (!developmentType) {
        showProposalInlineError("Please select a Development Type.");
        return;
    }

    let proposedArea = null;
    if (rawArea !== "") {
        proposedArea = Number(rawArea);
        if (isNaN(proposedArea) || proposedArea <= 0) {
            showProposalInlineError("Proposed Area must be a valid numeric value greater than zero.");
            return;
        }
    }

    // 5. Validation Loading State
    if (validateBtn) {
        validateBtn.disabled = true;
        validateBtn.textContent = "VALIDATING...";
    }

    try {
        if (window.activeLandProfileParcelId !== targetParcelId) {
            console.log("Stale parcel switch detected before proposal API call for:", targetParcelId);
            return;
        }

        const proposalData = {
            activityType,
            developmentType,
            proposedArea
        };

        const result = await validateProposal(targetParcelId, proposalData);

        // 13. Stale Request Protection
        if (window.activeLandProfileParcelId !== targetParcelId) {
            console.log("Ignored stale proposal response for parcel:", targetParcelId);
            return;
        }

        if (!result || !result.success || !result.data) {
            throw new Error(result ? result.message : "Unable to complete proposal validation.");
        }

        if (resultContainer) {
            resultContainer.innerHTML = renderProposalResultHTML(result.data, result.auditId, result.parcelId, result.createdAt);
        }
    } catch (error) {
        console.error("Proposal Validation API Error:", error);

        if (window.activeLandProfileParcelId !== targetParcelId) return;

        if (resultContainer) {
            resultContainer.innerHTML = `
                <div class="proposal-error-box">
                    <div class="proposal-error-title">⚠️ Proposal validation unavailable</div>
                    <div class="proposal-error-msg">Unable to complete proposal validation. Please try again.</div>
                </div>
            `;
        }
    } finally {
        if (validateBtn && window.activeLandProfileParcelId === targetParcelId) {
            validateBtn.disabled = false;
            validateBtn.textContent = "VALIDATE PROPOSAL";
        }
    }
}

function showProposalInlineError(msg) {
    const errorDiv = document.getElementById("proposal-inline-error");
    if (errorDiv) {
        errorDiv.textContent = msg;
        errorDiv.style.display = "block";
    }
}

function clearProposalForm(parcelId) {
    const activitySelect = document.getElementById("proposal-activity-type");
    const developmentSelect = document.getElementById("proposal-development-type");
    const areaInput = document.getElementById("proposal-area");
    const errorDiv = document.getElementById("proposal-inline-error");
    const resultContainer = document.getElementById("proposal-result-container");

    if (activitySelect) activitySelect.value = "";
    if (developmentSelect) developmentSelect.value = "";
    if (areaInput) areaInput.value = "";
    if (errorDiv) {
        errorDiv.style.display = "none";
        errorDiv.textContent = "";
    }
    if (resultContainer) {
        resultContainer.innerHTML = "";
    }
}

function renderProposalResultHTML(data, auditId = null, parcelId = null, createdAt = null) {
    const decision = data.decision || "PROCEED";
    const riskLevel = data.riskLevel || "LOW";
    const score = data.score !== undefined ? data.score : 0;
    const summary = data.summary || "";
    const checks = data.checks || [];
    const issues = data.issues || [];
    const recommendations = data.recommendations || [];

    let decisionLabel = decision;
    if (decision === "REVIEW_REQUIRED") decisionLabel = "REVIEW REQUIRED";

    let decisionClass = "proposal-result-proceed";
    if (decision === "REVIEW_REQUIRED") decisionClass = "proposal-result-review";
    if (decision === "CONFLICT") decisionClass = "proposal-result-conflict";

    let riskClass = "proposal-risk-low";
    if (riskLevel === "MEDIUM") riskClass = "proposal-risk-medium";
    if (riskLevel === "HIGH") riskClass = "proposal-risk-high";

    const formattedTime = createdAt ? new Date(createdAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short"
    }) : "";

    /* Render Checks */
    let checksHTML = "";
    if (checks.length > 0) {
        checksHTML = checks.map(check => {
            let icon = "✓";
            let checkStatusClass = "proposal-result-proceed";
            if (check.status === "WARNING") {
                icon = "⚠️";
                checkStatusClass = "proposal-result-review";
            } else if (check.status === "CONFLICT") {
                icon = "🔴";
                checkStatusClass = "proposal-result-conflict";
            }

            let sevClass = "proposal-sev-low";
            if (check.severity === "MEDIUM") sevClass = "proposal-sev-medium";
            if (check.severity === "HIGH") sevClass = "proposal-sev-high";

            return `
                <div class="proposal-check-item">
                    <div class="proposal-check-header">
                        <div class="proposal-check-title-wrap">
                            <span class="proposal-check-icon">${icon}</span>
                            <span class="proposal-check-title">${check.title}</span>
                        </div>
                        <div class="proposal-check-badges">
                            <span class="proposal-badge-sm ${checkStatusClass}">${check.status}</span>
                            <span class="proposal-badge-sm ${sevClass}">${check.severity}</span>
                        </div>
                    </div>
                    <div class="proposal-check-msg">${check.message}</div>
                </div>
            `;
        }).join("");
    }

    /* Render Detected Issues */
    let issuesHTML = "";
    if (issues.length > 0) {
        issuesHTML = issues.map(issue => {
            let sevClass = "proposal-sev-low";
            if (issue.severity === "MEDIUM") sevClass = "proposal-sev-medium";
            if (issue.severity === "HIGH") sevClass = "proposal-sev-high";

            return `
                <div class="proposal-issue-item">
                    <div class="proposal-issue-header">
                        <span class="proposal-issue-title">⚠️ ${issue.title}</span>
                        <span class="proposal-badge-sm ${sevClass}">Severity: ${issue.severity}</span>
                    </div>
                    <div class="proposal-issue-msg">${issue.message}</div>
                    ${issue.recommendation ? `<div class="proposal-issue-rec">💡 <strong>Recommendation:</strong> ${issue.recommendation}</div>` : ""}
                </div>
            `;
        }).join("");
    } else {
        issuesHTML = `
            <div class="proposal-no-issues">
                ✓ No proposal conflicts detected.
            </div>
        `;
    }

    /* Render Recommendations */
    let recsHTML = "";
    const uniqueRecs = Array.from(new Set(recommendations));
    if (uniqueRecs.length > 0) {
        recsHTML = `
            <div class="proposal-subsection">
                <div class="proposal-subsection-title">📋 Recommended Actions</div>
                <ul class="proposal-recs-list">
                    ${uniqueRecs.map(rec => `<li>${rec}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    const currentParcelId = parcelId || window.activeLandProfileParcelId;

    return `
        <div class="proposal-result-section">
            <div class="proposal-result-header-box">
                <div class="proposal-subsection-title main-result-title">
                    🔍 Proposal Validation Result
                </div>
                ${auditId ? `
                    <div class="proposal-audit-badge-block">
                        <div class="proposal-audit-ref-line">
                            <span class="audit-ref-label">Audit Reference:</span>
                            <span class="audit-ref-code">${auditId}</span>
                        </div>
                        ${formattedTime ? `
                            <div class="proposal-audit-time-line">
                                <span class="audit-time-label">Validated:</span>
                                <span class="audit-time-val">${formattedTime}</span>
                            </div>
                        ` : ""}
                    </div>
                ` : ""}
            </div>

            <div class="proposal-cards-grid">
                <div class="proposal-card">
                    <div class="proposal-card-label">Decision</div>
                    <div class="proposal-badge ${decisionClass}">${decisionLabel}</div>
                </div>
                <div class="proposal-card">
                    <div class="proposal-card-label">Risk Level</div>
                    <div class="proposal-badge ${riskClass}">${riskLevel}</div>
                </div>
                <div class="proposal-card">
                    <div class="proposal-card-label">Risk Score</div>
                    <div class="proposal-score-val">${score} / 100</div>
                </div>
            </div>

            ${auditId ? `
                <div class="proposal-audit-actions-row">
                    <button type="button" class="proposal-btn proposal-btn-audit-detail" onclick="showAuditDetailsModal('${auditId}')">
                        📜 VIEW AUDIT DETAILS
                    </button>
                    <button type="button" class="proposal-btn proposal-btn-audit-history" onclick="showValidationHistoryModal('${currentParcelId}')">
                        📜 VIEW VALIDATION HISTORY
                    </button>
                </div>
            ` : ""}

            ${summary ? `
                <div class="proposal-summary-box">
                    <strong>Summary:</strong> ${summary}
                </div>
            ` : ""}

            ${checks.length > 0 ? `
                <div class="proposal-subsection">
                    <div class="proposal-subsection-title">Proposal Checks</div>
                    <div class="proposal-checks-list">
                        ${checksHTML}
                    </div>
                </div>
            ` : ""}

            <div class="proposal-subsection">
                <div class="proposal-subsection-title">⚠️ Issues Requiring Attention</div>
                <div class="proposal-issues-list">
                    ${issuesHTML}
                </div>
            </div>

            ${recsHTML}
        </div>
    `;
}

/* =========================================================
   14. AUDIT MODALS (DETAILS & HISTORY)
   ========================================================= */

function createAuditModalContainer() {
    let overlay = document.getElementById("audit-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "audit-modal-overlay";
        overlay.className = "audit-modal-overlay";
        overlay.innerHTML = `
            <div class="audit-modal-panel">
                <div class="audit-modal-header">
                    <h3 id="audit-modal-title" class="audit-modal-title">Audit Record</h3>
                    <button type="button" class="audit-modal-close" onclick="closeAuditModal()">&times;</button>
                </div>
                <div id="audit-modal-body" class="audit-modal-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeAuditModal();
            }
        });
    }
}

function closeAuditModal() {
    const overlay = document.getElementById("audit-modal-overlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

async function showAuditDetailsModal(auditId) {
    if (!auditId) return;

    createAuditModalContainer();
    const modalOverlay = document.getElementById("audit-modal-overlay");
    const modalBody = document.getElementById("audit-modal-body");
    const modalTitle = document.getElementById("audit-modal-title");

    if (!modalOverlay || !modalBody) return;

    modalTitle.textContent = `Audit Record: ${auditId}`;
    modalBody.innerHTML = `
        <div class="audit-modal-loading">
            <div class="loading-spinner"></div>
            <p>Loading audit details...</p>
        </div>
    `;
    modalOverlay.classList.add("active");

    try {
        const response = await getAuditRecord(auditId);
        if (!response || !response.success || !response.data) {
            throw new Error(response ? response.message : "Audit details unavailable.");
        }

        const audit = response.data;
        const proposal = audit.proposal || {};
        const result = audit.result || {};
        const evidence = audit.evidence || {};
        const categories = evidence.categories || [];
        const checks = result.checks || [];
        const issues = result.issues || [];
        const recommendations = result.recommendations || [];

        const formattedDate = audit.createdAt ? new Date(audit.createdAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "medium"
        }) : "N/A";

        let decisionLabel = result.decision || "PROCEED";
        if (result.decision === "REVIEW_REQUIRED") decisionLabel = "REVIEW REQUIRED";

        let decisionClass = "proposal-result-proceed";
        if (result.decision === "REVIEW_REQUIRED") decisionClass = "proposal-result-review";
        if (result.decision === "CONFLICT") decisionClass = "proposal-result-conflict";

        let riskClass = "proposal-risk-low";
        if (result.riskLevel === "MEDIUM") riskClass = "proposal-risk-medium";
        if (result.riskLevel === "HIGH") riskClass = "proposal-risk-high";

        const documentIds = evidence.documentIds || [];

        /* Evidence categories */
        const categoriesHTML = categories.length > 0 ? categories.map(cat => `
            <span class="audit-category-tag">${cat}</span>
        `).join("") : `<span class="audit-category-tag empty">NONE</span>`;

        /* Document Evidence IDs HTML */
        const documentIdsHTML = documentIds.length > 0 ? `
            <div class="audit-document-list">
                <div class="audit-doc-heading">Associated Evidence Documents:</div>
                <div class="audit-doc-tags">
                    ${documentIds.map(docId => `
                        <button type="button" class="audit-doc-btn" onclick="showDocumentDetailsModal('${docId}')">
                            📄 ${docId} (View Evidence)
                        </button>
                    `).join("")}
                </div>
            </div>
        ` : `<div class="audit-document-list"><div class="audit-doc-heading">Associated Evidence Documents:</div><div style="font-size: 11px; color: #94a3b8;">None recorded</div></div>`;


        /* Checks HTML */
        const checksHTML = checks.length > 0 ? checks.map(c => {
            let icon = "✓";
            let statusClass = "proposal-result-proceed";
            if (c.status === "WARNING") {
                icon = "⚠️";
                statusClass = "proposal-result-review";
            } else if (c.status === "CONFLICT") {
                icon = "🔴";
                statusClass = "proposal-result-conflict";
            }

            return `
                <div class="audit-check-item">
                    <div class="audit-check-header">
                        <span>${icon} <strong>${c.title || c.category}</strong></span>
                        <span class="proposal-badge-sm ${statusClass}">${c.status}</span>
                    </div>
                    <div class="audit-check-msg">${c.message}</div>
                </div>
            `;
        }).join("") : `<div class="audit-empty-msg">No check logs.</div>`;

        /* Issues HTML */
        const issuesHTML = issues.length > 0 ? issues.map(iss => {
            let sevClass = "proposal-sev-low";
            if (iss.severity === "MEDIUM") sevClass = "proposal-sev-medium";
            if (iss.severity === "HIGH") sevClass = "proposal-sev-high";

            return `
                <div class="audit-issue-item">
                    <div class="audit-issue-header">
                        <span>⚠️ <strong>${iss.title}</strong></span>
                        <span class="proposal-badge-sm ${sevClass}">${iss.severity}</span>
                    </div>
                    <div class="audit-issue-msg">${iss.message}</div>
                    ${iss.recommendation ? `<div class="audit-issue-rec">💡 <strong>Rec:</strong> ${iss.recommendation}</div>` : ""}
                </div>
            `;
        }).join("") : `<div class="audit-empty-msg">✓ No issues recorded.</div>`;

        /* Recs HTML */
        const recsHTML = recommendations.length > 0 ? `
            <ul class="audit-recs-list">
                ${recommendations.map(r => `<li>${r}</li>`).join("")}
            </ul>
        ` : `<div class="audit-empty-msg">No recommendations.</div>`;

        modalBody.innerHTML = `
            <div class="audit-detail-container">
                <div class="audit-meta-header-card">
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Audit Reference</div>
                        <div class="audit-meta-val-highlight">${audit.auditId}</div>
                    </div>
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Parcel ID</div>
                        <div class="audit-meta-val-bold">${audit.parcelId}</div>
                    </div>
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Timestamp</div>
                        <div class="audit-meta-val">${formattedDate}</div>
                    </div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">🏗️ Proposal Specifications</div>
                    <div class="audit-grid-3">
                        <div><span class="audit-prop-label">Activity:</span> <strong>${proposal.activityType || "OTHER"}</strong></div>
                        <div><span class="audit-prop-label">Development:</span> <strong>${proposal.developmentType || "OTHER"}</strong></div>
                        <div><span class="audit-prop-label">Proposed Area:</span> <strong>${proposal.proposedArea ? proposal.proposedArea + " sq.ft" : "N/A"}</strong></div>
                    </div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">📊 Validation Decision & Risk</div>
                    <div class="audit-grid-3">
                        <div><span class="audit-prop-label">Decision:</span> <span class="proposal-badge ${decisionClass}">${decisionLabel}</span></div>
                        <div><span class="audit-prop-label">Risk Level:</span> <span class="proposal-badge ${riskClass}">${result.riskLevel || "LOW"}</span></div>
                        <div><span class="audit-prop-label">Risk Score:</span> <strong class="audit-score-highlight">${result.score !== undefined ? result.score : 0} / 100</strong></div>
                    </div>
                    ${result.summary ? `<div class="audit-summary-box"><strong>Summary:</strong> ${result.summary}</div>` : ""}
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">📂 Datasets & Evidence Used</div>
                    <div class="audit-categories-flex">${categoriesHTML}</div>
                    ${documentIdsHTML}
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">🔍 Validation Checks</div>
                    <div class="audit-checks-list-box">${checksHTML}</div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">⚠️ Identified Issues</div>
                    <div class="audit-issues-list-box">${issuesHTML}</div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">📋 Recommendations</div>
                    ${recsHTML}
                </div>

                <div class="audit-disclaimer-notice">
                    🛡️ <strong>Notice:</strong> This audit trail record is generated for administrative explainability and decision-support traceability. It does not constitute an official government document or legal title.
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error loading audit details:", error);
        modalBody.innerHTML = `
            <div class="audit-error-box">
                <div class="audit-error-title">⚠️ Audit details unavailable</div>
                <div class="audit-error-msg">Unable to load audit record details. Please try again later.</div>
            </div>
        `;
    }
}

async function showValidationHistoryModal(parcelId) {
    const targetParcelId = parcelId || window.activeLandProfileParcelId;
    if (!targetParcelId) return;

    createAuditModalContainer();
    const modalOverlay = document.getElementById("audit-modal-overlay");
    const modalBody = document.getElementById("audit-modal-body");
    const modalTitle = document.getElementById("audit-modal-title");

    if (!modalOverlay || !modalBody) return;

    modalTitle.textContent = `Validation History: ${targetParcelId}`;
    modalBody.innerHTML = `
        <div class="audit-modal-loading">
            <div class="loading-spinner"></div>
            <p>Loading validation history for ${targetParcelId}...</p>
        </div>
    `;
    modalOverlay.classList.add("active");

    try {
        const response = await getAuditHistoryByParcel(targetParcelId);

        /* Stale Request Protection */
        if (window.activeLandProfileParcelId !== targetParcelId) {
            console.log("Ignored stale audit history for parcel:", targetParcelId);
            return;
        }

        if (!response || !response.success || !Array.isArray(response.data)) {
            throw new Error("Validation history unavailable.");
        }

        const history = response.data;
        if (history.length === 0) {
            modalBody.innerHTML = `
                <div class="audit-empty-history">
                    <p>No validation audit records found for parcel <strong>${targetParcelId}</strong>.</p>
                </div>
            `;
            return;
        }

        const historyHTML = history.map(item => {
            const proposal = item.proposal || {};
            const result = item.result || {};
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short"
            }) : "N/A";

            let decisionLabel = result.decision || "PROCEED";
            if (result.decision === "REVIEW_REQUIRED") decisionLabel = "REVIEW REQUIRED";

            let decisionClass = "proposal-result-proceed";
            if (result.decision === "REVIEW_REQUIRED") decisionClass = "proposal-result-review";
            if (result.decision === "CONFLICT") decisionClass = "proposal-result-conflict";

            let riskClass = "proposal-risk-low";
            if (result.riskLevel === "MEDIUM") riskClass = "proposal-risk-medium";
            if (result.riskLevel === "HIGH") riskClass = "proposal-risk-high";

            return `
                <div class="audit-history-card" onclick="showAuditDetailsModal('${item.auditId}')" title="Click to view complete audit details">
                    <div class="history-card-top">
                        <div class="history-audit-id">${item.auditId}</div>
                        <div class="history-date">${dateStr}</div>
                    </div>
                    <div class="history-proposal-summary">
                        <strong>${proposal.activityType || "OTHER"}</strong> / <strong>${proposal.developmentType || "OTHER"}</strong>
                        ${proposal.proposedArea ? `<span class="history-area-tag">${proposal.proposedArea} sq.ft</span>` : ""}
                    </div>
                    <div class="history-badges-row">
                        <span class="proposal-badge ${decisionClass}">${decisionLabel}</span>
                        <span class="proposal-badge ${riskClass}">Risk: ${result.riskLevel || "LOW"}</span>
                        <span class="history-score-badge">Score: ${result.score !== undefined ? result.score : 0}</span>
                    </div>
                </div>
            `;
        }).join("");

        modalBody.innerHTML = `
            <div class="audit-history-wrapper">
                <div class="history-count-header">
                    Found <strong>${history.length}</strong> validation audit record(s) for parcel <strong>${targetParcelId}</strong> (newest first):
                </div>
                <div class="audit-history-cards-list">
                    ${historyHTML}
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error loading audit history:", error);
        if (window.activeLandProfileParcelId !== targetParcelId) return;
        modalBody.innerHTML = `
            <div class="audit-error-box">
                <div class="audit-error-title">⚠️ Validation history unavailable</div>
                <div class="audit-error-msg">Unable to load validation history for parcel ${targetParcelId}.</div>
            </div>
        `;
    }
}

// Expose globally for inline event handlers
window.handleValidateProposal = handleValidateProposal;
window.clearProposalForm = clearProposalForm;
window.showAuditDetailsModal = showAuditDetailsModal;
window.showValidationHistoryModal = showValidationHistoryModal;
window.closeAuditModal = closeAuditModal;

/* =========================================================
   15. DOCUMENT MODAL (DETAILS & EVIDENCE)
   ========================================================= */

function createDocumentModalContainer() {
    let overlay = document.getElementById("document-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "document-modal-overlay";
        overlay.className = "audit-modal-overlay";
        overlay.innerHTML = `
            <div class="audit-modal-panel">
                <div class="audit-modal-header">
                    <h3 id="document-modal-title" class="audit-modal-title">Document & Evidence Details</h3>
                    <button type="button" class="audit-modal-close" onclick="closeDocumentModal()">&times;</button>
                </div>
                <div id="document-modal-body" class="audit-modal-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeDocumentModal();
            }
        });
    }
}

function closeDocumentModal() {
    const overlay = document.getElementById("document-modal-overlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

async function showDocumentDetailsModal(documentId) {
    if (!documentId) return;

    createDocumentModalContainer();
    const modalOverlay = document.getElementById("document-modal-overlay");
    const modalBody = document.getElementById("document-modal-body");
    const modalTitle = document.getElementById("document-modal-title");

    if (!modalOverlay || !modalBody) return;

    modalTitle.textContent = `Document Details: ${documentId}`;
    modalBody.innerHTML = `
        <div class="audit-modal-loading">
            <div class="loading-spinner"></div>
            <p>Loading document metadata...</p>
        </div>
    `;
    modalOverlay.classList.add("active");

    try {
        const response = await getDocumentById(documentId);
        if (!response || !response.success || !response.document) {
            throw new Error(response ? response.message : "Document details unavailable.");
        }

        const doc = response.document;
        let statusClass = "proposal-result-proceed";
        if (doc.status === "PENDING") statusClass = "proposal-result-review";
        if (doc.status === "EXPIRED" || doc.status === "UNAVAILABLE") statusClass = "proposal-result-conflict";

        const ext = doc.textExtraction || {};
        let extClass = "extraction-unavailable";
        let extStatusText = "UNAVAILABLE";
        if (ext.status === "SUCCESS") {
            extClass = "extraction-success";
            extStatusText = "SUCCESSFUL";
        } else if (ext.status === "FAILED") {
            extClass = "extraction-failed";
            extStatusText = "FAILED";
        }

        modalBody.innerHTML = `
            <div class="audit-detail-container">
                <div class="audit-meta-header-card">
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Document ID</div>
                        <div class="audit-meta-val-highlight">${doc.documentId}</div>
                    </div>
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Parcel ID</div>
                        <div class="audit-meta-val-bold">${doc.parcelId}</div>
                    </div>
                    <div class="audit-meta-item">
                        <div class="audit-meta-label">Document Status</div>
                        <div><span class="proposal-badge ${statusClass}">${doc.status}</span></div>
                    </div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">📄 Metadata & Rights Verification</div>
                    <div class="audit-grid-3" style="grid-template-columns: 1fr 1fr;">
                        <div><span class="audit-prop-label">Title:</span> <strong>${doc.title}</strong></div>
                        <div><span class="audit-prop-label">Type:</span> <strong>${doc.documentType}</strong></div>
                        <div><span class="audit-prop-label">Document Number:</span> <strong>${doc.documentNumber}</strong></div>
                        <div><span class="audit-prop-label">Issuing Department:</span> <strong>${doc.issuingDepartment}</strong></div>
                        <div><span class="audit-prop-label">Issue Date:</span> <span>${doc.issueDate || 'N/A'}</span></div>
                        <div><span class="audit-prop-label">Created At:</span> <span>${doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}</span></div>
                    </div>
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">🔍 Text Extraction (PDF Evidence)</div>
                    <div class="audit-grid-3" style="grid-template-columns: 1fr 1fr; margin-bottom: 8px;">
                        <div><span class="audit-prop-label">Extraction Status:</span> <span class="extraction-tag ${extClass}">${extStatusText}</span></div>
                        <div><span class="audit-prop-label">Character Count:</span> <strong>${ext.characterCount ? ext.characterCount.toLocaleString() + " chars" : "N/A"}</strong></div>
                    </div>
                    <div class="audit-prop-label" style="margin-bottom: 4px;">Extracted Preview:</div>
                    ${ext.preview ? `<div class="extraction-preview-box">${ext.preview}</div>` : `<div class="audit-empty-msg">No extracted text preview available.</div>`}
                </div>

                <div class="audit-section-card">
                    <div class="audit-card-heading">📝 Description & Evidence File Record</div>
                    <div class="audit-summary-box" style="margin-bottom: 12px;">
                        <strong>Description:</strong> ${doc.description || "No description provided."}
                    </div>
                    <div class="audit-grid-3">
                        <div>
                            <span class="audit-prop-label">File Name:</span>
                            <strong style="color: #2563eb;">${doc.fileName ? doc.fileName : "Demo Evidence Record"}</strong>
                        </div>
                        <div>
                            <span class="audit-prop-label">Storage Status:</span>
                            <strong>${doc.storageStatus || "STORED"}</strong>
                        </div>
                    </div>
                    ${doc.fileName ? `
                        <div style="margin-top: 12px;">
                            <button type="button" class="doc-btn-open" onclick="window.open(getDocumentFileUrl('${doc.documentId}'), '_blank')">
                                📂 Open Document File
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Error displaying document details:", error);
        modalBody.innerHTML = `
            <div class="audit-error-box">
                <div class="audit-error-title">⚠️ Unable to load document details</div>
                <div class="audit-error-msg">${error.message}</div>
            </div>
        `;
    }
}

window.showDocumentDetailsModal = showDocumentDetailsModal;
window.closeDocumentModal = closeDocumentModal;

/* =========================================================
   16. UPLOAD DOCUMENT MODAL (PHASE 9)
   ========================================================= */

function createUploadModalContainer() {
    let overlay = document.getElementById("upload-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "upload-modal-overlay";
        overlay.className = "audit-modal-overlay";
        overlay.innerHTML = `
            <div class="audit-modal-panel">
                <div class="audit-modal-header">
                    <h3 id="upload-modal-title" class="audit-modal-title">Upload Supporting Document</h3>
                    <button type="button" class="audit-modal-close" onclick="closeUploadDocumentModal()">&times;</button>
                </div>
                <div id="upload-modal-body" class="audit-modal-body"></div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                closeUploadDocumentModal();
            }
        });
    }
}

function closeUploadDocumentModal() {
    const overlay = document.getElementById("upload-modal-overlay");
    if (overlay) {
        overlay.classList.remove("active");
    }
}

function showUploadDocumentModal(parcelId) {
    const targetParcelId = parcelId || window.activeLandProfileParcelId;
    if (!targetParcelId) return;

    createUploadModalContainer();
    const modalOverlay = document.getElementById("upload-modal-overlay");
    const modalBody = document.getElementById("upload-modal-body");
    const modalTitle = document.getElementById("upload-modal-title");

    if (!modalOverlay || !modalBody) return;

    modalTitle.textContent = `Upload Supporting Document (${targetParcelId})`;
    modalBody.innerHTML = `
        <form id="upload-doc-form" onsubmit="handleUploadDocumentSubmit(event, '${targetParcelId}')">
            <div id="upload-feedback-box"></div>

            <div class="upload-form-group">
                <label class="upload-form-label">Parcel ID *</label>
                <input type="text" id="upload-parcel-id" class="upload-form-input" value="${targetParcelId}">
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-type">Document Type *</label>
                <select id="upload-doc-type" class="upload-form-select" required>
                    <option value="OWNERSHIP">OWNERSHIP (Record of Rights / Patta)</option>
                    <option value="REGISTRATION">REGISTRATION (Deed / Clearance)</option>
                    <option value="LAND_USE">LAND_USE (Zoning Certificate)</option>
                    <option value="PROPERTY_TAX">PROPERTY_TAX (Tax Receipt)</option>
                    <option value="BUILDING_PERMISSION">BUILDING_PERMISSION (Plan Approval)</option>
                    <option value="RESTRICTIONS">RESTRICTIONS (Regulatory Compliance)</option>
                    <option value="UTILITIES">UTILITIES (Utility Connection)</option>
                    <option value="OTHER">OTHER (General Evidence)</option>
                </select>
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-number">Document Number *</label>
                <input type="text" id="upload-doc-number" class="upload-form-input" placeholder="e.g. ROR-2026-003" required>
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-title">Title *</label>
                <input type="text" id="upload-doc-title" class="upload-form-input" placeholder="e.g. Record of Rights (Patta)" required>
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-dept">Issuing Department</label>
                <input type="text" id="upload-doc-dept" class="upload-form-input" placeholder="e.g. Revenue Department">
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-date">Issue Date</label>
                <input type="date" id="upload-doc-date" class="upload-form-input">
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-desc">Description</label>
                <textarea id="upload-doc-desc" class="upload-form-textarea" rows="2" placeholder="Brief details about this evidence document..."></textarea>
            </div>

            <div class="upload-form-group">
                <label class="upload-form-label" for="upload-doc-file">Select PDF or Image File (Max 10MB) *</label>
                <input type="file" id="upload-doc-file" class="upload-form-input" accept=".pdf,image/jpeg,image/png" required>
            </div>

            <div class="proposal-buttons-row" style="margin-top: 16px;">
                <button type="submit" id="upload-submit-btn" class="proposal-btn proposal-btn-primary">
                    📤 Upload Document
                </button>
                <button type="button" class="proposal-btn proposal-btn-secondary" onclick="closeUploadDocumentModal()">
                    Cancel
                </button>
            </div>
        </form>
    `;

    modalOverlay.classList.add("active");
}

async function handleUploadDocumentSubmit(event, parcelId) {
    event.preventDefault();

    const feedbackBox = document.getElementById("upload-feedback-box");
    const submitBtn = document.getElementById("upload-submit-btn");
    const fileInput = document.getElementById("upload-doc-file");

    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (feedbackBox) {
            feedbackBox.innerHTML = `<div class="upload-error-box">⚠️ Please select a file to upload.</div>`;
        }
        return;
    }

    const file = fileInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
        if (feedbackBox) {
            feedbackBox.innerHTML = `<div class="upload-error-box">⚠️ File size exceeds the 10 MB limit.</div>`;
        }
        return;
    }

    const formData = new FormData();
    formData.append("parcelId", parcelId);
    formData.append("documentType", document.getElementById("upload-doc-type").value);
    formData.append("documentNumber", document.getElementById("upload-doc-number").value);
    formData.append("title", document.getElementById("upload-doc-title").value);
    formData.append("issuingDepartment", document.getElementById("upload-doc-dept").value || "");
    formData.append("issueDate", document.getElementById("upload-doc-date").value || "");
    formData.append("description", document.getElementById("upload-doc-desc").value || "");
    formData.append("file", file);

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading & Processing...";
    }

    try {
        const result = await uploadDocument(formData);

        if (!result.success || !result.document) {
            throw new Error(result.message || "Upload failed");
        }

        const doc = result.document;
        const ext = doc.textExtraction || {};

        if (feedbackBox) {
            feedbackBox.innerHTML = `
                <div class="upload-success-box">
                    <div style="font-weight: 700; margin-bottom: 4px;">✓ Document uploaded successfully!</div>
                    <div><strong>Document ID:</strong> ${doc.documentId}</div>
                    <div><strong>Text Extraction:</strong> ${ext.status || 'SUCCESS'} (${ext.characterCount ? ext.characterCount.toLocaleString() + ' chars' : '0 chars'})</div>
                    <div><strong>Evidence linked to:</strong> ${doc.parcelId}</div>
                </div>
            `;
        }

        // Refresh documents list asynchronously for current parcel
        fetchParcelDocuments(parcelId);

        setTimeout(() => {
            closeUploadDocumentModal();
        }, 2200);

    } catch (error) {
        console.error("Upload Submit Error:", error);
        if (feedbackBox) {
            feedbackBox.innerHTML = `<div class="upload-error-box">⚠️ Upload Failed: ${error.message}</div>`;
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "📤 Upload Document";
        }
    }
}

window.showDocumentDetailsModal = showDocumentDetailsModal;
window.closeDocumentModal = closeDocumentModal;
window.showUploadDocumentModal = showUploadDocumentModal;
window.closeUploadDocumentModal = closeUploadDocumentModal;
window.handleUploadDocumentSubmit = handleUploadDocumentSubmit;

/* =========================================================
   PHASE 12 — INTEGRATED LAND PARCEL WORKSPACE PANE RENDERERS
   ========================================================= */

window.switchWorkspaceTab = function(tabId) {
    const tabs = document.querySelectorAll('.workspace-tab-btn');
    tabs.forEach(btn => btn.classList.remove('active'));

    const activeBtn = Array.from(tabs).find(b => b.getAttribute('onclick')?.includes(`'${tabId}'`));
    if (activeBtn) activeBtn.classList.add('active');

    const panes = document.querySelectorAll('.tab-pane-content');
    panes.forEach(p => p.classList.remove('active'));

    const activePane = document.getElementById(`tab-pane-${tabId}`);
    if (activePane) activePane.classList.add('active');

    if (tabId === 'gismap' && window.integratedMap) {
        setTimeout(() => { window.integratedMap.invalidateSize(); }, 150);
    }
};

window.printIntegratedLandProfile = function() {
    window.print();
};

window.closeLandProfile = function() {
    const panel = document.getElementById("land-profile-panel");
    if (panel) {
        panel.classList.remove("active", "integrated-workspace");
    }
    if (window.integratedMap) {
        window.integratedMap.remove();
        window.integratedMap = null;
    }
};

function renderOverviewPane(profile, overallStatus, deptStatuses, conflicts) {
    const parcel = profile.parcel || {};
    const cadastral = profile.cadastral || {};
    const ror = profile.ror || profile.ownership || {};
    const landUse = profile.landUse || {};
    const registration = profile.registration || {};
    const propertyTax = profile.propertyTax || profile.tax || {};
    const building = profile.buildingPermission || profile.building || {};
    const restrictions = profile.restrictions || {};
    const documents = Array.isArray(profile.documents) ? profile.documents : [];
    const pId = parcel.id || profile.parcelId || "LND-001";

    const getStatusTag = (status) => {
        if (status === "VERIFIED" || status === "CLEAR") return `<span class="status-badge-verified">✓ ${status}</span>`;
        if (status === "CONFLICT") return `<span class="status-badge-conflict">❌ CONFLICT</span>`;
        if (status === "NOT AVAILABLE" || !status) return `<span style="background:#e2e8f0; color:#475569; padding:2px 6px; border-radius:3px; font-size:10px; font-weight:700;">NOT AVAILABLE</span>`;
        return `<span class="status-badge-review">⚠️ REVIEW REQUIRED</span>`;
    };

    const hasOutstandingTax = (propertyTax.outstandingAmount || 0) > 0;

    setTimeout(() => {
        if (typeof loadOverviewDepartmentRequests === "function") {
            loadOverviewDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- 15. QUICK ACTIONS -->
        <div class="govt-card-widget" style="margin-bottom: 1rem;">
            <div class="govt-card-header">⚡ QUICK ACTIONS</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; padding: 10px;">
                <button class="btn-govt-secondary" onclick="switchWorkspaceTab('gismap')">🗺️ View GIS</button>
                <button class="btn-govt-primary" onclick="openCreateDepartmentRequestModal('${pId}')">📤 Department Request</button>
                <button class="btn-govt-secondary" onclick="switchWorkspaceTab('documents')">📁 View Documents (${documents.length})</button>
                <button class="btn-govt-secondary" onclick="switchWorkspaceTab('conflicts')">⚠️ View Conflicts (${conflicts.length})</button>
                <button class="btn-govt-secondary" onclick="switchWorkspaceTab('timeline')">📜 View Timeline</button>
            </div>
        </div>

        <!-- 12. OVERALL GOVERNANCE STATUS & 11. DEPARTMENT VERIFICATION -->
        <div class="govt-card-widget" style="border: 2px solid #0b1d3a; margin-bottom: 1rem;">
            <div class="govt-card-header" style="background:#0b1d3a; color:#ffffff; display:flex; justify-content:space-between; align-items:center;">
                <span>🏛️ OVERALL GOVERNANCE STATUS</span>
                <span class="${overallStatus === 'VERIFIED' ? 'status-badge-verified' : (overallStatus === 'CONFLICT DETECTED' ? 'status-badge-conflict' : 'status-badge-review')}">${overallStatus}</span>
            </div>
            
            <div style="padding: 12px;">
                <div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase; margin-bottom:8px;">DEPARTMENT VERIFICATION STATUS</div>
                <div class="govt-grid-3col" style="margin-bottom: 12px;">
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">CADASTRAL</div>
                        ${getStatusTag(deptStatuses.cadastral)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">RoR / OWNERSHIP</div>
                        ${getStatusTag(deptStatuses.ror)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">REGISTRATION</div>
                        ${getStatusTag(deptStatuses.registration)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">LAND USE</div>
                        ${getStatusTag(deptStatuses.landUse)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">PROPERTY TAX</div>
                        ${getStatusTag(deptStatuses.propertyTax)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">BUILDING & MUNICIPAL</div>
                        ${getStatusTag(deptStatuses.building)}
                    </div>
                    <div style="background:#f8fafc; padding:8px; border:1px solid #cbd5e1; text-align:center; grid-column: span 3;">
                        <div style="font-size:10px; font-weight:700; color:#64748b; margin-bottom:4px;">RESTRICTIONS</div>
                        ${getStatusTag(deptStatuses.restrictions)}
                    </div>
                </div>

                <div style="background:#f1f5f9; border-left:4px solid #0b1d3a; padding:8px 12px; font-size:12px; color:#334155;">
                    <strong>Governance Summary:</strong> ${profile.governance?.summary || (overallStatus === 'VERIFIED' ? 'All departmental land records are verified and synchronized.' : 'Administrative review required for pending department verifications or outstanding dues.')}
                </div>
            </div>
        </div>

        ${hasOutstandingTax ? `
            <div class="outstanding-tax-banner" style="margin-bottom: 1rem;">
                <div>⚠️ <strong>OUTSTANDING PROPERTY TAX DUES DETECTED</strong></div>
                <div>Amount Pending: <strong>₹${(propertyTax.outstandingAmount || 0).toLocaleString()}</strong></div>
            </div>
        ` : ''}

        <!-- SUMMARIES GRID -->
        <div class="govt-grid-2col">
            <!-- 4. PARCEL SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">📍 PARCEL SUMMARY</div>
                ${profileRow("Parcel ID", pId)}
                ${profileRow("Survey Number", parcel.surveyNumber || cadastral.surveyNumber || "SUR-101")}
                ${profileRow("Area", parcel.area || cadastral.area || "2,400 sq.ft")}
                ${profileRow("Land Type", parcel.landType || cadastral.landType || "Residential")}
                ${profileRow("Current Land Use", parcel.landUse || landUse.currentLandUse || "Residential")}
                ${profileRow("District", parcel.district || cadastral.district || "Coimbatore")}
                ${profileRow("Taluk", cadastral.taluk || "Coimbatore South")}
                ${profileRow("Village", parcel.village || cadastral.village || "Demo Village")}
                ${profileRow("GIS Availability", cadastral.geometryStatus || "Active Polygon Available")}
                ${profileRow("Boundary Status", cadastral.boundaryStatus || "Verified")}
                <div class="source-attribution-footer">
                    <span>Source: Cadastral Department</span>
                    <span>Verified By: ${cadastral.surveyOfficer || 'OFF-CAD-001'}</span>
                </div>
            </div>

            <!-- 5. OWNER SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">👤 OWNER SUMMARY</div>
                ${profileRow("Current Owner", ror.rightsHolder || ror.ownerName || parcel.owner)}
                ${profileRow("Ownership Type", ror.ownershipType || "Individual")}
                ${profileRow("RoR Status", ror.rorStatus || "VERIFIED")}
                ${profileRow("Mutation Status", ror.mutationStatus || "Updated")}
                <div class="source-attribution-footer">
                    <span>Source: RoR Department</span>
                    <span>Verified By: ${ror.updatedBy || 'OFF-ROR-001'}</span>
                </div>
            </div>

            <!-- 6. REGISTRATION SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">📜 REGISTRATION SUMMARY</div>
                ${profileRow("Registration ID", registration.registrationId || registration.documentNumber || "REG-2026-045")}
                ${profileRow("Latest Transaction", registration.transactionType || registration.documentType || "Sale Deed")}
                ${profileRow("Registration Date", registration.registrationDate || registration.submissionDate || "2026-09-03")}
                ${profileRow("Registration Status", registration.status || "APPROVED")}
                <div class="source-attribution-footer">
                    <span>Source: Sub-Registrar Office</span>
                    <span>Verified By: ${registration.updatedBy || 'OFF-REG-001'}</span>
                </div>
            </div>

            <!-- 7. LAND USE SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">🏘️ LAND USE SUMMARY</div>
                ${profileRow("Current Land Use", landUse.currentLandUse || parcel.landUse)}
                ${profileRow("Master Plan Zone", landUse.masterPlanStatus || landUse.currentZone || "Approved Plan")}
                ${profileRow("Zoning Status", landUse.zoningStatus || "COMPATIBLE")}
                ${profileRow("Conversion Status", landUse.conversionStatus || "Approved / Developable")}
                ${profileRow("Planning Status", landUse.developmentStatus || landUse.status || "Approved")}
                <div class="source-attribution-footer">
                    <span>Source: Land Use Department</span>
                    <span>Verified By: ${landUse.updatedBy || 'OFF-LU-001'}</span>
                </div>
            </div>

            <!-- 8. TAX SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">💰 TAX SUMMARY</div>
                ${profileRow("Assessment ID", propertyTax.assessmentId || propertyTax.requestId || "PTX-2026-001")}
                ${profileRow("Tax Year", propertyTax.taxYear || "2026-2027")}
                ${profileRow("Tax Demand", formatCurrency(propertyTax.taxDemand || propertyTax.annualTax || 12500))}
                ${profileRow("Tax Paid", formatCurrency(propertyTax.amountPaid !== undefined ? propertyTax.amountPaid : 12500))}
                ${profileRow("Outstanding", hasOutstandingTax ? `<span style="color:#dc2626; font-weight:800;">₹${(propertyTax.outstandingAmount).toLocaleString()}</span>` : '₹0 (CLEARED)')}
                ${profileRow("Payment Status", propertyTax.paymentStatus || "Paid")}
                ${profileRow("Tax Clearance", propertyTax.taxClearanceStatus || "CLEARED")}
                <div class="source-attribution-footer">
                    <span>Source: Property Tax Department</span>
                    <span>Verified By: ${propertyTax.assignedOfficer || 'OFF-TAX-001'}</span>
                </div>
            </div>

            <!-- 9. BUILDING SUMMARY -->
            <div class="govt-card-widget">
                <div class="govt-card-header">🏗️ BUILDING SUMMARY</div>
                ${profileRow("Municipal Property ID", propertyTax.municipalPropertyId || building.municipalPropertyId || "MUN-PROP-001")}
                ${profileRow("Building Type", building.approvedBuildingType || "Residential Structure")}
                ${profileRow("Built-up Area", building.maximumBuiltUpArea || propertyTax.builtUpArea || "4,000 sq.ft")}
                ${profileRow("Floors", building.maximumFloors || propertyTax.numberOfFloors || 2)}
                ${profileRow("Building Permission", building.buildingPermissionStatus || "Approved")}
                ${profileRow("Building Status", building.validityStatus || building.documentStatus || "Valid")}
                <div class="source-attribution-footer">
                    <span>Source: Municipal Administration</span>
                    <span>Verified By: OFF-MUN-001</span>
                </div>
            </div>

            <!-- 10. RESTRICTIONS SUMMARY -->
            <div class="govt-card-widget" style="grid-column: span 2;">
                <div class="govt-card-header">🚧 RESTRICTIONS SUMMARY</div>
                <div class="govt-grid-2col">
                    <div>
                        ${profileRow("Court Restriction", restrictions.courtRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                        ${profileRow("Government Acquisition", restrictions.governmentAcquisition ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                        ${profileRow("Environmental Restriction", restrictions.environmentalRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                        ${profileRow("Forest Restriction", restrictions.forestRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                    </div>
                    <div>
                        ${profileRow("Water Body Restriction", restrictions.waterBodyRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                        ${profileRow("Heritage Restriction", restrictions.heritageRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                        ${profileRow("Development Restriction", restrictions.developmentRestriction ? '<span style="color:#dc2626; font-weight:700;">RESTRICTION PRESENT</span>' : '<span style="color:#10b981; font-weight:700;">CLEAR</span>')}
                    </div>
                </div>
                <div class="source-attribution-footer">
                    <span>Source: Restrictions Registry</span>
                    <span>Verified By: ${restrictions.updatedBy || 'OFF-REG-001'}</span>
                </div>
            </div>

            <!-- 14. DEPARTMENT REQUESTS -->
            <div class="govt-card-widget" style="grid-column: span 2;">
                <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>📤 DEPARTMENT REQUESTS</span>
                    <button class="btn-govt-primary" style="padding: 2px 8px; font-size: 11px;" onclick="openCreateDepartmentRequestModal('${pId}')">+ Department Request</button>
                </div>
                <div id="overview-dept-requests-container" style="padding: 8px;">
                    <div class="governance-loading">
                        <div class="loading-spinner-small"></div>
                        <span>Loading department requests...</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadOverviewDepartmentRequests(parcelId) {
    const container = document.getElementById("overview-dept-requests-container");
    if (!container) return;
    try {
        const token = window.AuthManager ? window.AuthManager.getToken() : "";
        const res = await fetch(`http://localhost:5000/api/department-requests?parcelId=${parcelId}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });
        if (!res.ok) throw new Error("Failed to fetch requests");
        const result = await res.json();
        const requests = (result.data || result.requests || []).filter(r => r.parcelId === parcelId);

        if (!requests || requests.length === 0) {
            container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 8px; text-align: center;">No department requests for this parcel.</div>`;
            return;
        }

        let html = `
            <table class="govt-table-compact" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Request ID</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">From</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">To</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Work</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Status</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        requests.forEach(r => {
            const dateStr = r.createdAt ? r.createdAt.substring(0, 10) : '2026-09-05';
            const fromDept = r.from?.department || r.fromDepartment || 'Department';
            const toDept = r.to?.department || r.toDepartment || 'Department';
            const work = r.requiredWork || r.requestType || 'Verification';
            const statusClass = r.status === 'COMPLETED' ? 'status-badge-verified' : (r.status === 'PENDING' ? 'status-badge-review' : 'status-badge-conflict');

            html += `
                <tr>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;"><strong>${r.requestId}</strong></td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">${fromDept}</td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">→ ${toDept}</td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">${work}</td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;"><span class="${statusClass}">${r.status}</span></td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">${dateStr}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (e) {
        console.error("Error loading overview department requests:", e);
        container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 8px;">No department requests for this parcel.</div>`;
    }
}

function renderGisMapPane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">Unable to load GIS parcel information.</div>`;
    }
    const parcel = profile.parcel || {};
    const cadastral = profile.cadastral || {};
    const pId = parcel.id || profile.parcelId || "LND-001";
    const surNo = parcel.surveyNumber || cadastral.surveyNumber || "SUR-101";
    const area = parcel.area || cadastral.area || "NOT AVAILABLE";
    const district = parcel.district || cadastral.district || "NOT AVAILABLE";
    const village = parcel.village || cadastral.village || "NOT AVAILABLE";
    const boundaryStatus = (cadastral.boundaryStatus || "Verified").toUpperCase();
    const hasGeometry = Boolean((parcel.coordinates && parcel.coordinates.length > 0) || (cadastral.coordinates && cadastral.coordinates.length > 0));

    let bBadgeClass = "status-badge-verified";
    if (boundaryStatus === "PENDING" || boundaryStatus === "PENDING VERIFICATION") bBadgeClass = "status-badge-review";
    if (boundaryStatus === "NOT VERIFIED" || boundaryStatus === "UNAVAILABLE") bBadgeClass = "status-badge-conflict";

    return `
        <!-- GIS PARCEL HEADER (PHASE 12B) -->
        <div class="gis-parcel-header-card" style="background:#0b1d3a; color:#ffffff; padding:12px 16px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
            <div>
                <div style="font-size:10px; font-weight:700; letter-spacing:0.5px; color:#93c5fd; text-transform:uppercase;">GIS PARCEL VIEW</div>
                <div style="font-size:16px; font-weight:800;">Parcel ID: ${pId}</div>
            </div>
            <div style="display:flex; gap:16px; font-size:12px; flex-wrap:wrap; align-items:center;">
                <div><span style="color:#cbd5e1;">Survey Number:</span> <strong>${surNo}</strong></div>
                <div><span style="color:#cbd5e1;">Area:</span> <strong>${area}</strong></div>
                <div><span style="color:#cbd5e1;">District:</span> <strong>${district}</strong></div>
                <div><span style="color:#cbd5e1;">Village:</span> <strong>${village}</strong></div>
                <div><span style="color:#cbd5e1;">Boundary Status:</span> <span class="${bBadgeClass}">${boundaryStatus}</span></div>
            </div>
        </div>

        <div class="govt-grid-2col">
            <div class="govt-card-widget" style="margin-bottom:0; display:flex; flex-direction:column;">
                <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                    <span>🗺️ GEOSPATIAL PARCEL BOUNDARY MAP</span>
                    <div class="map-quick-controls" style="display:flex; gap:4px;">
                        <button class="btn-govt-secondary" style="padding:2px 8px; font-size:10px;" onclick="if(window.integratedMap) window.integratedMap.zoomIn();" title="Zoom In">+</button>
                        <button class="btn-govt-secondary" style="padding:2px 8px; font-size:10px;" onclick="if(window.integratedMap) window.integratedMap.zoomOut();" title="Zoom Out">-</button>
                        <button class="btn-govt-secondary" style="padding:2px 8px; font-size:10px;" onclick="fitIntegratedParcelView()" title="Fit Parcel">Fit Parcel</button>
                        <button class="btn-govt-secondary" style="padding:2px 8px; font-size:10px;" onclick="resetIntegratedMapView()" title="Reset View">Reset View</button>
                    </div>
                </div>
                ${hasGeometry ? `
                    <div id="workspace-leaflet-map" style="height:420px; width:100%; border:1px solid #cbd5e1; border-radius:3px; position:relative;"></div>
                ` : `
                    <div style="height:420px; width:100%; border:1px solid #fca5a5; background:#fff1f2; color:#991b1b; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px; border-radius:3px;">
                        <div style="font-size:32px; margin-bottom:8px;">⚠️</div>
                        <div style="font-size:16px; font-weight:800; letter-spacing:0.5px;">GIS BOUNDARY NOT AVAILABLE</div>
                        <div style="font-size:12px; color:#7f1d1d; margin-top:4px; max-width:320px;">Cadastral spatial coordinates have not been surveyed or registered for this parcel.</div>
                    </div>
                `}
                <div style="background:#f8fafc; padding:8px 12px; border-top:1px solid #cbd5e1; font-size:11px; color:#475569; display:flex; justify-content:space-between; align-items:center;">
                    <span><strong>Exposed GIS Layers:</strong> Parcel Boundary, Roads (Available) | Land Use (Available) | Restrictions (Available)</span>
                    <span style="color:#64748b;">Sub-division: ${cadastral.subDivisionNumber || '1A'}</span>
                </div>
            </div>

            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">📍 SPATIAL & BOUNDARY DETAILS</div>
                ${profileRow("Parcel ID", pId)}
                ${profileRow("Survey Number", surNo)}
                ${profileRow("Boundary Status", boundaryStatus)}
                ${profileRow("Current Land Use", parcel.landUse || cadastral.landUse || "N/A")}
                ${profileRow("Master Plan Zone", profile.landUse?.currentZone || "Residential Zone")}
                ${profileRow("North Boundary", cadastral.northBoundary || "Public Road (12m width)")}
                ${profileRow("South Boundary", cadastral.southBoundary || "Adjacent Parcel")}
                ${profileRow("East Boundary", cadastral.eastBoundary || "Drainage / Pathway")}
                ${profileRow("West Boundary", cadastral.westBoundary || "Government Land")}
                ${profileRow("Road Access Width", profile.landUse?.roadWidth || "30 ft Bitumen Road")}
                ${profileRow("Restrictions Status", profile.restrictions?.restrictionStatus || "Clear")}
                <div style="margin-top:14px; display:flex; gap:8px; justify-content:center;">
                    <button class="btn-govt-primary" onclick="switchWorkspaceTab('overview')">← Return to Overview</button>
                    <button class="btn-govt-secondary" onclick="switchWorkspaceTab('ownership')">View Ownership / RoR →</button>
                </div>
            </div>
        </div>
    `;
}

function renderOwnershipPane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">Unable to load ownership / RoR information.</div>`;
    }

    const ror = profile.ror || profile.ownership || {};
    const parcel = profile.parcel || {};
    const pId = parcel.id || profile.parcelId || "LND-001";
    const surNo = parcel.surveyNumber || ror.surveyNumber || "SUR-101";

    const rorOwner = ror.rightsHolder || ror.ownerName || parcel.owner || "NOT AVAILABLE";
    const taxOwner = profile.propertyTax?.owner || profile.tax?.taxPayerName || null;
    const regOwner = profile.registration?.buyer || profile.registration?.currentOwner || null;
    const otherOwner = taxOwner || regOwner;

    const hasOwnerMismatch = Boolean(otherOwner && rorOwner && otherOwner.toLowerCase() !== rorOwner.toLowerCase());

    const history = Array.isArray(ror.ownershipHistory) ? ror.ownershipHistory : [];
    const mutations = Array.isArray(ror.mutations) ? ror.mutations : [];
    const docs = Array.isArray(profile.documents) ? profile.documents : [];
    const rorDoc = docs.find(d => (d.documentType || '').toUpperCase() === 'OWNERSHIP' || (d.title || '').toLowerCase().includes('ror') || (d.title || '').toLowerCase().includes('patta'));

    setTimeout(() => {
        if (typeof loadRorDepartmentRequests === "function") {
            loadRorDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- HEADER TITLE -->
        <div style="background:#0b1d3a; color:#fff; padding:10px 14px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:14px; font-weight:800; letter-spacing:0.5px;">👤 OWNERSHIP & RECORD OF RIGHTS (RoR)</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-govt-primary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Records Department', 'VERIFY_CURRENT_OWNER')">📤 Request RoR Verification</button>
                ${rorDoc ? `<button class="btn-govt-secondary" style="padding:3px 8px; font-size:11px;" onclick="showDocumentDetailsModal('${rorDoc.documentId}')">📄 View RoR Document</button>` : ''}
            </div>
        </div>

        <!-- 23. OWNER MISMATCH WARNING BANNER -->
        ${hasOwnerMismatch ? `
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#991b1b; font-weight:800; font-size:13px; display:flex; align-items:center; gap:6px;">
                    ⚠️ OWNER MISMATCH DETECTED
                    <span class="status-badge-review" style="font-size:10px;">REVIEW REQUIRED</span>
                </div>
                <div style="font-size:12px; color:#7f1d1d; margin-top:6px; line-height:1.5;">
                    <strong>RoR Registered Owner:</strong> ${rorOwner}<br>
                    <strong>Property Tax / Registration Owner:</strong> ${otherOwner}<br>
                    <span style="font-size:11px; color:#b91c1c;">Notice: Discrepancy detected across departmental ledgers. Source records have not been altered automatically. Statutory review is required.</span>
                </div>
            </div>
        ` : ''}

        <!-- 14. CURRENT OWNER & 15. OWNERSHIP INFORMATION -->
        <div class="govt-card-widget">
            <div class="govt-card-header">👤 CURRENT OWNER & TITLE INFORMATION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Owner Name", rorOwner)}
                    ${profileRow("Owner ID", ror.ownerId || "OWN-2026-881")}
                    ${profileRow("Owner Type", ror.ownerType || ror.ownershipType || "Individual")}
                    ${profileRow("Ownership Type", ror.ownershipType || "Individual")}
                    ${profileRow("Ownership Share", ror.ownershipShare || "100%")}
                    ${profileRow("Ownership Start Date", ror.startDate || ror.lastUpdated || "2024-05-18")}
                </div>
                <div>
                    ${profileRow("RoR Record Number", ror.recordNumber || "ROR-2026-001")}
                    ${profileRow("Tenure Type", ror.tenureType || "Freehold")}
                    ${profileRow("Possession Status", ror.possessionStatus || "Self")}
                    ${profileRow("Ownership Status", ror.ownershipStatus || "VERIFIED")}
                    ${profileRow("RoR Status", ror.rorStatus || "VERIFIED")}
                    ${profileRow("Mutation Status", ror.mutationStatus || "Updated")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source Department: Land Records / RoR Department</span>
                <span>Verified By: ${ror.updatedBy || 'OFF-ROR-001'}</span>
                <span>Last Updated: ${ror.lastUpdated || '2026-08-15'}</span>
            </div>
        </div>

        <!-- 16. RoR STATUS & 17. OWNERSHIP VERIFICATION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">📜 RECORD OF RIGHTS (RoR) DETAILS</div>
                ${profileRow("RoR Number", ror.recordNumber || "ROR-2026-001")}
                ${profileRow("RoR Status", ror.rorStatus || "VERIFIED")}
                ${profileRow("Current Owner", rorOwner)}
                ${profileRow("Land Classification", ror.landClassification || parcel.landType || "Residential")}
                ${profileRow("Extent / Area", ror.area || parcel.area || "2,400 sq.ft")}
                ${profileRow("Possession Status", ror.possessionStatus || "Self")}
                ${profileRow("Mutation Status", ror.mutationStatus || "Updated")}
                ${profileRow("Verification Status", ror.verificationStatus || ror.rorStatus || "VERIFIED")}
            </div>

            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🛡️ OWNERSHIP VERIFICATION</div>
                ${profileRow("Verification Status", ror.verificationStatus || ror.rorStatus || "VERIFIED")}
                ${profileRow("Verified By Officer ID", ror.updatedBy || "OFF-ROR-001")}
                ${profileRow("Department", "Land Records / RoR Department")}
                ${profileRow("Last Verified Timestamp", ror.lastVerified || ror.lastUpdated || "2026-08-15")}
                ${profileRow("Verification Remarks", ror.remarks || "Title verified and synchronized with state revenue registry.")}
                
                <!-- 20. RoR DOCUMENT WIDGET -->
                <div style="margin-top:12px; background:#f8fafc; border:1px solid #cbd5e1; padding:10px; border-radius:3px;">
                    <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">📄 ASSOCIATED RoR DOCUMENT</div>
                    ${rorDoc ? `
                        <div style="font-size:12px; color:#0b1d3a; font-weight:700; margin-bottom:4px;">${rorDoc.title} (${rorDoc.documentNumber})</div>
                        <div style="font-size:11px; color:#64748b; margin-bottom:6px;">Status: <span class="status-badge-verified">${rorDoc.status}</span> | Date: ${rorDoc.issueDate || '2026-01-15'}</div>
                        <button class="btn-govt-secondary" style="padding:2px 8px; font-size:10px;" onclick="showDocumentDetailsModal('${rorDoc.documentId}')">View Document</button>
                    ` : `
                        <div style="font-size:12px; color:#64748b;">RoR document not available.</div>
                    `}
                </div>
            </div>
        </div>

        <!-- 18. OWNERSHIP HISTORY -->
        <div class="govt-card-widget" style="margin-top:1rem;">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📜 HISTORICAL OWNERSHIP RECORDS</span>
                <span style="font-size:11px; color:#cbd5e1;">Source: State Revenue Archives</span>
            </div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Date / Year</th>
                            <th>Owner Name</th>
                            <th>Ownership Type</th>
                            <th>Transaction / Reason</th>
                            <th>Reference Document</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${h.date || h.year || '-'}</td>
                                <td><strong>${h.owner}</strong></td>
                                <td>${h.ownershipType || 'Individual'}</td>
                                <td>${h.reason || h.document || 'Title Transfer'}</td>
                                <td><code>${h.document || h.mutationNumber || '-'}</code></td>
                                <td><span class="status-badge-verified">${h.status || 'Completed'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No ownership history available.</div>'}
        </div>

        <!-- 19. MUTATION INFORMATION -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🔄 MUTATION RECORD & APPLICATIONS</div>
            ${mutations.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Mutation ID</th>
                            <th>Mutation Type</th>
                            <th>Application Date</th>
                            <th>Previous Owner</th>
                            <th>New Owner</th>
                            <th>Status</th>
                            <th>Remarks</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mutations.map(m => {
                            const mStatusClass = m.status === 'APPROVED' || m.status === 'COMPLETED' ? 'status-badge-verified' : (m.status === 'PENDING' ? 'status-badge-review' : 'status-badge-conflict');
                            return `
                                <tr>
                                    <td><strong>${m.mutationId}</strong></td>
                                    <td>${m.type}</td>
                                    <td>${m.submittedDate ? m.submittedDate.substring(0,10) : '2026-08-28'}</td>
                                    <td>${m.currentOwner}</td>
                                    <td><strong>${m.proposedOwner}</strong></td>
                                    <td><span class="${mStatusClass}">${m.status}</span></td>
                                    <td>${m.reason || 'Pending verification'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No pending or historical mutations recorded.</div>'}
        </div>

        <!-- 21. OWNERSHIP SOURCE -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🏛️ SOURCE DEPARTMENT ATTRIBUTION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Department", "Land Records / RoR Department")}
                    ${profileRow("Attribution", "Authorized State Land Records Directory")}
                </div>
                <div>
                    ${profileRow("Verified By Officer", ror.updatedBy || "OFF-ROR-001")}
                    ${profileRow("Last Updated Date", ror.lastUpdated || "2026-08-15")}
                </div>
            </div>
        </div>

        <!-- 24. DEPARTMENT REQUESTS INTEGRATION -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 LAND RECORDS / RoR DEPARTMENT REQUESTS</span>
                <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Records Department')">+ Department Request</button>
            </div>
            <div id="ror-dept-requests-container" style="padding:10px;">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading department requests...</span>
                </div>
            </div>
        </div>
    `;
}


function renderRegistrationPane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">Unable to load registration information.</div>`;
    }

    const reg = profile.registration || {};
    const ror = profile.ror || profile.ownership || {};
    const parcel = profile.parcel || {};
    const pId = parcel.id || profile.parcelId || "LND-001";
    const surNo = parcel.surveyNumber || reg.surveyNumber || "SUR-101";

    const regBuyer = reg.buyer || reg.proposedOwner || reg.currentOwner || "N/A";
    const rorOwner = ror.rightsHolder || ror.ownerName || parcel.owner || "N/A";

    const isConsistent = Boolean(regBuyer && rorOwner && regBuyer.trim().toLowerCase() === rorOwner.trim().toLowerCase());
    const isPendingSync = !isConsistent && reg.buyer && rorOwner;

    const history = Array.isArray(reg.transactionHistory) ? reg.transactionHistory : [];
    const docs = Array.isArray(profile.documents) ? profile.documents : [];
    const regDoc = docs.find(d => (d.documentType || '').toUpperCase() === 'REGISTRATION' || (d.documentType || '').toUpperCase() === 'DEED' || (d.title || '').toLowerCase().includes('deed') || (d.title || '').toLowerCase().includes('sale'));

    const regStatus = reg.status || "REGISTERED";
    const verificationStatus = (regStatus === "APPROVED" || reg.deedStatus === "VERIFIED") ? "VERIFIED" : (regStatus === "PENDING" ? "PENDING" : "NOT VERIFIED");
    const verificationBadge = verificationStatus === "VERIFIED" ? "status-badge-verified" : (verificationStatus === "PENDING" ? "status-badge-review" : "status-badge-conflict");

    setTimeout(() => {
        if (typeof loadRegDepartmentRequests === "function") {
            loadRegDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- HEADER TITLE & ACTIONS -->
        <div style="background:#0b1d3a; color:#fff; padding:10px 14px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:14px; font-weight:800; letter-spacing:0.5px;">📜 REGISTRATION & TRANSACTION RECORD</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-govt-primary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Records / RoR Department', 'VERIFY_CURRENT_OWNER')">📤 Request RoR Verification</button>
                ${regDoc ? `<button class="btn-govt-secondary" style="padding:3px 8px; font-size:11px;" onclick="showDocumentDetailsModal('${regDoc.documentId}')">📄 View Registration Document</button>` : ''}
            </div>
        </div>

        <!-- REGISTRATION STATUS CARD (Compact) -->
        <div class="govt-card-widget" style="margin-bottom:12px; background:#f8fafc; border:1px solid #cbd5e1;">
            <div class="govt-card-header" style="background:#1e293b; color:#fff; font-size:12px;">📊 REGISTRATION STATUS OVERVIEW</div>
            <div style="padding:8px 12px; display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px;">
                <div>
                    <span style="font-size:11px; color:#64748b; font-weight:700; display:block;">Current Status</span>
                    <span class="${regStatus === 'APPROVED' || regStatus === 'REGISTERED' ? 'status-badge-verified' : 'status-badge-review'}" style="font-size:11px;">${regStatus}</span>
                </div>
                <div>
                    <span style="font-size:11px; color:#64748b; font-weight:700; display:block;">Latest Transaction</span>
                    <span style="font-size:12px; font-weight:700; color:#0b1d3a;">${reg.transactionType || "SALE"}</span>
                </div>
                <div>
                    <span style="font-size:11px; color:#64748b; font-weight:700; display:block;">Registration Date</span>
                    <span style="font-size:12px; font-weight:600; color:#334155;">${reg.registrationDate || "2026-09-03"}</span>
                </div>
                <div>
                    <span style="font-size:11px; color:#64748b; font-weight:700; display:block;">Verification Status</span>
                    <span class="${verificationBadge}" style="font-size:11px;">${verificationStatus}</span>
                </div>
            </div>
        </div>

        <!-- OWNERSHIP CROSS-CHECK BANNER -->
        <div style="background:${isConsistent ? '#f0fdf4' : '#fee2e2'}; border:1px solid ${isConsistent ? '#bbf7d0' : '#fca5a5'}; border-left:4px solid ${isConsistent ? '#16a34a' : '#dc2626'}; padding:12px; border-radius:3px; margin-bottom:12px;">
            <div style="color:${isConsistent ? '#15803d' : '#991b1b'}; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <span>${isConsistent ? '✓ OWNERSHIP CONSISTENT' : '⚠️ OWNERSHIP MISMATCH'}</span>
                <span class="${isConsistent ? 'status-badge-verified' : 'status-badge-review'}" style="font-size:10px;">${isConsistent ? 'VERIFIED' : 'CONFLICT / REVIEW REQUIRED'}</span>
            </div>
            <div style="font-size:12px; color:${isConsistent ? '#166534' : '#7f1d1d'}; margin-top:6px; line-height:1.5;">
                <strong>Registration Latest Transferee:</strong> ${regBuyer}<br>
                <strong>RoR Current Registered Owner:</strong> ${rorOwner}
                ${!isConsistent ? `<div style="margin-top:6px; color:#b91c1c; font-weight:700;">REGISTRATION UPDATE MAY REQUIRE RoR MUTATION — PENDING OWNERSHIP SYNCHRONIZATION</div>` : ''}
            </div>
            ${!isConsistent ? `
                <div style="margin-top:8px;">
                    <button class="btn-govt-primary" style="padding:4px 10px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Records / RoR Department', 'VERIFY_CURRENT_OWNER')">Request RoR Verification</button>
                </div>
            ` : ''}
        </div>

        <!-- REGISTRATION SUMMARY & LATEST TRANSACTION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">📋 REGISTRATION SUMMARY</div>
                ${profileRow("Registration Status", regStatus)}
                ${profileRow("Registration Number", reg.registrationId || "REG-2026-045")}
                ${profileRow("Document Number", reg.documentNumber || "DOC-REG-2026-045")}
                ${profileRow("Registration Date", reg.registrationDate || "2026-09-03")}
                ${profileRow("Transaction Type", reg.transactionType || "Sale")}
                ${profileRow("Transaction Status", reg.status || "APPROVED")}
                ${profileRow("Sub-Registrar Office", reg.registrationOffice || "Coimbatore Sub-Registrar Office #1")}
                ${profileRow("Registration District", parcel.district || "Coimbatore")}
                ${profileRow("Consideration Value", formatCurrency(reg.considerationAmount))}
                ${profileRow("Market Value", formatCurrency(reg.marketValue))}
                ${profileRow("Last Updated", reg.lastUpdated || "2026-09-03")}
                <div class="source-attribution-footer">
                    <span>Source Department: Property Registration Department</span>
                    <span>Verified By: ${reg.updatedBy || 'OFF-REG-001'}</span>
                </div>
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🔄 LATEST TRANSACTION DETAILS</div>
                ${reg ? `
                    ${profileRow("Transaction ID", reg.registrationId || "REG-2026-045")}
                    ${profileRow("Transaction Type", reg.transactionType || "Sale")}
                    ${profileRow("Transaction Date", reg.registrationDate || "2026-09-03")}
                    ${profileRow("From Party / Previous Owner", reg.seller || reg.currentOwner || "Demo Agricultural Owner")}
                    ${profileRow("To Party / New Owner", reg.buyer || reg.proposedOwner || "Demo New Owner")}
                    ${profileRow("Consideration Value", formatCurrency(reg.considerationAmount))}
                    ${profileRow("Registration Number", reg.registrationId || "REG-2026-045")}
                    ${profileRow("Status", reg.status || "APPROVED")}
                ` : '<div style="padding:12px; color:#64748b; font-weight:bold;">NO REGISTRATION TRANSACTION AVAILABLE</div>'}
            </div>
        </div>

        <!-- TRANSACTION PARTIES & DOCUMENT INFORMATION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">👥 TRANSACTION PARTIES</div>
                ${profileRow("Seller / Transferor", reg.seller || reg.currentOwner || "Demo Agricultural Owner")}
                ${profileRow("Buyer / Transferee", reg.buyer || reg.proposedOwner || "Demo New Owner")}
                ${profileRow("Applicant", reg.buyer || reg.proposedOwner || "Demo New Owner")}
                ${profileRow("Witnesses", "Witness 1 (Local Revenue Inspector), Witness 2 (Authorized Advocate)")}
                ${profileRow("Representatives", "Legal Counsel Representative")}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">📑 REGISTRATION DOCUMENT</div>
                ${profileRow("Document Number", reg.documentNumber || "DOC-REG-2026-045")}
                ${profileRow("Document Type", reg.documentType || "Sale Deed")}
                ${profileRow("Registration Number", reg.registrationId || "REG-2026-045")}
                ${profileRow("Registration Date", reg.registrationDate || "2026-09-03")}
                ${profileRow("Office", reg.registrationOffice || "Coimbatore Sub-Registrar Office #1")}
                ${profileRow("Status", reg.status || "APPROVED")}
                ${profileRow("Document Reference", `REF-${reg.documentNumber || 'DOC-REG-2026-045'}`)}
                <div style="margin-top:10px; text-align:right;">
                    ${regDoc ? `
                        <button class="btn-govt-secondary" onclick="showDocumentDetailsModal('${regDoc.documentId}')">View Document</button>
                    ` : `
                        <button class="btn-govt-secondary" onclick="showDocumentDetailsModal('DOC-2026-001')">View Document</button>
                    `}
                </div>
            </div>
        </div>

        <!-- REGISTRATION VERIFICATION -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🛡️ REGISTRATION VERIFICATION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Verification Status", verificationStatus)}
                    ${profileRow("Verified By", reg.updatedBy || "OFF-REG-001")}
                </div>
                <div>
                    ${profileRow("Department", "Property Registration Department")}
                    ${profileRow("Verified At", reg.lastUpdated || "2026-09-03")}
                </div>
            </div>
            ${profileRow("Verification Remarks", "Registration deed, stamp duty payment, and encumbrance check verified by Sub-Registrar.")}
        </div>

        <!-- REGISTRATION HISTORY -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📜 REGISTRATION HISTORY</span>
                <span style="font-size:11px; color:#cbd5e1;">Source: Sub-Registrar Archives</span>
            </div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Date / Year</th>
                            <th>Registration Number</th>
                            <th>Transaction Type</th>
                            <th>From Party</th>
                            <th>To Party</th>
                            <th>Status</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(t => `
                            <tr>
                                <td>${t.year || t.date || '-'}</td>
                                <td><code>${t.docRef || reg.registrationId || '-'}</code></td>
                                <td>${t.type || 'Sale'}</td>
                                <td>${t.seller || '-'}</td>
                                <td><strong>${t.buyer || '-'}</strong></td>
                                <td><span class="status-badge-verified">${t.status || 'Completed'}</span></td>
                                <td>${t.docRef || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No registration history available.</div>'}
        </div>

        <!-- INTEGRATED DEPARTMENT REQUESTS -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 REGISTRATION DEPARTMENT REQUESTS</span>
                <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Property Registration Department')">+ Department Request</button>
            </div>
            <div id="reg-dept-requests-container" style="padding:10px;">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading department requests...</span>
                </div>
            </div>
        </div>
    `;
}

function renderLandUsePane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">Unable to load land use information.</div>`;
    }

    const lu = profile.landUse || {};
    const ror = profile.ror || profile.ownership || {};
    const parcel = profile.parcel || {};
    const pId = parcel.id || profile.parcelId || "LND-001";

    const currentLandUse = lu.currentLandUse || parcel.landUse || "Agricultural";
    const masterPlan = lu.masterPlanStatus ? {
        masterPlanName: lu.masterPlanStatus,
        planYear: "2026-2035",
        zone: lu.currentZone || "Agricultural Protection Zone",
        zoneCode: lu.masterPlanZoneCode || lu.zoningCode || "AGRI-PROTECT-01",
        planningAuthority: "Coimbatore Local Planning Authority (LPA)",
        developmentStatus: lu.developmentStatus || "Developable",
        applicableRegulations: lu.developmentRestriction || "Standard Development Regulations 2026"
    } : null;

    const conversions = Array.isArray(lu.conversions) ? lu.conversions : [];
    const mainConversion = conversions[0] || (lu.requestId ? {
        conversionId: lu.requestId,
        fromZone: lu.currentZone || "Agricultural Protection Zone",
        toZone: lu.requestedZone || "Mixed Residential Zone (R1)",
        applicant: lu.applicantName || "Demo Applicant",
        reason: lu.conversionReason || "Residential development",
        status: lu.status || "APPROVED",
        appliedDate: lu.submissionDate || "2026-08-25"
    } : null);

    const permitted = Array.isArray(lu.permittedUse) ? lu.permittedUse : [];
    const restricted = Array.isArray(lu.restrictedUse) ? lu.restrictedUse : [];

    /* Cross-Checks */
    const gisLandUse = parcel.landUse || "Agricultural";
    const isGisConsistent = Boolean(gisLandUse && currentLandUse && gisLandUse.trim().toLowerCase() === currentLandUse.trim().toLowerCase());

    const rorClass = ror.landClassification || ror.landUse || parcel.landType || "Agricultural";
    const isRorConsistent = Boolean(rorClass && currentLandUse && (rorClass.trim().toLowerCase().includes(currentLandUse.trim().toLowerCase()) || currentLandUse.trim().toLowerCase().includes(rorClass.trim().toLowerCase())));

    /* Eligibility */
    let eligibilityStatus = "ELIGIBLE";
    if (lu.zoningStatus === "INCOMPATIBLE") eligibilityStatus = "NOT ELIGIBLE";
    else if (mainConversion && mainConversion.status === "PENDING") eligibilityStatus = "CONDITIONALLY ELIGIBLE";

    let eligibilityBadge = eligibilityStatus === "ELIGIBLE" ? "status-badge-verified" : (eligibilityStatus === "CONDITIONALLY ELIGIBLE" ? "status-badge-review" : "status-badge-conflict");

    setTimeout(() => {
        if (typeof loadLandUseDepartmentRequests === "function") {
            loadLandUseDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- HEADER TITLE & ACTIONS -->
        <div style="background:#0b1d3a; color:#fff; padding:10px 14px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:14px; font-weight:800; letter-spacing:0.5px;">🏘️ LAND USE & PLANNING</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-govt-secondary" style="padding:3px 8px; font-size:11px;" onclick="switchWorkspaceTab('gismap')">🗺️ View on GIS</button>
                <button class="btn-govt-primary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Use & Planning Department', 'VERIFY_CURRENT_LAND_USE')">📤 Request Land Use Verification</button>
            </div>
        </div>

        <!-- GIS / ROR / REGISTRATION CROSS-CHECK WARNING BANNERS -->
        ${!isGisConsistent ? `
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-left:4px solid #f97316; padding:10px 12px; border-radius:3px; margin-bottom:10px; font-size:12px; color:#9a3412;">
                <strong>⚠️ GIS / LAND USE DATA MISMATCH:</strong> Spatial GIS map records classification as <strong>${gisLandUse}</strong>, whereas Land Use Department records <strong>${currentLandUse}</strong>. <span class="status-badge-review" style="font-size:10px;">REVIEW REQUIRED</span>
            </div>
        ` : ''}

        ${!isRorConsistent ? `
            <div style="background:#fefce8; border:1px solid #fef08a; border-left:4px solid #eab308; padding:10px 12px; border-radius:3px; margin-bottom:10px; font-size:12px; color:#854d0e;">
                <strong>⚠️ LAND CLASSIFICATION MISMATCH:</strong> RoR record specifies classification as <strong>${rorClass}</strong>, whereas Land Use record is designated as <strong>${currentLandUse}</strong>. <span class="status-badge-review" style="font-size:10px;">REVIEW REQUIRED</span>
            </div>
        ` : ''}

        <!-- 17. CURRENT LAND USE -->
        <div class="govt-card-widget">
            <div class="govt-card-header">📊 CURRENT LAND USE & CLASSIFICATION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Current Land Use", currentLandUse)}
                    ${profileRow("Land Classification", lu.currentZone || parcel.landType || "Agricultural Protection Zone")}
                    ${profileRow("Land Category", "Unrestricted Private Holding")}
                    ${profileRow("Usage Status", lu.developmentStatus || "Active Use")}
                </div>
                <div>
                    ${profileRow("Area", parcel.area || "1.25 Acres")}
                    ${profileRow("Effective Date", lu.submissionDate || "2026-08-25")}
                    ${profileRow("Last Updated", lu.lastUpdated || "2026-09-01")}
                    ${profileRow("Source Department", "Land Use & Planning Department")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: Land Use & Planning Department</span>
                <span>Assigned Officer: ${lu.assignedOfficer || 'OFF-LU-001'}</span>
            </div>
        </div>

        <!-- 18. MASTER PLAN & 19. ZONING INFORMATION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">🗺️ MASTER PLAN INFORMATION</div>
                ${masterPlan ? `
                    ${profileRow("Master Plan Name", masterPlan.masterPlanName)}
                    ${profileRow("Plan Year", masterPlan.planYear)}
                    ${profileRow("Zone", masterPlan.zone)}
                    ${profileRow("Zone Code", masterPlan.zoneCode)}
                    ${profileRow("Planning Authority", masterPlan.planningAuthority)}
                    ${profileRow("Development Status", masterPlan.developmentStatus)}
                    ${profileRow("Applicable Regulations", masterPlan.applicableRegulations)}
                ` : '<div style="padding:12px; color:#64748b; font-weight:bold;">MASTER PLAN DATA NOT AVAILABLE</div>'}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🏗️ ZONING INFORMATION</div>
                ${profileRow("Zone", lu.currentZone || "Agricultural Protection Zone")}
                ${profileRow("Zone Code", lu.zoningCode || "AGRI-PROTECT-01")}
                ${profileList("Permitted Use", permitted)}
                ${profileList("Restricted Use", restricted)}
                ${profileRow("Development Control", lu.setbackRequirement || "Standard controls apply")}
                ${profileRow("Zoning Status", lu.zoningStatus || "ACTIVE")}
            </div>
        </div>

        <!-- 20. LAND USE CONVERSION -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🔄 LAND USE CONVERSION RECORD</div>
            ${mainConversion ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Application ID</th>
                            <th>Applicant</th>
                            <th>Previous Land Use / Zone</th>
                            <th>Requested Land Use / Zone</th>
                            <th>Application Date</th>
                            <th>Authority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${mainConversion.conversionId || mainConversion.applicationId || 'LU-2026-003'}</strong></td>
                            <td>${mainConversion.applicant || 'Demo Applicant'}</td>
                            <td>${mainConversion.fromZone || currentLandUse}</td>
                            <td><strong>${mainConversion.toZone || lu.requestedLandUse || 'Residential'}</strong></td>
                            <td>${mainConversion.appliedDate || lu.submissionDate || '2026-08-25'}</td>
                            <td>District Land Use Committee</td>
                            <td><span class="${mainConversion.status === 'APPROVED' ? 'status-badge-verified' : 'status-badge-review'}">${mainConversion.status || 'PENDING'}</span></td>
                        </tr>
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No land-use conversion record available.</div>'}
        </div>

        <!-- 21. PLANNING RESTRICTIONS & 22. DEVELOPMENT ELIGIBILITY -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">⚠️ PLANNING RESTRICTIONS</div>
                ${lu.developmentRestriction || lu.setbackRequirement || lu.roadWidth ? `
                    ${profileRow("Development Restriction", lu.developmentRestriction || "None")}
                    ${profileRow("Setback Requirement", lu.setbackRequirement || "Front: 10ft, Side: 5ft")}
                    ${profileRow("Road Access Buffer", `Road Width: ${lu.roadWidth || '30ft'} (${lu.roadType || 'Bitumen'})`)}
                    ${profileRow("Environmental Restriction", lu.environmentalStatus || "CLEAR")}
                ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No planning restrictions recorded.</div>'}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🛡️ DEVELOPMENT ELIGIBILITY ASSESSMENT</div>
                <div style="padding:12px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:3px; margin-bottom:10px;">
                    <div style="font-size:11px; color:#64748b; font-weight:700;">ASSESSMENT RESULT</div>
                    <div style="margin-top:4px;"><span class="${eligibilityBadge}" style="font-size:13px; padding:4px 10px;">${eligibilityStatus}</span></div>
                    <div style="font-size:11px; color:#475569; margin-top:8px; line-height:1.4;">
                        Evaluation based on active Local Planning Authority (LPA) Master Plan 2026 and zoning parameters.
                    </div>
                </div>
                <div style="font-size:11px; color:#94a3b8; font-style:italic; text-align:center;">
                    * Prototype planning assessment only. Does not replace statutory planning clearance.
                </div>
            </div>
        </div>

        <!-- 23. LAND USE VERIFICATION -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🛡️ LAND USE VERIFICATION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Verification Status", lu.status === "APPROVED" ? "VERIFIED" : "PENDING")}
                    ${profileRow("Verified By", lu.updatedBy || lu.assignedOfficer || "OFF-LU-001")}
                </div>
                <div>
                    ${profileRow("Department", "Land Use & Planning Department")}
                    ${profileRow("Verified At", lu.lastUpdated || "2026-09-01")}
                </div>
            </div>
            ${profileRow("Remarks", "Zoning alignment and land-use designation verified with District Master Plan.")}
        </div>

        <!-- INTEGRATED DEPARTMENT REQUESTS -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 LAND USE & PLANNING DEPARTMENT REQUESTS</span>
                <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Use & Planning Department')">+ Department Request</button>
            </div>
            <div id="lu-dept-requests-container" style="padding:10px;">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading department requests...</span>
                </div>
            </div>
        </div>
    `;
}

async function loadRegDepartmentRequests(parcelId) {
    const container = document.getElementById("reg-dept-requests-container");
    if (!container) return;
    try {
        const res = await window.getParcelDepartmentRequests(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No registration department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const requests = res.data.filter(r => (r.to?.department || '').toLowerCase().includes('reg') || (r.from?.department || '').toLowerCase().includes('reg'));
        if (requests.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No registration department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Req ID</th>
                        <th>From Dept</th>
                        <th>To Dept</th>
                        <th>Request Type</th>
                        <th>Required Work</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => `
                        <tr>
                            <td><strong>${r.requestId}</strong></td>
                            <td>${r.from.department}</td>
                            <td>${r.to.department}</td>
                            <td>${r.requestType}</td>
                            <td><code>${r.requiredWork}</code></td>
                            <td><span class="${r.status === 'COMPLETED' ? 'status-badge-verified' : 'status-badge-review'}">${r.status}</span></td>
                            <td><button class="btn-govt-secondary" onclick="openDepartmentRequestDetailModal('${r.requestId}')" style="padding:2px 6px; font-size:0.75rem;">View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Unable to load department requests.</div>`;
    }
}

async function loadLandUseDepartmentRequests(parcelId) {
    const container = document.getElementById("lu-dept-requests-container");
    if (!container) return;
    try {
        const res = await window.getParcelDepartmentRequests(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No land use department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const requests = res.data.filter(r => (r.to?.department || '').toLowerCase().includes('land use') || (r.from?.department || '').toLowerCase().includes('land use') || (r.to?.department || '').toLowerCase().includes('planning') || (r.from?.department || '').toLowerCase().includes('planning'));
        if (requests.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No land use department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Req ID</th>
                        <th>From Dept</th>
                        <th>To Dept</th>
                        <th>Request Type</th>
                        <th>Required Work</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => `
                        <tr>
                            <td><strong>${r.requestId}</strong></td>
                            <td>${r.from.department}</td>
                            <td>${r.to.department}</td>
                            <td>${r.requestType}</td>
                            <td><code>${r.requiredWork}</code></td>
                            <td><span class="${r.status === 'COMPLETED' ? 'status-badge-verified' : 'status-badge-review'}">${r.status}</span></td>
                            <td><button class="btn-govt-secondary" onclick="openDepartmentRequestDetailModal('${r.requestId}')" style="padding:2px 6px; font-size:0.75rem;">View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Unable to load department requests.</div>`;
    }
}

window.loadRegDepartmentRequests = loadRegDepartmentRequests;
window.loadLandUseDepartmentRequests = loadLandUseDepartmentRequests;

function renderPropertyTaxPane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">PROPERTY TAX RECORD NOT AVAILABLE</div>`;
    }

    const tax = profile.propertyTax || profile.tax || {};
    const ror = profile.ror || profile.ownership || {};
    const reg = profile.registration || {};
    const parcel = profile.parcel || {};
    const pId = parcel.id || profile.parcelId || "LND-001";

    const taxOwner = tax.owner || parcel.owner || "Demo Agricultural Owner";
    const rorOwner = ror.rightsHolder || ror.ownerName || parcel.owner || "N/A";
    const regOwner = reg.buyer || reg.proposedOwner || "N/A";

    const isOwnerConsistent = Boolean(taxOwner && rorOwner && taxOwner.trim().toLowerCase() === rorOwner.trim().toLowerCase());

    const outstanding = tax.outstandingAmount || 0;
    const penalty = tax.penalty || 0;
    const clearanceStatus = tax.taxClearanceStatus || (outstanding === 0 ? "CLEARED" : "NOT CLEARED");

    const history = Array.isArray(tax.taxHistory) ? tax.taxHistory : [];

    setTimeout(() => {
        if (typeof loadTaxDepartmentRequests === "function") {
            loadTaxDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- HEADER TITLE & ACTIONS -->
        <div style="background:#0b1d3a; color:#fff; padding:10px 14px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:14px; font-weight:800; letter-spacing:0.5px;">💰 PROPERTY TAX & MUNICIPAL RECORD</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-govt-primary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Property Tax & Municipal Department', 'PROPERTY_TAX_CLEARANCE')">📤 Request Tax Clearance</button>
                <button class="btn-govt-secondary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Land Records / RoR Department', 'VERIFY_CURRENT_OWNER')">🔍 Request RoR Verification</button>
            </div>
        </div>

        <!-- 5. OUTSTANDING TAX BANNER -->
        ${outstanding > 0 ? `
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#991b1b; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span>⚠️ OUTSTANDING PROPERTY TAX DUES DETECTED</span>
                    <span class="status-badge-conflict" style="font-size:10px;">TAX CLEARANCE: NOT CLEARED</span>
                </div>
                <div style="font-size:12px; color:#7f1d1d; margin-top:6px; line-height:1.5;">
                    <strong>Outstanding Amount:</strong> ₹${outstanding.toLocaleString()} | 
                    <strong>Penalty:</strong> ₹${penalty.toLocaleString()} | 
                    <strong>Tax Year:</strong> ${tax.taxYear || "2026-2027"}<br>
                    <span style="font-size:11px; color:#b91c1c;">Notice: Property tax demand remains unpaid. Mandatory clearance is required prior to registration or municipal approval.</span>
                </div>
            </div>
        ` : `
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-left:4px solid #16a34a; padding:10px 12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#15803d; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span>✓ PROPERTY TAX DEMAND FULLY PAID</span>
                    <span class="status-badge-verified" style="font-size:10px;">TAX CLEARANCE: CLEARED</span>
                </div>
                <div style="font-size:11px; color:#166534; margin-top:4px;">
                    No outstanding property tax dues pending for financial year ${tax.taxYear || "2026-2027"}.
                </div>
            </div>
        `}

        <!-- 8. TAX OWNER CROSS-CHECK -->
        <div style="background:${isOwnerConsistent ? '#f8fafc' : '#fee2e2'}; border:1px solid ${isOwnerConsistent ? '#cbd5e1' : '#fca5a5'}; border-left:4px solid ${isOwnerConsistent ? '#2563eb' : '#dc2626'}; padding:12px; border-radius:3px; margin-bottom:12px;">
            <div style="color:${isOwnerConsistent ? '#1e40af' : '#991b1b'}; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                <span>${isOwnerConsistent ? '✓ OWNER INFORMATION CONSISTENT' : '⚠️ OWNER MISMATCH'}</span>
                <span class="${isOwnerConsistent ? 'status-badge-verified' : 'status-badge-review'}" style="font-size:10px;">${isOwnerConsistent ? 'VERIFIED' : 'REVIEW REQUIRED'}</span>
            </div>
            <div style="font-size:12px; color:${isOwnerConsistent ? '#1e3a8a' : '#7f1d1d'}; margin-top:6px; line-height:1.5;">
                <strong>Property Tax Owner:</strong> ${taxOwner}<br>
                <strong>RoR Registered Owner:</strong> ${rorOwner}
                ${regOwner ? `<br><strong>Registration Transferee:</strong> ${regOwner}` : ''}
            </div>
        </div>

        <!-- 2. TAX SUMMARY & 3. TAX ASSESSMENT -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">📋 PROPERTY TAX SUMMARY</div>
                ${profileRow("Assessment ID", tax.assessmentId || tax.requestId || "PTX-2026-001")}
                ${profileRow("Municipal Property ID", tax.municipalPropertyId || "MUN-PROP-001")}
                ${profileRow("Owner Name", taxOwner)}
                ${profileRow("Property Type", tax.propertyType || "Residential")}
                ${profileRow("Tax Category", "Private Land Holding")}
                ${profileRow("Assessment Year", tax.taxYear || "2026-2027")}
                ${profileRow("Current Demand", formatCurrency(tax.taxDemand || tax.annualTax))}
                ${profileRow("Amount Paid", formatCurrency(tax.amountPaid))}
                ${profileRow("Outstanding Amount", outstanding > 0 ? `<span style="color:#dc2626; font-weight:800;">₹${outstanding.toLocaleString()} (OUTSTANDING)</span>` : '₹0')}
                ${profileRow("Penalty", formatCurrency(penalty))}
                ${profileRow("Payment Status", tax.paymentStatus || (outstanding === 0 ? "Paid" : "Partially Paid"))}
                ${profileRow("Last Payment Date", tax.lastPaymentDate || "2026-07-15")}
                ${profileRow("Last Updated", tax.lastUpdated || "2026-08-15")}
                <div class="source-attribution-footer">
                    <span>Source Department: Property Tax & Municipal Department</span>
                    <span>Assigned Officer: ${tax.assignedOfficer || 'OFF-TAX-001'}</span>
                </div>
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">📊 TAX ASSESSMENT DETAILS</div>
                ${profileRow("Assessment Number", tax.assessmentId || "PTX-2026-001")}
                ${profileRow("Assessment Year", tax.taxYear || "2026-2027")}
                ${profileRow("Property Classification", tax.propertyType || "Residential")}
                ${profileRow("Annual Value", tax.annualTax ? formatCurrency(tax.annualTax * 10) : "NOT AVAILABLE")}
                ${profileRow("Taxable Value", tax.annualTax ? formatCurrency(tax.annualTax * 8) : "NOT AVAILABLE")}
                ${profileRow("Tax Rate", "0.5% (Municipal Schedule 2026)")}
                ${profileRow("Total Demand", formatCurrency(tax.taxDemand || tax.annualTax))}
                ${profileRow("Rebate / Relief", "₹0")}
                ${profileRow("Penalty Amount", formatCurrency(penalty))}
                ${profileRow("Net Payable", formatCurrency(tax.totalDue || outstanding))}
                ${profileRow("Assessment Status", tax.assessmentStatus || "VERIFIED")}
            </div>
        </div>

        <!-- 6. TAX CLEARANCE & 7. TAX VERIFICATION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">📄 TAX CLEARANCE STATUS</div>
                ${profileRow("Clearance Status", clearanceStatus)}
                ${profileRow("Clearance Reference", tax.clearanceRequests?.[0]?.clearanceId || tax.requestId || "CLR-2026-001")}
                ${profileRow("Clearance Date", tax.lastUpdated || "2026-08-15")}
                ${profileRow("Valid Until", "2027-03-31")}
                ${profileRow("Verified By", tax.assignedOfficer || "OFF-TAX-001")}
                ${profileRow("Remarks", outstanding === 0 ? "Tax demand cleared for current financial year." : `Outstanding dues of ₹${outstanding} pending.`)}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🛡️ PROPERTY TAX VERIFICATION</div>
                ${profileRow("Verification Status", (clearanceStatus === "CLEARED" && outstanding === 0) ? "VERIFIED" : "REVIEW REQUIRED")}
                ${profileRow("Verified By", tax.assignedOfficer || "OFF-TAX-001")}
                ${profileRow("Department", "Property Tax & Municipal Department")}
                ${profileRow("Verified At", tax.lastUpdated || "2026-08-15")}
                ${profileRow("Remarks", "Municipal tax ledger verified against treasury payment receipts.")}
            </div>
        </div>

        <!-- 4. TAX PAYMENT HISTORY -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📜 TAX PAYMENT HISTORY</span>
                <span style="font-size:11px; color:#cbd5e1;">Source: Treasury E-Challan Portal</span>
            </div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Payment Date</th>
                            <th>Receipt Number</th>
                            <th>Assessment Year</th>
                            <th>Amount (₹)</th>
                            <th>Payment Mode</th>
                            <th>Status</th>
                            <th>Reference</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${h.paymentDate || tax.lastPaymentDate || '2026-07-15'}</td>
                                <td><code>${h.paymentRef || tax.paymentReference || 'PAY-TAX-2026-001'}</code></td>
                                <td>${h.year || '2026-2027'}</td>
                                <td>₹${(h.paid || h.demand || 0).toLocaleString()}</td>
                                <td>${tax.paymentMode || 'Treasury E-Challan Portal'}</td>
                                <td><span class="${(h.outstanding || 0) === 0 ? 'status-badge-verified' : 'status-badge-review'}">${h.status || 'Paid'}</span></td>
                                <td>${h.paymentRef || tax.transactionReference || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b; font-size:12px;">No tax payment history available.</div>'}
        </div>

        <!-- INTEGRATED DEPARTMENT REQUESTS -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 PROPERTY TAX DEPARTMENT REQUESTS</span>
                <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Property Tax & Municipal Department')">+ Department Request</button>
            </div>
            <div id="tax-dept-requests-container" style="padding:10px;">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading department requests...</span>
                </div>
            </div>
        </div>
    `;
}

function renderBuildingMunicipalPane(profile) {
    if (!profile) {
        return `<div style="padding:16px; color:#ef4444; font-weight:bold;">BUILDING & MUNICIPAL RECORD NOT AVAILABLE</div>`;
    }

    const bp = profile.buildingPermission || profile.building || {};
    const tax = profile.propertyTax || profile.tax || {};
    const lu = profile.landUse || {};
    const parcel = profile.parcel || {};
    const pId = parcel.id || profile.parcelId || "LND-001";

    const buildingUse = bp.approvedBuildingType || bp.permissionType || "Residential Building";
    const landUseType = lu.currentLandUse || parcel.landUse || "Agricultural";

    // Land Use ↔ Building Use Check
    const isLandUseMatch = (landUseType.toLowerCase().includes("residential") && buildingUse.toLowerCase().includes("residential")) ||
        (landUseType.toLowerCase().includes("commercial") && buildingUse.toLowerCase().includes("commercial")) ||
        (landUseType.toLowerCase().includes("agricultural") && (buildingUse.toLowerCase().includes("agricultural") || buildingUse.toLowerCase().includes("residential")));

    // Recorded vs Approved Deviation Check
    const approvedFloors = bp.maximumFloors || 2;
    const recordedFloors = tax.numberOfFloors || bp.maximumFloors || 2;
    const hasFloorDeviation = recordedFloors > approvedFloors;

    const bpStatus = (bp.buildingPermissionStatus || "APPROVED").toUpperCase();

    setTimeout(() => {
        if (typeof loadBuildingDepartmentRequests === "function") {
            loadBuildingDepartmentRequests(pId);
        }
    }, 50);

    return `
        <!-- HEADER TITLE & ACTIONS -->
        <div style="background:#0b1d3a; color:#fff; padding:10px 14px; border-radius:3px; margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <div style="font-size:14px; font-weight:800; letter-spacing:0.5px;">🏗️ BUILDING & MUNICIPAL RECORDS</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn-govt-secondary" style="padding:3px 8px; font-size:11px;" onclick="switchWorkspaceTab('gismap')">🗺️ View Parcel on GIS</button>
                <button class="btn-govt-primary" style="padding:3px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Municipal Building & Planning Department', 'VERIFY_BUILDING_PERMISSION')">📤 Request Building Verification</button>
            </div>
        </div>

        <!-- 23. LAND USE ↔ BUILDING USE MISMATCH BANNER -->
        ${!isLandUseMatch ? `
            <div style="background:#fff7ed; border:1px solid #fed7aa; border-left:4px solid #f97316; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#9a3412; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span>⚠️ LAND USE / BUILDING USE MISMATCH</span>
                    <span class="status-badge-review" style="font-size:10px;">REVIEW REQUIRED</span>
                </div>
                <div style="font-size:12px; color:#7c2d12; margin-top:6px; line-height:1.5;">
                    <strong>Designated Land Use:</strong> ${landUseType}<br>
                    <strong>Recorded Building Use:</strong> ${buildingUse}<br>
                    <span style="font-size:11px; color:#c2410c;">Notice: Structure usage differs from authorized LPA land use zoning. Statutory planning review required.</span>
                </div>
            </div>
        ` : ''}

        <!-- 24. BUILDING PERMISSION DEVIATION BANNER -->
        ${hasFloorDeviation ? `
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#991b1b; font-weight:800; font-size:13px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
                    <span>⚠️ BUILDING PERMISSION DEVIATION</span>
                    <span class="status-badge-review" style="font-size:10px;">REVIEW REQUIRED</span>
                </div>
                <div style="font-size:12px; color:#7f1d1d; margin-top:6px; line-height:1.5;">
                    <strong>Approved Maximum Floors:</strong> ${approvedFloors}<br>
                    <strong>Recorded Actual Floors:</strong> ${recordedFloors}<br>
                    <span style="font-size:11px; color:#b91c1c;">Notice: Prototype compliance indicator detects unauthorized floor addition beyond approved plan limit.</span>
                </div>
            </div>
        ` : ''}

        <!-- 16. BUILDING SUMMARY & 17. BUILDING PERMISSION -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">🏢 BUILDING SUMMARY</div>
                ${profileRow("Municipal Property ID", tax.municipalPropertyId || "MUN-PROP-001")}
                ${profileRow("Building ID", bp.applicationNumber || "BP-2026-001")}
                ${profileRow("Building Type", bp.approvedBuildingType || bp.permissionType || "Residential Building")}
                ${profileRow("Building Use", buildingUse)}
                ${profileRow("Built-up Area", tax.builtUpArea || bp.maximumBuiltUpArea || "4,000 sq.ft")}
                ${profileRow("Plot Area", tax.landArea || parcel.area || "1.25 Acres")}
                ${profileRow("Number of Floors", recordedFloors)}
                ${profileRow("Construction Status", bp.validityStatus === "Valid" ? "COMPLETED" : "UNDER_CONSTRUCTION")}
                ${profileRow("Building Status", bpStatus)}
                ${profileRow("Year of Construction", "2024")}
                ${profileRow("Owner", parcel.owner || "Demo Agricultural Owner")}
                ${profileRow("Last Updated", bp.lastUpdated || "2026-08-15")}
                <div class="source-attribution-footer">
                    <span>Source: Municipal Building & Planning Department</span>
                </div>
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">📑 BUILDING PERMISSION & APPROVALS</div>
                ${profileRow("Permission ID", bp.applicationNumber || "BP-2026-001")}
                ${profileRow("Application Number", bp.applicationNumber || "BP-2026-001")}
                ${profileRow("Application Date", bp.applicationDate || "2026-05-10")}
                ${profileRow("Approval Date", bp.approvalDate || "2026-06-15")}
                ${profileRow("Approval Authority", bp.approvalAuthority || "Coimbatore Local Planning Authority")}
                ${profileRow("Approved Building Type", bp.approvedBuildingType || "Residential Building")}
                ${profileRow("Approved Built-up Area", bp.maximumBuiltUpArea || "4,000 sq.ft")}
                ${profileRow("Approved Floors", approvedFloors)}
                ${profileRow("Permission Status", bpStatus)}
                ${profileRow("Validity", bp.validityStatus || "Valid")}
            </div>
        </div>

        <!-- 18. BUILDING PLAN & 19. CONSTRUCTION STATUS -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">📐 APPROVED BUILDING PLAN</div>
                ${bp.applicationNumber ? `
                    ${profileRow("Plan Reference", `PLAN-${bp.applicationNumber}`)}
                    ${profileRow("Plan Version", "v1.0 Final Approved")}
                    ${profileRow("Approved Built-up Area", bp.maximumBuiltUpArea || "4,000 sq.ft")}
                    ${profileRow("Ground Coverage", "2,000 sq.ft")}
                    ${profileRow("Floor Count", approvedFloors)}
                    ${profileRow("Setbacks", bp.setbackRequirement || "Front: 10ft, Side: 5ft")}
                    ${profileRow("Max Height", "28 ft")}
                    ${profileRow("Approved Usage", bp.approvedBuildingType || "Residential")}
                    ${profileRow("Approval Status", "APPROVED")}
                ` : '<div style="padding:12px; color:#64748b; font-weight:bold;">BUILDING PLAN DATA NOT AVAILABLE</div>'}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🏗️ CONSTRUCTION STATUS & INSPECTION</div>
                ${profileRow("Construction Status", bp.validityStatus === "Valid" ? "COMPLETED" : "UNDER_CONSTRUCTION")}
                ${profileRow("Start Date", bp.approvalDate || "2026-06-15")}
                ${profileRow("Expected Completion", "2026-12-31")}
                ${profileRow("Actual Completion", bp.validityStatus === "Valid" ? "2026-08-15" : "In Progress")}
                ${profileRow("Last Inspection Date", bp.lastUpdated || "2026-08-15")}
                ${profileRow("Inspection Status", "PASSED")}
            </div>
        </div>

        <!-- 20. MUNICIPAL RECORD & 22. BUILDING COMPLIANCE -->
        <div class="govt-grid-2col">
            <div class="govt-card-widget">
                <div class="govt-card-header">🏛️ MUNICIPAL RECORD</div>
                ${profileRow("Municipal Property ID", tax.municipalPropertyId || "MUN-PROP-001")}
                ${profileRow("Ward", "Ward 14 (South Zone)")}
                ${profileRow("Zone", "Coimbatore South Municipal Zone")}
                ${profileRow("Local Body", "Coimbatore City Municipal Corporation")}
                ${profileRow("Assessment Number", tax.assessmentId || "PTX-2026-001")}
                ${profileRow("Property Classification", tax.propertyType || "Residential")}
                ${profileRow("Municipal Status", "ACTIVE")}
                ${profileRow("Last Updated", tax.lastUpdated || "2026-08-15")}
            </div>

            <div class="govt-card-widget">
                <div class="govt-card-header">🛡️ BUILDING COMPLIANCE</div>
                ${profileRow("Compliance Status", (isLandUseMatch && !hasFloorDeviation) ? "COMPLIANT" : "UNDER_REVIEW")}
                ${profileRow("Violation Type", hasFloorDeviation ? "Unauthorized Extra Floor" : (!isLandUseMatch ? "Non-Conforming Usage" : "None Recorded"))}
                ${profileRow("Notice Number", "N/A")}
                ${profileRow("Notice Date", "N/A")}
                ${profileRow("Resolution Status", "NO ACTION REQUIRED")}
            </div>
        </div>

        <!-- 21. BUILDING INSPECTION TABLE -->
        <div class="govt-card-widget">
            <div class="govt-card-header">🔍 BUILDING INSPECTIONS</div>
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Inspection Date</th>
                        <th>Inspection Type</th>
                        <th>Inspector / Officer</th>
                        <th>Result</th>
                        <th>Remarks</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${bp.lastUpdated || '2026-08-15'}</td>
                        <td>Completion & Setback Inspection</td>
                        <td>OFF-MUN-001</td>
                        <td><span class="status-badge-verified">PASSED</span></td>
                        <td>Structure strictly conforms to approved setback and floor plan.</td>
                        <td>COMPLETED</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- INTEGRATED DEPARTMENT REQUESTS -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 MUNICIPAL & BUILDING DEPARTMENT REQUESTS</span>
                <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${pId}', 'Municipal Building & Planning Department')">+ Department Request</button>
            </div>
            <div id="building-dept-requests-container" style="padding:10px;">
                <div class="governance-loading">
                    <div class="loading-spinner-small"></div>
                    <span>Loading department requests...</span>
                </div>
            </div>
        </div>
    `;
}

async function loadTaxDepartmentRequests(parcelId) {
    const container = document.getElementById("tax-dept-requests-container");
    if (!container) return;
    try {
        const res = await window.getParcelDepartmentRequests(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No property tax department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const requests = res.data.filter(r => (r.to?.department || '').toLowerCase().includes('tax') || (r.from?.department || '').toLowerCase().includes('tax') || (r.to?.department || '').toLowerCase().includes('municipal') || (r.from?.department || '').toLowerCase().includes('municipal'));
        if (requests.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No property tax department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Req ID</th>
                        <th>From Dept</th>
                        <th>To Dept</th>
                        <th>Request Type</th>
                        <th>Required Work</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => `
                        <tr>
                            <td><strong>${r.requestId}</strong></td>
                            <td>${r.from.department}</td>
                            <td>${r.to.department}</td>
                            <td>${r.requestType}</td>
                            <td><code>${r.requiredWork}</code></td>
                            <td><span class="${r.status === 'COMPLETED' ? 'status-badge-verified' : 'status-badge-review'}">${r.status}</span></td>
                            <td><button class="btn-govt-secondary" onclick="openDepartmentRequestDetailModal('${r.requestId}')" style="padding:2px 6px; font-size:0.75rem;">View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Unable to load department requests.</div>`;
    }
}

async function loadBuildingDepartmentRequests(parcelId) {
    const container = document.getElementById("building-dept-requests-container");
    if (!container) return;
    try {
        const res = await window.getParcelDepartmentRequests(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No building department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const requests = res.data.filter(r => (r.to?.department || '').toLowerCase().includes('building') || (r.from?.department || '').toLowerCase().includes('building') || (r.to?.department || '').toLowerCase().includes('municipal') || (r.from?.department || '').toLowerCase().includes('municipal'));
        if (requests.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No building department requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Req ID</th>
                        <th>From Dept</th>
                        <th>To Dept</th>
                        <th>Request Type</th>
                        <th>Required Work</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => `
                        <tr>
                            <td><strong>${r.requestId}</strong></td>
                            <td>${r.from.department}</td>
                            <td>${r.to.department}</td>
                            <td>${r.requestType}</td>
                            <td><code>${r.requiredWork}</code></td>
                            <td><span class="${r.status === 'COMPLETED' ? 'status-badge-verified' : 'status-badge-review'}">${r.status}</span></td>
                            <td><button class="btn-govt-secondary" onclick="openDepartmentRequestDetailModal('${r.requestId}')" style="padding:2px 6px; font-size:0.75rem;">View</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Unable to load department requests.</div>`;
    }
}

window.loadTaxDepartmentRequests = loadTaxDepartmentRequests;
window.loadBuildingDepartmentRequests = loadBuildingDepartmentRequests;

/* =========================================================
   PHASE 12H — RESTRICTIONS & REGULATORY CONSTRAINTS PANE
   ========================================================= */

function renderRestrictionsPane(profile) {
    const parcelId = profile.parcel?.id || profile.parcelId;
    const rest = profile.restrictions || {};
    const court = rest.court || {};
    const acq = rest.acquisition || {};
    const env = rest.environmental || {};
    const forest = rest.forest || {};
    const water = rest.waterBody || {};
    const road = rest.road || {};
    const heritage = rest.heritage || {};
    const dev = rest.development || {};
    const reg = Array.isArray(rest.restrictionRegister) ? rest.restrictionRegister : [];
    const clearance = rest.clearance || {};
    const verification = rest.verification || {};

    const waterBodyRest = rest.waterBodyRestriction || false;
    const roadRest = rest.roadWideningRestriction || false;
    const envRest = rest.environmentalRestriction || false;
    const courtRest = court.status === "PENDING" || rest.courtRestriction;
    const acqRest = acq.acquisitionStatus === "UNDER ACQUISITION" || acq.acquisitionStatus === "UNDER REVIEW" || rest.governmentAcquisition;

    let restrictionStatusText = "CLEAR";
    let statusBadgeClass = "status-badge-verified";
    if (courtRest || acqRest || (rest.riskLevel || "").toLowerCase() === "high") {
        restrictionStatusText = "RESTRICTED";
        statusBadgeClass = "status-badge-conflict";
    } else if (waterBodyRest || roadRest || envRest || rest.developmentRestriction) {
        restrictionStatusText = "RESTRICTED";
        statusBadgeClass = "status-badge-review";
    }

    const bp = profile.buildingPermission || profile.building || {};
    const lu = profile.landUse || {};

    return `
        <!-- Status Header Banner -->
        <div style="background:${restrictionStatusText === 'CLEAR' ? '#f0fdf4' : '#fef2f2'}; border:1px solid ${restrictionStatusText === 'CLEAR' ? '#bbf7d0' : '#fca5a5'}; border-left:4px solid ${restrictionStatusText === 'CLEAR' ? '#16a34a' : '#dc2626'}; padding:14px; border-radius:3px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <div style="color:${restrictionStatusText === 'CLEAR' ? '#15803d' : '#991b1b'}; font-weight:800; font-size:14px; margin-bottom:2px;">
                    ${restrictionStatusText === 'CLEAR' ? '✓ LAND RESTRICTION STATUS: CLEAR' : '⚠️ LAND RESTRICTION PRESENT / REGULATORY CONSTRAINTS ACTIVE'}
                </div>
                <div style="font-size:12px; color:#475569;">
                    Risk Level: <strong>${rest.riskLevel || (restrictionStatusText === 'CLEAR' ? 'Low' : 'Medium')}</strong> | Last Evaluated: ${rest.lastChecked || '2026-08-20'} | Authority: ${rest.sourceDepartment || 'State Regulatory Board & GIS Authorities'}
                </div>
            </div>
            <div>
                <span class="${statusBadgeClass}" style="padding:6px 12px; font-size:12px;">${restrictionStatusText}</span>
            </div>
        </div>

        ${(waterBodyRest || roadRest || envRest || courtRest) ? `
            <div style="background:#fffbeb; border:1px solid #fde68a; border-left:4px solid #d97706; padding:12px; border-radius:3px; margin-bottom:16px;">
                <div style="color:#b45309; font-weight:800; font-size:13px; margin-bottom:4px;">⚠️ PROTOTYPE REGULATORY CHECK — ACTIVE CONSTRAINTS DETECTED</div>
                <div style="font-size:12px; color:#78350f; line-height:1.4;">
                    ${waterBodyRest ? '• <strong>Water Body Buffer Restriction:</strong> Parcel boundaries fall within statutory waterway buffer. Construction restricted.<br>' : ''}
                    ${roadRest ? '• <strong>Road Widening Reservation:</strong> Frontage alignment reserved for proposed highway corridor expansion.<br>' : ''}
                    ${envRest ? '• <strong>Environmental Conservation Zone:</strong> Eco-sensitive zone guidelines apply for land conversion.<br>' : ''}
                    ${courtRest ? '• <strong>Court Litigation Pending:</strong> Injunction or title suit pending in judicial court.<br>' : ''}
                </div>
            </div>
        ` : ''}

        <!-- 11 Category Cards Grid -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:16px;">
            
            <!-- 1. Court / Legal -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">⚖️ COURT / LEGAL STATUS</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Case Number</th><td>${court.caseNumber || 'NO RECORD'}</td></tr>
                    <tr><th>Court Division</th><td>${court.court || 'District Civil Court'}</td></tr>
                    <tr><th>Case Type</th><td>${court.caseType || 'None'}</td></tr>
                    <tr><th>Filing Date</th><td>${court.filingDate || 'N/A'}</td></tr>
                    <tr><th>Order Reference</th><td>${court.orderReference || 'N/A'}</td></tr>
                    <tr><th>Status</th><td><span class="${court.status === 'PENDING' ? 'status-badge-conflict' : 'status-badge-verified'}">${court.status || 'CLEAR'}</span></td></tr>
                </table>
                <div style="margin-top:8px; font-size:11px; color:#64748b;"><strong>Remarks:</strong> ${court.remarks || 'No active litigation or judicial stay order.'}</div>
            </div>

            <!-- 2. Government Acquisition -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🏛️ GOVERNMENT ACQUISITION</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Acquisition Status</th><td><span class="${acq.acquisitionStatus === 'UNDER ACQUISITION' ? 'status-badge-conflict' : (acq.acquisitionStatus === 'UNDER REVIEW' ? 'status-badge-review' : 'status-badge-verified')}">${acq.acquisitionStatus || 'NOT UNDER ACQUISITION'}</span></td></tr>
                    <tr><th>Notification No.</th><td>${acq.notificationNumber || 'N/A'}</td></tr>
                    <tr><th>Notification Date</th><td>${acq.notificationDate || 'N/A'}</td></tr>
                    <tr><th>Authority</th><td>${acq.authority || 'District Revenue Office'}</td></tr>
                    <tr><th>Affected Area</th><td>${acq.affectedArea || '0.00 Sq.Ft'}</td></tr>
                </table>
                <div style="margin-top:8px; font-size:11px; color:#64748b;"><strong>Remarks:</strong> ${acq.remarks || 'Parcel is not subject to state or national land acquisition.'}</div>
            </div>

            <!-- 3. Environmental Restrictions -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🌿 ENVIRONMENTAL CONSTRAINTS</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Environmental Zone</th><td>${env.zone || 'Standard Zone'}</td></tr>
                    <tr><th>Protected Area</th><td>${env.protectedArea || 'No'}</td></tr>
                    <tr><th>Eco-Sensitive Zone</th><td>${env.ecoSensitiveZone || 'No'}</td></tr>
                    <tr><th>Buffer Requirement</th><td>${env.bufferRequirement || 'Standard setback'}</td></tr>
                    <tr><th>Status</th><td><span class="${env.restrictionStatus === 'RESTRICTED' ? 'status-badge-review' : 'status-badge-verified'}">${env.restrictionStatus || 'CLEAR'}</span></td></tr>
                </table>
            </div>

            <!-- 4. Forest Restriction -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🌲 FOREST STATUS</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Classification</th><td>${forest.forestClassification || 'Non-Forest Land'}</td></tr>
                    <tr><th>Reserved Forest</th><td>${forest.reservedForest || 'No'}</td></tr>
                    <tr><th>Clearance Req.</th><td>${forest.clearanceRequirement || 'NOT REQUIRED'}</td></tr>
                    <tr><th>Forest Boundary</th><td>${forest.forestBoundary || 'Outside Forest Buffer Zone'}</td></tr>
                    <tr><th>Status</th><td><span class="status-badge-verified">${forest.status || 'NOT FOREST'}</span></td></tr>
                </table>
            </div>

            <!-- 5. Water Body Restriction -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header" style="display:flex; justify-section:space-between; align-items:center;">
                    <span>🌊 WATER BODY / BUFFER STATUS</span>
                    <button class="btn-govt-secondary" style="padding:2px 8px; font-size:11px;" onclick="switchWorkspaceTab('gismap')">🗺️ View on GIS</button>
                </div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Water Body Type</th><td>${water.waterBodyType || 'None'}</td></tr>
                    <tr><th>Water Body Name</th><td>${water.waterBodyName || 'None'}</td></tr>
                    <tr><th>Buffer Requirement</th><td>${water.bufferRequirement || 'None'}</td></tr>
                    <tr><th>Proximity Distance</th><td>${water.distance || 'N/A'}</td></tr>
                    <tr><th>Status</th><td><span class="${water.restrictionStatus === 'ACTIVE RESTRICTION' ? 'status-badge-conflict' : 'status-badge-verified'}">${water.restrictionStatus || 'CLEAR'}</span></td></tr>
                </table>
            </div>

            <!-- 6. Road / Infrastructure Restriction -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🛣️ ROAD / INFRASTRUCTURE</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Road Widening</th><td>${road.roadWidening || 'No'}</td></tr>
                    <tr><th>Proposed Alignment</th><td>${road.proposedRoad || 'None'}</td></tr>
                    <tr><th>Right of Way (ROW)</th><td>${road.rightOfWay || 'N/A'}</td></tr>
                    <tr><th>Setback Reservation</th><td>${road.reservation || 'None'}</td></tr>
                    <tr><th>Status</th><td><span class="${road.status === 'ACTIVE RESTRICTION' ? 'status-badge-review' : 'status-badge-verified'}">${road.status || 'CLEAR'}</span></td></tr>
                </table>
            </div>

            <!-- 7. Heritage Restriction -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🏛️ HERITAGE STATUS</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Heritage Zone</th><td>${heritage.heritageZone || 'No'}</td></tr>
                    <tr><th>Protected Structure</th><td>${heritage.protectedStructure || 'None'}</td></tr>
                    <tr><th>Buffer Zone</th><td>${heritage.buffer || 'Outside Monument Zone'}</td></tr>
                    <tr><th>Authority</th><td>${heritage.authority || 'State Archaeological Dept'}</td></tr>
                    <tr><th>Status</th><td><span class="status-badge-verified">${heritage.status || 'CLEAR'}</span></td></tr>
                </table>
            </div>

            <!-- 8. Development Control -->
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🏗️ DEVELOPMENT CONTROL</div>
                <table class="govt-table-compact">
                    <tr><th style="width:40%;">Setback Rules</th><td>${dev.setback || 'Standard controls apply'}</td></tr>
                    <tr><th>Maximum Height</th><td>${dev.maximumHeight || '12.0m'}</td></tr>
                    <tr><th>Ground Coverage</th><td>${dev.groundCoverage || '60%'}</td></tr>
                    <tr><th>Permitted Use</th><td>${dev.permittedUse || 'Residential'}</td></tr>
                    <tr><th>Status</th><td><span class="${dev.status === 'HIGHLY RESTRICTED' ? 'status-badge-conflict' : (dev.status === 'RESTRICTED' ? 'status-badge-review' : 'status-badge-verified')}">${dev.status || 'PERMITTED'}</span></td></tr>
                </table>
            </div>

        </div>

        <!-- Restriction Register Table -->
        <div class="govt-card-widget">
            <div class="govt-card-header">📋 UNIFIED RESTRICTION REGISTER</div>
            ${reg.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Restriction ID</th>
                            <th>Category</th>
                            <th>Description</th>
                            <th>Authority</th>
                            <th>Start Date</th>
                            <th>Status</th>
                            <th>Source</th>
                            <th>Verification</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reg.map(r => `
                            <tr>
                                <td><strong>${r.restrictionId}</strong></td>
                                <td>${r.category}</td>
                                <td>${r.description}</td>
                                <td>${r.authority}</td>
                                <td>${r.startDate || '-'}</td>
                                <td><span class="${r.status === 'ACTIVE' ? 'status-badge-review' : 'status-badge-verified'}">${r.status}</span></td>
                                <td>${r.source}</td>
                                <td><span class="status-badge-verified">${r.verification}</span></td>
                                <td><button class="btn-govt-secondary" style="padding:2px 6px; font-size:11px;" onclick="openRestrictionDetailsModal('${r.restrictionId}')">View Details</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:14px; color:#64748b;">No restrictions recorded in unified register for this parcel.</div>'}
        </div>

        <!-- Clearance & Verification Section + Phase 11F Integration -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>🛡️ RESTRICTION CLEARANCE & VERIFICATION</span>
                <div style="display:flex; gap:8px;">
                    <button class="btn-govt-primary" style="font-size:11px;" onclick="openCreateDepartmentRequestModal('${parcelId}')">📤 Request Restriction Verification</button>
                    <button class="btn-govt-secondary" style="font-size:11px;" onclick="openCreateDepartmentRequestModal('${parcelId}')">📄 Request Regulatory Clearance</button>
                </div>
            </div>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px;">
                <div>
                    <h5 style="margin:0 0 8px 0; color:#0b1d3a; font-size:12px;">REGULATORY CLEARANCE STATUS</h5>
                    <table class="govt-table-compact">
                        <tr><th style="width:40%;">Clearance Status</th><td><span class="${clearance.clearanceStatus === 'CLEARED' ? 'status-badge-verified' : 'status-badge-review'}">${clearance.clearanceStatus || 'NOT CLEARED'}</span></td></tr>
                        <tr><th>Clearance Ref.</th><td>${clearance.clearanceReference || 'N/A'}</td></tr>
                        <tr><th>Issuing Authority</th><td>${clearance.authority || 'State Land Governance Board'}</td></tr>
                        <tr><th>Valid Until</th><td>${clearance.validUntil || 'N/A'}</td></tr>
                    </table>
                </div>
                <div>
                    <h5 style="margin:0 0 8px 0; color:#0b1d3a; font-size:12px;">DEPARTMENTAL VERIFICATION</h5>
                    <table class="govt-table-compact">
                        <tr><th style="width:40%;">Verification Status</th><td><span class="${verification.status === 'VERIFIED' ? 'status-badge-verified' : 'status-badge-review'}">${verification.status || 'PENDING'}</span></td></tr>
                        <tr><th>Verified By</th><td>${verification.verifiedBy || 'OFF-REG-001'}</td></tr>
                        <tr><th>Department</th><td>${verification.department || 'Restrictions & Regulatory Board'}</td></tr>
                        <tr><th>Verified At</th><td>${verification.verifiedAt || '2026-08-20'}</td></tr>
                    </table>
                </div>
            </div>
            <div style="margin-top:10px; font-size:11px; color:#475569;">
                <strong>Verification Remarks:</strong> ${verification.remarks || clearance.remarks || 'Regulatory records synchronized with State GIS layers.'}
            </div>
        </div>
    `;
}

/* =========================================================
   PHASE 12I — DOCUMENTS & EVIDENCE REPOSITORY PANE
   ========================================================= */

function renderDocumentsPane(profile) {
    const parcelId = profile.parcel?.id || profile.parcelId;
    const docs = Array.isArray(profile.documents) ? profile.documents : [];
    
    const totalDocs = docs.length;
    const verifiedDocs = docs.filter(d => (d.status || d.verificationStatus || "").toUpperCase() === "VERIFIED" || d.status === "AVAILABLE").length;
    const pendingDocs = docs.filter(d => (d.status || "").toUpperCase() === "PENDING").length;
    const expiredDocs = docs.filter(d => (d.status || "").toUpperCase() === "EXPIRED").length;

    // Define expected checklist items
    const hasType = (t) => docs.some(d => (d.documentType || "").toUpperCase() === t);

    const checklist = [
        { documentType: "RoR Record (Patta/Chitta)", requiredType: "OWNERSHIP", status: hasType("OWNERSHIP") ? "AVAILABLE" : "MISSING", department: "Revenue Department" },
        { documentType: "Cadastral Map (FMB)", requiredType: "CADASTRAL", status: hasType("CADASTRAL") ? "AVAILABLE" : "MISSING", department: "Cadastral Department" },
        { documentType: "Registered Sale Deed", requiredType: "REGISTRATION", status: hasType("REGISTRATION") ? "AVAILABLE" : "MISSING", department: "Registration Department" },
        { documentType: "Property Tax Receipt", requiredType: "PROPERTY_TAX", status: hasType("PROPERTY_TAX") ? "AVAILABLE" : "MISSING", department: "Property Tax Department" },
        { documentType: "Building Permission / Approval", requiredType: "BUILDING_PERMISSION", status: hasType("BUILDING_PERMISSION") ? "AVAILABLE" : "MISSING", department: "Municipal Building Dept" },
        { documentType: "Land Use Clearance", requiredType: "LAND_USE", status: hasType("LAND_USE") ? "AVAILABLE" : (parcelId === "LND-001" ? "NOT_APPLICABLE" : "MISSING"), department: "Land Use & Planning Dept" },
        { documentType: "Regulatory Clearance Record", requiredType: "RESTRICTIONS", status: hasType("RESTRICTIONS") ? "AVAILABLE" : "NOT_APPLICABLE", department: "Regulatory Board" }
    ];

    const missingCount = checklist.filter(c => c.status === "MISSING").length;

    return `
        <!-- Document Metric Counter Header -->
        <div style="display:grid; grid-template-columns: repeat(5, 1fr); gap:10px; margin-bottom:16px;">
            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-top:3px solid #0b1d3a; padding:10px; border-radius:3px; text-align:center;">
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Total Documents</div>
                <div style="font-size:20px; font-weight:800; color:#0b1d3a; margin-top:2px;">${totalDocs}</div>
            </div>
            <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-top:3px solid #16a34a; padding:10px; border-radius:3px; text-align:center;">
                <div style="font-size:10px; color:#15803d; font-weight:700; text-transform:uppercase;">Verified Evidence</div>
                <div style="font-size:20px; font-weight:800; color:#166534; margin-top:2px;">${verifiedDocs}</div>
            </div>
            <div style="background:#fffbeb; border:1px solid #fde68a; border-top:3px solid #d97706; padding:10px; border-radius:3px; text-align:center;">
                <div style="font-size:10px; color:#b45309; font-weight:700; text-transform:uppercase;">Pending Review</div>
                <div style="font-size:20px; font-weight:800; color:#92400e; margin-top:2px;">${pendingDocs}</div>
            </div>
            <div style="background:${missingCount > 0 ? '#fef2f2' : '#f8fafc'}; border:1px solid ${missingCount > 0 ? '#fca5a5' : '#cbd5e1'}; border-top:3px solid ${missingCount > 0 ? '#dc2626' : '#64748b'}; padding:10px; border-radius:3px; text-align:center;">
                <div style="font-size:10px; color:${missingCount > 0 ? '#b91c1c' : '#64748b'}; font-weight:700; text-transform:uppercase;">Missing Documents</div>
                <div style="font-size:20px; font-weight:800; color:${missingCount > 0 ? '#991b1b' : '#334155'}; margin-top:2px;">${missingCount}</div>
            </div>
            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-top:3px solid #475569; padding:10px; border-radius:3px; text-align:center;">
                <div style="font-size:10px; color:#64748b; font-weight:700; text-transform:uppercase;">Expired Permits</div>
                <div style="font-size:20px; font-weight:800; color:#475569; margin-top:2px;">${expiredDocs}</div>
            </div>
        </div>

        ${missingCount > 0 ? `
            <div style="background:#fef2f2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:16px;">
                <div style="color:#991b1b; font-weight:800; font-size:13px; margin-bottom:2px;">⚠️ DOCUMENT CHECK REQUIRED — MISSING MANDATORY EVIDENCE</div>
                <div style="font-size:12px; color:#7f1d1d; line-height:1.4;">
                    ${missingCount} expected workflow document(s) are missing from parcel record. This contributes to <strong>REVIEW REQUIRED</strong> in overall land governance status.
                </div>
            </div>
        ` : ''}

        <!-- Required Documents Checklist -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>✅ REQUIRED DOCUMENT CHECKLIST</span>
                <span style="font-size:11px; color:#64748b; font-weight:normal;">Statutory Workflow Validation</span>
            </div>
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Expected Document Type</th>
                        <th>Issuing Department</th>
                        <th>Requirement Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${checklist.map(c => `
                        <tr>
                            <td><strong>${c.documentType}</strong></td>
                            <td>${c.department}</td>
                            <td>
                                <span class="${c.status === 'AVAILABLE' ? 'status-badge-verified' : (c.status === 'MISSING' ? 'status-badge-conflict' : 'status-badge-review')}">
                                    ${c.status}
                                </span>
                            </td>
                            <td>
                                ${c.status === 'MISSING' ? `
                                    <button class="btn-govt-primary" style="padding:2px 8px; font-size:11px;" onclick="openCreateDepartmentRequestModal('${parcelId}')">📤 Request Document</button>
                                ` : `
                                    <span style="font-size:11px; color:#166534;">✓ Document Filed</span>
                                `}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- Document Repository Table with Controls -->
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span>📁 UNIFIED DEPARTMENT DOCUMENT REGISTER</span>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="text" id="doc-search-input" placeholder="🔍 Search documents..." onkeyup="filterLandProfileDocuments()" style="padding:4px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:3px; width:180px;">
                    <select id="doc-status-filter" onchange="filterLandProfileDocuments()" style="padding:4px 8px; font-size:11px; border:1px solid #cbd5e1; border-radius:3px;">
                        <option value="ALL">All Statuses</option>
                        <option value="VERIFIED">VERIFIED / AVAILABLE</option>
                        <option value="PENDING">PENDING</option>
                        <option value="EXPIRED">EXPIRED</option>
                    </select>
                    <button type="button" class="btn-govt-primary" style="font-size:11px;" onclick="openCreateDepartmentRequestModal('${parcelId}')">📤 Request Verification</button>
                </div>
            </div>

            <div id="doc-table-container">
                ${docs.length > 0 ? `
                    <table class="govt-table-compact" id="land-profile-docs-table">
                        <thead>
                            <tr>
                                <th>Doc ID</th>
                                <th>Category / Type</th>
                                <th>Source Department</th>
                                <th>Title / Reference</th>
                                <th>Issue Date</th>
                                <th>Version</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${docs.map(d => `
                                <tr class="doc-row-item" data-status="${(d.status || d.verificationStatus || '').toUpperCase()}" data-text="${(d.documentId + ' ' + d.documentType + ' ' + (d.issuingDepartment||'') + ' ' + d.title + ' ' + (d.documentNumber||'')).toLowerCase()}">
                                    <td><strong>${d.documentId}</strong></td>
                                    <td><span style="font-size:11px; background:#f1f5f9; padding:2px 5px; border-radius:2px;">${d.documentType}</span></td>
                                    <td>${d.issuingDepartment || d.sourceDepartment || 'Department Record'}</td>
                                    <td><strong>${d.title || d.documentNumber}</strong><br><span style="font-size:10px; color:#64748b;">Ref: ${d.documentNumber || '-'}</span></td>
                                    <td>${d.issueDate || '2026-01-15'}</td>
                                    <td><code>${d.version || 'v1.0'}</code></td>
                                    <td>
                                        <span class="${(d.status || '').toUpperCase() === 'PENDING' ? 'status-badge-review' : ((d.status || '').toUpperCase() === 'EXPIRED' ? 'status-badge-conflict' : 'status-badge-verified')}">
                                            ${d.status || 'AVAILABLE'}
                                        </span>
                                    </td>
                                    <td>
                                        <div style="display:flex; gap:4px;">
                                            <button class="btn-govt-secondary" style="padding:2px 6px; font-size:10px;" onclick="openDocumentDetailsModal('${d.documentId}')">View</button>
                                            <button class="btn-govt-print" style="padding:2px 6px; font-size:10px;" onclick="previewDocumentMock('${d.documentId}')">Preview</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : '<div style="padding:14px; color:#64748b;">No documents uploaded for this parcel.</div>'}
            </div>
        </div>
    `;
}

/* Document Filter Helper */
function filterLandProfileDocuments() {
    const searchVal = (document.getElementById("doc-search-input")?.value || "").toLowerCase();
    const filterVal = (document.getElementById("doc-status-filter")?.value || "ALL").toUpperCase();
    const rows = document.querySelectorAll(".doc-row-item");

    rows.forEach(row => {
        const text = row.getAttribute("data-text") || "";
        const status = row.getAttribute("data-status") || "";
        
        const matchesSearch = !searchVal || text.includes(searchVal);
        const matchesFilter = filterVal === "ALL" || status.includes(filterVal) || (filterVal === "VERIFIED" && status === "AVAILABLE");

        if (matchesSearch && matchesFilter) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });
}
window.filterLandProfileDocuments = filterLandProfileDocuments;

/* Document Preview Mock Helper */
function previewDocumentMock(docId) {
    alert(`Document Preview [${docId}]\n\nRendering official state digital record viewer for evidence document ${docId}.\nDocument integrity certified by State Land Infrastructure.`);
}
window.previewDocumentMock = previewDocumentMock;

/* Interactive Restriction Details Modal */
function openRestrictionDetailsModal(restrictionId) {
    const profile = window.selectedLandProfile;
    if (!profile || !profile.restrictions) return;

    const reg = Array.isArray(profile.restrictions.restrictionRegister) ? profile.restrictions.restrictionRegister : [];
    const item = reg.find(r => r.restrictionId === restrictionId) || {
        restrictionId,
        category: "Regulatory Constraint",
        description: "Land Restriction Record",
        authority: "State Regulatory Authority",
        startDate: "2024-01-01",
        endDate: "2035-12-31",
        status: "ACTIVE",
        source: "State GIS Layer",
        verification: "VERIFIED"
    };

    let modal = document.getElementById("modal-restriction-detail");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-restriction-detail";
        modal.className = "modal-overlay";
        document.body.appendChild(modal);
    }

    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-card" style="max-width: 550px;">
            <div class="modal-header">
                <h3>🚧 RESTRICTION DETAIL — ${item.restrictionId}</h3>
                <button class="close-modal-btn" onclick="closeModal('modal-restriction-detail')">×</button>
            </div>
            <div class="modal-body" style="padding:16px;">
                <table class="govt-table-compact">
                    <tr><th style="width:35%;">Restriction ID</th><td><strong>${item.restrictionId}</strong></td></tr>
                    <tr><th>Parcel ID</th><td>${profile.parcel?.id || profile.parcelId}</td></tr>
                    <tr><th>Category</th><td>${item.category}</td></tr>
                    <tr><th>Description</th><td>${item.description}</td></tr>
                    <tr><th>Issuing Authority</th><td>${item.authority}</td></tr>
                    <tr><th>Effective Start Date</th><td>${item.startDate || '-'}</td></tr>
                    <tr><th>Expiry Date</th><td>${item.endDate || 'Indefinite / Master Plan Term'}</td></tr>
                    <tr><th>Restriction Status</th><td><span class="status-badge-review">${item.status}</span></td></tr>
                    <tr><th>Data Source</th><td>${item.source}</td></tr>
                    <tr><th>Verification Status</th><td><span class="status-badge-verified">${item.verification}</span></td></tr>
                </table>
                <div style="margin-top:14px; text-align:right;">
                    <button class="btn-govt-secondary" onclick="closeModal('modal-restriction-detail')">Close</button>
                </div>
            </div>
        </div>
    `;
}
window.openRestrictionDetailsModal = openRestrictionDetailsModal;

/* Interactive Document Details Modal */
function openDocumentDetailsModal(docId) {
    const profile = window.selectedLandProfile;
    if (!profile) return;

    const docs = Array.isArray(profile.documents) ? profile.documents : [];
    const doc = docs.find(d => d.documentId === docId) || {
        documentId: docId,
        parcelId: profile.parcel?.id || profile.parcelId,
        documentType: "EVIDENCE",
        documentNumber: docId,
        title: "Official Government Evidence",
        issuingDepartment: "State Authority",
        issueDate: "2026-01-15",
        status: "VERIFIED",
        version: "v1.0",
        description: "Official document record."
    };

    let modal = document.getElementById("modal-document-detail");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "modal-document-detail";
        modal.className = "modal-overlay";
        document.body.appendChild(modal);
    }

    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-card" style="max-width: 600px;">
            <div class="modal-header">
                <h3>📁 DOCUMENT METADATA — ${doc.documentId}</h3>
                <button class="close-modal-btn" onclick="closeModal('modal-document-detail')">×</button>
            </div>
            <div class="modal-body" style="padding:16px;">
                <table class="govt-table-compact" style="margin-bottom:12px;">
                    <tr><th style="width:35%;">Document ID</th><td><strong>${doc.documentId}</strong></td></tr>
                    <tr><th>Parcel ID</th><td>${doc.parcelId || profile.parcel?.id || profile.parcelId}</td></tr>
                    <tr><th>Document Type</th><td><code>${doc.documentType}</code></td></tr>
                    <tr><th>Title / Reference</th><td>${doc.title || doc.documentNumber}</td></tr>
                    <tr><th>Document Number</th><td>${doc.documentNumber || '-'}</td></tr>
                    <tr><th>Issuing Department</th><td>${doc.issuingDepartment || doc.sourceDepartment || 'Department Record'}</td></tr>
                    <tr><th>Source Department</th><td>${doc.sourceDepartment || doc.issuingDepartment || 'Department Record'}</td></tr>
                    <tr><th>Issue Date</th><td>${doc.issueDate || '-'}</td></tr>
                    <tr><th>Uploaded Date</th><td>${doc.uploadedDate || '2026-01-15'}</td></tr>
                    <tr><th>Current Version</th><td><code>${doc.version || 'v1.0'}</code></td></tr>
                    <tr><th>Verification Status</th><td><span class="${(doc.status||'').toUpperCase() === 'PENDING' ? 'status-badge-review' : 'status-badge-verified'}">${doc.status || 'AVAILABLE'}</span></td></tr>
                    <tr><th>Verified By</th><td>${doc.verifiedBy || 'OFF-DOC-001'}</td></tr>
                </table>

                ${Array.isArray(doc.versionHistory) && doc.versionHistory.length > 0 ? `
                    <h5 style="margin:12px 0 6px 0; color:#0b1d3a;">VERSION HISTORY</h5>
                    <table class="govt-table-compact">
                        <thead>
                            <tr>
                                <th>Version</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${doc.versionHistory.map(vh => `
                                <tr>
                                    <td><code>${vh.version}</code></td>
                                    <td>${vh.date}</td>
                                    <td><span class="status-badge-verified">${vh.status}</span></td>
                                    <td>${vh.remarks}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}

                <div style="margin-top:14px; display:flex; justify-content:space-between; align-items:center;">
                    <button class="btn-govt-print" onclick="previewDocumentMock('${doc.documentId}')">👁️ Preview File</button>
                    <button class="btn-govt-secondary" onclick="closeModal('modal-document-detail')">Close</button>
                </div>
            </div>
        </div>
    `;
}
window.openDocumentDetailsModal = openDocumentDetailsModal;


function renderConflictsPane(profile) {
    const parcelId = profile.parcel ? profile.parcel.id : (profile.parcelId || "LND-001");
    const conflicts = Array.isArray(profile.conflicts) ? profile.conflicts : [];
    const hasOwnerMismatch = conflicts.some(c => c.category === 'OWNERSHIP' || (c.title && c.title.toLowerCase().includes('owner')));

    return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h4 style="margin:0; color:#0b1d3a;">⚠ LAND GOVERNANCE CONFLICTS</h4>
            <div style="display:flex; gap:8px;">
                <button class="btn-govt-primary" onclick="handleRunConsistencyCheck('${parcelId}')" style="padding:4px 10px; font-size:12px;">🔍 Run Consistency Check</button>
                <button class="btn-govt-secondary" onclick="switchToConflictsCenter('${parcelId}')" style="padding:4px 10px; font-size:12px;">View Conflict Center</button>
            </div>
        </div>

        ${hasOwnerMismatch ? `
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#991b1b; font-weight:800; font-size:14px; margin-bottom:4px;">🚨 HIGH PRIORITY — OWNER MISMATCH DETECTED</div>
                <div style="font-size:12px; color:#7f1d1d; line-height:1.4;">
                    Discrepancy detected between departmental ownership records (e.g. RoR Owner vs Tax Owner or Deed Owner).
                </div>
            </div>
        ` : ''}

        <div class="govt-card-widget">
            <div class="govt-card-header">INTER-DEPARTMENTAL DATA CONFLICTS DETECTED</div>
            ${conflicts.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Conflict ID</th>
                            <th>Type / Category</th>
                            <th>Severity</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${conflicts.map(c => `
                            <tr>
                                <td><strong>${c.id}</strong></td>
                                <td>${c.title || c.type || c.category}</td>
                                <td><span class="${c.severity === 'CRITICAL' || c.severity === 'HIGH' ? 'status-badge-conflict' : 'status-badge-review'}">${c.severity}</span></td>
                                <td>${c.description}</td>
                                <td><span class="${c.status === 'RESOLVED' ? 'status-badge-verified' : 'status-badge-conflict'}">${c.status || 'OPEN'}</span></td>
                                <td style="display:flex; gap:4px;">
                                    <button class="btn-govt-secondary" onclick="openConflictDetailModal('${c.id}')" style="padding:2px 6px; font-size:11px;">View</button>
                                    ${c.status !== 'RESOLVED' && c.status !== 'DISMISSED' ? `<button class="btn-govt-primary" onclick="handleRequestVerificationFromConflict('${c.id}')" style="padding:2px 6px; font-size:11px;">Request Verification</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:14px; color:#166534; background:#dcfce7; border-radius:3px;">✓ No inter-departmental data conflicts detected for this land parcel.</div>'}
        </div>
    `;
}

function renderTimelinePane(profile) {
    const parcelId = profile.parcel ? profile.parcel.id : (profile.parcelId || "LND-001");
    const surveyNo = profile.parcel?.surveyNumber || profile.cadastral?.surveyNumber || "SUR-101";

    setTimeout(() => {
        loadParcelTimelineInProfile(parcelId);
    }, 100);

    return `
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>🕒 UNIFIED PARCEL HISTORY & TIMELINE — ${parcelId} (Survey No: ${surveyNo})</span>
                <span class="dept-badge badge-cadastral">Phase 12L Integrated</span>
            </div>

            <!-- TIMELINE FILTER BAR -->
            <div style="background:#0f172a; padding:0.75rem; border-bottom:1px solid var(--govt-border); display:flex; flex-wrap:wrap; gap:0.5rem; align-items:center;">
                <div style="display:flex; align-items:center; gap:0.25rem;">
                    <label style="font-size:0.75rem; color:#94a3b8; font-weight:700;">Department:</label>
                    <select id="timeline-dept-filter" onchange="filterProfileTimeline('${parcelId}')" style="background:#1e293b; color:#e2e8f0; border:1px solid #334155; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem;">
                        <option value="ALL">ALL DEPARTMENTS</option>
                        <option value="CADASTRAL">Cadastral & Survey</option>
                        <option value="ROR">Land Records / RoR</option>
                        <option value="REGISTRATION">Registration</option>
                        <option value="LAND_USE">Land Use & Planning</option>
                        <option value="TAX">Property Tax & Municipal</option>
                        <option value="BUILDING">Building Authority</option>
                        <option value="RESTRICTIONS">Restrictions</option>
                        <option value="DOCUMENTS">Documents</option>
                        <option value="REQUESTS">Department Requests</option>
                        <option value="CONFLICTS">Conflicts</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:0.25rem;">
                    <label style="font-size:0.75rem; color:#94a3b8; font-weight:700;">Time Period:</label>
                    <select id="timeline-date-filter" onchange="filterProfileTimeline('${parcelId}')" style="background:#1e293b; color:#e2e8f0; border:1px solid #334155; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem;">
                        <option value="ALL_TIME">All Time</option>
                        <option value="TODAY">Today</option>
                        <option value="LAST_7_DAYS">Last 7 Days</option>
                        <option value="LAST_30_DAYS">Last 30 Days</option>
                        <option value="LAST_6_MONTHS">Last 6 Months</option>
                        <option value="LAST_YEAR">Last Year</option>
                    </select>
                </div>

                <div style="display:flex; align-items:center; gap:0.25rem; flex:1; min-width:180px;">
                    <input type="text" id="timeline-search-input" onkeyup="filterProfileTimeline('${parcelId}')" placeholder="Search event ID, reference, officer..." style="width:100%; background:#1e293b; color:#e2e8f0; border:1px solid #334155; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.75rem;">
                </div>

                <button class="btn-govt-secondary" id="btn-sort-timeline" onclick="toggleTimelineSort('${parcelId}')" style="padding:0.25rem 0.5rem; font-size:0.75rem;" data-sort="NEWEST_FIRST">⬇ Newest First</button>
            </div>

            <!-- TIMELINE CONTAINER -->
            <div id="profile-timeline-container" style="padding:1rem;">
                <div style="color:#64748b; font-size:0.9rem;">Loading unified parcel timeline events...</div>
            </div>
        </div>
    `;
}

let profileTimelineSortOrder = "NEWEST_FIRST";

function toggleTimelineSort(parcelId) {
    profileTimelineSortOrder = profileTimelineSortOrder === "NEWEST_FIRST" ? "OLDEST_FIRST" : "NEWEST_FIRST";
    const btn = document.getElementById("btn-sort-timeline");
    if (btn) {
        btn.textContent = profileTimelineSortOrder === "NEWEST_FIRST" ? "⬇ Newest First" : "⬆ Oldest First";
    }
    loadParcelTimelineInProfile(parcelId);
}

async function loadParcelTimelineInProfile(parcelId) {
    const container = document.getElementById("profile-timeline-container");
    if (!container) return;

    try {
        const deptFilter = document.getElementById("timeline-dept-filter")?.value || "ALL";
        const dateFilter = document.getElementById("timeline-date-filter")?.value || "ALL_TIME";
        const searchText = document.getElementById("timeline-search-input")?.value || "";

        const res = await window.getParcelTimeline(parcelId, {
            department: deptFilter,
            dateRange: dateFilter,
            search: searchText,
            sortOrder: profileTimelineSortOrder
        });

        if (!res.success || !res.data || !res.data.events || res.data.events.length === 0) {
            container.innerHTML = `<div style="padding:1.5rem; text-align:center; color:#64748b; font-size:0.9rem;">No timeline events found matching criteria for parcel ${parcelId}.</div>`;
            return;
        }

        const events = res.data.events;
        window.currentProfileTimelineEvents = events;

        let html = `<div style="display:flex; flex-direction:column; gap:0.75rem;">`;

        events.forEach(e => {
            const dateStr = e.timestamp ? new Date(e.timestamp).toLocaleString() : 'Date unavailable';
            const statusClass = e.status === 'VERIFIED' || e.status === 'COMPLETED' || e.status === 'RESOLVED' ? 'status-badge-verified' : (e.status === 'CONFLICT' || e.status === 'REJECTED' ? 'status-badge-review' : 'status-badge-pending');
            const icon = e.icon || '📋';

            let navButtonHTML = '';
            if (e.navigation) {
                if (e.navigation.type === 'conflict') {
                    navButtonHTML = `<button class="btn-govt-warning" onclick="openConflictDetailModal('${e.navigation.id}')" style="padding:2px 8px; font-size:0.75rem;">[ View Conflict ]</button>`;
                } else if (e.navigation.type === 'request') {
                    navButtonHTML = `<button class="btn-govt-primary" onclick="openDepartmentRequestDetailModal('${e.navigation.id}')" style="padding:2px 8px; font-size:0.75rem;">[ View Request ]</button>`;
                } else if (e.navigation.type === 'document') {
                    navButtonHTML = `<button class="btn-govt-secondary" onclick="switchWorkspaceTab('documents')" style="padding:2px 8px; font-size:0.75rem;">[ View Document ]</button>`;
                } else if (e.navigation.type === 'ownership') {
                    navButtonHTML = `<button class="btn-govt-secondary" onclick="switchWorkspaceTab('ownership')" style="padding:2px 8px; font-size:0.75rem;">[ View RoR ]</button>`;
                } else if (e.navigation.type === 'registration') {
                    navButtonHTML = `<button class="btn-govt-secondary" onclick="switchWorkspaceTab('registration')" style="padding:2px 8px; font-size:0.75rem;">[ View Registration ]</button>`;
                } else if (e.navigation.type === 'tax') {
                    navButtonHTML = `<button class="btn-govt-secondary" onclick="switchWorkspaceTab('tax')" style="padding:2px 8px; font-size:0.75rem;">[ View Property Tax ]</button>`;
                } else if (e.navigation.type === 'building') {
                    navButtonHTML = `<button class="btn-govt-secondary" onclick="switchWorkspaceTab('building')" style="padding:2px 8px; font-size:0.75rem;">[ View Building ]</button>`;
                }
            }

            html += `
                <div style="background:#0f172a; border:1px solid var(--govt-border); border-left:4px solid ${e.severity === 'HIGH' ? '#ef4444' : (e.status === 'RESOLVED' || e.status === 'VERIFIED' ? '#10b981' : '#38bdf8')}; padding:0.85rem; border-radius:4px; font-size:0.85rem;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
                        <div style="display:flex; align-items:center; gap:0.5rem;">
                            <span style="font-size:1.2rem;">${icon}</span>
                            <div>
                                <strong style="color:#f8fafc; font-size:0.95rem;">${e.title}</strong>
                                <div style="font-size:0.75rem; color:#94a3b8;">Ref: <code>${e.referenceId || e.eventId}</code> | Department: <strong>${e.department}</strong> | Actor: ${e.actor}</div>
                            </div>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items:flex-end; gap:0.25rem;">
                            <span class="${statusClass}">${e.status}</span>
                            <span style="font-size:0.75rem; color:#64748b;">${dateStr}</span>
                        </div>
                    </div>
                    <div style="color:#cbd5e1; font-size:0.85rem; margin-top:0.3rem; padding-left:1.7rem;">
                        ${e.description}
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:0.5rem; padding-left:1.7rem;">
                        <button class="btn-govt-secondary" onclick="openTimelineEventDetailModal('${e.eventId}')" style="padding:2px 8px; font-size:0.75rem;">Event Details</button>
                        ${navButtonHTML}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Failed to load parcel timeline: ${err.message}</div>`;
    }
}

function filterProfileTimeline(parcelId) {
    loadParcelTimelineInProfile(parcelId);
}

function openTimelineEventDetailModal(eventId) {
    const event = (window.currentProfileTimelineEvents || []).find(e => e.eventId === eventId);
    if (!event) return;

    const modalHTML = `
        <div id="modal-timeline-detail" class="modal-overlay" style="display:flex;">
            <div class="modal-box" style="max-width:600px; width:90%;">
                <div class="modal-header">
                    <h3>🕒 TIMELINE EVENT DETAILS (${event.eventId})</h3>
                    <button class="btn-close" onclick="closeModal('modal-timeline-detail')">✕</button>
                </div>
                <div class="modal-body" style="padding:1rem; font-size:0.85rem;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); margin-bottom:1rem;">
                        <div><strong>Event ID:</strong> ${event.eventId}</div>
                        <div><strong>Event Type:</strong> <code>${event.eventType}</code></div>
                        <div><strong>Parcel ID:</strong> ${event.parcelId}</div>
                        <div><strong>Department:</strong> ${event.department}</div>
                        <div><strong>Actor / User:</strong> ${event.actor}</div>
                        <div><strong>Timestamp:</strong> ${event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}</div>
                        <div><strong>Source System:</strong> ${event.source}</div>
                        <div><strong>Reference ID:</strong> <code>${event.referenceId || 'N/A'}</code></div>
                        <div><strong>Status:</strong> <span class="status-tag status-pending">${event.status}</span></div>
                        <div><strong>Severity:</strong> ${event.severity || 'LOW'}</div>
                    </div>
                    <div style="margin-bottom:1rem;">
                        <strong style="color:#38bdf8;">Title:</strong>
                        <div>${event.title}</div>
                    </div>
                    <div style="margin-bottom:1rem;">
                        <strong style="color:#38bdf8;">Description / Summary:</strong>
                        <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); margin-top:0.25rem;">${event.description}</div>
                    </div>
                    <div style="display:flex; justify-content:flex-end;">
                        <button class="btn-govt-secondary" onclick="closeModal('modal-timeline-detail')">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const existing = document.getElementById("modal-timeline-detail");
    if (existing) existing.remove();
    document.body.insertAdjacentHTML("beforeend", modalHTML);
}

function renderAuditPane(profile) {
    const parcelId = profile.parcel ? profile.parcel.id : (profile.parcelId || "LND-001");

    setTimeout(() => {
        loadParcelAuditsInProfile(parcelId);
    }, 100);

    return `
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📋 COMPREHENSIVE PARCEL AUDIT TRAIL — ${parcelId}</span>
                <button class="btn-govt-primary" onclick="openFullAuditCenterForParcel('${parcelId}')" style="padding:0.25rem 0.6rem; font-size:0.8rem;">[ View Full Audit Center ]</button>
            </div>
            <div id="profile-audits-container" style="padding:1rem;">
                <div style="color:#64748b; font-size:0.9rem;">Loading parcel audit logs...</div>
            </div>
        </div>
    `;
}

async function loadParcelAuditsInProfile(parcelId) {
    const container = document.getElementById("profile-audits-container");
    if (!container) return;

    try {
        const res = await window.getParcelAudits(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="padding:1rem; color:#64748b; font-size:0.9rem;">No audit logs recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const audits = res.data;

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Timestamp</th>
                        <th>Audit ID</th>
                        <th>User / Actor</th>
                        <th>Department</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Result</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${audits.map(a => `
                        <tr>
                            <td>${a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}</td>
                            <td><strong>${a.auditId}</strong></td>
                            <td>${a.actor || 'SYSTEM'}</td>
                            <td>${a.department || 'Governance'}</td>
                            <td><code>${a.action}</code></td>
                            <td>${a.resourceType || 'PARCEL'}: ${a.resourceId || a.parcelId}</td>
                            <td><span class="${a.result === 'SUCCESS' ? 'status-badge-verified' : 'status-badge-review'}">${a.result || 'SUCCESS'}</span></td>
                            <td><button class="btn-govt-secondary" onclick="openAuditDetailModal('${a.auditId}')" style="padding:2px 6px; font-size:0.75rem;">Details</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (err) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Failed to load parcel audits: ${err.message}</div>`;
    }
}

function openFullAuditCenterForParcel(parcelId) {
    closeLandProfile();
    if (typeof switchOfficerTab === "function") {
        switchOfficerTab("audit-trail");
        setTimeout(() => {
            const input = document.getElementById("audit-search-input") || document.getElementById("audit-parcel-filter");
            if (input) {
                input.value = parcelId;
                if (typeof triggerAuditFilter === "function") triggerAuditFilter();
            }
        }, 200);
    }
}

window.openTimelineEventDetailModal = openTimelineEventDetailModal;
window.loadParcelTimelineInProfile = loadParcelTimelineInProfile;
window.filterProfileTimeline = filterProfileTimeline;
window.toggleTimelineSort = toggleTimelineSort;
window.loadParcelAuditsInProfile = loadParcelAuditsInProfile;
window.openFullAuditCenterForParcel = openFullAuditCenterForParcel;

function profileRow(label, value) {
    return `
        <div class="profile-row">
            <span class="profile-label">${label}</span>
            <span class="profile-value">${value !== undefined && value !== null && value !== "" ? value : "NOT AVAILABLE"}</span>
        </div>
    `;
}

function formatCurrency(val) {
    if (val === null || val === undefined || isNaN(val)) return "₹0";
    return `₹${Number(val).toLocaleString()}`;
}

function initIntegratedWorkspaceMap(parcel) {
    setTimeout(() => {
        const container = document.getElementById("workspace-leaflet-map");
        if (!container) return;
        if (window.integratedMap) {
            window.integratedMap.remove();
            window.integratedMap = null;
        }
        const coords = parcel.coordinates || [[11.0200, 76.9500], [11.0200, 76.9530], [11.0175, 76.9530], [11.0175, 76.9500]];
        const poly = L.polygon(coords);
        const bounds = poly.getBounds();
        const center = bounds.getCenter();

        const map = L.map("workspace-leaflet-map").setView(center, 16);
        window.integratedMap = map;

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        poly.setStyle({
            color: "#0b1d3a",
            weight: 3,
            fillColor: "#38bdf8",
            fillOpacity: 0.4
        }).addTo(map);

        poly.bindPopup(`
            <strong>Parcel: ${parcel.id || "LND-001"}</strong><br>
            Survey Number: ${parcel.surveyNumber || "SUR-101"}<br>
            Land Use: ${parcel.landUse || "Residential"}<br>
            Area: ${parcel.area || "2,400 sq.ft"}
        `).openPopup();
    }, 250);
}

window.renderOverviewPane = renderOverviewPane;
window.renderGisMapPane = renderGisMapPane;
window.renderOwnershipPane = renderOwnershipPane;
window.renderRegistrationPane = renderRegistrationPane;
window.renderLandUsePane = renderLandUsePane;
window.renderPropertyTaxPane = renderPropertyTaxPane;
window.renderBuildingMunicipalPane = renderBuildingMunicipalPane;
window.renderRestrictionsPane = renderRestrictionsPane;
window.renderDocumentsPane = renderDocumentsPane;
window.renderConflictsPane = renderConflictsPane;
window.renderTimelinePane = renderTimelinePane;
window.renderAuditPane = renderAuditPane;

function renderDepartmentRequestsPane(profile) {
    const parcelId = profile.parcel ? profile.parcel.id : (profile.parcelId || "LND-001");

    setTimeout(() => {
        loadParcelDepartmentRequestsInProfile(parcelId);
    }, 100);

    return `
        <div class="govt-card-widget">
            <div class="govt-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📤 PARCEL INTER-DEPARTMENTAL VERIFICATION REQUESTS</span>
                <button class="btn-govt-primary" onclick="openCreateDepartmentRequestModal('${parcelId}')" style="padding:0.25rem 0.6rem; font-size:0.8rem;">+ New Request</button>
            </div>
            <div id="profile-dept-requests-container" style="padding:1rem;">
                <div style="color:#64748b; font-size:0.9rem;">Loading inter-departmental requests...</div>
            </div>
        </div>
    `;
}

async function loadParcelDepartmentRequestsInProfile(parcelId) {
    const container = document.getElementById("profile-dept-requests-container");
    if (!container) return;

    try {
        const res = await window.getParcelDepartmentRequests(parcelId);
        if (!res.success || !res.data || res.data.length === 0) {
            container.innerHTML = `<div style="color:#64748b; font-size:0.9rem;">No inter-departmental verification requests recorded for parcel ${parcelId}.</div>`;
            return;
        }

        const requests = res.data;

        container.innerHTML = `
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Req ID</th>
                        <th>From Dept</th>
                        <th>To Dept</th>
                        <th>Request Type</th>
                        <th>Required Work</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Response / Remarks</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${requests.map(r => {
                        const statusClass = r.status === 'COMPLETED' ? 'status-badge-verified' : (r.status === 'PENDING' ? 'status-badge-pending' : 'status-badge-review');
                        const isOverdue = r.isOverdue;
                        return `
                            <tr>
                                <td><strong>${r.requestId}</strong></td>
                                <td>${r.from.department}</td>
                                <td>${r.to.department}</td>
                                <td>${r.requestType}</td>
                                <td><code>${r.requiredWork}</code></td>
                                <td><span class="priority-${(r.priority || 'NORMAL').toLowerCase()}">${r.priority}</span></td>
                                <td>
                                    <span class="${statusClass}">${r.status}</span>
                                    ${isOverdue ? '<span style="background:#7f1d1d; color:#fca5a5; font-size:0.7rem; padding:2px 4px; border-radius:3px; margin-left:4px; font-weight:700;">OVERDUE</span>' : ''}
                                </td>
                                <td>${r.response ? `<strong>${r.response.result}:</strong> ${r.response.remarks}` : (r.reason || 'Pending assessment')}</td>
                                <td><button class="btn-govt-secondary" onclick="openDepartmentRequestDetailModal('${r.requestId}')" style="padding:2px 6px; font-size:0.75rem;">View</button>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    } catch (e) {
        container.innerHTML = `<div style="color:#ef4444; font-size:0.9rem;">Failed to load department requests: ${e.message}</div>`;
    }
}

window.renderDepartmentRequestsPane = renderDepartmentRequestsPane;
window.loadParcelDepartmentRequestsInProfile = loadParcelDepartmentRequestsInProfile;

async function loadRorDepartmentRequests(parcelId) {
    const container = document.getElementById("ror-dept-requests-container");
    if (!container) return;
    try {
        const token = window.AuthManager ? window.AuthManager.getToken() : "";
        const res = await fetch(`http://localhost:5000/api/department-requests?parcelId=${parcelId}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });
        if (!res.ok) throw new Error("Failed to fetch requests");
        const result = await res.json();
        const requests = (result.data || result.requests || []).filter(r => r.parcelId === parcelId && (
            (r.to?.department || r.toDepartment || '').toLowerCase().includes('records') ||
            (r.to?.department || r.toDepartment || '').toLowerCase().includes('ror') ||
            (r.from?.department || r.fromDepartment || '').toLowerCase().includes('records') ||
            (r.from?.department || r.fromDepartment || '').toLowerCase().includes('ror')
        ));

        if (!requests || requests.length === 0) {
            container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 8px; text-align: center;">No Land Records / RoR department requests recorded for this parcel.</div>`;
            return;
        }

        let html = `
            <table class="govt-table-compact" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #f1f5f9; text-align: left;">
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Request ID</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">From</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">To</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Required Work</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Status</th>
                        <th style="padding: 6px; border: 1px solid #cbd5e1;">Date</th>
                    </tr>
                </thead>
                <tbody>
        `;

        requests.forEach(r => {
            const dateStr = r.createdAt ? r.createdAt.substring(0, 10) : '2026-09-05';
            const fromDept = r.from?.department || r.fromDepartment || 'Department';
            const toDept = r.to?.department || r.toDepartment || 'Department';
            const work = r.requiredWork || r.requestType || 'Verification';
            const statusClass = r.status === 'COMPLETED' ? 'status-badge-verified' : (r.status === 'PENDING' ? 'status-badge-review' : 'status-badge-conflict');

            html += `
                <tr>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;"><strong>${r.requestId}</strong></td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">${fromDept}</td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">→ ${toDept}</td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;"><code>${work}</code></td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;"><span class="${statusClass}">${r.status}</span></td>
                    <td style="padding: 6px; border: 1px solid #cbd5e1;">${dateStr}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;
    } catch (e) {
        console.error("Error loading RoR department requests:", e);
        container.innerHTML = `<div style="color: #64748b; font-size: 12px; padding: 8px;">No Land Records / RoR department requests recorded.</div>`;
    }
}

window.loadRorDepartmentRequests = loadRorDepartmentRequests;


window.initIntegratedWorkspaceMap = initIntegratedWorkspaceMap;
window.profileRow = profileRow;
window.formatCurrency = formatCurrency;

/* =========================================================
   GLOBAL DEPARTMENT REQUEST MODAL HELPERS
   ========================================================= */

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
};

document.addEventListener("click", function(e) {
    if (e.target && e.target.classList && e.target.classList.contains("modal-overlay")) {
        e.target.style.display = "none";
    }
});

const GLOBAL_DEPARTMENT_WORK_OPTIONS = {
    "Cadastral & Survey Department": [
        { value: "VERIFY_BOUNDARY", label: "VERIFY BOUNDARY (Boundary Verification)" },
        { value: "FIELD_SURVEY", label: "FIELD SURVEY (Demarcation Survey)" },
        { value: "SUBDIVISION_CHECK", label: "SUBDIVISION CHECK (Subdivision Assessment)" }
    ],
    "Land Records Department": [
        { value: "VERIFY_CURRENT_OWNER", label: "VERIFY CURRENT OWNER (Ownership Verification)" },
        { value: "MUTATION_RECORD_CHECK", label: "MUTATION RECORD CHECK (Patta/RoR Verification)" },
        { value: "DISPUTE_CLEARANCE", label: "DISPUTE CLEARANCE (Title Objection Check)" }
    ],
    "Registration Department": [
        { value: "VERIFY_DEED_AUTHENTICITY", label: "VERIFY DEED AUTHENTICITY (Encumbrance Check)" },
        { value: "STAMP_DUTY_CLEARANCE", label: "STAMP DUTY CLEARANCE (Challan Verification)" },
        { value: "PREVIOUS_TITLE_SEARCH", label: "PREVIOUS TITLE SEARCH (Chain of Title)" }
    ],
    "Land Use & Planning Department": [
        { value: "ZONING_CLEARANCE", label: "ZONING CLEARANCE (Master Plan Zoning Check)" },
        { value: "NOC_LAND_USE_CHANGE", label: "NOC LAND USE CHANGE (Conversion Eligibility)" },
        { value: "SETBACK_COMPLIANCE", label: "SETBACK COMPLIANCE (Road Access / Setback)" }
    ],
    "Property Tax & Municipal Department": [
        { value: "PROPERTY_TAX_CLEARANCE", label: "PROPERTY TAX CLEARANCE (Dues Check)" },
        { value: "MUNICIPAL_ASSESSMENT_VERIFY", label: "MUNICIPAL ASSESSMENT VERIFY (Built-up Area)" },
        { value: "UTILITY_NOC", label: "UTILITY NOC (Water/Sewer Connection Status)" }
    ]
};

window.handleTargetDeptChange = function(targetDept) {
    const workSelect = document.getElementById("deptreq-work");
    if (!workSelect) return;

    workSelect.innerHTML = `<option value="">Select Required Work...</option>`;
    let matchedOptions = GLOBAL_DEPARTMENT_WORK_OPTIONS[targetDept];
    if (!matchedOptions) {
        const lower = (targetDept || "").toLowerCase();
        for (const [key, options] of Object.entries(GLOBAL_DEPARTMENT_WORK_OPTIONS)) {
            if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) {
                matchedOptions = options;
                break;
            }
        }
    }
    const options = matchedOptions || [];
    options.forEach(opt => {
        const el = document.createElement("option");
        el.value = opt.value;
        el.textContent = opt.label;
        workSelect.appendChild(el);
    });
};

window.openCreateDepartmentRequestModal = function(parcelId, defaultToDept = "", defaultWork = "") {
    let modal = document.getElementById("modal-department-request");
    if (!modal) {
        createGlobalDepartmentRequestModalHTML();
        modal = document.getElementById("modal-department-request");
    }

    const user = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : (typeof currentUser !== 'undefined' && currentUser ? currentUser : (window.AuthManager ? window.AuthManager.getUser() : null));
    const userName = user ? (user.name || user.email || 'Citizen / Applicant') : 'Citizen';
    const userId = user ? (user.officerId || user.uid || 'CIT-001') : 'CIT-001';
    const userDept = user ? (user.department || 'Citizen Applicant Portal') : 'Citizen Applicant Portal';

    const pId = parcelId || "LND-001";
    if (document.getElementById("deptreq-parcel-id")) {
        document.getElementById("deptreq-parcel-id").value = pId;
    }
    if (document.getElementById("deptreq-survey-no")) {
        const profile = window.selectedLandProfile || {};
        const surNo = (profile.parcel?.surveyNumber || profile.cadastral?.surveyNumber || "SUR-101");
        document.getElementById("deptreq-survey-no").value = surNo;
    }
    if (document.getElementById("deptreq-from-officer")) {
        document.getElementById("deptreq-from-officer").value = `${userName} (${userId})`;
    }
    if (document.getElementById("deptreq-from-dept")) {
        document.getElementById("deptreq-from-dept").value = userDept;
    }

    const toDeptSelect = document.getElementById("deptreq-to-dept");
    if (toDeptSelect) {
        if (defaultToDept) {
            toDeptSelect.value = defaultToDept;
            window.handleTargetDeptChange(defaultToDept);
            if (defaultWork && document.getElementById("deptreq-work")) {
                document.getElementById("deptreq-work").value = defaultWork;
            }
        } else {
            toDeptSelect.value = "";
            if (document.getElementById("deptreq-work")) {
                document.getElementById("deptreq-work").innerHTML = `<option value="">Select Target Department First...</option>`;
            }
        }
    }

    if (document.getElementById("deptreq-reason")) document.getElementById("deptreq-reason").value = "";
    if (document.getElementById("deptreq-expected")) document.getElementById("deptreq-expected").value = "";
    if (document.getElementById("deptreq-priority")) document.getElementById("deptreq-priority").value = "NORMAL";

    if (modal) modal.style.display = "flex";
};

window.handleCreateDepartmentRequestSubmit = async function(event) {
    event.preventDefault();
    const btn = document.getElementById("btn-submit-dept-req");
    if (btn) btn.disabled = true;

    try {
        const user = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : (typeof currentUser !== 'undefined' && currentUser ? currentUser : (window.AuthManager ? window.AuthManager.getUser() : null));
        const userName = user ? (user.name || user.email || 'Citizen') : 'Citizen';
        const userId = user ? (user.officerId || user.uid || 'CIT-001') : 'CIT-001';
        const userDept = user ? (user.department || 'Citizen Applicant Portal') : 'Citizen Applicant Portal';

        const parcelId = document.getElementById("deptreq-parcel-id").value;
        const surveyNumber = document.getElementById("deptreq-survey-no") ? document.getElementById("deptreq-survey-no").value : "";
        const toDepartment = document.getElementById("deptreq-to-dept").value;
        const requestType = document.getElementById("deptreq-type").value;
        const requiredWork = document.getElementById("deptreq-work").value;
        const priority = document.getElementById("deptreq-priority").value;
        const reason = document.getElementById("deptreq-reason").value;
        const expectedResponse = document.getElementById("deptreq-expected").value;

        const payload = {
            parcelId,
            surveyNumber,
            toDepartment,
            requestType,
            requiredWork,
            priority,
            reason,
            expectedResponse,
            fromOfficerId: userId,
            fromOfficerName: userName,
            fromDepartment: userDept
        };

        const res = await window.createDepartmentRequest(payload);
        if (res && res.success) {
            alert("Department action request submitted successfully.");
            window.closeModal("modal-department-request");
            if (typeof loadOfficerDashboard === "function") loadOfficerDashboard();
            if (typeof loadCitizenRequests === "function") loadCitizenRequests();
            if (typeof loadOverviewDepartmentRequests === "function") loadOverviewDepartmentRequests(parcelId);
            if (document.getElementById("generic-records-container") && typeof loadAndRenderDepartmentRequestsTab === "function") {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert((res && res.message) || "Failed to create department request.");
        }
    } catch (e) {
        alert(e.message || "Failed to send request.");
    } finally {
        if (btn) btn.disabled = false;
    }
};

function createGlobalDepartmentRequestModalHTML() {
    if (document.getElementById("modal-department-request")) return;
    const div = document.createElement("div");
    div.id = "modal-department-request";
    div.className = "modal-overlay";
    div.style.display = "none";
    div.innerHTML = `
        <div class="modal-card" style="max-width: 600px;">
            <div class="modal-header">
                <h3>📤 REQUEST DEPARTMENT ACTION</h3>
                <button class="close-modal-btn" onclick="closeModal('modal-department-request')">×</button>
            </div>
            <form onsubmit="handleCreateDepartmentRequestSubmit(event)">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                        <label>Parcel ID *</label>
                        <input type="text" id="deptreq-parcel-id" class="form-input" placeholder="Enter Parcel ID (e.g. LND-001)" required>
                    </div>
                    <div class="form-group">
                        <label>Survey Number *</label>
                        <input type="text" id="deptreq-survey-no" class="form-input" placeholder="Enter Survey Number (e.g. SUR-101)" required>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                        <label>Requested From</label>
                        <input type="text" id="deptreq-from-officer" class="form-input" readonly>
                    </div>
                    <div class="form-group">
                        <label>From Department</label>
                        <input type="text" id="deptreq-from-dept" class="form-input" readonly>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                        <label>Request To (Department) *</label>
                        <select id="deptreq-to-dept" class="form-input" onchange="handleTargetDeptChange(this.value)" required>
                            <option value="">Select Target Department...</option>
                            <option value="Cadastral & Survey Department">Cadastral & Survey Department</option>
                            <option value="Land Records Department">Land Records / RoR Department</option>
                            <option value="Registration Department">Registration Department</option>
                            <option value="Land Use & Planning Department">Land Use & Planning Department</option>
                            <option value="Property Tax & Municipal Department">Property Tax & Municipal Department</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Request Type *</label>
                        <select id="deptreq-type" class="form-input" required>
                            <option value="VERIFY">VERIFY (Verify Information)</option>
                            <option value="PROVIDE_INFORMATION">PROVIDE INFORMATION (Provide Data)</option>
                            <option value="CLEARANCE">CLEARANCE (Provide Clearance)</option>
                            <option value="CONFIRM">CONFIRM (Confirm Record Status)</option>
                            <option value="REVIEW">REVIEW (Review Dispute/Conflict)</option>
                            <option value="CORRECTION_REQUEST">CORRECTION REQUEST (Request Record Correction)</option>
                        </select>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div class="form-group">
                        <label>Required Work *</label>
                        <select id="deptreq-work" class="form-input" required>
                            <option value="">Select Target Department First...</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Priority *</label>
                        <select id="deptreq-priority" class="form-input" required>
                            <option value="NORMAL">NORMAL (Standard Processing - 3 Days)</option>
                            <option value="HIGH">HIGH (Priority Processing - 2 Days)</option>
                            <option value="URGENT">URGENT (Immediate Processing - 1 Day)</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Reason for Request *</label>
                    <textarea id="deptreq-reason" class="form-input" rows="3" placeholder="Specify statutory or verification reason for department request..." required></textarea>
                </div>

                <div class="form-group">
                    <label>Expected Response / Remarks (Optional)</label>
                    <input type="text" id="deptreq-expected" class="form-input" placeholder="e.g. Boundary verification report, tax clearance certificate, owner ledger copy...">
                </div>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.25rem;">
                    <button type="button" class="btn-govt-secondary" onclick="closeModal('modal-department-request')">Cancel</button>
                    <button type="submit" class="btn-govt-primary" id="btn-submit-dept-req">Send Request</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(div);
}


