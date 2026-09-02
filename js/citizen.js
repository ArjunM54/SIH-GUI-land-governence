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

    loadCitizenRequests();
});

async function loadCitizenRequests() {
    try {
        const res = await window.getCitizenRequests();
        const tbody = document.getElementById("requests-tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (res.success && res.requests.length > 0) {
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
    const parcelId = document.getElementById("req-parcel-id").value.trim();
    const type = document.getElementById("req-type").value;
    const department = document.getElementById("req-dept").value;

    try {
        const res = await window.submitCitizenRequest({ parcelId, type, department });
        if (res.success) {
            alert("Request submitted successfully!");
            document.getElementById("req-parcel-id").value = "";
            loadCitizenRequests();
        }
    } catch (e) {
        alert(e.message || "Failed to submit request.");
    }
}

function viewParcelProfile(parcelId) {
    if (typeof window.showLandProfileModal === "function") {
        window.showLandProfileModal(parcelId);
    } else {
        alert(`Opening Land Profile for ${parcelId}...`);
    }
}

async function handleLogout() {
    await window.logoutUser();
    window.AuthManager.clearSession();
    window.location.href = "login.html";
}

window.submitNewRequest = submitNewRequest;
window.viewParcelProfile = viewParcelProfile;
window.handleLogout = handleLogout;
