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

        const response =
            await fetch(
                `http://localhost:5000/api/land-profile/${parcelId}`
            );


        if (!response.ok) {

            throw new Error(
                `API returned HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Land profile not found"
            );

        }


        const landProfile =
            result.data;


        /* Store globally */

        window.selectedLandProfile =
            landProfile;


        console.log(
            "Complete land profile:",
            landProfile
        );


        /* Check for stale request before rendering */
        if (window.activeLandProfileParcelId !== parcelId) {
            console.log("Ignored stale land profile response for parcel:", parcelId);
            return;
        }

        renderLandProfile(
            landProfile
        );

        /* Fetch governance validation asynchronously */
        fetchGovernanceStatus(parcelId);

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
                </div>
            </form>

            <div class="proposal-disclaimer">
                Results are based on available land-governance records and are intended for administrative review.
            </div>

            <div id="proposal-result-container" class="proposal-result-wrapper"></div>
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
            resultContainer.innerHTML = renderProposalResultHTML(result.data);
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

function renderProposalResultHTML(data) {
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

    return `
        <div class="proposal-result-section">
            <div class="proposal-subsection-title main-result-title">
                🔍 Proposal Validation Result
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

// Expose globally for inline event handlers
window.handleValidateProposal = handleValidateProposal;
window.clearProposalForm = clearProposalForm;