/* =========================================================
   LANDGOV GIS
   ADMIN DASHBOARD CONTROLLER
   ========================================================= */

let currentAdmin = null;
let allOfficers = [];

document.addEventListener("DOMContentLoaded", async function () {
    currentAdmin = window.AuthManager.enforcePageAccess("admin");
    if (!currentAdmin) return;

    await loadAdminData();
});

async function loadAdminData() {
    await Promise.all([
        loadMetrics(),
        loadOfficers(),
        loadCitizens(),
        loadAuditLogs()
    ]);
}

async function loadMetrics() {
    try {
        const res = await window.getAdminMetrics();
        if (res.success) {
            const m = res.metrics;
            const container = document.getElementById("admin-metrics-row");
            container.innerHTML = `
                <div class="metric-card">
                    <div style="font-size: 0.82rem; color: #94a3b8;">Total Citizens</div>
                    <div class="metric-val" style="color: #38bdf8;">${m.totalCitizens}</div>
                </div>
                <div class="metric-card">
                    <div style="font-size: 0.82rem; color: #94a3b8;">Total Officers</div>
                    <div class="metric-val" style="color: #c084fc;">${m.totalOfficers}</div>
                </div>
                <div class="metric-card">
                    <div style="font-size: 0.82rem; color: #94a3b8;">Active Officers</div>
                    <div class="metric-val" style="color: #34d399;">${m.activeOfficers}</div>
                </div>
                <div class="metric-card">
                    <div style="font-size: 0.82rem; color: #94a3b8;">Disabled Accounts</div>
                    <div class="metric-val" style="color: #f87171;">${m.disabledOfficers}</div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error loading metrics:", e);
    }
}

async function loadOfficers() {
    try {
        const res = await window.getAdminOfficers();
        if (res.success) {
            allOfficers = res.officers;
            const tbody = document.getElementById("officers-tbody");
            tbody.innerHTML = "";

            allOfficers.forEach(off => {
                const tr = document.createElement("tr");
                const isCurrentAdmin = off.uid === currentAdmin.uid;
                tr.innerHTML = `
                    <td><strong>${off.officerId || 'N/A'}</strong></td>
                    <td>${off.name}</td>
                    <td>${off.email}</td>
                    <td>${off.department || 'N/A'}</td>
                    <td><span class="dept-badge badge-cadastral" style="font-size: 0.75rem;">${off.officerType || 'N/A'}</span></td>
                    <td>
                        <span class="status-tag ${off.status === 'active' ? 'tag-approved' : 'tag-pending'}">
                            ${off.status ? off.status.toUpperCase() : 'ACTIVE'}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 0.35rem;">
                            <button class="btn-secondary" onclick="openPermissionsModal('${off.uid}')">Permissions</button>
                            <button class="btn-secondary" onclick="triggerPasswordReset('${off.uid}')">Reset Pass</button>
                            ${off.status === 'active' 
                                ? `<button class="btn-danger" onclick="toggleStatus('${off.uid}', 'disabled')">Disable</button>` 
                                : `<button class="btn-success" onclick="toggleStatus('${off.uid}', 'active')">Enable</button>`
                            }
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Error loading officers:", e);
    }
}

async function loadCitizens() {
    try {
        const res = await window.apiRequest("/api/admin/citizens");
        if (res.success) {
            const tbody = document.getElementById("citizens-tbody");
            tbody.innerHTML = "";
            res.citizens.forEach(c => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${c.name}</strong></td>
                    <td>${c.email}</td>
                    <td><span class="status-tag tag-review">${c.role}</span></td>
                    <td><span class="status-tag tag-approved">${c.status}</span></td>
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Error loading citizens:", e);
    }
}

async function loadAuditLogs() {
    try {
        const res = await window.getAdminAuditLogs(50);
        if (res.success) {
            const tbody = document.getElementById("audit-tbody");
            tbody.innerHTML = "";
            res.logs.forEach(log => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${log.auditId}</strong></td>
                    <td>${new Date(log.createdAt).toLocaleString()}</td>
                    <td>${log.actor}</td>
                    <td>${log.target}</td>
                    <td><span class="status-tag tag-review">${log.action}</span></td>
                    <td><span class="status-tag ${log.result === 'SUCCESS' ? 'tag-approved' : 'tag-pending'}">${log.result}</span></td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (e) {
        console.error("Error loading audit logs:", e);
    }
}

function openCreateOfficerModal() {
    document.getElementById("create-officer-modal").style.display = "flex";
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
}

async function handleCreateOfficer(event) {
    event.preventDefault();
    const officerId = document.getElementById("new-off-id").value.trim();
    const name = document.getElementById("new-off-name").value.trim();
    const email = document.getElementById("new-off-email").value.trim();
    const officerType = document.getElementById("new-off-type").value;
    const status = document.getElementById("new-off-status").value;

    try {
        const res = await window.createGovernmentOfficer({
            officerId,
            name,
            email,
            officerType,
            status
        });

        if (res.success) {
            alert(res.message);
            closeModal("create-officer-modal");
            document.getElementById("create-officer-form").reset();
            loadAdminData();
        }
    } catch (e) {
        alert(e.message || "Failed to create officer.");
    }
}

async function toggleStatus(uid, newStatus) {
    if (!confirm(`Are you sure you want to ${newStatus} this officer account?`)) return;
    try {
        const res = await window.toggleOfficerStatus(uid, newStatus);
        if (res.success) {
            alert(res.message);
            loadAdminData();
        }
    } catch (e) {
        alert(e.message || "Failed to update account status.");
    }
}

async function triggerPasswordReset(uid) {
    if (!confirm("Initiate secure Firebase password reset for this officer? (No password will be shown)")) return;
    try {
        const res = await window.resetOfficerPassword(uid);
        if (res.success) {
            alert(res.message);
            loadAuditLogs();
        }
    } catch (e) {
        alert(e.message || "Failed to trigger password reset.");
    }
}

function openPermissionsModal(uid) {
    const officer = allOfficers.find(o => o.uid === uid);
    if (!officer) return;

    document.getElementById("perm-officer-uid").value = uid;
    document.getElementById("perm-officer-info").textContent = `${officer.name} (${officer.officerId || officer.email})`;

    const container = document.getElementById("perm-checkboxes-container");
    container.innerHTML = "";

    const allPermsList = Object.values(window.PERMISSIONS);

    allPermsList.forEach(perm => {
        const checked = (officer.permissions || []).includes(perm);
        const div = document.createElement("div");
        div.className = "perm-checkbox-item";
        div.innerHTML = `
            <input type="checkbox" id="perm-${perm}" value="${perm}" ${checked ? 'checked' : ''}>
            <label for="perm-${perm}">${perm}</label>
        `;
        container.appendChild(div);
    });

    document.getElementById("permissions-modal").style.display = "flex";
}

async function handleSavePermissions(event) {
    event.preventDefault();
    const uid = document.getElementById("perm-officer-uid").value;
    const checkboxes = document.querySelectorAll("#perm-checkboxes-container input[type='checkbox']:checked");
    const selectedPermissions = Array.from(checkboxes).map(c => c.value);

    try {
        const res = await window.updateOfficerPermissions(uid, selectedPermissions);
        if (res.success) {
            alert(res.message);
            closeModal("permissions-modal");
            loadAdminData();
        }
    } catch (e) {
        alert(e.message || "Failed to update officer permissions.");
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.AuthManager.clearSession();
    window.location.href = "login.html";
}

window.openCreateOfficerModal = openCreateOfficerModal;
window.closeModal = closeModal;
window.handleCreateOfficer = handleCreateOfficer;
window.toggleStatus = toggleStatus;
window.triggerPasswordReset = triggerPasswordReset;
window.openPermissionsModal = openPermissionsModal;
window.handleSavePermissions = handleSavePermissions;
window.handleLogout = handleLogout;
