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


        renderLandProfile(
            landProfile
        );

    }

    catch (error) {

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