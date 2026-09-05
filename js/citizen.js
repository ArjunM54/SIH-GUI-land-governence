/* =========================================================
   LANDGOV GIS
   CITIZEN DASHBOARD SCRIPT
   ========================================================= */

let currentUser = null;

document.addEventListener("DOMContentLoaded", async function () {
    currentUser = window.AuthManager.enforcePageAccess("citizen");
    if (!currentUser) return;

    document.getElementById("user-name").textContent = currentUser.name || "Citizen";
    document.getElementById("welcome-name").textContent = currentUser.name || "Citizen";

    loadCitizenParcels();
    loadCitizenRequests();
});

async function loadCitizenParcels() {
    const tbody = document.getElementById("my-parcels-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    try {
        // Fetch parcels authorized for this citizen from API
        const res = await window.getParcels();
        let userParcels = [];

        if (res && res.success && Array.isArray(res.data)) {
            userParcels = res.data;
        } else if (currentUser && Array.isArray(currentUser.assignedParcels)) {
            userParcels = currentUser.assignedParcels.map(id => ({
                id,
                district: "Central District",
                area: "4,500 sq.m"
            }));
        }

        if (userParcels.length > 0) {
            userParcels.forEach(p => {
                const parcelId = p.id || p.parcelId;
                const status = p.governanceStatus || p.status || "VERIFIED";
                let statusBadge = "";
                if (status === "REVIEW REQUIRED") {
                    statusBadge = `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; display: inline-block;">REVIEW REQUIRED</span>`;
                } else if (status === "CONFLICT DETECTED") {
                    statusBadge = `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; display: inline-block;">CONFLICT</span>`;
                } else {
                    statusBadge = `<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 0.8rem; display: inline-block;">VERIFIED</span>`;
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${parcelId}</strong></td>
                    <td>${p.village || p.district || 'Central'} / ${p.district || 'District'}</td>
                    <td>${p.areaSqMeters ? p.areaSqMeters.toLocaleString() + ' sq.m' : (p.area || '4,500 sq.m')}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="action-btn" onclick="viewParcelProfile('${parcelId}')">
                            View Land Profile
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No registered parcels found.</td></tr>`;
        }
    } catch (e) {
        console.error("Error loading citizen parcels:", e);
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #ef4444;">Unable to load parcels. Please check server.</td></tr>`;
    }
}

async function loadCitizenRequests() {
    try {
        const res = await window.getCitizenRequests();
        const tbody = document.getElementById("requests-tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (res && res.success && Array.isArray(res.requests) && res.requests.length > 0) {
            res.requests.forEach(r => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${r.requestId}</strong></td>
                    <td>${r.parcelId}</td>
                    <td>${r.department}</td>
                    <td><span class="status-tag tag-pending">${r.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No active requests found.</td></tr>`;
        }
    } catch (e) {
        console.error("Error loading citizen requests:", e);
    }
}

async function submitNewRequest(event) {
    event.preventDefault();
    const parcelId = document.getElementById("req-parcel-id").value.trim().toUpperCase();
    const type = document.getElementById("req-type").value;
    const department = document.getElementById("req-dept").value;

    try {
        const res = await window.submitCitizenRequest({ parcelId, type, department });
        if (res && res.success) {
            alert("Request submitted successfully!");
            document.getElementById("req-parcel-id").value = "";
            loadCitizenRequests();
        } else {
            alert(res.message || "Failed to submit request.");
        }
    } catch (e) {
        alert(e.message || "Failed to submit request.");
    }
}

function viewParcelProfile(parcelId) {
    if (typeof window.openCompleteLandProfile === "function") {
        window.openCompleteLandProfile(parcelId);
    } else if (typeof window.showLandProfileModal === "function") {
        window.showLandProfileModal(parcelId);
    } else {
        console.error("openCompleteLandProfile is unavailable.");
        alert(`Opening Land Profile for ${parcelId}...`);
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.AuthManager.clearSession();
    window.location.href = "login.html";
}

window.loadCitizenParcels = loadCitizenParcels;
window.submitNewRequest = submitNewRequest;
window.viewParcelProfile = viewParcelProfile;
window.handleLogout = handleLogout;
