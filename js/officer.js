/* =========================================================
   LANDGOV GIS
   INTEGRATED OFFICER WORKSPACE ENGINE (CADASTRAL, RoR & REGISTRATION)
   ========================================================= */

let currentOfficer = null;
let currentDeptData = null;
let activeWorkspaceParcel = null;
let activeRoRParcel = null;
let activeRegParcel = null;
let activeMutation = null;
let workspaceMap = null;
let workspacePolygonLayer = null;

document.addEventListener("DOMContentLoaded", async function () {
    currentOfficer = window.AuthManager.enforcePageAccess("officer");
    if (!currentOfficer) return;

    setupOfficerSidebar();
    setupOfficerHeader();
    await loadOfficerDashboard();
});

/* --- 1. SIDEBAR GENERATION ACCORDING TO OFFICER ROLE --- */
function setupOfficerSidebar() {
    const navContainer = document.getElementById("sidebar-nav-container");
    if (!navContainer) return;

    const officerType = currentOfficer.officerType || "cadastral_officer";

    if (officerType === "cadastral_officer" || currentOfficer.role === "admin") {
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>🏛</span> Dashboard Overview</a></li>
            </ul>
            <div class="nav-section-title">MY WORK</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-assigned-parcels" onclick="switchOfficerTab('assigned-parcels')"><span>📋</span> Assigned Parcels</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-verification" onclick="switchOfficerTab('pending-verification')"><span>⏳</span> Pending Verification</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-conflicts" onclick="switchOfficerTab('conflicts')"><span>⚠</span> Boundary Conflicts</a></li>
            </ul>
            <div class="nav-section-title">CADASTRAL</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-survey-records" onclick="switchOfficerTab('survey-records')"><span>📐</span> Survey Records</a></li>
                <li class="nav-item"><a class="nav-link" href="index.html#map-section"><span>🗺</span> Cadastral Map (GIS)</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-boundary-verification" onclick="switchOfficerTab('boundary-verification')"><span>📍</span> Boundary Verification</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-survey-history" onclick="switchOfficerTab('survey-history')"><span>📜</span> Survey History</a></li>
            </ul>
            <div class="nav-section-title">WORKFLOW</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-cases" onclick="switchOfficerTab('cases')"><span>📁</span> Cases</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-department-requests" onclick="switchOfficerTab('department-requests')"><span>📤</span> Department Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-notifications" onclick="switchOfficerTab('notifications')"><span>🔔</span> Notifications</a></li>
            </ul>
            <div class="nav-section-title">RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-documents" onclick="switchOfficerTab('documents')"><span>📄</span> Documents</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-audit-trail" onclick="switchOfficerTab('audit-trail')"><span>🕒</span> Audit Trail</a></li>
            </ul>
        `;
    } else if (officerType === "land_records_officer") {
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>🏛</span> Dashboard Overview</a></li>
            </ul>
            <div class="nav-section-title">MY WORK</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-assigned-parcels" onclick="switchOfficerTab('assigned-parcels')"><span>📋</span> Assigned Parcels</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-mutations" onclick="switchOfficerTab('pending-mutations')"><span>⏳</span> Pending Mutations</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-ownership-disputes" onclick="switchOfficerTab('ownership-disputes')"><span>⚠</span> Ownership Disputes</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-verification" onclick="switchOfficerTab('pending-verification')"><span>🔍</span> Pending Verification</a></li>
            </ul>
            <div class="nav-section-title">LAND RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-ror-records" onclick="switchOfficerTab('ror-records')"><span>📜</span> Record of Rights</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-ownership-records" onclick="switchOfficerTab('ownership-records')"><span>👤</span> Ownership Records</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-mutation-requests" onclick="switchOfficerTab('mutation-requests')"><span>🔄</span> Mutation Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-mutation-history" onclick="switchOfficerTab('mutation-history')"><span>📚</span> Mutation History</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-record-corrections" onclick="switchOfficerTab('record-corrections')"><span>✏</span> Record Corrections</a></li>
            </ul>
            <div class="nav-section-title">VERIFICATION</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-ownership-verification" onclick="switchOfficerTab('ownership-verification')"><span>✓</span> Ownership Verification</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-document-verification" onclick="switchOfficerTab('document-verification')"><span>📄</span> Document Verification</a></li>
            </ul>
            <div class="nav-section-title">WORKFLOW</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-cases" onclick="switchOfficerTab('cases')"><span>📁</span> Cases</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-department-requests" onclick="switchOfficerTab('department-requests')"><span>📤</span> Department Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-notifications" onclick="switchOfficerTab('notifications')"><span>🔔</span> Notifications</a></li>
            </ul>
            <div class="nav-section-title">RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-documents" onclick="switchOfficerTab('documents')"><span>📄</span> Documents</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-audit-trail" onclick="switchOfficerTab('audit-trail')"><span>🕒</span> Audit Trail</a></li>
            </ul>
        `;
    } else if (officerType === "registration_officer") {
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>🏛</span> Dashboard</a></li>
            </ul>
            <div class="nav-section-title">MY WORK</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-assigned-parcels" onclick="switchOfficerTab('assigned-parcels')"><span>📋</span> Assigned Parcels</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-registrations" onclick="switchOfficerTab('pending-registrations')"><span>⏳</span> Pending Registrations</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-transfer-requests" onclick="switchOfficerTab('transfer-requests')"><span>🔄</span> Transfer Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-registration-issues" onclick="switchOfficerTab('registration-issues')"><span>⚠</span> Registration Issues</a></li>
            </ul>
            <div class="nav-section-title">REGISTRATION</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-registration-records" onclick="switchOfficerTab('registration-records')"><span>📝</span> Registration Records</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-deed-verification" onclick="switchOfficerTab('deed-verification')"><span>📄</span> Deed Verification</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-stamp-duty" onclick="switchOfficerTab('stamp-duty')"><span>💰</span> Stamp Duty</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-encumbrance-check" onclick="switchOfficerTab('encumbrance-check')"><span>🔍</span> Encumbrance Check</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-registration-history" onclick="switchOfficerTab('registration-history')"><span>📚</span> Registration History</a></li>
            </ul>
            <div class="nav-section-title">VERIFICATION</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-ownership-check" onclick="switchOfficerTab('ownership-check')"><span>👤</span> Ownership Check</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-cadastral-check" onclick="switchOfficerTab('cadastral-check')"><span>📐</span> Cadastral Check</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-tax-clearance" onclick="switchOfficerTab('tax-clearance')"><span>🧾</span> Tax Clearance</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-restrictions" onclick="switchOfficerTab('restrictions')"><span>🚧</span> Restrictions</a></li>
            </ul>
            <div class="nav-section-title">WORKFLOW</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-cases" onclick="switchOfficerTab('cases')"><span>📁</span> Cases</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-department-requests" onclick="switchOfficerTab('department-requests')"><span>📤</span> Department Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-notifications" onclick="switchOfficerTab('notifications')"><span>🔔</span> Notifications</a></li>
            </ul>
            <div class="nav-section-title">RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-documents" onclick="switchOfficerTab('documents')"><span>📄</span> Documents</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-audit-trail" onclick="switchOfficerTab('audit-trail')"><span>🕒</span> Audit Trail</a></li>
            </ul>
        `;
    } else if (officerType === "land_use_officer") {
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>🏛</span> Dashboard</a></li>
            </ul>
            <div class="nav-section-title">MY WORK</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-assigned-parcels" onclick="switchOfficerTab('assigned-parcels')"><span>📋</span> Assigned Parcels</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-conversion-requests" onclick="switchOfficerTab('conversion-requests')"><span>⏳</span> Conversion Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-planning-conflicts" onclick="switchOfficerTab('planning-conflicts')"><span>⚠</span> Planning Conflicts</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-verification" onclick="switchOfficerTab('pending-verification')"><span>🔍</span> Pending Verification</a></li>
            </ul>
            <div class="nav-section-title">LAND USE</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-land-use-records" onclick="switchOfficerTab('land-use-records')"><span>🗺</span> Land Use Records</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-master-plan" onclick="switchOfficerTab('master-plan')"><span>🏙</span> Master Plan</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-conversion-requests-all" onclick="switchOfficerTab('conversion-requests-all')"><span>🔄</span> Conversion Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-zoning" onclick="switchOfficerTab('zoning')"><span>🚧</span> Zoning</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-restrictions" onclick="switchOfficerTab('restrictions')"><span>⚠</span> Restrictions</a></li>
            </ul>
            <div class="nav-section-title">PLANNING</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-building-permissions" onclick="switchOfficerTab('building-permissions')"><span>🏗</span> Building Permissions</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-road-access" onclick="switchOfficerTab('road-access')"><span>🛣</span> Road Access</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-environmental-checks" onclick="switchOfficerTab('environmental-checks')"><span>🌱</span> Environmental Checks</a></li>
            </ul>
            <div class="nav-section-title">WORKFLOW</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-cases" onclick="switchOfficerTab('cases')"><span>📁</span> Cases</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-department-requests" onclick="switchOfficerTab('department-requests')"><span>📤</span> Department Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-notifications" onclick="switchOfficerTab('notifications')"><span>🔔</span> Notifications</a></li>
            </ul>
            <div class="nav-section-title">RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-documents" onclick="switchOfficerTab('documents')"><span>📄</span> Documents</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-audit-trail" onclick="switchOfficerTab('audit-trail')"><span>🕒</span> Audit Trail</a></li>
            </ul>
        `;
    } else if (officerType === "property_tax_officer") {
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>🏛</span> Dashboard</a></li>
            </ul>
            <div class="nav-section-title">MY WORK</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-assigned-parcels" onclick="switchOfficerTab('assigned-parcels')"><span>📋</span> Assigned Parcels</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-pending-tax" onclick="switchOfficerTab('pending-tax')"><span>⏳</span> Pending Tax Verification</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-outstanding-tax" onclick="switchOfficerTab('outstanding-tax')"><span>⚠</span> Outstanding Tax</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-tax-clearance" onclick="switchOfficerTab('tax-clearance')"><span>🧾</span> Tax Clearance Requests</a></li>
            </ul>
            <div class="nav-section-title">PROPERTY TAX</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-tax-records" onclick="switchOfficerTab('tax-records')"><span>📜</span> Tax Records</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-assessments" onclick="switchOfficerTab('assessments')"><span>📊</span> Property Assessments</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-tax-payments" onclick="switchOfficerTab('tax-payments')"><span>💰</span> Tax Payments</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-tax-history" onclick="switchOfficerTab('tax-history')"><span>📚</span> Tax History</a></li>
            </ul>
            <div class="nav-section-title">MUNICIPAL</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-municipal-details" onclick="switchOfficerTab('municipal-details')"><span>🏢</span> Property Details</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-building-permissions" onclick="switchOfficerTab('building-permissions')"><span>🏗</span> Building Permissions</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-utilities" onclick="switchOfficerTab('utilities')"><span>🚰</span> Utilities</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-municipal-records" onclick="switchOfficerTab('municipal-records')"><span>📁</span> Municipal Records</a></li>
            </ul>
            <div class="nav-section-title">VERIFICATION</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-ownership-check" onclick="switchOfficerTab('ownership-check')"><span>👤</span> Ownership Check</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-registration-check" onclick="switchOfficerTab('registration-check')"><span>📝</span> Registration Check</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-land-use-check" onclick="switchOfficerTab('land-use-check')"><span>🗺</span> Land Use Check</a></li>
            </ul>
            <div class="nav-section-title">WORKFLOW</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-cases" onclick="switchOfficerTab('cases')"><span>📁</span> Cases</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-department-requests" onclick="switchOfficerTab('department-requests')"><span>📤</span> Department Requests</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-notifications" onclick="switchOfficerTab('notifications')"><span>🔔</span> Notifications</a></li>
            </ul>
            <div class="nav-section-title">RECORDS</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link" id="nav-documents" onclick="switchOfficerTab('documents')"><span>📄</span> Documents</a></li>
                <li class="nav-item"><a class="nav-link" id="nav-audit-trail" onclick="switchOfficerTab('audit-trail')"><span>🕒</span> Audit Trail</a></li>
            </ul>
        `;
    } else {
        const info = window.OFFICER_TYPES_INFO[officerType] || { title: "Department Officer" };
        navContainer.innerHTML = `
            <div class="nav-section-title">DASHBOARD</div>
            <ul class="nav-menu">
                <li class="nav-item"><a class="nav-link active" id="nav-overview" onclick="switchOfficerTab('overview')"><span>📊</span> ${info.title} Dashboard</a></li>
                <li class="nav-item"><a class="nav-link" href="index.html#map-section"><span>🗺</span> GIS Land Map</a></li>
            </ul>
        `;
    }
}

/* --- 2. HEADER SETUP --- */
function setupOfficerHeader() {
    const officerType = currentOfficer.officerType || "cadastral_officer";

    if (officerType === "property_tax_officer") {
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-TAX-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Meena Municipal";
        document.getElementById("officer-dept").textContent = currentOfficer.department || "Property Tax & Municipal Department";
        document.getElementById("dept-title").textContent = "Property Tax & Municipal Department";
        document.getElementById("dept-subtitle").textContent = "Property Tax Assessment, Municipal Records & Clearance Administration";
        const badge = document.getElementById("dept-badge");
        badge.textContent = "Property Tax & Municipal";
        badge.className = "dept-badge badge-tax";
    } else if (officerType === "land_use_officer") {
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-LU-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Ravi Planner";
        document.getElementById("officer-dept").textContent = currentOfficer.department || "Land Use & Planning Department";
        document.getElementById("dept-title").textContent = "Land Use & Planning Department";
        document.getElementById("dept-subtitle").textContent = "Land Use, Zoning & Development Administration";
        const badge = document.getElementById("dept-badge");
        badge.textContent = "Land Use & Planning";
        badge.className = "dept-badge badge-landuse";
    } else if (officerType === "registration_officer") {
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-REG-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Priya Registrar";
        document.getElementById("officer-dept").textContent = currentOfficer.department || "Registration Department";
        document.getElementById("dept-title").textContent = "Registration Department";
        document.getElementById("dept-subtitle").textContent = "Property Registration & Transfer Administration";
        const badge = document.getElementById("dept-badge");
        badge.textContent = "Registration Dept";
        badge.className = "dept-badge badge-registration";
    } else if (officerType === "land_records_officer") {
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-ROR-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Kumar LandRecords";
        document.getElementById("officer-dept").textContent = currentOfficer.department || "Land Records Department";
        document.getElementById("dept-title").textContent = "Land Records / RoR Department";
        document.getElementById("dept-subtitle").textContent = "Record of Rights & Ownership Administration";
        const badge = document.getElementById("dept-badge");
        badge.textContent = "Land Records / RoR";
        badge.className = "dept-badge badge-ror";
    } else if (officerType === "cadastral_officer" || currentOfficer.role === "admin") {
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-CAD-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Arun Survey";
        document.getElementById("officer-dept").textContent = currentOfficer.department || "Cadastral & Survey Department";
        document.getElementById("dept-title").textContent = "Cadastral & Survey Department";
        document.getElementById("dept-subtitle").textContent = "Land Boundary and Survey Administration";
        const badge = document.getElementById("dept-badge");
        badge.textContent = "Cadastral & Survey";
        badge.className = "dept-badge badge-cadastral";
    } else {
        const info = window.OFFICER_TYPES_INFO[officerType] || { title: "Department Officer", department: "Department", badgeClass: "badge-cadastral" };
        document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || info.defaultOfficerId || "OFF-001";
        document.getElementById("officer-name").textContent = currentOfficer.name || "Officer";
        document.getElementById("officer-dept").textContent = currentOfficer.department || info.department;
        document.getElementById("dept-title").textContent = `${info.title} Portal`;
        document.getElementById("dept-subtitle").textContent = `${info.department} Action Queue`;
        const badge = document.getElementById("dept-badge");
        badge.textContent = info.department;
        badge.className = `dept-badge ${info.badgeClass}`;
    }
}

/* --- 3. DASHBOARD DATA LOADING --- */
async function loadOfficerDashboard() {
    try {
        const res = await window.getOfficerDepartmentOverview(currentOfficer.officerType);
        if (res.success) {
            currentDeptData = res;
            renderMetrics(res.stats);

            if (currentOfficer.officerType === "cadastral_officer" || currentOfficer.role === "admin") {
                renderWorkQueue(res.workQueue || []);
                renderAssignedParcels(res.assignedParcels || []);
                renderDepartmentRequests(res.requests || []);
                renderCases(res.cases || []);
            } else if (currentOfficer.officerType === "land_records_officer") {
                renderRoRWorkQueue(res.workQueue || []);
                renderRoRAssignedParcels(res.assignedParcels || []);
                renderDepartmentRequests(res.requests || []);
                renderCases(res.cases || []);
            } else if (currentOfficer.officerType === "registration_officer") {
                renderRegistrationWorkQueue(res.workQueue || []);
                renderRegistrationAssignedParcels(res.assignedParcels || []);
                renderDepartmentRequests(res.requests || []);
                renderCases(res.cases || []);
            } else if (currentOfficer.officerType === "land_use_officer") {
                renderLandUseWorkQueue(res.workQueue || []);
                renderLandUseAssignedParcels(res.assignedParcels || []);
                renderDepartmentRequests(res.requests || []);
                renderCases(res.cases || []);
            } else if (currentOfficer.officerType === "property_tax_officer") {
                renderPropertyTaxWorkQueue(res.workQueue || []);
                renderPropertyTaxAssignedParcels(res.assignedParcels || []);
                renderDepartmentRequests(res.requests || []);
                renderCases(res.cases || []);
            } else {
                renderLegacyDepartmentTable(currentOfficer.officerType, res);
            }
        }
    } catch (e) {
        console.error("Error loading officer dashboard:", e);
        alert(e.message || "Failed to load officer data.");
    }
}

/* --- 4. RENDER METRICS --- */
function renderMetrics(stats = {}) {
    const container = document.getElementById("metrics-container");
    container.innerHTML = "";

    const keyLabels = {
        assignedParcels: "Assigned Parcels",
        pendingBoundaryVerification: "Pending Verification",
        verifiedBoundaries: "Verified Boundaries",
        boundaryConflicts: "Boundary Conflicts",
        pendingSurveyRequests: "Survey Requests",
        pendingOwnershipVerification: "Ownership Verification",
        pendingMutations: "Pending Mutations",
        ownershipDisputes: "Ownership Disputes",
        approvedMutations: "Approved Mutations",
        rejectedMutations: "Rejected Mutations",
        pendingRegistrations: "Pending Registrations",
        transferRequests: "Transfer Requests",
        deedsAwaitingVerification: "Deeds Awaiting Verification",
        encumbranceChecks: "Encumbrance Checks",
        approvedTransfers: "Approved Transfers",
        rejectedTransfers: "Rejected Transfers",
        pendingConversions: "Conversion Requests",
        pendingReviews: "Planning Reviews",
        zoningConflicts: "Zoning Conflicts",
        restrictionAlerts: "Restriction Alerts",
        buildingReviews: "Building Reviews",
        approvedConversions: "Approved Conversions",
        rejectedConversions: "Rejected Conversions",
        pendingTaxVerification: "Pending Tax Verification",
        outstandingTaxCases: "Outstanding Tax Cases",
        taxClearanceRequests: "Tax Clearance Requests",
        pendingAssessments: "Pending Assessments",
        clearedParcels: "Cleared Parcels",
        overdueTaxCases: "Overdue Tax Cases"
    };

    Object.entries(stats).forEach(([key, value]) => {
        const label = keyLabels[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
            <div class="metric-card-label">${label}</div>
            <div class="metric-card-val">${typeof value === 'object' ? JSON.stringify(value) : value}</div>
        `;
        container.appendChild(card);
    });
}

/* --- 5. RENDER CADASTRAL WORK QUEUE & ASSIGNED PARCELS --- */
function renderWorkQueue(workQueue = []) {
    const container = document.getElementById("work-queue-table-container");
    const headerTitle = document.getElementById("work-queue-card-title");
    const casesTitle = document.getElementById("cases-card-title");

    if (headerTitle) headerTitle.textContent = "📋 PENDING CADASTRAL WORK";
    if (casesTitle) casesTitle.textContent = "📁 ACTIVE CADASTRAL CASES";
    const countBadge = document.getElementById("work-queue-count");
    if (countBadge) countBadge.textContent = `${workQueue.length} items`;

    if (!container) return;

    if (!workQueue || workQueue.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No pending cadastral work items.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey No</th>
                    <th>Village</th>
                    <th>Area</th>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${workQueue.map(item => `
                    <tr>
                        <td><strong>${item.parcelId}</strong></td>
                        <td>${item.surveyNo || 'N/A'}</td>
                        <td>${item.village || 'Demo Village'}</td>
                        <td>${item.area || 'N/A'}</td>
                        <td>${item.task}</td>
                        <td><span class="priority-${(item.priority || 'medium').toLowerCase()}">${item.priority || 'MEDIUM'}</span></td>
                        <td><span class="status-tag ${(item.status || '').toLowerCase().includes('verified') ? 'status-verified' : 'status-pending'}">${item.status}</span></td>
                        <td><button class="btn-govt-primary" onclick="openParcelWorkspace('${item.parcelId}')">Review</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderAssignedParcels(parcels = []) {
    const container = document.getElementById("assigned-parcels-table-container");
    document.getElementById("assigned-parcels-count").textContent = `${parcels.length} parcels`;

    if (!parcels || parcels.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No assigned parcels found.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey Number</th>
                    <th>Owner</th>
                    <th>Area</th>
                    <th>District</th>
                    <th>Village</th>
                    <th>Land Type</th>
                    <th>Boundary Status</th>
                    <th>Last Survey</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td><strong>${p.parcelId}</strong></td>
                        <td>${p.surveyNumber}</td>
                        <td>${p.owner || 'N/A'}</td>
                        <td>${p.area}</td>
                        <td>${p.district || 'Coimbatore'}</td>
                        <td>${p.village}</td>
                        <td>${p.landType || 'Agricultural'}</td>
                        <td><span class="status-tag ${(p.boundaryStatus || '').toLowerCase().includes('verified') ? 'status-verified' : 'status-pending'}">${p.boundaryStatus || 'Pending'}</span></td>
                        <td>${p.surveyDate || '2026 Survey'}</td>
                        <td><button class="btn-govt-secondary" onclick="openParcelWorkspace('${p.parcelId}')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- 6. RENDER RoR WORK QUEUE & ASSIGNED PARCELS --- */
function renderRoRWorkQueue(workQueue = []) {
    const container = document.getElementById("work-queue-table-container");
    const headerTitle = document.getElementById("work-queue-card-title");
    const casesTitle = document.getElementById("cases-card-title");

    if (headerTitle) headerTitle.textContent = "📋 PENDING LAND RECORD WORK";
    if (casesTitle) casesTitle.textContent = "📁 ACTIVE RoR CASES";
    const countBadge = document.getElementById("work-queue-count");
    if (countBadge) countBadge.textContent = `${workQueue.length} items`;

    if (!container) return;

    if (!workQueue || workQueue.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No pending land record or mutation work.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel</th>
                    <th>Survey No</th>
                    <th>Current Owner</th>
                    <th>Task</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${workQueue.map(item => `
                    <tr>
                        <td><strong>${item.parcelId}</strong></td>
                        <td>${item.surveyNo || 'SUR-101'}</td>
                        <td>${item.owner || 'N/A'}</td>
                        <td>${item.task}</td>
                        <td><span class="priority-${(item.priority || 'medium').toLowerCase()}">${item.priority}</span></td>
                        <td><span class="status-tag ${(item.status || '').toLowerCase().includes('verified') ? 'status-verified' : 'status-pending'}">${item.status}</span></td>
                        <td><button class="btn-govt-primary" onclick="openRoRParcelWorkspace('${item.parcelId}')">Review</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderRoRAssignedParcels(parcels = []) {
    const container = document.getElementById("assigned-parcels-table-container");
    document.getElementById("assigned-parcels-count").textContent = `${parcels.length} parcels`;

    if (!parcels || parcels.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No assigned parcels found for this RoR officer.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey Number</th>
                    <th>Owner</th>
                    <th>Area</th>
                    <th>District</th>
                    <th>Village</th>
                    <th>RoR Number</th>
                    <th>Ownership Type</th>
                    <th>RoR Status</th>
                    <th>Mutation Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td><strong>${p.parcelId}</strong></td>
                        <td>${p.surveyNumber}</td>
                        <td>${p.rightsHolder || p.ownerName || 'N/A'}</td>
                        <td>${p.area}</td>
                        <td>${p.district || 'Coimbatore'}</td>
                        <td>${p.village}</td>
                        <td>${p.recordNumber || 'ROR-2026-001'}</td>
                        <td>${p.ownershipType || 'Individual'}</td>
                        <td><span class="status-tag ${(p.rorStatus || '').toLowerCase() === 'verified' ? 'status-verified' : 'status-pending'}">${p.rorStatus || 'Pending'}</span></td>
                        <td><span class="status-tag status-review">${p.mutationStatus || 'None'}</span></td>
                        <td><button class="btn-govt-secondary" onclick="openRoRParcelWorkspace('${p.parcelId}')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- 7. RENDER REGISTRATION WORK QUEUE & ASSIGNED PARCELS --- */
function renderRegistrationWorkQueue(workQueue = []) {
    const container = document.getElementById("work-queue-table-container");
    const headerTitle = document.getElementById("work-queue-card-title");
    const casesTitle = document.getElementById("cases-card-title");

    if (headerTitle) headerTitle.textContent = "📋 PENDING REGISTRATION WORK";
    if (casesTitle) casesTitle.textContent = "📁 ACTIVE REGISTRATION CASES";
    const countBadge = document.getElementById("work-queue-count");
    if (countBadge) countBadge.textContent = `${workQueue.length} items`;

    if (!container) return;

    if (!workQueue || workQueue.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No pending property transfer or registration cases.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Registration ID</th>
                    <th>Parcel</th>
                    <th>Survey No</th>
                    <th>Current Owner</th>
                    <th>Proposed Owner</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${workQueue.map(item => `
                    <tr>
                        <td><strong>${item.registrationId}</strong></td>
                        <td>${item.parcelId}</td>
                        <td>${item.surveyNo || 'SUR-101'}</td>
                        <td>${item.currentOwner}</td>
                        <td>${item.proposedOwner}</td>
                        <td>${item.type}</td>
                        <td><span class="priority-${(item.priority || 'medium').toLowerCase()}">${item.priority}</span></td>
                        <td><span class="status-tag ${(item.status || '').toLowerCase() === 'approved' ? 'status-verified' : 'status-pending'}">${item.status}</span></td>
                        <td><button class="btn-govt-primary" onclick="openRegistrationCaseWorkspace('${item.parcelId}')">Review</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderRegistrationAssignedParcels(parcels = []) {
    const container = document.getElementById("assigned-parcels-table-container");
    document.getElementById("assigned-parcels-count").textContent = `${parcels.length} parcels`;

    if (!parcels || parcels.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8; text-align: center;">No assigned parcels found for this Registration officer.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey Number</th>
                    <th>Current Owner</th>
                    <th>Proposed Owner</th>
                    <th>Registration ID</th>
                    <th>Area</th>
                    <th>District</th>
                    <th>RoR Status</th>
                    <th>Registration Status</th>
                    <th>Tax Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td><strong>${p.parcelId}</strong></td>
                        <td>${p.surveyNumber}</td>
                        <td>${p.currentOwner}</td>
                        <td>${p.proposedOwner}</td>
                        <td>${p.registrationId}</td>
                        <td>${p.area}</td>
                        <td>${p.district}</td>
                        <td><span class="status-tag status-verified">${p.rorStatus}</span></td>
                        <td><span class="status-tag ${(p.registrationStatus || '').toLowerCase() === 'approved' ? 'status-verified' : 'status-pending'}">${p.registrationStatus}</span></td>
                        <td><span class="status-tag ${(p.taxStatus || '').toLowerCase() === 'cleared' ? 'status-verified' : 'status-pending'}">${p.taxStatus}</span></td>
                        <td><button class="btn-govt-secondary" onclick="openRegistrationCaseWorkspace('${p.parcelId}')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- INTER-DEPARTMENTAL PARCEL VERIFICATION REQUEST SUITE (PHASE 11F) --- */

const DEPARTMENT_WORK_OPTIONS = {
    "Cadastral & Survey Department": [
        { value: "VERIFY_BOUNDARY", label: "Verify Boundary" },
        { value: "VERIFY_SURVEY_NUMBER", label: "Verify Survey Number" },
        { value: "VERIFY_PARCEL_AREA", label: "Verify Parcel Area" },
        { value: "VERIFY_GIS_RECORD", label: "Verify GIS Record" }
    ],
    "Land Records Department": [
        { value: "VERIFY_CURRENT_OWNER", label: "Verify Current Owner" },
        { value: "VERIFY_ROR", label: "Verify Record of Rights (RoR)" },
        { value: "VERIFY_MUTATION", label: "Verify Mutation Record" },
        { value: "PROVIDE_OWNERSHIP_HISTORY", label: "Provide Ownership History" }
    ],
    "Registration Department": [
        { value: "VERIFY_REGISTRATION", label: "Verify Registration" },
        { value: "PROVIDE_LATEST_TRANSACTION", label: "Provide Latest Transaction" },
        { value: "VERIFY_SALE_TRANSFER", label: "Verify Sale/Transfer" },
        { value: "PROVIDE_REGISTRATION_HISTORY", label: "Provide Registration History" }
    ],
    "Land Use & Planning Department": [
        { value: "VERIFY_CURRENT_LAND_USE", label: "Verify Current Land Use" },
        { value: "VERIFY_ZONING", label: "Verify Zoning" },
        { value: "VERIFY_MASTER_PLAN", label: "Verify Master Plan Alignment" },
        { value: "VERIFY_CONVERSION_STATUS", label: "Verify Conversion Status" },
        { value: "VERIFY_RESTRICTIONS", label: "Verify Restrictions" }
    ],
    "Property Tax & Municipal Department": [
        { value: "VERIFY_TAX_ASSESSMENT", label: "Verify Tax Assessment" },
        { value: "VERIFY_TAX_PAYMENT", label: "Verify Tax Payment" },
        { value: "PROPERTY_TAX_CLEARANCE", label: "Provide Property Tax Clearance" },
        { value: "VERIFY_OUTSTANDING_DUES", label: "Verify Outstanding Dues" },
        { value: "VERIFY_MUNICIPAL_PROPERTY", label: "Verify Municipal Property" }
    ]
};

function normalizeDept(dept) {
    if (!dept) return "";
    const lower = String(dept).toLowerCase().trim();
    if (lower.includes("cadastral") || lower.includes("survey")) return "Cadastral & Survey Department";
    if (lower.includes("record") || lower.includes("ror")) return "Land Records Department";
    if (lower.includes("registration")) return "Registration Department";
    if (lower.includes("use") || lower.includes("planning") || lower.includes("zoning")) return "Land Use & Planning Department";
    if (lower.includes("tax") || lower.includes("municipal")) return "Property Tax & Municipal Department";
    return dept;
}

function handleTargetDeptChange(targetDept) {
    const workSelect = document.getElementById("deptreq-work");
    if (!workSelect) return;

    workSelect.innerHTML = `<option value="">Select Required Work...</option>`;
    const normalizedTarget = normalizeDept(targetDept);
    const options = DEPARTMENT_WORK_OPTIONS[normalizedTarget] || [];

    options.forEach(opt => {
        const el = document.createElement("option");
        el.value = opt.value;
        el.textContent = opt.label;
        workSelect.appendChild(el);
    });
}

function openCreateDepartmentRequestModal(parcelId, defaultToDept = "", defaultWork = "") {
    const pId = parcelId || (activeWorkspaceParcel ? activeWorkspaceParcel.parcelId : "LND-001");
    document.getElementById("deptreq-parcel-id").value = pId;
    document.getElementById("deptreq-survey-no").value = activeWorkspaceParcel ? (activeWorkspaceParcel.surveyNumber || "SUR-101") : "SUR-101";
    document.getElementById("deptreq-from-officer").value = `${currentOfficer.name || 'Officer'} (${currentOfficer.officerId || 'OFF-001'})`;
    document.getElementById("deptreq-from-dept").value = currentOfficer.department || "Officer Department";

    const toDeptSelect = document.getElementById("deptreq-to-dept");
    const currentDeptNorm = normalizeDept(currentOfficer.department);

    Array.from(toDeptSelect.options).forEach(opt => {
        if (opt.value && normalizeDept(opt.value) === currentDeptNorm && currentOfficer.role !== "admin") {
            opt.disabled = true;
            opt.textContent = `${opt.textContent} (Your Department)`;
        } else {
            opt.disabled = false;
        }
    });

    if (defaultToDept) {
        toDeptSelect.value = defaultToDept;
        handleTargetDeptChange(defaultToDept);
        if (defaultWork) {
            document.getElementById("deptreq-work").value = defaultWork;
        }
    } else {
        toDeptSelect.value = "";
        document.getElementById("deptreq-work").innerHTML = `<option value="">Select Target Department First...</option>`;
    }

    document.getElementById("deptreq-reason").value = "";
    document.getElementById("deptreq-expected").value = "";
    document.getElementById("deptreq-priority").value = "NORMAL";

    document.getElementById("modal-department-request").style.display = "flex";
}

function quickRequestVerification(targetDept, defaultWork) {
    const pId = activeWorkspaceParcel ? activeWorkspaceParcel.parcelId : "LND-001";
    openCreateDepartmentRequestModal(pId, targetDept, defaultWork);
}

async function handleCreateDepartmentRequestSubmit(event) {
    event.preventDefault();
    const btn = document.getElementById("btn-submit-dept-req");
    if (btn) btn.disabled = true;

    try {
        const parcelId = document.getElementById("deptreq-parcel-id").value;
        const toDepartment = document.getElementById("deptreq-to-dept").value;
        const requestType = document.getElementById("deptreq-type").value;
        const requiredWork = document.getElementById("deptreq-work").value;
        const priority = document.getElementById("deptreq-priority").value;
        const reason = document.getElementById("deptreq-reason").value;
        const expectedResponse = document.getElementById("deptreq-expected").value;

        const payload = {
            parcelId,
            toDepartment,
            requestType,
            requiredWork,
            priority,
            reason,
            expectedResponse,
            fromOfficerId: currentOfficer.officerId || currentOfficer.uid,
            fromOfficerName: currentOfficer.name,
            fromDepartment: currentOfficer.department
        };

        const res = await window.createDepartmentRequest(payload);
        if (res.success) {
            alert("Request sent successfully.");
            closeModal("modal-department-request");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to create department request.");
        }
    } catch (e) {
        alert(e.message || "Failed to send request.");
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function renderDepartmentRequests(requests = []) {
    const container = document.getElementById("dept-requests-container");
    if (!container) return;

    try {
        const res = await window.getDepartmentRequests({ myRequests: true });
        const allReqs = res.data || requests;

        if (!allReqs || allReqs.length === 0) {
            container.innerHTML = `<div style="padding: 1rem; color: #94a3b8;">No interdepartmental requests pending.</div>`;
            return;
        }

        container.innerHTML = renderRequestsTableHTML(allReqs, "INCOMING & OUTGOING DEPARTMENT REQUESTS");
    } catch (e) {
        container.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Error loading requests: ${e.message}</div>`;
    }
}

async function loadAndRenderDepartmentRequestsTab(container) {
    container.innerHTML = `<div style="padding: 1.5rem; color: #94a3b8;">Loading department requests...</div>`;
    try {
        const res = await window.getDepartmentRequests({ myRequests: true });
        const reqs = res.data || [];

        const myDept = normalizeDept(currentOfficer.department);
        const incoming = reqs.filter(r => normalizeDept(r.to.department) === myDept);
        const outgoing = reqs.filter(r => normalizeDept(r.from.department) === myDept || r.from.officerId === (currentOfficer.officerId || currentOfficer.uid));

        container.innerHTML = `
            <div style="margin-bottom: 1.5rem; display:flex; justify-content:space-between; align-items:center;">
                <h3>📤 DEPARTMENT ACTION REQUESTS</h3>
                <button class="btn-govt-primary" onclick="openCreateDepartmentRequestModal()">+ Department Request</button>
            </div>

            <div style="margin-bottom: 2rem;">
                <h4 style="color:#38bdf8; margin-bottom:0.75rem;">📥 INCOMING REQUESTS (FOR MY DEPARTMENT)</h4>
                ${renderRequestsTableHTML(incoming, "Incoming Requests", true)}
            </div>

            <div>
                <h4 style="color:#38bdf8; margin-bottom:0.75rem;">📤 MY OUTGOING REQUESTS (SENT TO OTHER DEPARTMENTS)</h4>
                ${renderRequestsTableHTML(outgoing, "Outgoing Requests", false)}
            </div>
        `;
    } catch (e) {
        container.innerHTML = `<div style="padding: 1rem; color: #ef4444;">Failed to load department requests: ${e.message}</div>`;
    }
}

function renderRequestsTableHTML(requests = [], title = "", isIncoming = true) {
    if (!requests || requests.length === 0) {
        return `<div style="padding: 1rem; background: #0f172a; border: 1px solid var(--govt-border); color: #94a3b8;">No ${title.toLowerCase()} found.</div>`;
    }

    return `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>${isIncoming ? 'From Dept' : 'To Dept'}</th>
                    <th>Parcel ID</th>
                    <th>Request Type</th>
                    <th>Required Work</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${requests.map(r => {
                    const isUrgent = r.priority === "URGENT";
                    const priorityClass = isUrgent ? "priority-high" : (r.priority === "HIGH" ? "priority-high" : "priority-medium");
                    const statusClass = r.status === "COMPLETED" ? "status-verified" : (r.status === "PENDING" ? "status-pending" : "status-review");
                    const isOverdue = r.isOverdue;

                    return `
                        <tr style="${isUrgent ? 'background: rgba(239, 68, 68, 0.08);' : ''}">
                            <td><strong>${r.requestId}</strong></td>
                            <td>${isIncoming ? r.from.department : r.to.department}</td>
                            <td><strong>${r.parcelId}</strong></td>
                            <td>${r.requestType}</td>
                            <td><code>${r.requiredWork}</code></td>
                            <td><span class="${priorityClass}">${r.priority}</span></td>
                            <td>
                                <span class="status-tag ${statusClass}">${r.status}</span>
                                ${isOverdue ? '<span class="status-tag" style="background:#7f1d1d; color:#fca5a5; font-weight:700;">OVERDUE</span>' : ''}
                            </td>
                            <td>${r.createdAt ? r.createdAt.substring(0, 10) : 'N/A'}</td>
                            <td style="display:flex; gap:0.25rem; flex-wrap:wrap;">
                                <button class="btn-govt-secondary" style="padding:2px 6px; font-size:0.75rem;" onclick="openDepartmentRequestDetailModal('${r.requestId}')">View Request</button>
                                ${isIncoming && r.status === 'PENDING' ? `<button class="btn-govt-primary" style="padding:2px 6px; font-size:0.75rem;" onclick="handleAcceptRequest('${r.requestId}')">Accept</button>` : ''}
                                ${isIncoming && (r.status === 'ACCEPTED' || r.status === 'IN_PROGRESS') ? `<button class="btn-govt-primary" style="padding:2px 6px; font-size:0.75rem;" onclick="openCompleteDepartmentRequestModal('${r.requestId}')">Complete</button>` : ''}
                                ${isOverdue || r.status === 'IN_PROGRESS' ? `<button class="btn-govt-warning" style="padding:2px 6px; font-size:0.75rem;" onclick="handleEscalateRequest('${r.requestId}')">Escalate</button>` : ''}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

async function openDepartmentRequestDetailModal(requestId) {
    try {
        const res = await window.getDepartmentRequestById(requestId);
        if (!res.success || !res.data) {
            alert("Request not found.");
            return;
        }

        const r = res.data;
        document.getElementById("reqdetail-modal-title").textContent = `📋 REQUEST ${r.requestId} DETAILS`;

        const isOverdue = r.isOverdue;
        const myDept = normalizeDept(currentOfficer.department);
        const isTargetDept = normalizeDept(r.to.department) === myDept || currentOfficer.role === "admin";
        const isRequesterDept = normalizeDept(r.from.department) === myDept || r.from.officerId === (currentOfficer.officerId || currentOfficer.uid) || currentOfficer.role === "admin";

        const content = document.getElementById("reqdetail-content");
        content.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:#0f172a; padding:1rem; border:1px solid var(--govt-border); font-size:0.85rem; margin-bottom:1rem;">
                <div><strong>Parcel ID:</strong> ${r.parcelId}</div>
                <div><strong>Survey Number:</strong> ${r.surveyNumber || 'N/A'}</div>
                <div><strong>From Department:</strong> ${r.from.department}</div>
                <div><strong>Requested By:</strong> ${r.from.officerName} (${r.from.officerId})</div>
                <div><strong>To Department:</strong> ${r.to.department}</div>
                <div><strong>Request Type:</strong> ${r.requestType}</div>
                <div><strong>Required Work:</strong> <code>${r.requiredWork}</code></div>
                <div><strong>Priority:</strong> <span class="priority-${(r.priority || 'NORMAL').toLowerCase()}">${r.priority}</span></div>
                <div><strong>Status:</strong> <span class="status-tag status-pending">${r.status}</span> ${isOverdue ? '<span style="background:#7f1d1d; color:#fca5a5; padding:2px 6px; border-radius:3px; font-weight:700;">OVERDUE</span>' : ''}</div>
                <div><strong>Created At:</strong> ${r.createdAt ? new Date(r.createdAt).toLocaleString() : 'N/A'}</div>
                <div><strong>Due SLA:</strong> ${r.dueAt ? new Date(r.dueAt).toLocaleString() : 'N/A'}</div>
            </div>

            <div style="margin-bottom:1rem;">
                <label style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Reason for Request:</label>
                <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); font-size:0.85rem; margin-top:0.25rem;">
                    ${r.reason || 'No specific reason provided.'}
                </div>
            </div>

            ${r.expectedResponse ? `
                <div style="margin-bottom:1rem;">
                    <label style="font-weight:700; color:#38bdf8; font-size:0.85rem;">Expected Response:</label>
                    <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); font-size:0.85rem; margin-top:0.25rem;">
                        ${r.expectedResponse}
                    </div>
                </div>
            ` : ''}

            ${r.response ? `
                <div style="margin-bottom:1rem; border:1px solid #059669; padding:0.75rem; background:rgba(5, 150, 105, 0.1);">
                    <h4 style="color:#10b981; margin-bottom:0.5rem;">✓ VERIFICATION RESPONSE (${r.response.result})</h4>
                    <div style="font-size:0.85rem; margin-bottom:0.25rem;"><strong>Completed By:</strong> ${r.response.completedByName || r.response.completedBy} (${r.completedAt ? new Date(r.completedAt).toLocaleString() : ''})</div>
                    <div style="font-size:0.85rem; margin-bottom:0.25rem;"><strong>Remarks:</strong> ${r.response.remarks || r.response.informationProvided}</div>
                    ${r.response.supportingDocument ? `<div style="font-size:0.85rem;"><strong>Document Ref:</strong> <code>${r.response.supportingDocument}</code></div>` : ''}
                </div>
            ` : ''}

            <div>
                <h4 style="color:#38bdf8; margin-bottom:0.5rem; font-size:0.9rem;">📜 AUDIT & TIMELINE</h4>
                <ul class="timeline-list">
                    ${(r.timeline || []).map(t => `
                        <li class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-date">${t.timestamp ? new Date(t.timestamp).toLocaleTimeString() : ''} — ${t.actor}</div>
                            <div class="timeline-title">${t.event}</div>
                            <div class="timeline-desc">${t.notes || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;

        const actionGroup = document.getElementById("reqdetail-action-buttons");
        actionGroup.innerHTML = "";

        if (isTargetDept) {
            if (r.status === "PENDING") {
                actionGroup.innerHTML += `<button class="btn-govt-primary" onclick="handleAcceptRequest('${r.requestId}')">Accept Request</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-danger" onclick="handleRejectRequest('${r.requestId}')">Reject Request</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-warning" onclick="handleRequestMoreInfo('${r.requestId}')">Request More Information</button>`;
            } else if (r.status === "ACCEPTED") {
                actionGroup.innerHTML += `<button class="btn-govt-primary" onclick="handleStartRequest('${r.requestId}')">Begin Work</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-warning" onclick="handleRequestMoreInfo('${r.requestId}')">Request More Information</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-danger" onclick="handleRejectRequest('${r.requestId}')">Reject</button>`;
            } else if (r.status === "IN_PROGRESS" || r.status === "MORE_INFORMATION_REQUIRED") {
                actionGroup.innerHTML += `<button class="btn-govt-primary" onclick="openCompleteDepartmentRequestModal('${r.requestId}')">Complete Request</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-warning" onclick="handleRequestMoreInfo('${r.requestId}')">Request More Information</button>`;
                actionGroup.innerHTML += `<button class="btn-govt-warning" onclick="handleEscalateRequest('${r.requestId}')">Escalate</button>`;
            }
        }

        if (isRequesterDept && !["COMPLETED", "REJECTED", "CANCELLED"].includes(r.status)) {
            actionGroup.innerHTML += `<button class="btn-govt-secondary" onclick="handleCancelRequest('${r.requestId}')">Cancel Request</button>`;
        }

        actionGroup.innerHTML += `<button class="btn-govt-secondary" onclick="closeModal('modal-request-detail')">Close</button>`;

        document.getElementById("modal-request-detail").style.display = "flex";
    } catch (e) {
        alert("Failed to load request details: " + e.message);
    }
}

async function handleAcceptRequest(requestId) {
    try {
        const res = await window.acceptDepartmentRequest(requestId);
        if (res.success) {
            alert("Request accepted successfully.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to accept request.");
        }
    } catch (e) {
        alert(e.message || "Failed to accept request.");
    }
}

async function handleStartRequest(requestId) {
    try {
        const res = await window.startDepartmentRequest(requestId);
        if (res.success) {
            alert("Verification work started.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to start request.");
        }
    } catch (e) {
        alert(e.message || "Failed to start request.");
    }
}

function openCompleteDepartmentRequestModal(requestId) {
    document.getElementById("complete-req-id").value = requestId;
    document.getElementById("complete-req-id-label").value = requestId;
    document.getElementById("complete-req-info").value = "";
    document.getElementById("complete-req-remarks").value = "";
    document.getElementById("complete-req-doc").value = "";

    closeModal("modal-request-detail");
    document.getElementById("modal-request-completion").style.display = "flex";
}

async function handleDepartmentRequestCompletionSubmit(event) {
    event.preventDefault();
    const requestId = document.getElementById("complete-req-id").value;
    const result = document.getElementById("complete-req-result").value;
    const informationProvided = document.getElementById("complete-req-info").value;
    const remarks = document.getElementById("complete-req-remarks").value;
    const supportingDocument = document.getElementById("complete-req-doc").value;

    const btn = document.getElementById("btn-submit-complete-req");
    if (btn) btn.disabled = true;

    try {
        const payload = {
            result,
            informationProvided,
            remarks,
            supportingDocument
        };

        const res = await window.completeDepartmentRequest(requestId, payload);
        if (res.success) {
            alert("Department verification request completed successfully.");
            closeModal("modal-request-completion");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to complete request.");
        }
    } catch (e) {
        alert(e.message || "Failed to complete request.");
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function handleRejectRequest(requestId) {
    const reason = prompt("Enter grounds/reason for rejecting this request:");
    if (!reason) return;

    try {
        const res = await window.rejectDepartmentRequest(requestId, reason);
        if (res.success) {
            alert("Request rejected.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to reject request.");
        }
    } catch (e) {
        alert(e.message || "Failed to reject request.");
    }
}

async function handleRequestMoreInfo(requestId) {
    const notes = prompt("Specify what additional information or documentation is required:");
    if (!notes) return;

    try {
        const res = await window.requestMoreInfoDepartment(requestId, notes);
        if (res.success) {
            alert("Information request sent to requester.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to submit request.");
        }
    } catch (e) {
        alert(e.message || "Failed to submit request.");
    }
}

async function handleEscalateRequest(requestId) {
    const reason = prompt("Specify escalation reason (e.g. SLA breach / urgent priority):");
    if (!reason) return;

    try {
        const res = await window.escalateDepartmentRequest(requestId, reason);
        if (res.success) {
            alert("Request escalated.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to escalate request.");
        }
    } catch (e) {
        alert(e.message || "Failed to escalate request.");
    }
}

async function handleCancelRequest(requestId) {
    const reason = prompt("Enter reason for cancelling this request:");
    if (!reason) return;

    try {
        const res = await window.cancelDepartmentRequest(requestId, reason);
        if (res.success) {
            alert("Request cancelled.");
            closeModal("modal-request-detail");
            loadOfficerDashboard();
            if (document.getElementById("generic-records-container")) {
                loadAndRenderDepartmentRequestsTab(document.getElementById("generic-records-container"));
            }
        } else {
            alert(res.message || "Failed to cancel request.");
        }
    } catch (e) {
        alert(e.message || "Failed to cancel request.");
    }
}

// Expose handlers to window
window.handleTargetDeptChange = handleTargetDeptChange;
window.openCreateDepartmentRequestModal = openCreateDepartmentRequestModal;
window.quickRequestVerification = quickRequestVerification;
window.handleCreateDepartmentRequestSubmit = handleCreateDepartmentRequestSubmit;
window.openDepartmentRequestDetailModal = openDepartmentRequestDetailModal;
window.handleAcceptRequest = handleAcceptRequest;
window.handleStartRequest = handleStartRequest;
window.openCompleteDepartmentRequestModal = openCompleteDepartmentRequestModal;
window.handleDepartmentRequestCompletionSubmit = handleDepartmentRequestCompletionSubmit;
window.handleRejectRequest = handleRejectRequest;
window.handleRequestMoreInfo = handleRequestMoreInfo;
window.handleEscalateRequest = handleEscalateRequest;
window.handleCancelRequest = handleCancelRequest;


function renderCases(cases = []) {
    const container = document.getElementById("cases-container");
    if (!cases || cases.length === 0) {
        container.innerHTML = `<div style="padding: 1rem; color: #94a3b8;">No active cases assigned.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr><th>Case ID</th><th>Parcel</th><th>Case Type</th><th>Stage</th><th>Priority</th><th>Status</th></tr>
            </thead>
            <tbody>
                ${cases.map(c => `
                    <tr>
                        <td><strong>${c.caseId}</strong></td>
                        <td>${c.parcelId}</td>
                        <td>${c.caseType}</td>
                        <td>${c.stage}</td>
                        <td><span class="priority-${(c.priority || 'medium').toLowerCase()}">${c.priority}</span></td>
                        <td><span class="status-tag status-review">${c.status}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- 8. CADASTRAL PARCEL WORKSPACE OPENER --- */
async function openParcelWorkspace(parcelId) {
    try {
        const res = await window.getCadastralParcelDetail(parcelId);
        if (!res.success) {
            alert(res.message || "Failed to load parcel cadastral details.");
            return;
        }

        activeWorkspaceParcel = res.data;

        document.getElementById("view-overview").style.display = "none";
        document.getElementById("view-generic-records").style.display = "none";
        document.getElementById("view-parcel-workspace").style.display = "block";

        document.getElementById("workspace-parcel-title").textContent = `LAND PARCEL ${activeWorkspaceParcel.parcelId}`;

        renderWorkspaceBasicInfo(activeWorkspaceParcel);
        renderWorkspaceBoundaryInfo(activeWorkspaceParcel);
        renderWorkspaceHistory(activeWorkspaceParcel);
        renderWorkspaceAuditDocs(activeWorkspaceParcel);
        renderWorkspaceGISMap(activeWorkspaceParcel);

    } catch (e) {
        alert(e.message || "Failed to access parcel workspace.");
    }
}

function renderWorkspaceBasicInfo(p) {
    const container = document.getElementById("workspace-basic-info");
    const isVerified = (p.boundaryStatus || "").toLowerCase() === "verified";
    document.getElementById("workspace-boundary-badge").textContent = p.boundaryStatus || "Pending";
    document.getElementById("workspace-boundary-badge").className = `status-tag ${isVerified ? 'status-verified' : 'status-pending'}`;

    container.innerHTML = `
        <div class="info-field"><div class="info-label">Parcel ID</div><div class="info-value">${p.parcelId}</div></div>
        <div class="info-field"><div class="info-label">Survey Number</div><div class="info-value">${p.surveyNumber}</div></div>
        <div class="info-field"><div class="info-label">Sub-Division</div><div class="info-value">${p.subDivisionNumber || '1A'}</div></div>
        <div class="info-field"><div class="info-label">Owner Name</div><div class="info-value">${p.owner || 'N/A'}</div></div>
        <div class="info-field"><div class="info-label">Area</div><div class="info-value">${p.area} (${p.areaSqM || 0} sq.m)</div></div>
        <div class="info-field"><div class="info-label">Land Type / Use</div><div class="info-value">${p.landType || 'Agricultural'}</div></div>
        <div class="info-field"><div class="info-label">District / Taluk</div><div class="info-value">${p.district}, ${p.taluk}</div></div>
        <div class="info-field"><div class="info-label">Village</div><div class="info-value">${p.village}</div></div>
        <div class="info-field"><div class="info-label">Survey Officer</div><div class="info-value">${p.surveyOfficer || 'OFF-CAD-001'}</div></div>
        <div class="info-field"><div class="info-label">Survey Date</div><div class="info-value">${p.surveyDate || '2026-08-20'}</div></div>
        <div class="info-field"><div class="info-label">Previous Survey No</div><div class="info-value">${p.previousSurveyNumber || 'SUR-099'}</div></div>
        <div class="info-field"><div class="info-label">Survey Reference</div><div class="info-value">${p.surveyReference || 'CAD-REF-2026'}</div></div>
    `;
}

function renderWorkspaceBoundaryInfo(p) {
    const container = document.getElementById("workspace-boundary-info");
    container.innerHTML = `
        <div class="info-field"><div class="info-label">North Boundary</div><div class="info-value">${p.northBoundary || 'Public Road'}</div></div>
        <div class="info-field"><div class="info-label">South Boundary</div><div class="info-value">${p.southBoundary || 'Adjacent Survey Plot'}</div></div>
        <div class="info-field"><div class="info-label">East Boundary</div><div class="info-value">${p.eastBoundary || 'Water Body / Drain Buffer'}</div></div>
        <div class="info-field"><div class="info-label">West Boundary</div><div class="info-value">${p.westBoundary || 'Government Reserve Land'}</div></div>
    `;
}

function renderWorkspaceHistory(p) {
    const container = document.getElementById("workspace-history-container");
    const history = p.surveyHistory || [];
    const inspections = p.inspectionRemarks || [];

    let html = `<h4>Survey History</h4><ul class="timeline-list">`;
    if (history.length === 0) {
        html += `<li style="color:#94a3b8;">No previous survey history.</li>`;
    } else {
        history.forEach(h => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot"></div>
                    <div class="timeline-date">${h.date} — Officer: ${h.officer}</div>
                    <div class="timeline-title">${h.action} [${h.status}]</div>
                    <div class="timeline-desc">${h.notes}</div>
                </li>
            `;
        });
    }
    html += `</ul><h4 style="margin-top: 1.5rem;">Inspection Remarks History</h4><ul class="timeline-list">`;

    if (inspections.length === 0) {
        html += `<li style="color:#94a3b8;">No field inspection notes recorded.</li>`;
    } else {
        inspections.forEach(insp => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#f59e0b;"></div>
                    <div class="timeline-date">${insp.date} — Officer: ${insp.officer} (${insp.officerId})</div>
                    <div class="timeline-title">${insp.id}: Inspection Remarks</div>
                    <div class="timeline-desc">${insp.remarks}</div>
                </li>
            `;
        });
    }
    html += `</ul>`;
    container.innerHTML = html;
}

function renderWorkspaceAuditDocs(p) {
    const container = document.getElementById("workspace-audit-docs-container");
    const docs = p.documents || [];
    const audits = p.auditTrail || [];

    let html = `<h4>Survey & Cadastral Documents</h4>`;
    if (docs.length === 0) {
        html += `<p style="color:#94a3b8;">No documents associated yet.</p>`;
    } else {
        html += `
            <table class="table-govt" style="margin-bottom: 1.5rem;">
                <thead><tr><th>Doc ID</th><th>Title</th><th>Type</th><th>Issue Date</th><th>Status</th></tr></thead>
                <tbody>
                    ${docs.map(d => `
                        <tr>
                            <td><strong>${d.documentId}</strong></td>
                            <td>${d.title}</td>
                            <td>${d.documentType}</td>
                            <td>${d.issueDate || '2026-08-20'}</td>
                            <td><span class="status-tag status-verified">${d.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    html += `<h4>System Audit Trail (Parcel ${p.parcelId})</h4><ul class="timeline-list">`;
    if (audits.length === 0) {
        html += `<li style="color:#94a3b8;">No audit log events recorded for this parcel.</li>`;
    } else {
        audits.forEach(a => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#38bdf8;"></div>
                    <div class="timeline-date">${new Date(a.createdAt).toLocaleString()} — ${a.actor}</div>
                    <div class="timeline-title">${a.action}</div>
                    <div class="timeline-desc">${JSON.stringify(a.details || {})}</div>
                </li>
            `;
        });
    }
    html += `</ul>`;
    container.innerHTML = html;
}

function renderWorkspaceGISMap(p) {
    const mapDiv = document.getElementById("workspace-gis-map");
    if (!mapDiv) return;

    if (workspaceMap) {
        workspaceMap.remove();
        workspaceMap = null;
    }

    const defaultCoords = (p.coordinates && p.coordinates.length > 0)
        ? p.coordinates
        : [[11.0200, 76.9500], [11.0200, 76.9530], [11.0175, 76.9530], [11.0175, 76.9500]];

    const centerLat = defaultCoords[0][0];
    const centerLng = defaultCoords[0][1];

    workspaceMap = L.map('workspace-gis-map').setView([centerLat, centerLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | LandGov GIS Infrastructure'
    }).addTo(workspaceMap);

    const isVerified = (p.boundaryStatus || p.rorStatus || p.status || "").toString().toLowerCase().includes("verified") || (p.status || "").toLowerCase() === "approved";
    const polyColor = isVerified ? "#10b981" : "#f59e0b";

    workspacePolygonLayer = L.polygon(defaultCoords, {
        color: polyColor,
        weight: 3,
        fillColor: polyColor,
        fillOpacity: 0.35
    }).addTo(workspaceMap);

    workspacePolygonLayer.bindPopup(`
        <strong>Parcel ID: ${p.parcelId}</strong><br>
        Survey No: ${p.surveyNumber || 'SUR-101'}<br>
        Status: ${p.boundaryStatus || p.status || 'Active'}
    `).openPopup();

    workspaceMap.fitBounds(workspacePolygonLayer.getBounds(), { padding: [20, 20] });
}

/* --- 9. RoR PARCEL WORKSPACE OPENER --- */
async function openRoRParcelWorkspace(parcelId) {
    try {
        const res = await window.getRoRParcelDetail(parcelId);
        if (!res.success) {
            alert(res.message || "Failed to load RoR parcel details.");
            return;
        }

        activeRoRParcel = res.data;

        document.getElementById("view-overview").style.display = "none";
        document.getElementById("view-generic-records").style.display = "none";
        document.getElementById("view-parcel-workspace").style.display = "block";

        document.getElementById("workspace-parcel-title").textContent = `RECORD OF RIGHTS — PARCEL ${activeRoRParcel.parcelId}`;

        // Swap actions panel for RoR actions
        const actionsPanel = document.querySelector(".cadastral-actions-panel");
        actionsPanel.innerHTML = `
            <button class="btn-govt-primary" onclick="openVerifyOwnershipModal()">✓ Verify Ownership</button>
            <button class="btn-govt-primary" onclick="openApproveMutationModal()">✓ Approve Mutation</button>
            <button class="btn-govt-danger" onclick="openRejectMutationModal()">✕ Reject Mutation</button>
            <button class="btn-govt-warning" onclick="openRequestInfoModal()">📤 Request Information</button>
            <button class="btn-govt-danger" onclick="openReportOwnershipDisputeModal()">⚠ Report Ownership Dispute</button>
            <button class="btn-govt-secondary" onclick="openCorrectRoRModal()">✏ Correct RoR Record</button>
        `;

        renderRoRBasicInfo(activeRoRParcel);
        renderRoRCadastralCrossReference(activeRoRParcel);
        renderRoROwnershipHistory(activeRoRParcel);
        renderRoRMutationsWorkflow(activeRoRParcel);
        renderWorkspaceGISMap(activeRoRParcel);

    } catch (e) {
        alert(e.message || "Failed to access RoR parcel workspace.");
    }
}

function renderRoRBasicInfo(r) {
    const container = document.getElementById("workspace-basic-info");
    const isVerified = (r.rorStatus || "").toLowerCase() === "verified";
    document.getElementById("workspace-boundary-badge").textContent = `RoR: ${r.rorStatus || "Pending"}`;
    document.getElementById("workspace-boundary-badge").className = `status-tag ${isVerified ? 'status-verified' : 'status-pending'}`;

    const matrix = r.interdepartmentalStatus || {};

    container.innerHTML = `
        <div class="info-field"><div class="info-label">Parcel ID</div><div class="info-value">${r.parcelId}</div></div>
        <div class="info-field"><div class="info-label">RoR Number</div><div class="info-value">${r.recordNumber || 'ROR-2026-001'}</div></div>
        <div class="info-field"><div class="info-label">Owner Name</div><div class="info-value">${r.rightsHolder || r.ownerName}</div></div>
        <div class="info-field"><div class="info-label">Ownership Type</div><div class="info-value">${r.ownershipType || 'Individual'} (${r.ownershipShare || '100%'})</div></div>
        <div class="info-field"><div class="info-label">Possession Status</div><div class="info-value">${r.possessionStatus || 'Self'}</div></div>
        <div class="info-field"><div class="info-label">Land Classification</div><div class="info-value">${r.landClassification || 'Agricultural'}</div></div>
        <div class="info-field"><div class="info-label">Area & District</div><div class="info-value">${r.area}, ${r.district || 'Coimbatore'}</div></div>
        <div class="info-field"><div class="info-label">RoR Record Status</div><div class="info-value"><span class="status-tag ${isVerified ? 'status-verified' : 'status-pending'}">${r.rorStatus}</span></div></div>
        
        <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: #0f172a; padding: 0.75rem; border: 1px solid var(--govt-border); border-radius: var(--govt-radius);">
            <div class="info-label" style="margin-bottom: 0.4rem;">INTERDEPARTMENTAL VERIFICATION MATRIX</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="status-tag ${matrix.cadastral === 'VERIFIED' ? 'status-verified' : 'status-pending'}">Cadastral: ${matrix.cadastral || 'PENDING'}</span>
                <span class="status-tag ${matrix.ror === 'VERIFIED' ? 'status-verified' : 'status-pending'}">RoR: ${matrix.ror || 'PENDING'}</span>
                <span class="status-tag status-pending">Registration: ${matrix.registration || 'PENDING'}</span>
                <span class="status-tag status-pending">Land Use: ${matrix.landUse || 'PENDING'}</span>
                <span class="status-tag status-pending">Property Tax: ${matrix.propertyTax || 'PENDING'}</span>
            </div>
        </div>
    `;
}

function renderRoRCadastralCrossReference(r) {
    const container = document.getElementById("workspace-boundary-info");
    const cad = r.cadastralVerification || {};
    const isCadVerified = (cad.boundaryStatus || "").toLowerCase() === "verified";

    container.innerHTML = `
        <div class="info-field"><div class="info-label">Cadastral Boundary Status</div><div class="info-value"><span class="status-tag ${isCadVerified ? 'status-verified' : 'status-pending'}">${cad.boundaryStatus || 'Pending Verification'}</span></div></div>
        <div class="info-field"><div class="info-label">Cadastral Survey Status</div><div class="info-value">${cad.surveyStatus || 'Verified'}</div></div>
        <div class="info-field"><div class="info-label">Last Cadastral Survey Date</div><div class="info-value">${cad.surveyDate || '2026-08-20'}</div></div>
        <div class="info-field"><div class="info-label">Surveying Officer</div><div class="info-value">${cad.surveyOfficer || 'OFF-CAD-001'}</div></div>
    `;
}

function renderRoROwnershipHistory(r) {
    const container = document.getElementById("workspace-history-container");
    const history = r.ownershipHistory || [];

    let html = `<h4>Chronological Ownership History</h4><ul class="timeline-list">`;
    if (history.length === 0) {
        html += `<li style="color:#94a3b8;">No prior ownership history recorded.</li>`;
    } else {
        history.forEach(h => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#10b981;"></div>
                    <div class="timeline-date">${h.date} — Doc Ref: ${h.document}</div>
                    <div class="timeline-title">${h.owner} (${h.ownershipType})</div>
                    <div class="timeline-desc">Mutation Ref: ${h.mutationNumber} — Status: ${h.status}</div>
                </li>
            `;
        });
    }
    html += `</ul>`;
    container.innerHTML = html;
}

function renderRoRMutationsWorkflow(r) {
    const container = document.getElementById("workspace-audit-docs-container");
    const mutations = r.mutations || [];
    const disputes = r.disputes || [];
    const docs = r.documents || [];

    let html = `<h4>Active Mutation Requests & Workflow Tracker</h4>`;
    if (mutations.length === 0) {
        html += `<p style="color:#94a3b8;">No pending mutation requests for parcel ${r.parcelId}.</p>`;
    } else {
        mutations.forEach(m => {
            activeMutation = m;
            html += `
                <div style="background:#0f172a; padding:1rem; border:1px solid var(--govt-border); border-radius:4px; margin-bottom:1rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                        <strong>Mutation ID: ${m.mutationId} (${m.type})</strong>
                        <span class="status-tag status-pending">${m.status}</span>
                    </div>
                    <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:0.5rem;">
                        Current Owner: <strong>${m.currentOwner}</strong> → Proposed Owner: <strong>${m.proposedOwner}</strong><br>
                        Reason: ${m.reason} | Supporting Doc: ${m.supportingDocument}
                    </div>
                    <div style="font-size:0.75rem; font-weight:700; color:#38bdf8; margin-bottom:0.4rem;">
                        CURRENT STAGE: ${m.currentStage || 'Ownership Verification'}
                    </div>
                    <div style="display:flex; gap:0.4rem; flex-wrap:wrap; font-size:0.7rem;">
                        ${(m.stages || [
                            { name: "Mutation Requested", status: "COMPLETED" },
                            { name: "Document Verification", status: "COMPLETED" },
                            { name: "Cadastral Verification", status: "COMPLETED" },
                            { name: "Ownership Verification", status: "IN_PROGRESS" },
                            { name: "Dispute Check", status: "PENDING" },
                            { name: "Approval", status: "PENDING" },
                            { name: "RoR Update", status: "PENDING" }
                        ]).map(s => `
                            <span style="padding:0.15rem 0.4rem; border-radius:3px; background:${s.status === 'COMPLETED' ? 'rgba(16,185,129,0.2)' : (s.status === 'IN_PROGRESS' ? 'rgba(56,189,248,0.2)' : '#1e293b')}; color:${s.status === 'COMPLETED' ? '#34d399' : (s.status === 'IN_PROGRESS' ? '#38bdf8' : '#94a3b8')};">
                                ${s.status === 'COMPLETED' ? '✓' : (s.status === 'IN_PROGRESS' ? '●' : '○')} ${s.name}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }

    if (disputes.length > 0) {
        html += `<h4 style="color:#ef4444;">⚠ Ownership Disputes</h4><ul class="timeline-list">`;
        disputes.forEach(d => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#ef4444;"></div>
                    <div class="timeline-date">${d.reportedAt ? d.reportedAt.split('T')[0] : '2026-09-02'} — By ${d.reportedBy}</div>
                    <div class="timeline-title">${d.disputeId}: ${d.type} [${d.severity}]</div>
                    <div class="timeline-desc">${d.description}</div>
                </li>
            `;
        });
        html += `</ul>`;
    }

    html += `<h4>Supporting Documents</h4>`;
    if (docs.length === 0) {
        html += `<p style="color:#94a3b8;">No uploaded documents found.</p>`;
    } else {
        html += `
            <table class="table-govt">
                <thead><tr><th>Doc ID</th><th>Title</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    ${docs.map(d => `
                        <tr>
                            <td><strong>${d.documentId}</strong></td>
                            <td>${d.title}</td>
                            <td>${d.documentType}</td>
                            <td><span class="status-tag ${d.status === 'VERIFIED' ? 'status-verified' : 'status-pending'}">${d.status}</span></td>
                            <td>
                                <button class="btn-govt-primary" onclick="handleVerifyDocAction('${d.documentId}', 'VERIFIED')">Verify</button>
                                <button class="btn-govt-danger" onclick="handleVerifyDocAction('${d.documentId}', 'REJECTED')">Reject</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
    container.innerHTML = html;
}

/* --- 10. REGISTRATION CASE WORKSPACE OPENER --- */
async function openRegistrationCaseWorkspace(parcelId) {
    try {
        const res = await window.getRegistrationParcelDetail(parcelId);
        if (!res.success) {
            alert(res.message || "Failed to load Registration case details.");
            return;
        }

        activeRegParcel = res.data;

        document.getElementById("view-overview").style.display = "none";
        document.getElementById("view-generic-records").style.display = "none";
        document.getElementById("view-parcel-workspace").style.display = "block";

        document.getElementById("workspace-parcel-title").textContent = `REGISTRATION CASE ${activeRegParcel.registrationId} — PARCEL ${activeRegParcel.parcelId}`;

        // Swap actions panel for Registration actions
        const actionsPanel = document.querySelector(".cadastral-actions-panel");
        actionsPanel.innerHTML = `
            <button class="btn-govt-primary" onclick="openVerifyDeedModal()">✓ Verify Deed</button>
            <button class="btn-govt-primary" onclick="openVerifyStampDutyModal()">💰 Verify Stamp Duty</button>
            <button class="btn-govt-secondary" onclick="openEncumbranceCheckModal()">🔍 Perform Encumbrance Check</button>
            <button class="btn-govt-warning" onclick="openRequestTaxClearanceModal()">🧾 Request Tax Clearance</button>
            <button class="btn-govt-primary" onclick="openApproveRegistrationModal()">✓ APPROVE REGISTRATION</button>
            <button class="btn-govt-danger" onclick="openRejectRegistrationModal()">✕ Reject Registration</button>
            <button class="btn-govt-warning" onclick="openRequestRegInfoModal()">📤 Request Information</button>
        `;

        renderRegistrationBasicInfo(activeRegParcel);
        renderRegistrationChecklistCard(activeRegParcel);
        renderRegistrationTransactionHistory(activeRegParcel);
        renderRegistrationAuditDocs(activeRegParcel);
        renderWorkspaceGISMap(activeRegParcel);

    } catch (e) {
        alert(e.message || "Failed to access Registration case workspace.");
    }
}

function renderRegistrationBasicInfo(r) {
    const container = document.getElementById("workspace-basic-info");
    const isApproved = (r.status || "").toLowerCase() === "approved";
    document.getElementById("workspace-boundary-badge").textContent = `Registration: ${r.status || "Pending"}`;
    document.getElementById("workspace-boundary-badge").className = `status-tag ${isApproved ? 'status-verified' : 'status-pending'}`;

    const cad = r.cadastralCrossReference || {};
    const ror = r.rorCrossReference || {};

    container.innerHTML = `
        <div class="info-field"><div class="info-label">Registration ID</div><div class="info-value"><strong>${r.registrationId}</strong></div></div>
        <div class="info-field"><div class="info-label">Parcel ID & Survey</div><div class="info-value">${r.parcelId} (${r.surveyNumber})</div></div>
        <div class="info-field"><div class="info-label">Transaction Type</div><div class="info-value">${r.transactionType} (${r.documentType || 'Sale Deed'})</div></div>
        <div class="info-field"><div class="info-label">Current Owner (Seller)</div><div class="info-value">${r.currentOwner || r.seller}</div></div>
        <div class="info-field"><div class="info-label">Proposed Owner (Buyer)</div><div class="info-value"><strong>${r.proposedOwner || r.buyer}</strong></div></div>
        <div class="info-field"><div class="info-label">Consideration Value</div><div class="info-value">₹ ${Number(r.considerationAmount || 0).toLocaleString('en-IN')}</div></div>
        <div class="info-field"><div class="info-label">Market / Guidance Value</div><div class="info-value">₹ ${Number(r.marketValue || 0).toLocaleString('en-IN')}</div></div>
        <div class="info-field"><div class="info-label">Stamp Duty Required / Paid</div><div class="info-value">₹ ${Number(r.stampDutyRequired || 0).toLocaleString('en-IN')} / <span style="color:#34d399;">₹ ${Number(r.stampDutyPaid || 0).toLocaleString('en-IN')}</span></div></div>
        <div class="info-field"><div class="info-label">Registration Fee</div><div class="info-value">₹ ${Number(r.registrationFee || 0).toLocaleString('en-IN')}</div></div>
        <div class="info-field"><div class="info-label">Payment Reference</div><div class="info-value">${r.paymentReference || 'N/A'}</div></div>
        <div class="info-field"><div class="info-label">Sub-Registrar Office</div><div class="info-value">${r.registrationOffice}</div></div>
        <div class="info-field"><div class="info-label">Registration Status</div><div class="info-value"><span class="status-tag ${isApproved ? 'status-verified' : 'status-pending'}">${r.status}</span></div></div>

        <div style="grid-column: 1 / -1; margin-top: 0.5rem; background: #0f172a; padding: 0.75rem; border: 1px solid var(--govt-border); border-radius: var(--govt-radius);">
            <div class="info-label" style="margin-bottom: 0.4rem;">CROSS-DEPARTMENTAL STATUS SUMMARY</div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <span class="status-tag ${cad.boundaryStatus === 'Verified' ? 'status-verified' : 'status-pending'}">Cadastral Boundary: ${cad.boundaryStatus || 'Pending'}</span>
                <span class="status-tag ${ror.rorStatus === 'VERIFIED' ? 'status-verified' : 'status-pending'}">RoR Ownership: ${ror.rorStatus || 'Pending'}</span>
                <span class="status-tag ${r.taxClearanceStatus === 'CLEARED' ? 'status-verified' : 'status-pending'}">Property Tax: ${r.taxClearanceStatus}</span>
                <span class="status-tag status-verified">Land Use: ${r.landUseStatus}</span>
                <span class="status-tag status-verified">Restrictions: ${r.restrictionStatus}</span>
            </div>
        </div>
    `;
}

function renderRegistrationChecklistCard(r) {
    const container = document.getElementById("workspace-boundary-info");
    const chk = r.checklist || {};

    const items = [
        { key: "cadastral", label: "Cadastral Boundary Verification", val: chk.cadastral },
        { key: "ror", label: "RoR Ownership Title Verification", val: chk.ror },
        { key: "deed", label: "Sale Deed & Document Attestation", val: chk.deed },
        { key: "stampDuty", label: "Stamp Duty & Registration Fee Payment", val: chk.stampDuty },
        { key: "encumbrance", label: "Encumbrance Search (Prior Liens/Mortgages)", val: chk.encumbrance },
        { key: "taxClearance", label: "Property Tax Municipal Dues Clearance", val: chk.taxClearance },
        { key: "landUse", label: "Land Use & Zoning Master Plan Compliance", val: chk.landUse },
        { key: "restrictions", label: "Environmental & Statutory Restrictions Check", val: chk.restrictions }
    ];

    container.innerHTML = `
        <div style="grid-column: 1 / -1; margin-bottom: 0.5rem;">
            <strong>8-POINT REGISTRATION CLEARANCE CHECKLIST</strong>
        </div>
        ${items.map(item => {
            const isPass = (item.val || "").toUpperCase() === "VERIFIED" || (item.val || "").toUpperCase() === "CLEARED" || (item.val || "").toUpperCase() === "CLEAR";
            return `
                <div class="info-field" style="border-left: 3px solid ${isPass ? '#10b981' : '#f59e0b'}; padding-left: 0.5rem;">
                    <div class="info-label">${item.label}</div>
                    <div class="info-value">
                        <span class="status-tag ${isPass ? 'status-verified' : 'status-pending'}">
                            ${isPass ? '✓ PASS' : '⏳ PENDING (' + item.val + ')'}
                        </span>
                    </div>
                </div>
            `;
        }).join('')}
    `;
}

function renderRegistrationTransactionHistory(r) {
    const container = document.getElementById("workspace-history-container");
    const history = r.transactionHistory || [];

    let html = `<h4>Property Transaction History</h4><ul class="timeline-list">`;
    if (history.length === 0) {
        html += `<li style="color:#94a3b8;">No prior registered property transactions recorded.</li>`;
    } else {
        history.forEach(h => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#38bdf8;"></div>
                    <div class="timeline-date">${h.year} — Reg Doc: ${h.docRef}</div>
                    <div class="timeline-title">${h.type}: ${h.seller} → ${h.buyer}</div>
                    <div class="timeline-desc">Consideration: ₹ ${Number(h.consideration || 0).toLocaleString('en-IN')} | Status: ${h.status}</div>
                </li>
            `;
        });
    }
    html += `</ul>`;
    container.innerHTML = html;
}

function renderRegistrationAuditDocs(r) {
    const container = document.getElementById("workspace-audit-docs-container");
    const requests = r.requests || [];
    const audits = r.auditTrail || [];

    let html = `<h4>Interdepartmental Requests Sent for Case ${r.registrationId}</h4>`;
    if (requests.length === 0) {
        html += `<p style="color:#94a3b8;">No interdepartmental clearance requests generated yet.</p>`;
    } else {
        html += `
            <table class="table-govt" style="margin-bottom:1.5rem;">
                <thead><tr><th>Req ID</th><th>To Dept</th><th>Request Summary</th><th>Status</th></tr></thead>
                <tbody>
                    ${requests.map(req => `
                        <tr>
                            <td><strong>${req.requestId}</strong></td>
                            <td>${req.toDepartment}</td>
                            <td>${req.request}</td>
                            <td><span class="status-tag status-pending">${req.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    html += `<h4>System Audit Trail (Parcel ${r.parcelId})</h4><ul class="timeline-list">`;
    if (audits.length === 0) {
        html += `<li style="color:#94a3b8;">No audit log events recorded for this parcel.</li>`;
    } else {
        audits.forEach(a => {
            html += `
                <li class="timeline-item">
                    <div class="timeline-dot" style="background:#38bdf8;"></div>
                    <div class="timeline-date">${new Date(a.createdAt).toLocaleString()} — ${a.actor}</div>
                    <div class="timeline-title">${a.action}</div>
                    <div class="timeline-desc">${JSON.stringify(a.details || {})}</div>
                </li>
            `;
        });
    }
    html += `</ul>`;
    container.innerHTML = html;
}

/* --- 11. TAB SWITCHER --- */
function switchOfficerTab(tabName) {
    document.getElementById("view-overview").style.display = "none";
    document.getElementById("view-parcel-workspace").style.display = "none";
    document.getElementById("view-generic-records").style.display = "none";

    document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
    const activeNav = document.getElementById(`nav-${tabName}`);
    if (activeNav) activeNav.classList.add("active");

    if (tabName === "overview") {
        document.getElementById("view-overview").style.display = "block";
    } else if (tabName === "assigned-parcels" || tabName === "pending-mutations" || tabName === "pending-registrations" || tabName === "pending-verification" || tabName === "survey-records") {
        document.getElementById("view-overview").style.display = "block";
    } else {
        document.getElementById("view-generic-records").style.display = "block";
        document.getElementById("generic-tab-title").textContent = tabName.replace(/-/g, " ").toUpperCase();
        renderGenericTabContent(tabName);
    }
}

function renderGenericTabContent(tabName) {
    const container = document.getElementById("generic-records-container");

    if (tabName === "department-requests") {
        loadAndRenderDepartmentRequestsTab(container);
        return;
    }

    if (!currentDeptData) return;

    if (tabName === "transfer-requests" || tabName === "registration-records") {
        const regs = currentDeptData.registrations || [];
        container.innerHTML = `
            <table class="table-govt">
                <thead><tr><th>Registration ID</th><th>Parcel</th><th>Type</th><th>Current Owner</th><th>Proposed Owner</th><th>Stamp Duty Status</th><th>Tax Clearance</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                    ${regs.map(r => `
                        <tr>
                            <td><strong>${r.registrationId}</strong></td>
                            <td>${r.parcelId}</td>
                            <td>${r.transactionType}</td>
                            <td>${r.currentOwner}</td>
                            <td>${r.proposedOwner}</td>
                            <td><span class="status-tag status-verified">${r.stampDutyStatus}</span></td>
                            <td><span class="status-tag ${r.taxClearanceStatus === 'CLEARED' ? 'status-verified' : 'status-pending'}">${r.taxClearanceStatus}</span></td>
                            <td><span class="status-tag ${r.status === 'APPROVED' ? 'status-verified' : 'status-pending'}">${r.status}</span></td>
                            <td><button class="btn-govt-primary" onclick="openRegistrationCaseWorkspace('${r.parcelId}')">Review Case</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (tabName === "ownership-disputes" || tabName === "conflicts") {
        const disputes = currentDeptData.disputes || [];
        container.innerHTML = `
            <table class="table-govt">
                <thead><tr><th>Dispute ID</th><th>Parcel</th><th>Type</th><th>Severity</th><th>Description</th><th>Reported By</th><th>Status</th></tr></thead>
                <tbody>
                    ${disputes.map(d => `
                        <tr>
                            <td><strong>${d.disputeId}</strong></td>
                            <td>${d.parcelId}</td>
                            <td>${d.type}</td>
                            <td><span class="priority-${(d.severity || 'medium').toLowerCase()}">${d.severity}</span></td>
                            <td>${d.description}</td>
                            <td>${d.reportedBy}</td>
                            <td><span class="status-tag status-conflict">${d.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        container.innerHTML = `<div style="padding: 1.5rem; color:#94a3b8;">${tabName.replace(/-/g, " ").toUpperCase()} view active. Access controlled.</div>`;
    }
}

/* --- 12. MODAL ACTION HANDLERS --- */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

/* CADASTRAL MODAL HANDLERS */
function openVerifyBoundaryModal() {
    if (!activeWorkspaceParcel) return;
    document.getElementById("verify-parcel-id").value = activeWorkspaceParcel.parcelId;
    document.getElementById("verify-parcel-label").value = `${activeWorkspaceParcel.parcelId} (Survey: ${activeWorkspaceParcel.surveyNumber})`;
    document.getElementById("modal-verify-boundary").style.display = "flex";
}

async function handleVerifyBoundarySubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("verify-parcel-id").value;
    const verificationResult = document.getElementById("verify-result-select").value;
    const remarks = document.getElementById("verify-remarks").value;

    try {
        const res = await window.verifyCadastralParcelBoundary(parcelId, verificationResult, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-verify-boundary");
            await loadOfficerDashboard();
            await openParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Boundary verification failed.");
    }
}

function openUpdateSurveyModal() {
    if (!activeWorkspaceParcel) return;
    document.getElementById("survey-parcel-id").value = activeWorkspaceParcel.parcelId;
    document.getElementById("survey-num-input").value = activeWorkspaceParcel.surveyNumber || "";
    document.getElementById("survey-date-input").value = activeWorkspaceParcel.surveyDate || new Date().toISOString().split("T")[0];
    document.getElementById("survey-area-input").value = activeWorkspaceParcel.area || "";
    document.getElementById("survey-ref-input").value = activeWorkspaceParcel.surveyReference || "CAD-REF-2026";
    document.getElementById("survey-north-input").value = activeWorkspaceParcel.northBoundary || "";
    document.getElementById("survey-south-input").value = activeWorkspaceParcel.southBoundary || "";
    document.getElementById("survey-east-input").value = activeWorkspaceParcel.eastBoundary || "";
    document.getElementById("survey-west-input").value = activeWorkspaceParcel.westBoundary || "";
    document.getElementById("modal-update-survey").style.display = "flex";
}

async function handleUpdateSurveySubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("survey-parcel-id").value;
    const surveyData = {
        surveyNumber: document.getElementById("survey-num-input").value,
        surveyDate: document.getElementById("survey-date-input").value,
        area: document.getElementById("survey-area-input").value,
        surveyReference: document.getElementById("survey-ref-input").value,
        northBoundary: document.getElementById("survey-north-input").value,
        southBoundary: document.getElementById("survey-south-input").value,
        eastBoundary: document.getElementById("survey-east-input").value,
        westBoundary: document.getElementById("survey-west-input").value,
        surveyRemarks: document.getElementById("survey-remarks-input").value
    };

    try {
        const res = await window.updateCadastralSurvey(parcelId, surveyData);
        if (res.success) {
            alert(res.message);
            closeModal("modal-update-survey");
            await loadOfficerDashboard();
            await openParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Survey update failed.");
    }
}

function openReportConflictModal() {
    if (!activeWorkspaceParcel) return;
    document.getElementById("conflict-parcel-id").value = activeWorkspaceParcel.parcelId;
    document.getElementById("modal-report-conflict").style.display = "flex";
}

async function handleReportConflictSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("conflict-parcel-id").value;
    const conflictData = {
        type: document.getElementById("conflict-type-select").value,
        severity: document.getElementById("conflict-severity-select").value,
        description: document.getElementById("conflict-desc-input").value
    };

    try {
        const res = await window.reportCadastralConflict(parcelId, conflictData);
        if (res.success) {
            alert(res.message);
            closeModal("modal-report-conflict");
            await loadOfficerDashboard();
            await openParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Conflict reporting failed.");
    }
}

function openAddInspectionModal() {
    if (!activeWorkspaceParcel) return;
    document.getElementById("inspection-parcel-id").value = activeWorkspaceParcel.parcelId;
    document.getElementById("inspection-date-input").value = new Date().toISOString().split("T")[0];
    document.getElementById("modal-add-inspection").style.display = "flex";
}

async function handleAddInspectionSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("inspection-parcel-id").value;
    const inspectionDate = document.getElementById("inspection-date-input").value;
    const remarks = document.getElementById("inspection-remarks-input").value;

    try {
        const res = await window.addCadastralInspection(parcelId, inspectionDate, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-add-inspection");
            await openParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Adding inspection remarks failed.");
    }
}

function openAddDocumentModal() {
    if (!activeWorkspaceParcel) return;
    document.getElementById("doc-parcel-id").value = activeWorkspaceParcel.parcelId;
    document.getElementById("modal-add-document").style.display = "flex";
}

async function handleAddDocumentSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("doc-parcel-id").value;
    const docData = {
        title: document.getElementById("doc-title-input").value,
        documentType: document.getElementById("doc-type-select").value,
        documentNumber: document.getElementById("doc-number-input").value,
        description: document.getElementById("doc-desc-input").value
    };

    try {
        const res = await window.addCadastralDocument(parcelId, docData);
        if (res.success) {
            alert(res.message);
            closeModal("modal-add-document");
            await openParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Document addition failed.");
    }
}

function openRespondRequestModal(requestId) {
    document.getElementById("request-id-input").value = requestId;
    document.getElementById("modal-respond-request").style.display = "flex";
}

async function handleRespondRequestSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("request-id-input").value;
    const responseStatus = document.getElementById("request-status-select").value;
    const remarks = document.getElementById("request-remarks-input").value;

    try {
        const res = await window.respondDepartmentRequest(requestId, responseStatus, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-respond-request");
            await loadOfficerDashboard();
        }
    } catch (err) {
        alert(err.message || "Responding to request failed.");
    }
}

/* RoR MODAL HANDLERS */
function openVerifyOwnershipModal() {
    if (!activeRoRParcel) return;
    document.getElementById("verify-ror-parcel-id").value = activeRoRParcel.parcelId;
    document.getElementById("verify-ror-label").value = `${activeRoRParcel.parcelId} — Owner: ${activeRoRParcel.rightsHolder || activeRoRParcel.ownerName} (${activeRoRParcel.recordNumber || 'ROR-2026-001'})`;
    document.getElementById("modal-verify-ownership").style.display = "flex";
}

async function handleVerifyOwnershipSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("verify-ror-parcel-id").value;
    const verificationResult = document.getElementById("verify-ror-result-select").value;
    const remarks = document.getElementById("verify-ror-remarks").value;

    try {
        const res = await window.verifyOwnership(parcelId, verificationResult, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-verify-ownership");
            await loadOfficerDashboard();
            await openRoRParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Ownership verification failed.");
    }
}

function openApproveMutationModal(mutationId = null) {
    if (!activeRoRParcel && !mutationId) return;
    const targetMut = activeRoRParcel && activeRoRParcel.mutations ? activeRoRParcel.mutations[0] : null;
    const mutId = mutationId || (targetMut ? targetMut.mutationId : "MUT-2026-008");

    document.getElementById("approve-mutation-id").value = mutId;
    document.getElementById("approve-mutation-label").value = `${mutId} (Parcel: ${activeRoRParcel ? activeRoRParcel.parcelId : 'LND-001'})`;

    const cadStatus = activeRoRParcel && activeRoRParcel.cadastralVerification ? activeRoRParcel.cadastralVerification.boundaryStatus : "Pending";
    const rorStatus = activeRoRParcel ? activeRoRParcel.rorStatus : "Pending";
    const openDisputes = activeRoRParcel && activeRoRParcel.disputes ? activeRoRParcel.disputes.filter(d => d.status === "OPEN") : [];

    const cadOk = (cadStatus || "").toLowerCase() === "verified";
    const rorOk = (rorStatus || "").toLowerCase() === "verified";
    const disputeOk = openDisputes.length === 0;

    const prereqBox = document.getElementById("approve-mutation-prerequisites");
    prereqBox.innerHTML = `
        <div>${cadOk ? '✓' : '❌'} <strong>Cadastral Verification:</strong> ${cadStatus}</div>
        <div>${rorOk ? '✓' : '❌'} <strong>Ownership Verification:</strong> ${rorStatus}</div>
        <div>${disputeOk ? '✓' : '❌'} <strong>Dispute Check:</strong> ${openDisputes.length > 0 ? openDisputes.length + ' Open Dispute(s)' : 'Clear'}</div>
    `;

    const confirmBtn = document.getElementById("btn-confirm-approve-mutation");
    if (cadOk && rorOk && disputeOk) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.innerText = "Execute Mutation & Transfer Ownership";
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.innerText = "Approval Blocked — Complete Prerequisite Verifications";
    }

    document.getElementById("modal-approve-mutation").style.display = "flex";
}

async function handleApproveMutationSubmit(e) {
    e.preventDefault();
    const mutationId = document.getElementById("approve-mutation-id").value;
    const remarks = document.getElementById("approve-mutation-remarks").value;

    try {
        const res = await window.approveMutation(mutationId, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-approve-mutation");
            await loadOfficerDashboard();
            if (activeRoRParcel) await openRoRParcelWorkspace(activeRoRParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Mutation approval failed.");
    }
}

function openRejectMutationModal(mutationId = null) {
    const mutId = mutationId || (activeMutation ? activeMutation.mutationId : "MUT-2026-008");
    document.getElementById("reject-mutation-id").value = mutId;
    document.getElementById("modal-reject-mutation").style.display = "flex";
}

async function handleRejectMutationSubmit(e) {
    e.preventDefault();
    const mutationId = document.getElementById("reject-mutation-id").value;
    const rejectionReason = document.getElementById("reject-reason-select").value;
    const remarks = document.getElementById("reject-mutation-remarks").value;

    try {
        const res = await window.rejectMutation(mutationId, rejectionReason, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-reject-mutation");
            await loadOfficerDashboard();
            if (activeRoRParcel) await openRoRParcelWorkspace(activeRoRParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Mutation rejection failed.");
    }
}

function openRequestInfoModal(mutationId = null) {
    const mutId = mutationId || (activeMutation ? activeMutation.mutationId : "MUT-2026-008");
    document.getElementById("reqinfo-mutation-id").value = mutId;
    document.getElementById("modal-request-info").style.display = "flex";
}

async function handleRequestInfoSubmit(e) {
    e.preventDefault();
    const mutationId = document.getElementById("reqinfo-mutation-id").value;
    const infoRequired = document.getElementById("reqinfo-input").value;
    const reason = document.getElementById("reqinfo-reason").value;

    try {
        const res = await window.requestMutationInformation(mutationId, infoRequired, reason);
        if (res.success) {
            alert(res.message);
            closeModal("modal-request-info");
            await loadOfficerDashboard();
            if (activeRoRParcel) await openRoRParcelWorkspace(activeRoRParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Information request failed.");
    }
}

function openReportOwnershipDisputeModal() {
    if (!activeRoRParcel) return;
    document.getElementById("dispute-ror-parcel-id").value = activeRoRParcel.parcelId;
    document.getElementById("modal-report-ownership-dispute").style.display = "flex";
}

async function handleReportOwnershipDisputeSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("dispute-ror-parcel-id").value;
    const disputeData = {
        type: document.getElementById("dispute-type-select").value,
        severity: document.getElementById("dispute-severity-select").value,
        description: document.getElementById("dispute-desc-input").value
    };

    try {
        const res = await window.reportOwnershipDispute(parcelId, disputeData);
        if (res.success) {
            alert(res.message);
            closeModal("modal-report-ownership-dispute");
            await loadOfficerDashboard();
            await openRoRParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "Dispute recording failed.");
    }
}

function openCorrectRoRModal() {
    if (!activeRoRParcel) return;
    document.getElementById("correct-ror-parcel-id").value = activeRoRParcel.parcelId;
    document.getElementById("correct-owner-input").value = activeRoRParcel.rightsHolder || activeRoRParcel.ownerName || "";
    document.getElementById("correct-type-select").value = activeRoRParcel.ownershipType || "Individual";
    document.getElementById("correct-share-input").value = activeRoRParcel.ownershipShare || "100%";
    document.getElementById("correct-possession-input").value = activeRoRParcel.possessionStatus || "Self";
    document.getElementById("correct-ror-num-input").value = activeRoRParcel.recordNumber || "ROR-2026-001";
    document.getElementById("modal-correct-ror").style.display = "flex";
}

async function handleCorrectRoRSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("correct-ror-parcel-id").value;
    const correctionData = {
        ownerName: document.getElementById("correct-owner-input").value,
        ownershipType: document.getElementById("correct-type-select").value,
        ownershipShare: document.getElementById("correct-share-input").value,
        possessionStatus: document.getElementById("correct-possession-input").value,
        rorNumber: document.getElementById("correct-ror-num-input").value,
        correctionRemarks: document.getElementById("correct-remarks-input").value
    };

    try {
        const res = await window.correctRoRRecord(parcelId, correctionData);
        if (res.success) {
            alert(res.message);
            closeModal("modal-correct-ror");
            await loadOfficerDashboard();
            await openRoRParcelWorkspace(parcelId);
        }
    } catch (err) {
        alert(err.message || "RoR record correction failed.");
    }
}

/* REGISTRATION MODAL HANDLERS */
function openVerifyDeedModal() {
    if (!activeRegParcel) return;
    document.getElementById("verify-deed-reg-id").value = activeRegParcel.registrationId;
    document.getElementById("verify-deed-label").value = `${activeRegParcel.registrationId} — ${activeRegParcel.documentType} (Parcel: ${activeRegParcel.parcelId})`;
    document.getElementById("modal-verify-deed").style.display = "flex";
}

async function handleVerifyDeedSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("verify-deed-reg-id").value;
    const verificationResult = document.getElementById("verify-deed-result-select").value;
    const remarks = document.getElementById("verify-deed-remarks").value;

    try {
        const res = await window.verifyDeed(regId, verificationResult, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-verify-deed");
            await loadOfficerDashboard();
            await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Deed verification failed.");
    }
}

function openVerifyStampDutyModal() {
    if (!activeRegParcel) return;
    document.getElementById("stamp-duty-reg-id").value = activeRegParcel.registrationId;
    document.getElementById("stamp-duty-ref-input").value = activeRegParcel.paymentReference || "PAY-STAMP-2026-8891";
    document.getElementById("modal-verify-stamp-duty").style.display = "flex";
}

async function handleVerifyStampDutySubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("stamp-duty-reg-id").value;
    const paymentRef = document.getElementById("stamp-duty-ref-input").value;
    const remarks = document.getElementById("stamp-duty-remarks-input").value;

    try {
        const res = await window.verifyStampDuty(regId, paymentRef, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-verify-stamp-duty");
            await loadOfficerDashboard();
            await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Stamp duty verification failed.");
    }
}

function openEncumbranceCheckModal() {
    if (!activeRegParcel) return;
    document.getElementById("encumbrance-reg-id").value = activeRegParcel.registrationId;
    document.getElementById("modal-encumbrance-check").style.display = "flex";
}

async function handleEncumbranceCheckSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("encumbrance-reg-id").value;
    const remarks = document.getElementById("encumbrance-remarks-input").value;

    try {
        const res = await window.performEncumbranceCheck(regId, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-encumbrance-check");
            await loadOfficerDashboard();
            await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Encumbrance check failed.");
    }
}

function openRequestTaxClearanceModal() {
    if (!activeRegParcel) return;
    document.getElementById("taxreq-reg-id").value = activeRegParcel.registrationId;
    document.getElementById("modal-request-tax-clearance").style.display = "flex";
}

async function handleRequestTaxClearanceSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("taxreq-reg-id").value;
    const remarks = document.getElementById("taxreq-remarks-input").value;

    try {
        const res = await window.requestTaxClearance(regId, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-request-tax-clearance");
            await loadOfficerDashboard();
            await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Tax clearance request failed.");
    }
}

function openApproveRegistrationModal() {
    if (!activeRegParcel) return;
    const regId = activeRegParcel.registrationId;
    document.getElementById("approve-reg-id").value = regId;
    document.getElementById("approve-reg-label").value = `${regId} (Parcel ${activeRegParcel.parcelId} — ${activeRegParcel.currentOwner} -> ${activeRegParcel.proposedOwner})`;

    const chk = activeRegParcel.checklist || {};
    const items = [
        { label: "Cadastral Boundary Verification", val: chk.cadastral },
        { label: "RoR Ownership Title Verification", val: chk.ror },
        { label: "Sale Deed Attestation", val: chk.deed },
        { label: "Stamp Duty & Fee Payment", val: chk.stampDuty },
        { label: "Encumbrance Search", val: chk.encumbrance },
        { label: "Property Tax Municipal Dues Clearance", val: chk.taxClearance },
        { label: "Land Use Alignment", val: chk.landUse },
        { label: "Restrictions Compliance", val: chk.restrictions }
    ];

    let allPass = true;
    const prereqBox = document.getElementById("approve-reg-prerequisites");
    prereqBox.innerHTML = items.map(i => {
        const isPass = (i.val || "").toUpperCase() === "VERIFIED" || (i.val || "").toUpperCase() === "CLEARED" || (i.val || "").toUpperCase() === "CLEAR";
        if (!isPass) allPass = false;
        return `<div>${isPass ? '✓' : '❌'} <strong>${i.label}:</strong> ${i.val || 'PENDING'}</div>`;
    }).join('');

    const confirmBtn = document.getElementById("btn-confirm-approve-reg");
    if (allPass) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.innerText = "Execute Property Transfer & Notify RoR";
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.innerText = "Approval Blocked — 8-Point Prerequisites Incomplete";
    }

    document.getElementById("modal-approve-registration").style.display = "flex";
}

async function handleApproveRegistrationSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("approve-reg-id").value;
    const remarks = document.getElementById("approve-reg-remarks").value;

    try {
        const res = await window.approveRegistrationTransfer(regId, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-approve-registration");
            await loadOfficerDashboard();
            if (activeRegParcel) await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Registration approval failed.");
    }
}

function openRejectRegistrationModal() {
    if (!activeRegParcel) return;
    document.getElementById("reject-reg-id").value = activeRegParcel.registrationId;
    document.getElementById("modal-reject-registration").style.display = "flex";
}

async function handleRejectRegistrationSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("reject-reg-id").value;
    const rejectionReason = document.getElementById("reject-reg-reason-select").value;
    const remarks = document.getElementById("reject-reg-remarks").value;

    try {
        const res = await window.rejectRegistration(regId, rejectionReason, remarks);
        if (res.success) {
            alert(res.message);
            closeModal("modal-reject-registration");
            await loadOfficerDashboard();
            if (activeRegParcel) await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Registration rejection failed.");
    }
}

function openRequestRegInfoModal() {
    if (!activeRegParcel) return;
    document.getElementById("reqreg-id").value = activeRegParcel.registrationId;
    document.getElementById("modal-request-reg-info").style.display = "flex";
}

async function handleRequestRegInfoSubmit(e) {
    e.preventDefault();
    const regId = document.getElementById("reqreg-id").value;
    const infoRequired = document.getElementById("reqreg-info-input").value;
    const reason = document.getElementById("reqreg-reason-input").value;

    try {
        const res = await window.requestRegistrationInformation(regId, infoRequired, reason);
        if (res.success) {
            alert(res.message);
            closeModal("modal-request-reg-info");
            await loadOfficerDashboard();
            if (activeRegParcel) await openRegistrationCaseWorkspace(activeRegParcel.parcelId);
        }
    } catch (err) {
        alert(err.message || "Information request failed.");
    }
}

/* --- LEGACY DEPARTMENT FALLBACK --- */
function renderLegacyDepartmentTable(officerType, data) {
    const container = document.getElementById("work-queue-table-container");
    if (officerType === "land_use_officer") {
        const convs = data.conversions || [];
        container.innerHTML = `
            <table class="table-govt">
                <thead><tr><th>Conversion ID</th><th>Parcel ID</th><th>From Zone</th><th>To Zone</th><th>Status</th></tr></thead>
                <tbody>
                    ${convs.map(c => `
                        <tr>
                            <td><strong>${c.conversionId}</strong></td>
                            <td>${c.parcelId}</td>
                            <td>${c.fromZone || c.currentZone}</td>
                            <td>${c.toZone || c.requestedZone}</td>
                            <td><span class="status-tag status-review">${c.status}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

/* --- 14. LAND USE WORK QUEUE & ASSIGNED PARCELS RENDERERS --- */
function renderLandUseWorkQueue(workQueue = []) {
    const container = document.getElementById("work-queue-table-container");
    const headerTitle = document.getElementById("work-queue-card-title");
    const countBadge = document.getElementById("work-queue-count");
    const casesTitle = document.getElementById("cases-card-title");

    if (headerTitle) headerTitle.textContent = "📋 PENDING LAND USE & PLANNING WORK";
    if (countBadge) countBadge.textContent = `${workQueue.length} items`;
    if (casesTitle) casesTitle.textContent = "📁 ACTIVE PLANNING CASES";

    if (!container) return;

    if (!workQueue || workQueue.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">No pending land use conversion requests.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>Parcel</th>
                    <th>Survey No</th>
                    <th>Current Use</th>
                    <th>Requested Use</th>
                    <th>Zone</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${workQueue.map(w => `
                    <tr>
                        <td><strong>${w.requestId}</strong></td>
                        <td><span class="badge-parcel">${w.parcelId}</span></td>
                        <td>${w.surveyNo || 'SUR-101'}</td>
                        <td><span class="status-tag status-pending">${w.currentUse}</span></td>
                        <td><span class="status-tag status-review">${w.requestedUse}</span></td>
                        <td>${w.zone}</td>
                        <td><span class="priority-${(w.priority || 'high').toLowerCase()}">${w.priority}</span></td>
                        <td><span class="status-tag status-review">${w.status}</span></td>
                        <td>
                            <button class="btn-govt-primary" onclick="openLandUseParcelWorkspace('${w.parcelId}')">Review</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderLandUseAssignedParcels(parcels = []) {
    const container = document.getElementById("assigned-parcels-table-container");
    const headerTitle = document.getElementById("assigned-parcels-card-title");
    const countBadge = document.getElementById("assigned-parcels-count");

    if (headerTitle) headerTitle.textContent = "📐 MY ASSIGNED PARCELS";
    if (countBadge) countBadge.textContent = `${parcels.length} parcels`;

    if (!container) return;

    if (!parcels || parcels.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">No land use parcels assigned.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey Number</th>
                    <th>Owner</th>
                    <th>Area</th>
                    <th>Village</th>
                    <th>District</th>
                    <th>Current Land Use</th>
                    <th>Master Plan Zone</th>
                    <th>Restriction Status</th>
                    <th>Planning Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td><strong>${p.parcelId}</strong></td>
                        <td>${p.surveyNumber}</td>
                        <td>${p.owner}</td>
                        <td>${p.area}</td>
                        <td>${p.village}</td>
                        <td>${p.district}</td>
                        <td><span class="status-tag status-pending">${p.currentLandUse}</span></td>
                        <td>${p.masterPlanZone}</td>
                        <td><span class="status-tag ${(p.restrictionStatus || '').toLowerCase() === 'clear' ? 'status-verified' : 'status-pending'}">${p.restrictionStatus}</span></td>
                        <td><span class="status-tag ${(p.planningStatus || '').toLowerCase() === 'approved' ? 'status-verified' : 'status-review'}">${p.planningStatus}</span></td>
                        <td><button class="btn-govt-secondary" onclick="openLandUseParcelWorkspace('${p.parcelId}')">View</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- 15. LAND USE PARCEL WORKSPACE OPENER --- */
async function openLandUseParcelWorkspace(parcelId) {
    try {
        const res = await window.getLandUseParcelDetail(parcelId);
        if (!res.success) {
            alert(res.message || "Failed to load land use parcel details.");
            return;
        }

        const item = res.data;
        activeParcelId = parcelId;
        const checklist = item.checklist || {};
        const isApprovable = checklist.cadastral === "VERIFIED" && checklist.ror === "VERIFIED" && checklist.zoning !== "INCOMPATIBLE" && checklist.environmental === "CLEAR" && checklist.roadAccess === "AVAILABLE" && checklist.restrictions === "CLEAR";

        document.getElementById("view-overview").style.display = "none";
        const workspaceView = document.getElementById("view-parcel-workspace");
        workspaceView.style.display = "block";

        const titleSpan = document.getElementById("workspace-parcel-title");
        if (titleSpan) titleSpan.textContent = `LAND USE & PLANNING WORKSPACE — PARCEL ${item.parcelId}`;

        // Top Action Panel
        const actionsPanel = document.querySelector(".cadastral-actions-panel");
        if (actionsPanel) {
            actionsPanel.innerHTML = `
                <button class="btn-govt-secondary" onclick="openEnvironmentalCheckModal('${item.parcelId}')">🌱 Verify Environmental Status</button>
                <button class="btn-govt-secondary" onclick="openRoadAccessCheckModal('${item.parcelId}')">🛣 Verify Road Access</button>
                <button class="btn-govt-secondary" onclick="openReviewBuildingPermissionModal('${item.buildingPermission ? item.buildingPermission.applicationNumber || 'BP-2026-001' : 'BP-2026-001'}')">🏗 Review Building Permission</button>
                <button class="btn-govt-warning" onclick="openPlanningConflictModal('${item.parcelId}')">⚠ Report Planning Conflict</button>
                ${isApprovable ? `
                    <button class="btn-govt-primary" style="background:#16a34a; border-color:#16a34a;" onclick="openApproveConversionModal('${item.requestId || 'LU-2026-003'}')">✓ APPROVE CONVERSION</button>
                ` : `
                    <button class="btn-govt-secondary" style="opacity:0.6; cursor:not-allowed;" title="All statutory checklist items must pass before approval" onclick="alert('Conversion cannot be approved: Pending statutory checks in checklist.')">🔒 APPROVE CONVERSION (Prerequisites Pending)</button>
                `}
                <button class="btn-govt-danger" onclick="openRejectConversionModal('${item.requestId || 'LU-2026-003'}')">✕ REJECT CONVERSION</button>
                <button class="btn-govt-secondary" onclick="openRequestLuInfoModal('${item.requestId || 'LU-2026-003'}')">📤 Request Information</button>
            `;
        }

        // Basic Info Box
        const basicInfoBox = document.getElementById("workspace-basic-info");
        if (basicInfoBox) {
            basicInfoBox.innerHTML = `
                <div class="info-box">
                    <div class="info-box-label">PARCEL ID</div>
                    <div class="info-box-val">${item.parcelId}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">SURVEY NUMBER</div>
                    <div class="info-box-val">${item.surveyNumber}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">REQUEST ID</div>
                    <div class="info-box-val">${item.requestId || 'LU-2026-003'}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">APPLICANT</div>
                    <div class="info-box-val">${item.applicantName || 'Demo Applicant'}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">CURRENT LAND USE</div>
                    <div class="info-box-val"><span class="status-tag status-pending">${item.currentLandUse}</span></div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">REQUESTED USE</div>
                    <div class="info-box-val"><span class="status-tag status-review">${item.requestedLandUse}</span></div>
                </div>
            `;
        }

        // Replace Grid View
        const gridView = document.querySelector(".workspace-grid");
        if (gridView) {
            gridView.innerHTML = `
                <!-- 7-POINT PLANNING CLEARANCE CHECKLIST -->
                <div class="govt-card" style="grid-column: 1 / -1;">
                    <div class="govt-card-header">
                        <h3>📑 7-POINT PLANNING CLEARANCE CHECKLIST</h3>
                        <span class="status-tag ${(item.status || '').toLowerCase() === 'approved' ? 'status-verified' : 'status-review'}">${item.status}</span>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
                            Conversion approval requires all mandatory statutory checks (Cadastral, RoR, Zoning, Master Plan, Environmental, Road Access, and Restrictions) to be verified and cleared.
                        </p>
                        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap:0.75rem;">
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">1. Cadastral Boundary Verification</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.cadastral === 'VERIFIED' ? '#4ade80' : '#f87171'};">
                                    ${checklist.cadastral === 'VERIFIED' ? '✓ VERIFIED' : '⏳ PENDING'}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">2. RoR Ownership Title Check</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.ror === 'VERIFIED' ? '#4ade80' : '#f87171'};">
                                    ${checklist.ror === 'VERIFIED' ? '✓ VERIFIED' : '⏳ PENDING'}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">3. Master Plan Zoning Alignment</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.zoning === 'INCOMPATIBLE' ? '#f87171' : '#4ade80'};">
                                    ${checklist.zoning === 'COMPATIBLE' ? '✓ COMPATIBLE' : (checklist.zoning === 'CONDITIONAL' ? '⚠ CONDITIONAL' : '✕ INCOMPATIBLE')}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">4. Master Plan Record Status</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:#4ade80;">
                                    ✓ ${item.masterPlanStatus || 'Approved Plan 2026-2035'}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">5. Environmental & Buffer Check</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.environmental === 'CLEAR' ? '#4ade80' : '#fbbf24'};">
                                    ${checklist.environmental === 'CLEAR' ? '✓ CLEAR' : (checklist.environmental === 'REVIEW_REQUIRED' ? '⚠ REVIEW REQUIRED' : '⏳ PENDING')}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">6. Road Access & Setback Check</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.roadAccess === 'AVAILABLE' ? '#4ade80' : '#fbbf24'};">
                                    ${checklist.roadAccess === 'AVAILABLE' ? '✓ AVAILABLE' : '⏳ PENDING'}
                                </div>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border-radius:4px; border:1px solid var(--govt-border);">
                                <div style="font-size:0.75rem; color:#94a3b8;">7. Development Restrictions</div>
                                <div style="font-weight:600; margin-top:0.25rem; color:${checklist.restrictions === 'CLEAR' ? '#4ade80' : '#f87171'};">
                                    ${checklist.restrictions === 'CLEAR' ? '✓ CLEAR' : '⛔ RESTRICTED'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- LAND CONVERSION & MASTER PLAN DETAILS -->
                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>🔄 LAND CONVERSION APPLICATION</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt">
                            <tr><td><strong>Current Land Use:</strong></td><td><span class="status-tag status-pending">${item.currentLandUse}</span></td></tr>
                            <tr><td><strong>Requested Land Use:</strong></td><td><span class="status-tag status-review">${item.requestedLandUse}</span></td></tr>
                            <tr><td><strong>Current Zone:</strong></td><td>${item.currentZone}</td></tr>
                            <tr><td><strong>Requested Zone:</strong></td><td>${item.requestedZone}</td></tr>
                            <tr><td><strong>Applicant Name:</strong></td><td>${item.applicantName || 'Demo Applicant'}</td></tr>
                            <tr><td><strong>Conversion Reason:</strong></td><td>${item.conversionReason || 'Residential development'}</td></tr>
                            <tr><td><strong>Submission Date:</strong></td><td>${item.submissionDate || '2026-08-25'}</td></tr>
                        </table>
                    </div>
                </div>

                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>🏙 MASTER PLAN ZONING INFORMATION</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt">
                            <tr><td><strong>Zoning Code:</strong></td><td><code>${item.zoningCode || 'AGRI-PROTECT-01'}</code></td></tr>
                            <tr><td><strong>Master Plan Zone:</strong></td><td>${item.currentZone}</td></tr>
                            <tr><td><strong>Development Intensity:</strong></td><td>${item.developmentIntensity || 'Medium (FAR 1.5)'}</td></tr>
                            <tr><td><strong>Setback Requirement:</strong></td><td>${item.setbackRequirement || 'Front: 10 ft, Side: 5 ft'}</td></tr>
                            <tr><td><strong>Permitted Uses:</strong></td><td>${(item.permittedUse || []).join(', ')}</td></tr>
                            <tr><td><strong>Restricted Uses:</strong></td><td><span style="color:#f87171;">${(item.restrictedUse || []).join(', ')}</span></td></tr>
                        </table>
                    </div>
                </div>

                <!-- ENVIRONMENTAL & ROAD ACCESS VERIFICATION PANEL -->
                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>🌱 ENVIRONMENTAL & ECO-SENSITIVE STATUS</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt">
                            <tr><td><strong>Environmental Status:</strong></td><td><span class="status-tag ${item.environmentalStatus === 'CLEAR' ? 'status-verified' : 'status-pending'}">${item.environmentalStatus || 'PENDING'}</span></td></tr>
                            <tr><td><strong>Eco-sensitive Distance:</strong></td><td>No eco-sensitive sanctuary within 1km buffer</td></tr>
                            <tr><td><strong>Water Body Restriction:</strong></td><td>Clear (Outside 30m stream buffer)</td></tr>
                            <tr><td><strong>Flood Risk Level:</strong></td><td>Low Flood Risk Zone</td></tr>
                        </table>
                    </div>
                </div>

                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>🛣 ROAD ACCESS & INFRASTRUCTURE</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt">
                            <tr><td><strong>Road Access Status:</strong></td><td><span class="status-tag ${item.roadAccessStatus === 'AVAILABLE' ? 'status-verified' : 'status-pending'}">${item.roadAccessStatus || 'PENDING'}</span></td></tr>
                            <tr><td><strong>Road Width:</strong></td><td>${item.roadWidth || '30 ft Public Panchayati Bitumen Road'}</td></tr>
                            <tr><td><strong>Road Classification:</strong></td><td>${item.roadType || 'Paved Bitumen Road'}</td></tr>
                            <tr><td><strong>Access Restriction:</strong></td><td>None Identified</td></tr>
                        </table>
                    </div>
                </div>

                <!-- BUILDING PERMISSION REVIEW -->
                <div class="govt-card" style="grid-column: 1 / -1;">
                    <div class="govt-card-header">
                        <h3>🏗 BUILDING PERMISSION SCRUTINY</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        ${item.buildingPermission && item.buildingPermission.applicationNumber ? `
                            <table class="table-govt">
                                <thead>
                                    <tr><th>App Number</th><th>Permission Type</th><th>Approved Type</th><th>Max Floors</th><th>Built-Up Area</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>${item.buildingPermission.applicationNumber}</strong></td>
                                        <td>${item.buildingPermission.permissionType}</td>
                                        <td>${item.buildingPermission.approvedBuildingType}</td>
                                        <td>${item.buildingPermission.maximumFloors} Floors</td>
                                        <td>${item.buildingPermission.maximumBuiltUpArea}</td>
                                        <td><span class="status-tag status-verified">${item.buildingPermission.buildingPermissionStatus}</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        ` : `<div style="padding:0.75rem; color:#94a3b8;">No building permission application filed yet.</div>`}
                    </div>
                </div>

                <!-- CHRONOLOGICAL LAND USE HISTORY -->
                <div class="govt-card" style="grid-column: 1 / -1;">
                    <div class="govt-card-header">
                        <h3>📚 CHRONOLOGICAL LAND USE HISTORY</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt">
                            <thead>
                                <tr><th>Year</th><th>Land Use Classification</th><th>Zoning Designation</th><th>Verified By</th><th>Ref Doc</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                ${(item.landUseHistory || []).map(h => `
                                    <tr>
                                        <td><strong>${h.year}</strong></td>
                                        <td>${h.landUse}</td>
                                        <td>${h.zone}</td>
                                        <td>${h.officer}</td>
                                        <td>${h.docRef}</td>
                                        <td><span class="status-tag status-verified">${h.status}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

    } catch (e) {
        console.error("Error opening Land Use parcel workspace:", e);
        alert(e.message || "Failed to open Land Use parcel workspace.");
    }
}

/* --- 16. MODAL OPENERS & SUBMIT HANDLERS --- */
function openEnvironmentalCheckModal(parcelId) {
    document.getElementById("env-parcel-id").value = parcelId;
    document.getElementById("modal-environmental-check").style.display = "flex";
}

async function handleEnvironmentalCheckSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("env-parcel-id").value;
    const status = document.getElementById("env-status-select").value;
    const remarks = document.getElementById("env-remarks-input").value;

    try {
        const res = await window.verifyEnvironmentalStatus(parcelId, status, remarks);
        alert(res.message || "Environmental status updated.");
        closeModal("modal-environmental-check");
        await openLandUseParcelWorkspace(parcelId);
        await loadOfficerDashboard();
    } catch (err) {
        alert(err.message || "Failed to update environmental status.");
    }
}

function openRoadAccessCheckModal(parcelId) {
    document.getElementById("road-parcel-id").value = parcelId;
    document.getElementById("modal-road-access-check").style.display = "flex";
}

async function handleRoadAccessCheckSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("road-parcel-id").value;
    const status = document.getElementById("road-status-select").value;
    const width = document.getElementById("road-width-input").value;
    const remarks = document.getElementById("road-remarks-input").value;

    try {
        const res = await window.verifyRoadAccess(parcelId, status, width, remarks);
        alert(res.message || "Road access status updated.");
        closeModal("modal-road-access-check");
        await openLandUseParcelWorkspace(parcelId);
        await loadOfficerDashboard();
    } catch (err) {
        alert(err.message || "Failed to update road access.");
    }
}

function openPlanningConflictModal(parcelId) {
    document.getElementById("conflict-lu-parcel-id").value = parcelId;
    document.getElementById("modal-planning-conflict").style.display = "flex";
}

async function handlePlanningConflictSubmit(e) {
    e.preventDefault();
    const parcelId = document.getElementById("conflict-lu-parcel-id").value;
    const type = document.getElementById("conflict-lu-type-select").value;
    const severity = document.getElementById("conflict-lu-severity-select").value;
    const description = document.getElementById("conflict-lu-desc-input").value;

    try {
        const res = await window.reportPlanningConflict(parcelId, { type, severity, description });
        alert(res.message || "Planning conflict recorded.");
        closeModal("modal-planning-conflict");
        await openLandUseParcelWorkspace(parcelId);
        await loadOfficerDashboard();
    } catch (err) {
        alert(err.message || "Failed to report conflict.");
    }
}

function openReviewBuildingPermissionModal(applicationId) {
    document.getElementById("bp-app-id").value = applicationId;
    document.getElementById("bp-app-label").value = applicationId;
    document.getElementById("modal-review-building-permission").style.display = "flex";
}

async function handleReviewBuildingPermissionSubmit(e) {
    e.preventDefault();
    const appId = document.getElementById("bp-app-id").value;
    const status = document.getElementById("bp-decision-select").value;
    const remarks = document.getElementById("bp-remarks-input").value;

    try {
        const res = await window.reviewBuildingPermission(appId, status, remarks);
        alert(res.message || "Building permission decision saved.");
        closeModal("modal-review-building-permission");
        await loadOfficerDashboard();
    } catch (err) {
        alert(err.message || "Failed to review building permission.");
    }
}

async function openApproveConversionModal(requestId) {
    document.getElementById("approve-lu-req-id").value = requestId;
    document.getElementById("approve-lu-req-label").value = requestId;

    try {
        const res = await window.getLandUseParcelDetail("LND-001");
        const checklist = res.data ? res.data.checklist || {} : {};
        const prereqBox = document.getElementById("approve-lu-prerequisites");
        prereqBox.innerHTML = `
            <ul style="margin:0; padding-left:1.25rem;">
                <li style="color:${checklist.cadastral === 'VERIFIED' ? '#4ade80' : '#f87171'};">1. Cadastral Boundary: ${checklist.cadastral || 'VERIFIED'}</li>
                <li style="color:${checklist.ror === 'VERIFIED' ? '#4ade80' : '#f87171'};">2. RoR Ownership Title: ${checklist.ror || 'VERIFIED'}</li>
                <li style="color:${checklist.zoning !== 'INCOMPATIBLE' ? '#4ade80' : '#f87171'};">3. Zoning Compatibility: ${checklist.zoning || 'CONDITIONAL'}</li>
                <li style="color:${checklist.environmental === 'CLEAR' ? '#4ade80' : '#fbbf24'};">4. Environmental Status: ${checklist.environmental || 'PENDING'}</li>
                <li style="color:${checklist.roadAccess === 'AVAILABLE' ? '#4ade80' : '#fbbf24'};">5. Road Access: ${checklist.roadAccess || 'PENDING'}</li>
                <li style="color:${checklist.restrictions === 'CLEAR' ? '#4ade80' : '#f87171'};">6. Restrictions Check: ${checklist.restrictions || 'CLEAR'}</li>
            </ul>
        `;
    } catch (e) {
        console.error("Error loading prerequisites preview:", e);
    }

    document.getElementById("modal-approve-conversion").style.display = "flex";
}

async function handleApproveConversionSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("approve-lu-req-id").value;
    const remarks = document.getElementById("approve-lu-remarks").value;

    try {
        const res = await window.approveLandUseConversionReq(requestId, remarks);
        alert(res.message || "Land use conversion approved!");
        closeModal("modal-approve-conversion");
        await loadOfficerDashboard();
        document.getElementById("officer-workspace-detail").style.display = "none";
    } catch (err) {
        alert(err.message || "Failed to approve land use conversion.");
    }
}

function openRejectConversionModal(requestId) {
    document.getElementById("reject-lu-req-id").value = requestId;
    document.getElementById("modal-reject-conversion").style.display = "flex";
}

async function handleRejectConversionSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("reject-lu-req-id").value;
    const reason = document.getElementById("reject-lu-reason-select").value;
    const remarks = document.getElementById("reject-lu-remarks").value;

    try {
        const res = await window.rejectLandUseConversionReq(requestId, reason, remarks);
        alert(res.message || "Conversion request rejected.");
        closeModal("modal-reject-conversion");
        await loadOfficerDashboard();
        document.getElementById("officer-workspace-detail").style.display = "none";
    } catch (err) {
        alert(err.message || "Failed to reject conversion.");
    }
}

function openRequestLuInfoModal(requestId) {
    document.getElementById("reqlu-id").value = requestId;
    document.getElementById("modal-request-lu-info").style.display = "flex";
}

async function handleRequestLuInfoSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("reqlu-id").value;
    const info = document.getElementById("reqlu-info-input").value;
    const reason = document.getElementById("reqlu-reason-input").value;

    try {
        const res = await window.requestLandUseInformation(requestId, info, reason);
        alert(res.message || "Information request submitted.");
        closeModal("modal-request-lu-info");
        await loadOfficerDashboard();
    } catch (err) {
        alert(err.message || "Failed to request information.");
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.AuthManager.clearSession();
    window.location.href = "login.html";
}

// Global Exports
window.switchOfficerTab = switchOfficerTab;
window.openParcelWorkspace = openParcelWorkspace;
window.openRoRParcelWorkspace = openRoRParcelWorkspace;
window.openRegistrationCaseWorkspace = openRegistrationCaseWorkspace;
window.openLandUseParcelWorkspace = openLandUseParcelWorkspace;
window.closeModal = closeModal;

window.openVerifyBoundaryModal = openVerifyBoundaryModal;
window.handleVerifyBoundarySubmit = handleVerifyBoundarySubmit;
window.openUpdateSurveyModal = openUpdateSurveyModal;
window.handleUpdateSurveySubmit = handleUpdateSurveySubmit;
window.openReportConflictModal = openReportConflictModal;
window.handleReportConflictSubmit = handleReportConflictSubmit;
window.openAddInspectionModal = openAddInspectionModal;
window.handleAddInspectionSubmit = handleAddInspectionSubmit;
window.openAddDocumentModal = openAddDocumentModal;
window.handleAddDocumentSubmit = handleAddDocumentSubmit;
window.openRespondRequestModal = openRespondRequestModal;
window.handleRespondRequestSubmit = handleRespondRequestSubmit;

window.openVerifyOwnershipModal = openVerifyOwnershipModal;
window.handleVerifyOwnershipSubmit = handleVerifyOwnershipSubmit;
window.openApproveMutationModal = openApproveMutationModal;
window.handleApproveMutationSubmit = handleApproveMutationSubmit;
window.openRejectMutationModal = openRejectMutationModal;
window.handleRejectMutationSubmit = handleRejectMutationSubmit;
window.openRequestInfoModal = openRequestInfoModal;
window.handleRequestInfoSubmit = handleRequestInfoSubmit;
window.openReportOwnershipDisputeModal = openReportOwnershipDisputeModal;
window.handleReportOwnershipDisputeSubmit = handleReportOwnershipDisputeSubmit;
window.openCorrectRoRModal = openCorrectRoRModal;
window.handleCorrectRoRSubmit = handleCorrectRoRSubmit;
window.handleVerifyDocAction = handleVerifyDocAction;

window.openVerifyDeedModal = openVerifyDeedModal;
window.handleVerifyDeedSubmit = handleVerifyDeedSubmit;
window.openVerifyStampDutyModal = openVerifyStampDutyModal;
window.handleVerifyStampDutySubmit = handleVerifyStampDutySubmit;
window.openEncumbranceCheckModal = openEncumbranceCheckModal;
window.handleEncumbranceCheckSubmit = handleEncumbranceCheckSubmit;
window.openRequestTaxClearanceModal = openRequestTaxClearanceModal;
window.handleRequestTaxClearanceSubmit = handleRequestTaxClearanceSubmit;
window.openApproveRegistrationModal = openApproveRegistrationModal;
window.handleApproveRegistrationSubmit = handleApproveRegistrationSubmit;
window.openRejectRegistrationModal = openRejectRegistrationModal;
window.handleRejectRegistrationSubmit = handleRejectRegistrationSubmit;
window.openRequestRegInfoModal = openRequestRegInfoModal;
window.handleRequestRegInfoSubmit = handleRequestRegInfoSubmit;

/* --- 15. PROPERTY TAX WORK QUEUE & ASSIGNED PARCELS RENDERERS --- */
function renderPropertyTaxWorkQueue(workQueue = []) {
    const container = document.getElementById("work-queue-table-container");
    const headerTitle = document.getElementById("work-queue-card-title");
    const countBadge = document.getElementById("work-queue-count");
    const casesTitle = document.getElementById("cases-card-title");

    if (headerTitle) headerTitle.textContent = "📋 PENDING PROPERTY TAX WORK";
    if (countBadge) countBadge.textContent = `${workQueue.length} items`;
    if (casesTitle) casesTitle.textContent = "📁 ACTIVE TAX CASES";

    if (!container) return;

    if (!workQueue || workQueue.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">No pending property tax clearance or assessment requests.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Request ID</th>
                    <th>Parcel</th>
                    <th>Survey No</th>
                    <th>Property Type</th>
                    <th>Tax Demand</th>
                    <th>Amount Paid</th>
                    <th>Outstanding</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${workQueue.map(w => `
                    <tr>
                        <td><strong>${w.requestId}</strong></td>
                        <td><span class="badge-parcel">${w.parcelId}</span></td>
                        <td>${w.surveyNo || 'SUR-101'}</td>
                        <td>${w.propertyType}</td>
                        <td>₹ ${(w.taxDemand || 0).toLocaleString()}</td>
                        <td>₹ ${(w.amountPaid || 0).toLocaleString()}</td>
                        <td><span class="${w.outstandingAmount > 0 ? 'priority-high' : 'status-tag status-verified'}">₹ ${(w.outstandingAmount || 0).toLocaleString()}</span></td>
                        <td><span class="priority-${(w.priority || 'high').toLowerCase()}">${w.priority}</span></td>
                        <td><span class="status-tag ${(w.status || '').toLowerCase() === 'cleared' ? 'status-verified' : 'status-pending'}">${w.status}</span></td>
                        <td>
                            <button class="btn-govt-primary" onclick="openPropertyTaxParcelWorkspace('${w.parcelId}')">Review</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPropertyTaxAssignedParcels(parcels = []) {
    const container = document.getElementById("assigned-parcels-table-container");
    const headerTitle = document.getElementById("assigned-parcels-card-title");
    const countBadge = document.getElementById("assigned-parcels-count");

    if (headerTitle) headerTitle.textContent = "📐 MY ASSIGNED PARCELS";
    if (countBadge) countBadge.textContent = `${parcels.length} parcels`;

    if (!container) return;

    if (!parcels || parcels.length === 0) {
        container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: #94a3b8;">No property tax parcels assigned.</div>`;
        return;
    }

    container.innerHTML = `
        <table class="table-govt">
            <thead>
                <tr>
                    <th>Parcel ID</th>
                    <th>Survey Number</th>
                    <th>Owner</th>
                    <th>District</th>
                    <th>Village</th>
                    <th>Land Type</th>
                    <th>Tax Status</th>
                    <th>Outstanding Amount</th>
                    <th>Assessment Status</th>
                    <th>Municipal Status</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${parcels.map(p => `
                    <tr>
                        <td><strong>${p.parcelId}</strong></td>
                        <td>${p.surveyNumber}</td>
                        <td>${p.owner || 'N/A'}</td>
                        <td>${p.district || 'Coimbatore'}</td>
                        <td>${p.village || 'Demo Village'}</td>
                        <td>${p.landType || 'Agricultural'}</td>
                        <td><span class="status-tag ${(p.taxStatus || '').toLowerCase() === 'cleared' ? 'status-verified' : 'status-pending'}">${p.taxStatus || 'Pending'}</span></td>
                        <td><span class="${p.outstandingAmount > 0 ? 'priority-high' : 'status-tag status-verified'}">₹ ${(p.outstandingAmount || 0).toLocaleString()}</span></td>
                        <td><span class="status-tag ${(p.assessmentStatus || '').toLowerCase() === 'verified' ? 'status-verified' : 'status-review'}">${p.assessmentStatus || 'Pending'}</span></td>
                        <td><span class="status-tag status-verified">${p.municipalStatus || 'VERIFIED'}</span></td>
                        <td>
                            <button class="btn-govt-secondary" onclick="openPropertyTaxParcelWorkspace('${p.parcelId}')">View</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

/* --- 16. PROPERTY TAX WORKSPACE DETAILED VIEW --- */
async function openPropertyTaxParcelWorkspace(parcelId) {
    try {
        const res = await window.getPropertyTaxParcelDetail(parcelId);
        if (!res.success) {
            alert(res.message || "Failed to load parcel workspace.");
            return;
        }

        const data = res.data;
        activeParcelId = parcelId;

        document.getElementById("view-overview").style.display = "none";
        const workspaceView = document.getElementById("view-parcel-workspace");
        workspaceView.style.display = "block";

        const titleSpan = document.getElementById("workspace-parcel-title");
        if (titleSpan) titleSpan.textContent = `PROPERTY TAX & MUNICIPAL WORKSPACE — PARCEL ${parcelId}`;

        // Top Action Panel
        const actionsPanel = document.querySelector(".cadastral-actions-panel");
        if (actionsPanel) {
            const isOutstanding = (data.outstandingAmount || 0) > 0;
            actionsPanel.innerHTML = `
                <button class="btn-govt-secondary" onclick="openVerifyAssessmentModal('${data.assessmentId}')">✓ Verify Assessment</button>
                <button class="btn-govt-secondary" onclick="openVerifyTaxPaymentModal('${data.paymentReference || data.parcelId}')">💰 Verify Tax Payment</button>
                <button class="btn-govt-primary" onclick="openApproveTaxClearanceModal('${data.requestId || data.parcelId}')" ${isOutstanding ? 'title="Blocked: Dues Outstanding"' : ''}>🧾 APPROVE TAX CLEARANCE</button>
                <button class="btn-govt-danger" onclick="openRejectTaxClearanceModal('${data.requestId || data.parcelId}')">✕ REJECT CLEARANCE</button>
                <button class="btn-govt-warning" onclick="openRequestTaxInfoModal('${data.requestId || data.parcelId}')">📤 Request Information</button>
            `;
        }

        // Basic Info Box
        const basicInfoBox = document.getElementById("workspace-basic-info");
        if (basicInfoBox) {
            basicInfoBox.innerHTML = `
                <div class="info-box">
                    <div class="info-box-label">PARCEL ID</div>
                    <div class="info-box-val">${data.parcelId}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">SURVEY NUMBER</div>
                    <div class="info-box-val">${data.surveyNumber || 'SUR-101'}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">ASSESSMENT NUMBER</div>
                    <div class="info-box-val">${data.assessmentId}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">PROPERTY TYPE</div>
                    <div class="info-box-val">${data.propertyType}</div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">TAX CLEARANCE STATUS</div>
                    <div class="info-box-val"><span class="status-tag ${data.taxClearanceStatus === 'CLEARED' ? 'status-verified' : 'status-pending'}">${data.taxClearanceStatus}</span></div>
                </div>
                <div class="info-box">
                    <div class="info-box-label">OUTSTANDING DUES</div>
                    <div class="info-box-val" style="color: ${data.outstandingAmount > 0 ? '#ef4444' : '#22c55e'}; font-weight:700;">₹ ${(data.outstandingAmount || 0).toLocaleString()}</div>
                </div>
            `;
        }

        // Replace Grid View with Integrated Property Tax & Municipal Case View
        const gridView = document.querySelector(".workspace-grid");
        if (gridView) {
            const v = data.verificationStatus || {};
            const utils = data.utilitiesStatus || {};
            const isOutstanding = (data.outstandingAmount || 0) > 0;

            gridView.innerHTML = `
                <!-- DEPARTMENT VERIFICATION MATRIX -->
                <div class="govt-card" style="grid-column: 1 / -1;">
                    <div class="govt-card-header">
                        <h3>🏛 DEPARTMENTAL INTEGRATED CLEARANCE CHECKLIST</h3>
                        <span class="status-tag ${data.taxClearanceStatus === 'CLEARED' ? 'status-verified' : 'status-pending'}">${data.taxClearanceStatus}</span>
                    </div>
                    <div class="govt-card-body" style="padding: 1rem;">
                        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.75rem; text-align: center;">
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">CADASTRAL</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Boundary</div>
                                <span class="status-tag status-verified" style="margin-top:0.35rem; display:inline-block;">${v.cadastral || 'PASS'}</span>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">RoR TITLE</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Ownership</div>
                                <span class="status-tag status-verified" style="margin-top:0.35rem; display:inline-block;">${v.ror || 'PASS'}</span>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">REGISTRATION</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Deed Status</div>
                                <span class="status-tag status-verified" style="margin-top:0.35rem; display:inline-block;">${v.registration || 'PASS'}</span>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">LAND USE</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Zoning</div>
                                <span class="status-tag status-verified" style="margin-top:0.35rem; display:inline-block;">${v.landUse || 'PASS'}</span>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">TAX ASSESSMENT</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Valuation</div>
                                <span class="status-tag ${data.assessmentStatus === 'VERIFIED' ? 'status-verified' : 'status-review'}" style="margin-top:0.35rem; display:inline-block;">${v.assessment || 'PASS'}</span>
                            </div>
                            <div style="background:#0f172a; padding:0.75rem; border:1px solid var(--govt-border); border-radius:4px;">
                                <div style="font-size:0.75rem; color:#94a3b8; font-weight:700;">TAX CLEARANCE</div>
                                <div style="font-size:0.9rem; margin-top:0.35rem; color: #38bdf8;">Zero Dues</div>
                                <span class="status-tag ${data.outstandingAmount === 0 ? 'status-verified' : 'status-pending'}" style="margin-top:0.35rem; display:inline-block;">${v.taxClearance || 'PASS'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- TAX RECORD & ASSESSMENT DETAILS CARD -->
                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>📊 TAX RECORD & ASSESSMENT DEMAND</h3>
                        <span class="status-tag status-verified">${data.assessmentStatus}</span>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        ${isOutstanding ? `
                            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid #ef4444; color: #fca5a5; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.85rem; font-weight: 600;">
                                ⚠ TAX CLEARANCE BLOCKED: Outstanding tax dues of ₹ ${(data.outstandingAmount || 0).toLocaleString()} detected. Clearance certificate cannot be issued until full payment is verified.
                            </div>
                        ` : `
                            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #86efac; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.85rem; font-weight: 600;">
                                ✓ ALL TAX DUES CLEARED: Zero outstanding dues on record for Tax Year ${data.taxYear}. Eligible for tax clearance certificate order.
                            </div>
                        `}
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; font-size:0.85rem;">
                            <div><strong>Assessment ID:</strong> ${data.assessmentId}</div>
                            <div><strong>Tax Year:</strong> ${data.taxYear}</div>
                            <div><strong>Property Type:</strong> ${data.propertyType}</div>
                            <div><strong>Payment Status:</strong> <span class="status-tag ${data.paymentStatus === 'Paid' ? 'status-verified' : 'status-review'}">${data.paymentStatus}</span></div>
                            <div><strong>Annual Tax Demand:</strong> ₹ ${(data.taxDemand || data.annualTax || 0).toLocaleString()}</div>
                            <div><strong>Amount Paid:</strong> ₹ ${(data.amountPaid || 0).toLocaleString()}</div>
                            <div><strong>Outstanding Dues:</strong> <span style="color:${data.outstandingAmount > 0 ? '#ef4444' : '#22c55e'}; font-weight:700;">₹ ${(data.outstandingAmount || 0).toLocaleString()}</span></div>
                            <div><strong>Penalty / Interest:</strong> ₹ ${(data.penalty || 0).toLocaleString()}</div>
                            <div><strong>Payment Reference:</strong> ${data.paymentReference || 'N/A'}</div>
                            <div><strong>Transaction Ref:</strong> ${data.transactionReference || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                <!-- MUNICIPAL PROPERTY & UTILITIES CARD -->
                <div class="govt-card">
                    <div class="govt-card-header">
                        <h3>🏢 MUNICIPAL PROPERTY & UTILITIES INFRASTRUCTURE</h3>
                        <span class="status-tag status-verified">Municipal Verified</span>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.75rem; font-size:0.85rem; margin-bottom:1rem;">
                            <div><strong>Municipal Property ID:</strong> ${data.municipalPropertyId || 'MUN-PROP-001'}</div>
                            <div><strong>Land Area:</strong> ${data.landArea}</div>
                            <div><strong>Built-up Area:</strong> ${data.builtUpArea}</div>
                            <div><strong>Floors:</strong> ${data.numberOfFloors || 1} Floors</div>
                            <div><strong>Building Status:</strong> ${data.buildingStatus}</div>
                            <div><strong>Road Access:</strong> ${data.roadAccess}</div>
                        </div>
                        <h4 style="font-size:0.85rem; color:#38bdf8; margin-bottom:0.5rem; border-bottom:1px solid var(--govt-border); padding-bottom:0.25rem;">🚰 MUNICIPAL UTILITIES INFRASTRUCTURE</h4>
                        <div style="font-size:0.825rem; display:flex; flex-direction:column; gap:0.35rem;">
                            <div>💧 <strong>Water Connection:</strong> ${utils.water || 'AVAILABLE (Municipal Tap)'}</div>
                            <div>⚡ <strong>Electricity Connection:</strong> ${utils.electricity || 'AVAILABLE (TNEB Connection)'}</div>
                            <div>🚽 <strong>Sewerage Connection:</strong> ${utils.sewerage || 'AVAILABLE (Underground Sewerage System)'}</div>
                        </div>
                    </div>
                </div>

                <!-- CHRONOLOGICAL TAX HISTORY & AUDIT TRAIL -->
                <div class="govt-card" style="grid-column: 1 / -1;">
                    <div class="govt-card-header">
                        <h3>📚 CHRONOLOGICAL TAX PAYMENT HISTORY & AUDIT LOG</h3>
                    </div>
                    <div class="govt-card-body" style="padding:1rem;">
                        <table class="table-govt" style="margin-bottom:1rem;">
                            <thead>
                                <tr>
                                    <th>Tax Year</th>
                                    <th>Demand</th>
                                    <th>Paid</th>
                                    <th>Outstanding</th>
                                    <th>Status</th>
                                    <th>Payment Ref</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${(data.taxHistory || []).map(h => `
                                    <tr>
                                        <td><strong>${h.year}</strong></td>
                                        <td>₹ ${(h.demand || 0).toLocaleString()}</td>
                                        <td>₹ ${(h.paid || 0).toLocaleString()}</td>
                                        <td>₹ ${(h.outstanding || 0).toLocaleString()}</td>
                                        <td><span class="status-tag status-verified">${h.status}</span></td>
                                        <td>${h.paymentRef || 'PAY-TAX-HIST'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

    } catch (e) {
        console.error("Error opening Property Tax workspace:", e);
        alert(e.message || "Failed to open Property Tax workspace.");
    }
}

/* --- 17. PROPERTY TAX MODAL SUBMIT HANDLERS --- */
function openVerifyAssessmentModal(assessmentId) {
    document.getElementById("tax-ass-id").value = assessmentId || activeParcelId;
    document.getElementById("tax-ass-label").value = assessmentId || `PTX-2026-${activeParcelId}`;
    document.getElementById("tax-ass-remarks").value = "";
    document.getElementById("modal-verify-assessment").style.display = "flex";
}

async function handleVerifyAssessmentSubmit(e) {
    e.preventDefault();
    const assessmentId = document.getElementById("tax-ass-id").value;
    const remarks = document.getElementById("tax-ass-remarks").value;

    try {
        const res = await window.verifyTaxAssessment(assessmentId, remarks);
        if (res.success) {
            alert(res.message || "Property tax assessment verified successfully!");
            closeModal("modal-verify-assessment");
            openPropertyTaxParcelWorkspace(activeParcelId);
        } else {
            alert(res.message || "Failed to verify assessment.");
        }
    } catch (err) {
        alert(err.message || "Server error verifying assessment.");
    }
}

function openVerifyTaxPaymentModal(paymentRef) {
    document.getElementById("tax-pay-id").value = paymentRef || activeParcelId;
    document.getElementById("tax-pay-label").value = paymentRef || `PAY-TAX-${activeParcelId}`;
    document.getElementById("tax-pay-remarks").value = "";
    document.getElementById("modal-verify-tax-payment").style.display = "flex";
}

async function handleVerifyTaxPaymentSubmit(e) {
    e.preventDefault();
    const paymentId = document.getElementById("tax-pay-id").value;
    const remarks = document.getElementById("tax-pay-remarks").value;

    try {
        const res = await window.verifyTaxPaymentRecord(paymentId, remarks);
        if (res.success) {
            alert(res.message || "Tax payment verified successfully! Dues cleared.");
            closeModal("modal-verify-tax-payment");
            openPropertyTaxParcelWorkspace(activeParcelId);
        } else {
            alert(res.message || "Failed to verify payment.");
        }
    } catch (err) {
        alert(err.message || "Server error verifying payment.");
    }
}

function openApproveTaxClearanceModal(requestId) {
    document.getElementById("approve-tax-req-id").value = requestId || activeParcelId;
    document.getElementById("approve-tax-req-label").value = requestId || `CLR-2026-${activeParcelId}`;
    document.getElementById("approve-tax-remarks").value = "";

    const statusDiv = document.getElementById("approve-tax-dues-status");
    if (statusDiv) {
        statusDiv.innerHTML = `
            <div>Checking tax dues record for parcel <strong>${activeParcelId}</strong>...</div>
        `;
    }

    document.getElementById("modal-approve-tax-clearance").style.display = "flex";
}

async function handleApproveTaxClearanceSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("approve-tax-req-id").value;
    const remarks = document.getElementById("approve-tax-remarks").value;

    try {
        const res = await window.approveTaxClearanceReq(requestId, remarks);
        if (res.success) {
            alert(res.message || "Property tax clearance issued successfully!");
            closeModal("modal-approve-tax-clearance");
            openPropertyTaxParcelWorkspace(activeParcelId);
        } else {
            alert(res.message || "Failed to approve clearance.");
        }
    } catch (err) {
        alert(err.message || "Server error approving clearance.");
    }
}

function openRejectTaxClearanceModal(requestId) {
    document.getElementById("reject-tax-req-id").value = requestId || activeParcelId;
    document.getElementById("reject-tax-remarks").value = "";
    document.getElementById("modal-reject-tax-clearance").style.display = "flex";
}

async function handleRejectTaxClearanceSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("reject-tax-req-id").value;
    const rejectionReason = document.getElementById("reject-tax-reason-select").value;
    const remarks = document.getElementById("reject-tax-remarks").value;

    try {
        const res = await window.rejectTaxClearanceReq(requestId, rejectionReason, remarks);
        if (res.success) {
            alert(res.message || "Tax clearance request rejected.");
            closeModal("modal-reject-tax-clearance");
            openPropertyTaxParcelWorkspace(activeParcelId);
        } else {
            alert(res.message || "Failed to reject clearance.");
        }
    } catch (err) {
        alert(err.message || "Server error rejecting clearance.");
    }
}

function openRequestTaxInfoModal(requestId) {
    document.getElementById("reqtax-id").value = requestId || activeParcelId;
    document.getElementById("reqtax-info-input").value = "";
    document.getElementById("reqtax-reason-input").value = "";
    document.getElementById("modal-request-tax-info").style.display = "flex";
}

async function handleRequestTaxInfoSubmit(e) {
    e.preventDefault();
    const requestId = document.getElementById("reqtax-id").value;
    const infoRequired = document.getElementById("reqtax-info-input").value;
    const reason = document.getElementById("reqtax-reason-input").value;

    try {
        const res = await window.requestTaxClearanceInfo(requestId, infoRequired, reason);
        if (res.success) {
            alert(res.message || "Information request logged.");
            closeModal("modal-request-tax-info");
            openPropertyTaxParcelWorkspace(activeParcelId);
        } else {
            alert(res.message || "Failed to send request.");
        }
    } catch (err) {
        alert(err.message || "Server error requesting info.");
    }
}

// Window Exports
window.openVerifyAssessmentModal = openVerifyAssessmentModal;
window.handleVerifyAssessmentSubmit = handleVerifyAssessmentSubmit;
window.openVerifyTaxPaymentModal = openVerifyTaxPaymentModal;
window.handleVerifyTaxPaymentSubmit = handleVerifyTaxPaymentSubmit;
window.openApproveTaxClearanceModal = openApproveTaxClearanceModal;
window.handleApproveTaxClearanceSubmit = handleApproveTaxClearanceSubmit;
window.openRejectTaxClearanceModal = openRejectTaxClearanceModal;
window.handleRejectTaxClearanceSubmit = handleRejectTaxClearanceSubmit;
window.openRequestTaxInfoModal = openRequestTaxInfoModal;
window.handleRequestTaxInfoSubmit = handleRequestTaxInfoSubmit;
window.openPropertyTaxParcelWorkspace = openPropertyTaxParcelWorkspace;

window.openEnvironmentalCheckModal = openEnvironmentalCheckModal;
window.handleEnvironmentalCheckSubmit = handleEnvironmentalCheckSubmit;
window.openRoadAccessCheckModal = openRoadAccessCheckModal;
window.handleRoadAccessCheckSubmit = handleRoadAccessCheckSubmit;
window.openPlanningConflictModal = openPlanningConflictModal;
window.handlePlanningConflictSubmit = handlePlanningConflictSubmit;
window.openReviewBuildingPermissionModal = openReviewBuildingPermissionModal;
window.handleReviewBuildingPermissionSubmit = handleReviewBuildingPermissionSubmit;
window.openApproveConversionModal = openApproveConversionModal;
window.handleApproveConversionSubmit = handleApproveConversionSubmit;
window.openRejectConversionModal = openRejectConversionModal;
window.handleRejectConversionSubmit = handleRejectConversionSubmit;
window.openRequestLuInfoModal = openRequestLuInfoModal;
window.handleRequestLuInfoSubmit = handleRequestLuInfoSubmit;
window.handleLogout = handleLogout;

