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
    const parcel = profile.parcel || {};
    return `
        <div class="govt-grid-2col">
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">🗺️ GEOSPATIAL PARCEL BOUNDARY MAP</div>
                <div id="workspace-leaflet-map" style="height:420px; width:100%; border:1px solid #cbd5e1; border-radius:3px;"></div>
            </div>
            <div class="govt-card-widget" style="margin-bottom:0;">
                <div class="govt-card-header">📍 SPATIAL & BOUNDARY DETAILS</div>
                ${profileRow("Parcel ID", parcel.id || profile.parcelId)}
                ${profileRow("Survey Number", parcel.surveyNumber)}
                ${profileRow("Land Use", parcel.landUse)}
                ${profileRow("Planning Zone", profile.landUse?.currentZone || "Residential Zone")}
                ${profileRow("North Boundary", profile.cadastral?.northBoundary || "Public Road (12m width)")}
                ${profileRow("South Boundary", profile.cadastral?.southBoundary || "Adjacent Parcel")}
                ${profileRow("East Boundary", profile.cadastral?.eastBoundary || "Drainage / Pathway")}
                ${profileRow("West Boundary", profile.cadastral?.westBoundary || "Government Land")}
                ${profileRow("Road Access", profile.landUse?.roadWidth || "30 ft Bitumen Road")}
                ${profileRow("Restrictions", profile.restrictions?.restrictionStatus || "Clear")}
                <div style="margin-top:12px; text-align:center;">
                    <button class="btn-govt-print" style="margin:0 auto;" onclick="switchWorkspaceTab('overview')">← Return to Land Profile Overview</button>
                </div>
            </div>
        </div>
    `;
}

function renderOwnershipPane(profile) {
    const ror = profile.ror || profile.ownership || {};
    const history = Array.isArray(ror.ownershipHistory) ? ror.ownershipHistory : [];
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">👤 RECORD OF RIGHTS (RoR) & OWNERSHIP RECORD</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Rights Holder / Owner", ror.rightsHolder || ror.ownerName || profile.parcel?.owner)}
                    ${profileRow("Ownership Type", ror.ownershipType || "Individual")}
                    ${profileRow("Ownership Share", ror.ownershipShare || "100%")}
                    ${profileRow("Possession Status", ror.possessionStatus || "Self")}
                    ${profileRow("Tenure Type", ror.tenureType || "Freehold")}
                </div>
                <div>
                    ${profileRow("RoR Record Number", ror.recordNumber || "ROR-2026-001")}
                    ${profileRow("RoR Status", ror.rorStatus || "VERIFIED")}
                    ${profileRow("Mutation Status", ror.mutationStatus || "Updated")}
                    ${profileRow("Last Updated", ror.lastUpdated || "2026-08-15")}
                    ${profileRow("Verified By", ror.updatedBy || "OFF-ROR-001")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: RoR Department</span>
                <span>Verified By: ${ror.updatedBy || 'OFF-ROR-001'}</span>
                <span>Last Updated: ${ror.lastUpdated || '2026-08-15'}</span>
            </div>
        </div>

        <div class="govt-card-widget">
            <div class="govt-card-header">📜 HISTORICAL OWNERSHIP RECORD</div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Date / Year</th>
                            <th>Owner Name</th>
                            <th>Ownership Type</th>
                            <th>Supporting Document</th>
                            <th>Mutation Number</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${h.date || h.year || '-'}</td>
                                <td><strong>${h.owner}</strong></td>
                                <td>${h.ownershipType || 'Individual'}</td>
                                <td>${h.document || '-'}</td>
                                <td>${h.mutationNumber || '-'}</td>
                                <td><span class="status-badge-verified">${h.status || 'Completed'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:10px; color:#64748b;">No historical mutations recorded.</div>'}
        </div>
    `;
}

function renderRegistrationPane(profile) {
    const reg = profile.registration || {};
    const history = Array.isArray(reg.transactionHistory) ? reg.transactionHistory : [];
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">📜 SUB-REGISTRAR OFFICE PROPERTY REGISTRATION</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Registration ID", reg.registrationId || "REG-2026-045")}
                    ${profileRow("Document Number", reg.documentNumber || "DOC-REG-2026-045")}
                    ${profileRow("Document Type", reg.documentType || "Sale Deed")}
                    ${profileRow("Transaction Type", reg.transactionType || "Sale")}
                    ${profileRow("Seller Name", reg.seller || "Ramesh Kumar")}
                    ${profileRow("Buyer / Current Owner", reg.buyer || reg.currentOwner || profile.parcel?.owner)}
                </div>
                <div>
                    ${profileRow("Registration Date", reg.registrationDate || "2026-09-03")}
                    ${profileRow("Registration Office", reg.registrationOffice || "Sub-Registrar Office #1")}
                    ${profileRow("Consideration Amount", `₹${(reg.considerationAmount || 0).toLocaleString()}`)}
                    ${profileRow("Stamp Duty Status", reg.stampDutyStatus || "VERIFIED")}
                    ${profileRow("Encumbrance Status", reg.encumbranceStatus || "CLEAR")}
                    ${profileRow("Registration Status", reg.status || "APPROVED")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: Registration Department (Sub-Registrar Office)</span>
                <span>Verified By: ${reg.updatedBy || 'OFF-REG-001'}</span>
            </div>
        </div>

        <div class="govt-card-widget">
            <div class="govt-card-header">📋 TRANSACTION HISTORY</div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Year</th>
                            <th>Transaction Type</th>
                            <th>Seller</th>
                            <th>Buyer</th>
                            <th>Document Reference</th>
                            <th>Consideration (₹)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(t => `
                            <tr>
                                <td>${t.year}</td>
                                <td>${t.type}</td>
                                <td>${t.seller}</td>
                                <td><strong>${t.buyer}</strong></td>
                                <td>${t.docRef}</td>
                                <td>₹${(t.consideration || 0).toLocaleString()}</td>
                                <td><span class="status-badge-verified">${t.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:10px; color:#64748b;">No previous transaction history records.</div>'}
        </div>
    `;
}

function renderLandUsePane(profile) {
    const lu = profile.landUse || {};
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">🏘️ ZONING & MASTER PLAN COMPLIANCE</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Current Land Use", lu.currentLandUse || profile.parcel?.landUse)}
                    ${profileRow("Master Plan Zone", lu.currentZone || lu.zoningName || "Residential Zone")}
                    ${profileRow("Zone Code", lu.zoningCode || "AGRI-PROTECT-01")}
                    ${profileRow("Zoning Status", lu.zoningStatus || "COMPATIBLE")}
                    ${profileRow("Development Intensity (FAR)", lu.developmentIntensity || "Medium (FAR 1.5)")}
                </div>
                <div>
                    ${profileRow("Environmental Status", lu.environmentalStatus || "CLEAR")}
                    ${profileRow("Road Access Width", lu.roadWidth || "30 ft Bitumen Road")}
                    ${profileRow("Road Surface Type", lu.roadType || "Paved Bitumen Road")}
                    ${profileRow("Restriction Status", lu.restrictionStatus || "CLEAR")}
                    ${profileRow("Master Plan Period", lu.masterPlanStatus || "Approved Plan 2026-2035")}
                </div>
            </div>
            ${profileRow("Development Setbacks", lu.setbackRequirement || "Front: 10 ft, Side: 5 ft, Rear: 10 ft")}
            ${profileRow("Development Restriction", lu.developmentRestriction || "Standard setback regulations apply.")}
            <div class="source-attribution-footer">
                <span>Source: Land Use & Planning Department</span>
                <span>Verified By: ${lu.assignedOfficer || 'OFF-LU-001'}</span>
            </div>
        </div>
    `;
}

function renderPropertyTaxPane(profile) {
    const tax = profile.propertyTax || profile.tax || {};
    const history = Array.isArray(tax.taxHistory) ? tax.taxHistory : [];
    const outstanding = tax.outstandingAmount || 0;

    return `
        ${outstanding > 0 ? `
            <div class="outstanding-tax-banner">
                <div>⚠️ <strong>OUTSTANDING PROPERTY TAX DUES DETECTED</strong></div>
                <div>Total Outstanding: <strong>₹${outstanding.toLocaleString()}</strong></div>
            </div>
        ` : ''}

        <div class="govt-card-widget">
            <div class="govt-card-header">💰 MUNICIPAL PROPERTY TAX ASSESSMENT</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Assessment ID", tax.assessmentId || tax.requestId || "PTX-2026-001")}
                    ${profileRow("Tax Assessment Year", tax.taxYear || "2026-2027")}
                    ${profileRow("Property Classification", tax.propertyType || "Residential")}
                    ${profileRow("Land Area", tax.landArea || profile.parcel?.area)}
                    ${profileRow("Built-up Area", tax.builtUpArea || "4,000 sq.ft")}
                </div>
                <div>
                    ${profileRow("Annual Tax Demand", `₹${(tax.annualTax || tax.taxDemand || 0).toLocaleString()}`)}
                    ${profileRow("Amount Paid", `₹${(tax.amountPaid || 0).toLocaleString()}`)}
                    ${profileRow("Outstanding Amount", outstanding > 0 ? `<span style="color:#dc2626; font-weight:800;">₹${outstanding.toLocaleString()} (OUTSTANDING)</span>` : '₹0')}
                    ${profileRow("Penalty Amount", `₹${(tax.penalty || 0).toLocaleString()}`)}
                    ${profileRow("Payment Status", tax.paymentStatus || "Paid")}
                    ${profileRow("Tax Clearance Status", tax.taxClearanceStatus || "CLEARED")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: Property Tax & Municipal Department</span>
                <span>Verified By: ${tax.assignedOfficer || 'OFF-TAX-001'}</span>
            </div>
        </div>

        <div class="govt-card-widget">
            <div class="govt-card-header">📋 TAX ASSESSMENT HISTORY</div>
            ${history.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Assessment Year</th>
                            <th>Demand (₹)</th>
                            <th>Paid (₹)</th>
                            <th>Outstanding (₹)</th>
                            <th>Payment Reference</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map(h => `
                            <tr>
                                <td>${h.year}</td>
                                <td>₹${(h.demand || 0).toLocaleString()}</td>
                                <td>₹${(h.paid || 0).toLocaleString()}</td>
                                <td>₹${(h.outstanding || 0).toLocaleString()}</td>
                                <td>${h.paymentRef || '-'}</td>
                                <td><span class="${h.outstanding === 0 ? 'status-badge-verified' : 'status-badge-review'}">${h.status}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:10px; color:#64748b;">No tax payment history.</div>'}
        </div>
    `;
}

function renderBuildingMunicipalPane(profile) {
    const bp = profile.buildingPermission || profile.building || {};
    const util = profile.utilities || {};

    const formatAvailable = (val) => {
        if (!val || val.available === false || String(val).toLowerCase().includes('not available')) {
            return `<span style="color:#dc2626; font-weight:700;">NOT AVAILABLE</span>`;
        }
        return `<span style="color:#16a34a; font-weight:700;">VERIFIED DATA (AVAILABLE)</span>`;
    };

    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">🏗️ BUILDING PERMISSION & APPROVALS</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Application Number", bp.applicationNumber || "BP-2026-001")}
                    ${profileRow("Building Permission Status", bp.buildingPermissionStatus || "Approved")}
                    ${profileRow("Permission Type", bp.permissionType || "Residential Construction")}
                    ${profileRow("Approved Building Type", bp.approvedBuildingType || "Residential Building")}
                </div>
                <div>
                    ${profileRow("Maximum Approved Floors", bp.maximumFloors || 2)}
                    ${profileRow("Maximum Built-up Area", bp.maximumBuiltUpArea || "4,000 sq.ft")}
                    ${profileRow("Approval Authority", bp.approvalAuthority || "Local Planning Authority")}
                    ${profileRow("Validity Status", bp.validityStatus || "Valid")}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: Local Planning Authority & Municipal Administration</span>
                <span>Last Checked: ${bp.lastUpdated || '2026-08-15'}</span>
            </div>
        </div>

        <div class="govt-card-widget">
            <div class="govt-card-header">💧 MUNICIPAL INFRASTRUCTURE & UTILITIES STATUS</div>
            <div class="govt-grid-2col">
                <div>
                    ${profileRow("Water Connection", formatAvailable(util.water))}
                    ${profileRow("Electricity Grid", formatAvailable(util.electricity))}
                </div>
                <div>
                    ${profileRow("Sewerage Line", formatAvailable(util.sewerage))}
                    ${profileRow("Public Road Access", formatAvailable(util.road))}
                </div>
            </div>
            <div class="source-attribution-footer">
                <span>Source: Municipal Works & Infrastructure Department</span>
            </div>
        </div>
    `;
}

function renderRestrictionsPane(profile) {
    const rest = profile.restrictions || {};

    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">🚧 REGULATORY RESTRICTIONS MATRIX</div>
            <table class="govt-table-compact">
                <thead>
                    <tr>
                        <th>Restriction Type</th>
                        <th>Applicability</th>
                        <th>Status</th>
                        <th>Source Authority</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Court Restriction / Litigation</td>
                        <td>${rest.courtRestriction ? 'ACTIVE' : 'NONE'}</td>
                        <td><span class="${rest.courtRestriction ? 'status-badge-conflict' : 'status-badge-verified'}">${rest.courtRestriction ? 'RESTRICTED' : 'CLEAR'}</span></td>
                        <td>Judicial Records</td>
                    </tr>
                    <tr>
                        <td>Government Land Acquisition</td>
                        <td>${rest.governmentAcquisition ? 'ACTIVE NOTICE' : 'NONE'}</td>
                        <td><span class="${rest.governmentAcquisition ? 'status-badge-conflict' : 'status-badge-verified'}">${rest.governmentAcquisition ? 'ACQUISITION NOTICE' : 'CLEAR'}</span></td>
                        <td>Revenue Department</td>
                    </tr>
                    <tr>
                        <td>Environmental Protection Zone</td>
                        <td>${rest.environmentalRestriction ? 'ACTIVE' : 'NONE'}</td>
                        <td><span class="${rest.environmentalRestriction ? 'status-badge-review' : 'status-badge-verified'}">${rest.environmentalRestriction ? 'ENVIRONMENTAL CLEARANCE REQUIRED' : 'CLEAR'}</span></td>
                        <td>Forest & Environment Dept</td>
                    </tr>
                    <tr>
                        <td>Water Body Buffer Zone</td>
                        <td>${rest.waterBodyRestriction ? 'BUFFER RESTRICTION' : 'NONE'}</td>
                        <td><span class="${rest.waterBodyRestriction ? 'status-badge-conflict' : 'status-badge-verified'}">${rest.waterBodyRestriction ? 'BUFFER ZONE RESTRICTION' : 'CLEAR'}</span></td>
                        <td>Public Works Dept (PWD)</td>
                    </tr>
                    <tr>
                        <td>Heritage Zone Conservation</td>
                        <td>${rest.heritageRestriction ? 'HERITAGE ZONE' : 'NONE'}</td>
                        <td><span class="${rest.heritageRestriction ? 'status-badge-review' : 'status-badge-verified'}">${rest.heritageRestriction ? 'CONSERVATION RULES APPLY' : 'CLEAR'}</span></td>
                        <td>Archaeological & Planning Board</td>
                    </tr>
                    <tr>
                        <td>Road Widening Setback</td>
                        <td>${rest.roadWideningRestriction ? 'ROAD SETBACK APPLICABLE' : 'NONE'}</td>
                        <td><span class="${rest.roadWideningRestriction ? 'status-badge-review' : 'status-badge-verified'}">${rest.roadWideningRestriction ? 'SETBACK REQUIRED' : 'CLEAR'}</span></td>
                        <td>Highways & Urban Planning</td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top:12px; font-size:12px; color:#475569;">
                <strong>Remarks:</strong> ${rest.remarks || "No regulatory land restrictions recorded."}
            </div>
            <div class="source-attribution-footer">
                <span>Source: State Revenue & GIS Planning Authorities</span>
                <span>Last Checked: ${rest.lastChecked || '2026-08-15'}</span>
            </div>
        </div>
    `;
}

function renderDocumentsPane(profile) {
    const docs = Array.isArray(profile.documents) ? profile.documents : [];
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">
                <span>📁 UNIFIED DEPARTMENT DOCUMENT REPOSITORY</span>
                <button type="button" class="btn-govt-print" style="font-size:11px;" onclick="showUploadDocumentModal('${profile.parcel?.id || profile.parcelId}')">+ Upload Evidence</button>
            </div>
            ${docs.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Document ID</th>
                            <th>Document Type</th>
                            <th>Department</th>
                            <th>Title / Reference</th>
                            <th>Issue Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${docs.map(d => `
                            <tr>
                                <td><strong>${d.documentId}</strong></td>
                                <td>${d.documentType}</td>
                                <td>${d.issuingDepartment || 'Department Record'}</td>
                                <td>${d.title || d.documentNumber}</td>
                                <td>${d.issueDate || '2026-01-15'}</td>
                                <td><span class="status-badge-verified">${d.status || 'AVAILABLE'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:14px; color:#64748b;">No documents uploaded for this parcel.</div>'}
        </div>
    `;
}

function renderConflictsPane(profile) {
    const conflicts = Array.isArray(profile.conflicts) ? profile.conflicts : [];
    const hasOwnerMismatch = conflicts.some(c => c.category === 'OWNERSHIP' || (c.title && c.title.toLowerCase().includes('owner')));

    return `
        ${hasOwnerMismatch ? `
            <div style="background:#fee2e2; border:1px solid #fca5a5; border-left:4px solid #dc2626; padding:12px; border-radius:3px; margin-bottom:12px;">
                <div style="color:#991b1b; font-weight:800; font-size:14px; margin-bottom:4px;">🚨 HIGH PRIORITY — OWNER MISMATCH DETECTED</div>
                <div style="font-size:12px; color:#7f1d1d; line-height:1.4;">
                    Discrepancy detected between departmental ownership records (e.g. RoR Owner vs Tax Owner or Deed Owner).
                </div>
            </div>
        ` : ''}

        <div class="govt-card-widget">
            <div class="govt-card-header">⚠ INTER-DEPARTMENTAL DATA CONFLICTS DETECTED</div>
            ${conflicts.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Conflict ID</th>
                            <th>Type / Category</th>
                            <th>Severity</th>
                            <th>Description</th>
                            <th>Affected Data</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${conflicts.map(c => `
                            <tr>
                                <td><strong>${c.id}</strong></td>
                                <td>${c.title || c.category}</td>
                                <td><span class="${c.severity === 'HIGH' ? 'status-badge-conflict' : 'status-badge-review'}">${c.severity}</span></td>
                                <td>${c.description}</td>
                                <td><span style="font-size:11px; color:#475569;">${c.affectedData || '-'}</span></td>
                                <td><span class="status-badge-conflict">${c.status || 'OPEN'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:14px; color:#166534; background:#dcfce7; border-radius:3px;">✓ No inter-departmental data conflicts detected for this land parcel.</div>'}
        </div>
    `;
}

function renderTimelinePane(profile) {
    const timeline = Array.isArray(profile.timeline) ? profile.timeline : [];
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">🕒 LAND GOVERNANCE HISTORICAL TIMELINE</div>
            ${timeline.length > 0 ? `
                <div class="timeline-vertical-list">
                    ${timeline.map(e => `
                        <div class="timeline-item-entry">
                            <div class="timeline-date-tag">${e.date || e.year}</div>
                            <div class="timeline-title-text">${e.title}</div>
                            <div class="timeline-dept-tag">Department: <strong>${e.department}</strong> | Officer: ${e.officer || 'OFF-GOVT-001'}</div>
                            ${e.details ? `<div style="font-size:11px; color:#475569; margin-top:4px;">${e.details}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
            ` : '<div style="padding:12px; color:#64748b;">No timeline entries available.</div>'}
        </div>
    `;
}

function renderAuditPane(profile) {
    const auditLogs = Array.isArray(profile.audit) ? profile.audit : [];
    return `
        <div class="govt-card-widget">
            <div class="govt-card-header">🕒 AUDIT TRAIL LOGS</div>
            ${auditLogs.length > 0 ? `
                <table class="govt-table-compact">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Officer / Actor</th>
                            <th>Department / Role</th>
                            <th>Action</th>
                            <th>Result</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${auditLogs.map(a => `
                            <tr>
                                <td>${a.timestamp ? a.timestamp.substring(0, 19).replace('T', ' ') : '-'}</td>
                                <td><strong>${a.actor || a.officerId || 'system'}</strong></td>
                                <td>${a.details?.role || a.department || 'OFFICER'}</td>
                                <td><code>${a.action}</code></td>
                                <td><span class="status-badge-verified">${a.result || 'SUCCESS'}</span></td>
                                <td>${typeof a.details === 'object' ? JSON.stringify(a.details) : (a.details || '-')}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            ` : '<div style="padding:12px; color:#64748b;">No audit trail events logged for this parcel yet.</div>'}
        </div>
    `;
}

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


