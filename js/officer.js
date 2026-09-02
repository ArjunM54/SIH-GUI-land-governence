/* =========================================================
   LANDGOV GIS
   DYNAMIC OFFICER DASHBOARD ENGINE
   ========================================================= */

let currentOfficer = null;
let currentDeptData = null;

document.addEventListener("DOMContentLoaded", async function () {
    currentOfficer = window.AuthManager.enforcePageAccess("officer");
    if (!currentOfficer) return;

    setupOfficerHeader();
    await loadOfficerDashboard();
});

function setupOfficerHeader() {
    const info = window.OFFICER_TYPES_INFO[currentOfficer.officerType] || {
        title: "Government Officer",
        department: "Department",
        badgeClass: "badge-cadastral",
        icon: "🏛️"
    };

    document.getElementById("officer-id-tag").textContent = currentOfficer.officerId || "OFF-001";
    document.getElementById("officer-name").textContent = currentOfficer.name || "Officer";
    document.getElementById("officer-dept").textContent = currentOfficer.department || info.department;
    
    document.getElementById("dept-title").textContent = `${info.title} Dashboard`;
    const badge = document.getElementById("dept-badge");
    badge.textContent = info.department;
    badge.className = `dept-badge ${info.badgeClass}`;
}

async function loadOfficerDashboard() {
    try {
        const res = await window.getOfficerDepartmentOverview(currentOfficer.officerType);
        if (res.success) {
            currentDeptData = res;
            renderMetrics(res.stats);
            renderRecordsTable(currentOfficer.officerType, res);
        }
    } catch (e) {
        console.error("Error loading officer overview:", e);
        document.getElementById("module-table-container").innerHTML = `
            <div style="padding: 1rem; color: #ef4444;">
                ⚠️ ${e.message || "Failed to load officer department data. Verify your permission access."}
            </div>
        `;
    }
}

function renderMetrics(stats = {}) {
    const container = document.getElementById("metrics-container");
    container.innerHTML = "";

    Object.entries(stats).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
        const card = document.createElement("div");
        card.className = "metric-card";
        card.innerHTML = `
            <div style="font-size: 0.85rem; color: #94a3b8; font-weight: 600;">${label}</div>
            <div class="metric-val">${typeof value === 'object' ? JSON.stringify(value) : value}</div>
        `;
        container.appendChild(card);
    });
}

function renderRecordsTable(officerType, data) {
    const container = document.getElementById("module-table-container");
    container.innerHTML = "";

    let tableHtml = "";

    if (officerType === "cadastral_officer") {
        const records = data.records || [];
        tableHtml = `
            <table class="table-custom">
                <thead>
                    <tr>
                        <th>Survey No</th>
                        <th>Parcel ID</th>
                        <th>Village</th>
                        <th>Area (sq.m)</th>
                        <th>Verification Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(r => `
                        <tr>
                            <td><strong>${r.surveyNo}</strong></td>
                            <td>${r.parcelId}</td>
                            <td>${r.village}</td>
                            <td>${r.areaSqM}</td>
                            <td><span class="status-tag ${r.verified ? 'tag-approved' : 'tag-pending'}">${r.status}</span></td>
                            <td><button class="action-btn" onclick="openActionModal('${r.parcelId}', '${r.surveyNo}', 'CADASTRAL')">Verify Boundary</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (officerType === "land_records_officer") {
        const mutations = data.mutations || [];
        tableHtml = `
            <table class="table-custom">
                <thead>
                    <tr>
                        <th>Mutation ID</th>
                        <th>Parcel ID</th>
                        <th>Current Owner</th>
                        <th>Requested Change</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${mutations.map(m => `
                        <tr>
                            <td><strong>${m.mutationId}</strong></td>
                            <td>${m.parcelId}</td>
                            <td>${m.owner}</td>
                            <td>${m.requestedChange}</td>
                            <td><span class="status-tag tag-pending">${m.status}</span></td>
                            <td><button class="action-btn" onclick="openActionModal('${m.mutationId}', '${m.mutationId}', 'MUTATION')">Approve Mutation</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (officerType === "registration_officer") {
        const regs = data.registrations || [];
        tableHtml = `
            <table class="table-custom">
                <thead>
                    <tr>
                        <th>Reg No</th>
                        <th>Parcel ID</th>
                        <th>Buyer</th>
                        <th>Seller</th>
                        <th>Stamp Duty</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${regs.map(r => `
                        <tr>
                            <td><strong>${r.regNo}</strong></td>
                            <td>${r.parcelId}</td>
                            <td>${r.buyer}</td>
                            <td>${r.seller}</td>
                            <td><span class="status-tag tag-approved">${r.stampDutyPaid ? 'PAID' : 'PENDING'}</span></td>
                            <td><button class="action-btn" onclick="openActionModal('${r.regNo}', '${r.regNo}', 'TRANSFER')">Approve Transfer</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (officerType === "land_use_officer") {
        const convs = data.conversions || [];
        tableHtml = `
            <table class="table-custom">
                <thead>
                    <tr>
                        <th>Conversion ID</th>
                        <th>Parcel ID</th>
                        <th>From Zone</th>
                        <th>To Zone</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${convs.map(c => `
                        <tr>
                            <td><strong>${c.conversionId}</strong></td>
                            <td>${c.parcelId}</td>
                            <td>${c.fromZone}</td>
                            <td>${c.toZone}</td>
                            <td><span class="status-tag tag-review">${c.status}</span></td>
                            <td><button class="action-btn" onclick="openActionModal('${c.conversionId}', '${c.conversionId}', 'LANDUSE')">Approve Conversion</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else if (officerType === "property_tax_officer") {
        const records = data.taxRecords || [];
        tableHtml = `
            <table class="table-custom">
                <thead>
                    <tr>
                        <th>Parcel ID</th>
                        <th>Annual Tax</th>
                        <th>Outstanding Amount</th>
                        <th>Tax Status</th>
                        <th>Building Permit</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${records.map(t => `
                        <tr>
                            <td><strong>${t.parcelId}</strong></td>
                            <td>₹${t.annualTax}</td>
                            <td>₹${t.outstanding}</td>
                            <td><span class="status-tag ${t.status === 'Paid' ? 'tag-approved' : 'tag-pending'}">${t.status}</span></td>
                            <td>${t.buildingPermit}</td>
                            <td><button class="action-btn" onclick="openActionModal('${t.parcelId}', '${t.parcelId}', 'TAX')">Verify Clearance</button></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    container.innerHTML = tableHtml;
}

let activeActionType = "";

function openActionModal(targetId, displayId, actionType) {
    activeActionType = actionType;
    document.getElementById("action-target-id").value = targetId;
    document.getElementById("action-display-id").value = displayId;
    document.getElementById("action-modal").style.display = "flex";
}

function closeActionModal() {
    document.getElementById("action-modal").style.display = "none";
}

async function handleActionSubmit(event) {
    event.preventDefault();
    const targetId = document.getElementById("action-target-id").value;
    const decision = document.getElementById("action-decision").value;
    const remarks = document.getElementById("action-remarks").value;

    try {
        let res = null;
        if (activeActionType === "CADASTRAL") {
            res = await window.verifyCadastralBoundary(targetId, targetId, remarks);
        } else if (activeActionType === "MUTATION") {
            res = await window.approveRoRMutation(targetId, decision, remarks);
        } else if (activeActionType === "TRANSFER") {
            res = await window.approvePropertyTransfer(targetId, decision, remarks);
        } else if (activeActionType === "LANDUSE") {
            res = await window.approveLandUseConversion(targetId, decision, "C-2");
        } else if (activeActionType === "TAX") {
            res = await window.verifyPropertyTaxClearance(targetId, 0, remarks);
        }

        if (res && res.success) {
            alert(res.message || "Officer action executed and logged in audit system.");
            closeActionModal();
            loadOfficerDashboard();
        }
    } catch (e) {
        alert(e.message || "Action failed due to permission or server error.");
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.AuthManager.clearSession();
    window.location.href = "login.html";
}

window.openActionModal = openActionModal;
window.closeActionModal = closeActionModal;
window.handleActionSubmit = handleActionSubmit;
window.handleLogout = handleLogout;
