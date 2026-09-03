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

async function openCompleteLandProfile(parcelId) {

    console.log(
        "Opening complete land profile:",
        parcelId
    );

    /* Track active parcel for stale-request protection */
    window.activeLandProfileParcelId = parcelId;
    if (typeof closeAuditModal === "function") {
        closeAuditModal();
    }

    createLandProfilePanel();



    const panel =
        document.getElementById(
            "land-profile-panel"
        );


    const content =
        document.getElementById(
            "land-profile-content"
        );


    const parcelTitle =
        document.getElementById(
            "land-profile-parcel-id"
        );


    parcelTitle.textContent =
        parcelId;


    panel.classList.add("active");


    /* Loading */

    content.innerHTML = `

        <div class="land-profile-loading">

            <div class="loading-spinner"></div>

            <p>
                Loading complete land information...
            </p>

        </div>

    `;


    try {
        const token = window.AuthManager ? window.AuthManager.getToken() : "";
        const response = await fetch(`http://localhost:5000/api/land-profile/${parcelId}`, {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        });

        if (!response.ok) {
            let errMsg = "Unable to load land profile. Please try again.";
            if (response.status === 401) {
                errMsg = "Your session has expired. Please login again.";
            } else if (response.status === 403) {
                errMsg = "You are not authorized to view this parcel.";
            } else if (response.status === 404) {
                errMsg = "Land profile not found.";
            }
            throw new Error(errMsg);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "Land profile not found");
        }

        const landProfile = result.data || result;
        window.selectedLandProfile = landProfile;

        console.log("Complete land profile received:", landProfile);

        /* Check for stale request before rendering */
        if (window.activeLandProfileParcelId !== parcelId) {
            console.log("Ignored stale land profile response for parcel:", parcelId);
            return;
        }

        renderLandProfile(landProfile);

        /* Asynchronous background updates if functions exist */
        if (typeof window.fetchGovernanceStatus === "function") {
            window.fetchGovernanceStatus(parcelId);
        }
        if (typeof window.fetchParcelDocuments === "function") {
            window.fetchParcelDocuments(parcelId);
        }
    }

    catch (error) {

        if (window.activeLandProfileParcelId !== parcelId) return;

        console.error(
            "Land profile error:",
            error
        );


        content.innerHTML = `

            <div class="land-profile-error">

                <h3>
                    Unable to load land information
                </h3>

                <p>
                    ${error.message}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   2. CREATE PANEL
   ========================================================= */

function createLandProfilePanel() {

    if (
        document.getElementById(
            "land-profile-panel"
        )
    ) {

        return;

    }


    const panel =
        document.createElement("div");


    panel.id =
        "land-profile-panel";


    panel.innerHTML = `

        <div class="land-profile-header">

            <div>

                <div class="land-profile-title">

                    Complete Land Profile

                </div>

                <div
                    id="land-profile-parcel-id"
                    class="land-profile-subtitle"
                >
                    Select a parcel
                </div>

            </div>


            <button
                class="land-profile-close"
                onclick="closeLandProfile()"
            >

                ×

            </button>

        </div>


        <div
            id="land-profile-content"
            class="land-profile-content"
        >

            <div class="land-profile-empty">

                Click a parcel to view
                complete land information.

            </div>

        </div>

    `;


    document.body.appendChild(
        panel
    );

}


/* =========================================================
   3. RENDER COMPLETE PROFILE
   ========================================================= */

function renderLandProfile(
    profile
) {

    const content =
        document.getElementById(
            "land-profile-content"
        );


    const parcel =
        profile.parcel || {};


    const cadastral =
        profile.cadastral || {};


    const ror =
        profile.ror || {};


    const landUse =
        profile.landUse || {};


    const registration =
        profile.registration || {};


    const propertyTax =
        profile.propertyTax || {};


    const building =
        profile.buildingPermission || {};


    const restrictions =
        profile.restrictions || {};


    const utilities =
        profile.utilities || {};


    content.innerHTML = `

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
                <label class="upload-form-label">Parcel ID</label>
                <input type="text" id="upload-parcel-id" class="upload-form-input" value="${targetParcelId}" readonly>
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

