/* =========================================================
   LANDGOV GIS
   CITIZEN PORTAL CONTROLLER
   Handles Tab Navigation, Data Population, Application Tracking,
   Multi-Officer Verifications, Service Forms, Documents & Profile.
   ========================================================= */

let currentUser = null;
let currentSummary = null;
let currentApplications = [];

document.addEventListener("DOMContentLoaded", async function () {
    if (!window.AuthManager) {
        console.error("AuthManager unavailable.");
        return;
    }

    currentUser = window.AuthManager.enforcePageAccess("citizen");
    if (!currentUser) return;

    // Update UI headers
    const nameStr = currentUser.name || "Citizen";
    const idStr = currentUser.uid || "CIT-2026-9081";

    const sidebarName = document.getElementById("sidebar-user-name");
    const sidebarId = document.getElementById("sidebar-citizen-id");
    const welcomeName = document.getElementById("welcome-name");

    if (sidebarName) sidebarName.textContent = nameStr;
    if (sidebarId) sidebarId.textContent = idStr;
    if (welcomeName) welcomeName.textContent = nameStr;

    // Load initial data
    await loadDashboardSummary();
    await loadMyLand();
    await loadApplications();
    await loadServices();
    await loadDocuments();
    await loadPropertyTax();
    await loadNotifications();
    await loadProfile();
});

/* ================= TAB & SIDEBAR NAVIGATION ================= */

function switchTab(tabName, subTab = null) {
    // Hide all sections
    const sections = document.querySelectorAll(".tab-section");
    sections.forEach(sec => sec.style.display = "none");

    // Show target section
    const target = document.getElementById(`section-${tabName}`);
    if (target) target.style.display = "block";

    // Update sidebar active link
    const links = document.querySelectorAll(".nav-link");
    links.forEach(link => link.classList.remove("active"));

    const activeLink = document.getElementById(`nav-${tabName}`);
    if (activeLink) activeLink.classList.add("active");

    // Close mobile sidebar if open
    const sidebar = document.getElementById("citizen-sidebar");
    if (sidebar) sidebar.classList.remove("open");

    // Handle subtab navigation if provided
    if (tabName === "applications" && subTab) {
        switchAppSubTab(subTab);
    } else if (tabName === "services" && subTab) {
        highlightServiceCategory(subTab);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleSubmenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;

    const isOpen = menu.classList.contains("open");
    document.querySelectorAll(".nav-submenu").forEach(m => m.classList.remove("open"));

    if (!isOpen) {
        menu.classList.add("open");
    }
}

function switchAppSubTab(subTab) {
    const subSections = document.querySelectorAll(".app-sub-section");
    subSections.forEach(sec => sec.style.display = "none");

    const targetSub = document.getElementById(`app-sub-${subTab}`);
    if (targetSub) targetSub.style.display = "block";

    // Update button styles
    const btnSubmit = document.getElementById("app-tab-submit");
    const btnMy = document.getElementById("app-tab-my");
    const btnTrack = document.getElementById("app-tab-track");

    if (btnSubmit) btnSubmit.className = subTab === "submit" ? "action-btn" : "secondary-btn";
    if (btnMy) btnMy.className = subTab === "my" ? "action-btn" : "secondary-btn";
    if (btnTrack) btnTrack.className = subTab === "track" ? "action-btn" : "secondary-btn";
}

function toggleSidebar() {
    const sidebar = document.getElementById("citizen-sidebar");
    if (sidebar) sidebar.classList.toggle("open");
}

/* ================= 1. DASHBOARD SUMMARY ================= */

async function loadDashboardSummary() {
    try {
        const res = await window.getCitizenDashboardSummary();
        if (res && res.success) {
            currentSummary = res.summary;
            const s = res.summary;
            const apps = res.recentApplications || [];

            const pendingCount = apps.filter(a => a.status !== "COMPLETED" && a.status !== "REJECTED").length;
            const approvedCount = apps.filter(a => a.status === "COMPLETED").length;
            const actionNeededCount = apps.filter(a => a.status === "REJECTED" || a.status === "DOCUMENT_REQUIRED").length;

            const mApps = document.getElementById("metric-applications");
            const mPending = document.getElementById("metric-pending");
            const mApproved = document.getElementById("metric-approved");
            const mAction = document.getElementById("metric-action-needed");

            if (mApps) mApps.textContent = apps.length;
            if (mPending) mPending.textContent = pendingCount;
            if (mApproved) mApproved.textContent = approvedCount;
            if (mAction) mAction.textContent = actionNeededCount;

            // Recent Applications Table
            const appTbody = document.getElementById("recent-applications-tbody");
            if (appTbody) {
                appTbody.innerHTML = "";
                if (apps.length > 0) {
                    apps.forEach(a => {
                        const v = a.verifications || {};
                        const approvedSubCount = Object.values(v).filter(st => st && st.status === "APPROVED").length;
                        const progressStr = `${approvedSubCount} / 5 Officers`;

                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${a.applicationId}</strong></td>
                            <td>${a.type || 'Owner Change'}</td>
                            <td>${formatDate(a.submittedDate)}</td>
                            <td><span class="status-tag ${getStatusTagClass(a.status)}">${formatStatus(a.status)}</span></td>
                            <td><span class="status-tag tag-review" style="font-size:0.75rem;">${progressStr}</span></td>
                            <td>
                                <button class="action-btn" style="font-size:0.75rem;" onclick="trackApplicationById('${a.applicationId}')">View</button>
                            </td>
                        `;
                        appTbody.appendChild(tr);
                    });
                } else {
                    appTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No recent applications found.</td></tr>`;
                }
            }

            // Recent Notifications
            const notifContainer = document.getElementById("recent-notifications-container");
            if (notifContainer) {
                notifContainer.innerHTML = "";
                if (res.recentNotifications && res.recentNotifications.length > 0) {
                    res.recentNotifications.forEach(n => {
                        const item = document.createElement("div");
                        item.style.cssText = "background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;";
                        item.innerHTML = `
                            <div style="font-weight: 600; font-size: 0.88rem; color: #38bdf8;">${n.title}</div>
                            <div style="font-size: 0.82rem; color: #cbd5e1; margin-top: 0.2rem;">${n.message}</div>
                            <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 0.4rem;">${formatDate(n.timestamp)}</div>
                        `;
                        notifContainer.appendChild(item);
                    });
                } else {
                    notifContainer.innerHTML = `<div style="text-align: center; color: #94a3b8;">No recent notifications.</div>`;
                }
            }

            // Dashboard Properties Table
            const propTbody = document.getElementById("dash-properties-tbody");
            if (propTbody) {
                propTbody.innerHTML = "";
                if (res.properties && res.properties.length > 0) {
                    res.properties.forEach(p => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${p.parcelId}</strong></td>
                            <td>${p.surveyNumber}</td>
                            <td>${p.areaSqFt}</td>
                            <td>${p.landUse}</td>
                            <td>
                                <button class="action-btn" onclick="viewParcelProfile('${p.parcelId}')">View Land Profile</button>
                            </td>
                        `;
                        propTbody.appendChild(tr);
                    });
                } else {
                    propTbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #94a3b8;">No properties found.</td></tr>`;
                }
            }
        }
    } catch (e) {
        console.error("Error loading dashboard summary:", e);
    }
}

/* ================= 2. MY LAND ================= */

async function loadMyLand() {
    const container = document.getElementById("myland-cards-container");
    if (!container) return;

    try {
        const res = await window.getCitizenMyLand();
        container.innerHTML = "";

        if (res && res.success && Array.isArray(res.properties) && res.properties.length > 0) {
            res.properties.forEach(p => {
                const card = document.createElement("div");
                card.className = "card-panel";
                card.innerHTML = `
                    <div class="card-title">
                        <div>
                            <span style="color: #38bdf8;">MY LAND — Parcel ID: ${p.parcelId}</span>
                            <span style="font-size: 0.82rem; color: #94a3b8; font-weight: normal; margin-left: 0.75rem;">Survey Number: ${p.surveyNumber}</span>
                        </div>
                        <span class="status-tag tag-approved">${p.ownershipStatus}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem; font-size: 0.88rem;">
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Area</span>
                            <strong>${p.areaSqFt}</strong> (${p.areaSqMeters} sq.m)
                        </div>
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Land Use</span>
                            <strong>${p.landUse}</strong>
                        </div>
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Current Owner</span>
                            <strong>${p.currentOwner}</strong>
                        </div>
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Registration Info</span>
                            <strong>${p.registrationInfo}</strong>
                        </div>
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Property Tax</span>
                            <strong>${p.propertyTax}</strong>
                        </div>
                        <div style="background: #0f172a; padding: 0.85rem; border-radius: 8px; border: 1px solid #334155;">
                            <span style="color: #94a3b8; display: block; font-size: 0.78rem;">Land Classification & Restrictions</span>
                            <strong>${p.landClassification}</strong> — ${p.restrictions}
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <button class="action-btn" onclick="viewParcelProfile('${p.parcelId}')">[ View Land Profile ]</button>
                        <a href="index.html#map-section" class="secondary-btn" style="text-decoration: none; display: inline-block;">[ View on GIS Map ]</a>
                        <button class="secondary-btn" onclick="openOwnerChangeForParcel('${p.parcelId}', '${p.currentOwner}')">Apply Owner Change</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<div class="card-panel" style="text-align: center; color: #94a3b8;">No registered properties found for your account.</div>`;
        }
    } catch (e) {
        console.error("Error loading My Land:", e);
        container.innerHTML = `<div class="card-panel" style="text-align: center; color: #ef4444;">Failed to load land profile records.</div>`;
    }
}

/* ================= 3. APPLICATIONS & TRACKING ================= */

async function loadApplications() {
    try {
        const res = await window.getCitizenApplications();
        const tbody = document.getElementById("my-applications-tbody");
        const select = document.getElementById("track-app-select");

        if (res && res.success && Array.isArray(res.applications)) {
            currentApplications = res.applications;

            // Populate My Applications table
            if (tbody) {
                tbody.innerHTML = "";
                if (currentApplications.length > 0) {
                    currentApplications.forEach(a => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${a.applicationId}</strong></td>
                            <td>${a.parcelId}</td>
                            <td>${a.type}</td>
                            <td>${formatDate(a.submittedDate)}</td>
                            <td><span class="status-tag ${getStatusTagClass(a.status)}">${formatStatus(a.status)}</span></td>
                            <td>
                                <button class="action-btn" onclick="trackApplicationById('${a.applicationId}')">Track 5-Officer Progress</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                } else {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No submitted applications found.</td></tr>`;
                }
            }

            // Populate Application History table
            const histTbody = document.getElementById("history-applications-tbody");
            if (histTbody) {
                histTbody.innerHTML = "";
                if (currentApplications.length > 0) {
                    currentApplications.forEach(a => {
                        const tr = document.createElement("tr");
                        tr.innerHTML = `
                            <td><strong>${a.applicationId}</strong></td>
                            <td>${a.type}</td>
                            <td>${a.parcelId}</td>
                            <td>${formatDate(a.submittedDate)}</td>
                            <td><span class="status-tag ${getStatusTagClass(a.status)}">${formatStatus(a.status)}</span></td>
                            <td>
                                <button class="action-btn" style="font-size:0.75rem;" onclick="trackApplicationById('${a.applicationId}')">View Details</button>
                            </td>
                        `;
                        histTbody.appendChild(tr);
                    });
                } else {
                    histTbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8;">No historical applications found.</td></tr>`;
                }
            }

            // Populate Select dropdown in Track Application tab
            if (select) {
                select.innerHTML = `<option value="">Select Application...</option>`;
                currentApplications.forEach(a => {
                    const opt = document.createElement("option");
                    opt.value = a.applicationId;
                    opt.textContent = `${a.applicationId} (${a.type} - Parcel ${a.parcelId})`;
                    select.appendChild(opt);
                });

                // Auto select first application if available
                if (currentApplications.length > 0) {
                    select.value = currentApplications[0].applicationId;
                    loadTrackingDetails(currentApplications[0].applicationId);
                }
            }
        }
    } catch (e) {
        console.error("Error loading citizen applications:", e);
    }
}

function trackApplicationById(appId) {
    switchTab("applications", "track");
    const select = document.getElementById("track-app-select");
    if (select) {
        select.value = appId;
    }
    loadTrackingDetails(appId);
}

function loadTrackingDetails(appId) {
    const container = document.getElementById("tracking-detail-container");
    if (!container) return;

    if (!appId) {
        container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 2rem;">Please select an application to view its 5-department verification timeline.</div>`;
        return;
    }

    const app = currentApplications.find(a => a.applicationId === appId);
    if (!app) {
        container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 2rem;">Application details not found.</div>`;
        return;
    }

    const v = app.verifications || {};

    const stages = [
        { key: "cadastral", label: "Cadastral & Survey Officer", data: v.cadastral || {} },
        { key: "ror", label: "Land Records / RoR Officer", data: v.ror || {} },
        { key: "registration", label: "Registration Officer", data: v.registration || {} },
        { key: "landUse", label: "Land Use & Planning Officer", data: v.landUse || {} },
        { key: "propertyTax", label: "Property Tax & Municipal Officer", data: v.propertyTax || {} }
    ];

    const approvedCount = stages.filter(s => s.data.status === "APPROVED").length;
    const isCompleted = app.status === "COMPLETED" || approvedCount === 5;
    const isRejected = app.status === "REJECTED" || stages.some(s => s.data.status === "REJECTED");

    const hasDocReq = stages.some(s => s.data.status === "DOCUMENT_REQUIRED");

    // Stepper nodes HTML
    let stepNodesHtml = "";
    stages.forEach((s, idx) => {
        const status = s.data.status || "PENDING";
        let nodeClass = "";
        let icon = idx + 1;

        if (status === "APPROVED") {
            nodeClass = "completed";
            icon = "✓";
        } else if (status === "REJECTED") {
            nodeClass = "rejected";
            icon = "✕";
        } else if (status === "DOCUMENT_REQUIRED") {
            nodeClass = "rejected";
            icon = "📄";
        } else if (idx === approvedCount && !isRejected) {
            nodeClass = "active";
            icon = "●";
        }

        stepNodesHtml += `
            <div class="step-node ${nodeClass}">
                <div class="step-circle">${icon}</div>
                <div class="step-label">${s.label}</div>
                <div class="step-status-sub">${status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : status === 'DOCUMENT_REQUIRED' ? 'Doc Required' : 'Waiting'}</div>
            </div>
        `;
    });

    // Progress bar fill width
    const fillPercent = isCompleted ? 100 : (approvedCount / 5) * 100;

    // Final outcome card
    let outcomeHtml = "";
    if (isCompleted) {
        outcomeHtml = `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 1.25rem; margin-top: 1.5rem;">
                <h4 style="color: #34d399; margin: 0 0 0.5rem 0; font-size: 1.1rem;">✓ Owner Change Completed</h4>
                <div style="font-size: 0.88rem; color: #e2e8f0; line-height: 1.6;">
                    <div><strong>Application:</strong> ${app.applicationId}</div>
                    <div><strong>Previous Owner:</strong> ${app.currentOwner || 'Arun Kumar'}</div>
                    <div><strong>New Owner:</strong> ${app.newOwner || 'Hari Prem'}</div>
                    <div><strong>Property:</strong> ${app.parcelId}</div>
                    <div><strong>Status:</strong> <span class="status-tag tag-approved">Completed</span></div>
                    <p style="margin: 0.5rem 0 0 0; color: #a7f3d0; font-weight: 500;">All required 5 departmental verifications have been completed successfully. Record of Rights, Land Profile, and Property Registry updated.</p>
                </div>
            </div>
        `;
    } else if (isRejected) {
        outcomeHtml = `
            <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 1.25rem; margin-top: 1.5rem;">
                <h4 style="color: #f87171; margin: 0 0 0.5rem 0; font-size: 1.1rem;">❌ Application Rejected</h4>
                <p style="font-size: 0.88rem; color: #fca5a5; margin: 0;">One or more government officers rejected the application. Ownership remains unchanged in official records.</p>
            </div>
        `;
    } else if (hasDocReq) {
        outcomeHtml = `
            <div style="background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.4); border-radius: 10px; padding: 1.25rem; margin-top: 1.5rem;">
                <h4 style="color: #eab308; margin: 0 0 0.5rem 0; font-size: 1.1rem;">📄 Action Required: Additional Document Requested</h4>
                <p style="font-size: 0.88rem; color: #fef08a; margin: 0 0 0.75rem 0;">One of the reviewing officers has requested an additional document. Please use the button in the audit table below to upload the document.</p>
            </div>
        `;
    } else {
        outcomeHtml = `
            <div style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 10px; padding: 1rem; margin-top: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: #38bdf8;">Multi-Officer Verification in Progress</strong>
                    <div style="font-size: 0.83rem; color: #cbd5e1;">${approvedCount} of 5 departmental approvals completed.</div>
                </div>
                <span class="status-tag tag-pending">${approvedCount} / 5 Approved</span>
            </div>
        `;
    }

    container.innerHTML = `
        <div class="tracker-card">
            <div class="tracker-header">
                <div>
                    <h3 style="margin: 0; color: #38bdf8;">${app.applicationId} — ${app.type}</h3>
                    <span style="font-size: 0.83rem; color: #94a3b8;">Parcel ID: ${app.parcelId} | Submitted: ${formatDate(app.submittedDate)}</span>
                </div>
                <span class="status-tag ${getStatusTagClass(app.status)}">${formatStatus(app.status)}</span>
            </div>

            <!-- STEPPER TIMELINE -->
            <div class="stepper-progress-container">
                <div class="stepper-progress-bar">
                    <div class="stepper-progress-fill" style="width: ${fillPercent}%;"></div>
                </div>
                ${stepNodesHtml}
            </div>

            <!-- DEPARTMENT STAGE DETAILS -->
            <div style="margin-top: 1.5rem;">
                <h4 style="margin: 0 0 0.75rem 0; font-size: 0.95rem; color: #f8fafc;">Departmental Verification Audit Trail:</h4>
                <table class="table-custom">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th>Officer</th>
                            <th>Status</th>
                            <th>Date</th>
                            <th>Officer Inspection Remarks</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stages.map(s => `
                            <tr>
                                <td><strong>${s.label}</strong></td>
                                <td>${s.data.officerName || s.data.officerId || 'Pending Assignment'}</td>
                                <td><span class="status-tag ${getStatusTagClass(s.data.status || 'PENDING')}">${s.data.status || 'PENDING'}</span></td>
                                <td>${s.data.date ? formatDate(s.data.date) : 'Pending'}</td>
                                <td>${s.data.remarks || 'Awaiting officer review...'}</td>
                                <td>
                                    ${s.data.status === 'DOCUMENT_REQUIRED' ? `<button class="action-btn" style="font-size: 0.75rem;" onclick="openResubmitDocModal('${app.applicationId}', '${s.key}', '${s.data.requestedDocument || 'Requested Document'}')">📤 Upload Document</button>` : '—'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            ${outcomeHtml}
        </div>
    `;
}

function openResubmitDocModal(appId, deptKey, requestedDocName = "") {
    const modal = document.getElementById("upload-doc-modal");
    if (!modal) return;

    document.getElementById("resubmit-app-id").value = appId;
    document.getElementById("resubmit-dept-key").value = deptKey;
    document.getElementById("resubmit-app-display").value = `${appId} (${deptKey.toUpperCase()})`;
    document.getElementById("resubmit-doc-name").value = requestedDocName || "Updated_Document.pdf";

    modal.style.display = "flex";
}

async function handleResubmitDocSubmit(event) {
    event.preventDefault();
    const appId = document.getElementById("resubmit-app-id").value;
    const deptKey = document.getElementById("resubmit-dept-key").value;
    const docName = document.getElementById("resubmit-doc-name").value.trim();

    try {
        const res = await window.resubmitApplicationDocument(appId, deptKey, docName);
        if (res && res.success) {
            closeModal("upload-doc-modal");
            alert("Requested document uploaded and resubmitted successfully!");
            await loadApplications();
            trackApplicationById(appId);
        } else {
            alert((res && res.message) || "Failed to resubmit document.");
        }
    } catch (e) {
        alert(e.message || "Error resubmitting document.");
    }
}

/* ================= 4. SERVICES ================= */

async function loadServices() {
    try {
        const res = await window.getCitizenServices();
        if (res && res.success) {
            const props = res.properties || [];
            const apps = res.applications || [];

            // Property Reg Summary
            const regBox = document.getElementById("service-reg-details");
            if (regBox) {
                const regApps = apps.filter(a => a.serviceCategory === "Property Registration" || a.type === "Owner Change");
                regBox.innerHTML = `
                    <div><strong>Registered Parcels:</strong> ${props.length}</div>
                    <div><strong>Active Deeds under verification:</strong> ${regApps.length}</div>
                    <div><strong>Deed Reg Status:</strong> Verified & Registered</div>
                `;
            }

            // Mutation Summary
            const mutBox = document.getElementById("service-mut-details");
            if (mutBox) {
                const mutApps = apps.filter(a => a.type === "Mutation Request");
                mutBox.innerHTML = `
                    <div><strong>RoR Mutation Requests:</strong> ${mutApps.length}</div>
                    <div><strong>Record of Rights Title:</strong> Clear / Freehold</div>
                `;
            }

            // Land Use Summary
            const luBox = document.getElementById("service-lu-details");
            if (luBox) {
                const luApps = apps.filter(a => a.type === "Land Use Request");
                luBox.innerHTML = `
                    <div><strong>Zoning Category:</strong> Primary Residential / Agricultural</div>
                    <div><strong>Pending Conversions:</strong> ${luApps.length}</div>
                `;
            }

            // Tax Summary
            const taxBox = document.getElementById("service-tax-details");
            if (taxBox) {
                taxBox.innerHTML = `
                    <div><strong>Annual Property Tax:</strong> ₹8,500</div>
                    <div><strong>Outstanding Dues:</strong> ₹0</div>
                    <div><strong>Payment Status:</strong> <span class="status-tag tag-approved">✓ Clear</span></div>
                `;
            }
        }
    } catch (e) {
        console.error("Error loading services:", e);
    }
}

function highlightServiceCategory(category) {
    // Helper to highlight service tab
    switchTab("services");
}

/* ================= 5. DOCUMENTS ================= */

let allCitizenDocs = [];

async function loadDocuments() {
    const tbody = document.getElementById("documents-tbody");
    if (!tbody) return;

    try {
        const res = await window.getCitizenDocuments();
        tbody.innerHTML = "";

        if (res && res.success && Array.isArray(res.documents)) {
            allCitizenDocs = res.documents;
            renderDocumentsTable(allCitizenDocs);
        } else {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No documents found for your parcels.</td></tr>`;
        }
    } catch (e) {
        console.error("Error loading citizen documents:", e);
    }
}

function renderDocumentsTable(docsList) {
    const tbody = document.getElementById("documents-tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (docsList.length > 0) {
        docsList.forEach(d => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><strong>${d.title || d.documentType}</strong></td>
                <td>${d.category || 'Ownership Documents'}</td>
                <td>${d.parcelId}</td>
                <td>${d.documentNumber || d.documentId}</td>
                <td>${d.uploadedDate || '2026-01-15'}</td>
                <td><span class="status-tag tag-approved">${d.verificationStatus || 'AVAILABLE'}</span></td>
                <td>
                    <button class="action-btn" onclick="alert('Downloading certificate ${d.documentId}...')">Download</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8;">No matching documents found in this category.</td></tr>`;
    }
}

function filterDocsByCategory(category, btnElement) {
    const filterBtns = document.querySelectorAll(".doc-filter-btn");
    filterBtns.forEach(btn => {
        btn.className = "secondary-btn doc-filter-btn";
        btn.style.fontSize = "0.78rem";
        btn.style.padding = "0.35rem 0.75rem";
    });

    if (btnElement) {
        btnElement.className = "action-btn doc-filter-btn active";
        btnElement.style.fontSize = "0.78rem";
        btnElement.style.padding = "0.35rem 0.75rem";
    }

    if (category === "All") {
        renderDocumentsTable(allCitizenDocs);
    } else {
        const filtered = allCitizenDocs.filter(d => d.category === category);
        renderDocumentsTable(filtered);
    }
}

/* ================= 6. PROPERTY TAX ================= */

async function loadPropertyTax() {
    const container = document.getElementById("tax-cards-container");
    if (!container) return;

    try {
        const res = await window.getCitizenPropertyTax();
        container.innerHTML = "";

        if (res && res.success && Array.isArray(res.taxRecords) && res.taxRecords.length > 0) {
            res.taxRecords.forEach(t => {
                const card = document.createElement("div");
                card.style.cssText = "background: #0f172a; padding: 1.25rem; border-radius: 10px; border: 1px solid #334155; margin-bottom: 1rem;";
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 0.75rem; margin-bottom: 1rem;">
                        <div>
                            <strong style="color: #38bdf8; font-size: 1.05rem;">Parcel: ${t.parcelId}</strong>
                            <span style="font-size: 0.82rem; color: #94a3b8; margin-left: 0.75rem;">Property Tax ID: ${t.propertyTaxId}</span>
                        </div>
                        <span class="status-tag ${t.outstandingAmount > 0 ? 'tag-pending' : 'tag-approved'}">${t.status}</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem; font-size: 0.88rem;">
                        <div><span style="color: #94a3b8; display: block; font-size: 0.78rem;">Annual Tax</span><strong>₹${t.annualTax.toLocaleString()}</strong></div>
                        <div><span style="color: #94a3b8; display: block; font-size: 0.78rem;">Paid Amount</span><strong style="color: #34d399;">₹${t.paidAmount.toLocaleString()}</strong></div>
                        <div><span style="color: #94a3b8; display: block; font-size: 0.78rem;">Outstanding Amount</span><strong style="color: ${t.outstandingAmount > 0 ? '#f87171' : '#f8fafc'};">₹${t.outstandingAmount.toLocaleString()}</strong></div>
                        <div><span style="color: #94a3b8; display: block; font-size: 0.78rem;">Last Payment Status</span><strong>${t.status} (${t.lastPaymentDate})</strong></div>
                    </div>
                    <div style="display: flex; gap: 0.75rem;">
                        <button class="action-btn" onclick="alert('Viewing Tax Assessment History for ${t.parcelId}...')">[ View Tax History ]</button>
                        <button class="secondary-btn" onclick="alert('Downloading Tax Receipt for ${t.propertyTaxId}...')">[ Download Receipt ]</button>
                    </div>
                `;
                container.appendChild(card);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8;">No property tax records found.</div>`;
        }
    } catch (e) {
        console.error("Error loading property tax:", e);
    }
}

/* ================= 7. NOTIFICATIONS ================= */

async function loadNotifications() {
    const container = document.getElementById("notifications-feed-container");
    if (!container) return;

    try {
        const res = await window.getCitizenNotifications();
        container.innerHTML = "";

        if (res && res.success && Array.isArray(res.notifications) && res.notifications.length > 0) {
            const unreadCount = res.notifications.filter(n => !n.read).length;
            const badge = document.getElementById("notif-badge-count");
            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = "inline-block";
                } else {
                    badge.style.display = "none";
                }
            }

            res.notifications.forEach(n => {
                const item = document.createElement("div");
                item.style.cssText = `background: ${n.read ? '#0f172a' : '#1e293b'}; padding: 1rem; border-radius: 8px; border: 1px solid ${n.read ? '#334155' : '#0284c7'};`;
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div style="font-weight: 600; color: #38bdf8; font-size: 0.95rem;">${n.title}</div>
                        <span style="font-size: 0.75rem; color: #94a3b8;">${formatDate(n.timestamp)}</span>
                    </div>
                    <div style="font-size: 0.88rem; color: #cbd5e1; margin-top: 0.4rem; line-height: 1.4;">${n.message}</div>
                    ${n.applicationId ? `<button class="action-btn" style="margin-top: 0.6rem; font-size: 0.78rem;" onclick="trackApplicationById('${n.applicationId}')">View Application Track</button>` : ''}
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = `<div style="text-align: center; color: #94a3b8; padding: 2rem;">No notifications found.</div>`;
        }
    } catch (e) {
        console.error("Error loading notifications:", e);
    }
}

async function markAllNotificationsRead() {
    alert("All notifications marked as read.");
    await loadNotifications();
}

/* ================= 8. MY PROFILE ================= */

async function loadProfile() {
    try {
        const res = await window.getCitizenProfile();
        if (res && res.success && res.profile) {
            const p = res.profile;
            document.getElementById("prof-name").textContent = p.name || "Hari Prem";
            document.getElementById("prof-id").textContent = p.citizenId || "CIT-2026-9081";
            document.getElementById("prof-email").textContent = p.email || "";
            document.getElementById("prof-mobile").textContent = p.mobile || "6383120790";
            document.getElementById("prof-address").textContent = p.address || "Coimbatore, Tamil Nadu";

            document.getElementById("edit-name").value = p.name || "";
            document.getElementById("edit-mobile").value = p.mobile || "";
            document.getElementById("edit-address").value = p.address || "";
        }
    } catch (e) {
        console.error("Error loading profile:", e);
    }
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    const name = document.getElementById("edit-name").value.trim();
    const mobile = document.getElementById("edit-mobile").value.trim();
    const address = document.getElementById("edit-address").value.trim();

    try {
        const res = await window.updateCitizenProfile({ name, mobile, address });
        if (res && res.success) {
            alert("Profile updated successfully!");
            await loadProfile();
        } else {
            alert(res.message || "Failed to update profile.");
        }
    } catch (e) {
        alert(e.message || "Error updating profile.");
    }
}

/* ================= MODAL & SUBMISSION HANDLERS ================= */

function openOwnerChangeModal() {
    const modal = document.getElementById("owner-change-modal");
    const select = document.getElementById("oc-parcel-id");
    if (!modal || !select) return;

    select.innerHTML = `<option value="">Select your property...</option>`;

    // Populate user's authorized properties
    const assigned = (currentUser && currentUser.assignedParcels) ? currentUser.assignedParcels : ["LND-001", "LND-003"];
    assigned.forEach(id => {
        const opt = document.createElement("option");
        opt.value = id;
        opt.textContent = `Parcel ${id} (Ramgarh / Central District)`;
        select.appendChild(opt);
    });

    if (assigned.length > 0) {
        select.value = assigned[0];
        populateCurrentOwner(assigned[0]);
    }

    modal.style.display = "flex";
}

function openOwnerChangeForParcel(parcelId, currentOwner) {
    openOwnerChangeModal();
    const select = document.getElementById("oc-parcel-id");
    if (select) select.value = parcelId;
    populateCurrentOwner(parcelId, currentOwner);
}

function populateCurrentOwner(parcelId, fallbackOwner = "") {
    const field = document.getElementById("oc-current-owner");
    if (!field) return;

    if (fallbackOwner) {
        field.value = fallbackOwner;
        return;
    }

    if (parcelId === "LND-001") field.value = "Arun Kumar";
    else if (parcelId === "LND-003") field.value = "Demo Agricultural Owner";
    else field.value = currentUser ? currentUser.name : "Hari Prem";
}

async function handleOwnerChangeSubmit(event) {
    event.preventDefault();
    const parcelId = document.getElementById("oc-parcel-id").value;
    const currentOwner = document.getElementById("oc-current-owner").value;
    const newOwner = document.getElementById("oc-new-owner").value.trim();
    const relationship = document.getElementById("oc-relationship").value;
    const reason = document.getElementById("oc-reason").value.trim();
    const declaration = document.getElementById("oc-declaration").checked;

    try {
        const res = await window.submitOwnerChangeApplication({
            parcelId,
            currentOwner,
            newOwner,
            relationship,
            reason,
            declaration
        });

        if (res && res.success && res.application) {
            const appId = res.application.applicationId;

            // Upload any attached required document files
            const reqKeys = ["saleDeed", "idProof", "previousRoR", "surveyDoc", "landUseDoc", "taxReceipt"];
            for (const key of reqKeys) {
                const input = document.getElementById(`oc-doc-${key}`);
                if (input && input.files && input.files[0]) {
                    const formData = new FormData();
                    formData.append("file", input.files[0]);
                    formData.append("reqKey", key);
                    try {
                        await window.uploadRequirementDocument(appId, formData);
                    } catch (err) {
                        console.warn(`Failed to upload ${key} file:`, err);
                    }
                }
            }

            closeModal("owner-change-modal");
            alert(`Owner Change Application submitted successfully! Application ID: ${appId}`);

            await loadDashboardSummary();
            await loadApplications();
            trackApplicationById(appId);
        } else {
            alert(res.message || "Failed to submit owner change application.");
        }
    } catch (e) {
        alert(e.message || "Error submitting owner change application.");
    }
}

function openServiceModal(serviceType) {
    const modal = document.getElementById("service-request-modal");
    const title = document.getElementById("service-modal-title");
    const srvTypeInput = document.getElementById("srv-type");
    const select = document.getElementById("srv-parcel-id");
    const extraFieldsContainer = document.getElementById("srv-extra-fields");

    if (!modal) return;
    if (title) title.textContent = `🛎️ ${serviceType}`;
    if (srvTypeInput) srvTypeInput.value = serviceType;

    if (select) {
        select.innerHTML = `<option value="">Select parcel...</option>`;
        const assigned = (currentUser && currentUser.assignedParcels) ? currentUser.assignedParcels : ["LND-001", "LND-003"];
        assigned.forEach(id => {
            const opt = document.createElement("option");
            opt.value = id;
            opt.textContent = `Parcel ${id}`;
            select.appendChild(opt);
        });
        if (assigned.length > 0) select.value = assigned[0];
    }

    if (extraFieldsContainer) {
        extraFieldsContainer.innerHTML = "";

        if (serviceType === "Land Use Request") {
            extraFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Current Land Use</label>
                    <input type="text" id="srv-current-lu" class="form-input" value="Residential / Freehold" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Requested Land Use Category *</label>
                    <select id="srv-requested-lu" class="form-input" required>
                        <option value="Residential">Residential Development</option>
                        <option value="Commercial">Commercial Zoning</option>
                        <option value="Industrial">Industrial Light Zone</option>
                        <option value="Agricultural">Agricultural Land Use</option>
                        <option value="Mixed Use">Mixed Development</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Supporting Site Plan / Layout Documents</label>
                    <input type="file" id="srv-docs" class="form-input" multiple style="padding: 0.4rem;">
                </div>
                <div class="form-group" style="display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.75rem;">
                    <input type="checkbox" id="srv-declaration" required style="margin-top: 0.2rem;">
                    <label for="srv-declaration" style="font-size: 0.8rem; color: #cbd5e1;">
                        I declare that this land-use request complies with municipal master planning regulations and understand it requires Land Use Officer review.
                    </label>
                </div>
            `;
        } else if (serviceType === "Mutation Request") {
            extraFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Mutation Category *</label>
                    <select id="srv-mut-cat" class="form-input" required>
                        <option value="Title Transfer Post Sale">Title Transfer Post Sale</option>
                        <option value="Inheritance Succession">Inheritance / Succession</option>
                        <option value="Family Partition">Family Partition</option>
                        <option value="Court Order Mutation">Court Order Mutation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">New Owner / Rights Holder Name *</label>
                    <input type="text" id="srv-mut-holder" class="form-input" placeholder="Enter beneficiary full name" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Supporting Deed / Legal Heir Documents</label>
                    <input type="file" id="srv-docs" class="form-input" multiple style="padding: 0.4rem;">
                </div>
                <div class="form-group" style="display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.75rem;">
                    <input type="checkbox" id="srv-declaration" required style="margin-top: 0.2rem;">
                    <label for="srv-declaration" style="font-size: 0.8rem; color: #cbd5e1;">
                        I declare that all attached records for Record of Rights (RoR) mutation are authentic.
                    </label>
                </div>
            `;
        } else if (serviceType === "Property Registration") {
            extraFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Deed Transaction Type *</label>
                    <select id="srv-reg-deed" class="form-input" required>
                        <option value="Sale Deed Registration">Sale Deed Registration</option>
                        <option value="Gift Deed Registration">Gift Deed Registration</option>
                        <option value="Lease Deed Registration">Lease Deed Registration</option>
                        <option value="Mortgage Deed Clearance">Mortgage Deed Clearance</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Deed / Reference Number (Optional)</label>
                    <input type="text" id="srv-reg-ref" class="form-input" placeholder="e.g. DEED-2026-9081">
                </div>
                <div class="form-group">
                    <label class="form-label">Attach Registered Deed Draft / Stamp Receipt</label>
                    <input type="file" id="srv-docs" class="form-input" multiple style="padding: 0.4rem;">
                </div>
                <div class="form-group" style="display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.75rem;">
                    <input type="checkbox" id="srv-declaration" required style="margin-top: 0.2rem;">
                    <label for="srv-declaration" style="font-size: 0.8rem; color: #cbd5e1;">
                        I confirm that stamp duty and registration fee details provided are accurate.
                    </label>
                </div>
            `;
        } else if (serviceType === "Property Tax Services") {
            extraFieldsContainer.innerHTML = `
                <div class="form-group">
                    <label class="form-label">Tax Service Type *</label>
                    <select id="srv-tax-type" class="form-input" required>
                        <option value="Property Tax Assessment Dispute">Property Tax Assessment Dispute</option>
                        <option value="Tax Receipt Copy Request">Tax Receipt Copy Request</option>
                        <option value="Address Correction for Tax Bill">Address Correction for Tax Bill</option>
                        <option value="Exemption / Concession Claim">Tax Exemption / Concession Claim</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Attach Tax Proof / Assessment Receipt</label>
                    <input type="file" id="srv-docs" class="form-input" multiple style="padding: 0.4rem;">
                </div>
                <div class="form-group" style="display: flex; gap: 0.5rem; align-items: flex-start; margin-top: 0.75rem;">
                    <input type="checkbox" id="srv-declaration" required style="margin-top: 0.2rem;">
                    <label for="srv-declaration" style="font-size: 0.8rem; color: #cbd5e1;">
                        I verify that I am the registered tax payer for this property.
                    </label>
                </div>
            `;
        }
    }

    modal.style.display = "flex";
}

async function handleGenericServiceSubmit(event) {
    event.preventDefault();
    const parcelId = document.getElementById("srv-parcel-id").value;
    const type = document.getElementById("srv-type").value || "Land Service Request";
    const reason = document.getElementById("srv-reason").value.trim();

    const reqData = { parcelId, type, reason };

    const requestedLuInput = document.getElementById("srv-requested-lu");
    if (requestedLuInput) reqData.requestedLandUse = requestedLuInput.value;

    const mutHolderInput = document.getElementById("srv-mut-holder");
    if (mutHolderInput) reqData.newOwner = mutHolderInput.value.trim();

    const regDeedInput = document.getElementById("srv-reg-deed");
    if (regDeedInput) reqData.deedType = regDeedInput.value;

    const taxTypeInput = document.getElementById("srv-tax-type");
    if (taxTypeInput) reqData.taxServiceType = taxTypeInput.value;

    try {
        const res = await window.submitServiceApplication(reqData);
        if (res && res.success) {
            closeModal("service-request-modal");
            alert(`Service request submitted successfully! Request ID: ${res.request.requestId || res.request.applicationId}`);

            await loadDashboardSummary();
            await loadApplications();
            switchTab("applications", "my");
        } else {
            alert(res.message || "Failed to submit service request.");
        }
    } catch (e) {
        alert(e.message || "Failed to submit service request.");
    }
}

async function handleSupportSubmit(event) {
    event.preventDefault();
    alert("Your support ticket has been submitted. Our helpdesk will contact you shortly.");
    document.getElementById("support-message").value = "";
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = "none";
}

function viewParcelProfile(parcelId) {
    if (typeof window.openCompleteLandProfile === "function") {
        window.openCompleteLandProfile(parcelId);
    } else {
        alert(`Opening Complete Land Profile for ${parcelId}...`);
    }
}

async function handleLogout() {
    try {
        if (typeof window.logoutUser === "function") {
            await window.logoutUser();
        }
    } catch (e) {
        console.warn("Backend logout request ignored:", e);
    } finally {
        if (window.AuthManager && typeof window.AuthManager.clearSession === "function") {
            window.AuthManager.clearSession();
        } else {
            sessionStorage.clear();
            localStorage.clear();
        }
        window.location.href = "login.html";
    }
}

/* HELPER UTILITIES */
function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatStatus(status) {
    if (!status) return "Pending";
    if (status === "UNDER_VERIFICATION") return "Under Verification";
    if (status === "COMPLETED") return "Completed";
    if (status === "REJECTED") return "Rejected";
    return status;
}

function getStatusTagClass(status) {
    if (!status) return "tag-pending";
    const s = status.toUpperCase();
    if (s.includes("APPROVED") || s.includes("COMPLETED") || s.includes("VERIFIED") || s.includes("AVAILABLE")) return "tag-approved";
    if (s.includes("REJECTED")) return "tag-rejected";
    if (s.includes("REVIEW")) return "tag-review";
    return "tag-pending";
}
async function searchULPIN() {

    const input = document.getElementById("ulpin-search-input");
    const container = document.getElementById("ulpin-result-container");

    const ulpin = input.value.trim();

    if (!ulpin) {
        alert("Please enter a ULPIN.");
        return;
    }

    container.innerHTML = `
        <div class="govt-card">
            Searching land...
        </div>
    `;

    try {

        const result = await window.searchLandByULPIN(ulpin);

        if (!result.success) {
            container.innerHTML = `
                <div class="govt-card">
                    <h3>❌ Land Not Found</h3>
                    <p>${result.message}</p>
                </div>
            `;
            return;
        }

        displayULPINLand(result.data);

    } catch (error) {

        container.innerHTML = `
            <div class="govt-card">
                <h3>❌ Search Failed</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}
function displayULPINLand(land) {

    const container =
        document.getElementById("ulpin-result-container");

    container.innerHTML = `

        <div class="govt-card">

            <h2>🏡 Land Found</h2>

            <div class="land-basic-grid">

                <div>
                    <strong>ULPIN</strong>
                    <p>${land.ulpin}</p>
                </div>

                <div>
                    <strong>Parcel ID</strong>
                    <p>${land.parcelId}</p>
                </div>

                <div>
                    <strong>Survey Number</strong>
                    <p>${land.surveyNumber}</p>
                </div>

                <div>
                    <strong>Owner</strong>
                    <p>${land.owner}</p>
                </div>

                <div>
                    <strong>Extent</strong>
                    <p>${land.extent}</p>
                </div>

                <div>
                    <strong>Land Use</strong>
                    <p>${land.landUse}</p>
                </div>

                <div>
                    <strong>Village</strong>
                    <p>${land.village}</p>
                </div>

                <div>
                    <strong>District</strong>
                    <p>${land.district}</p>
                </div>

            </div>

            <hr>

            <h3>Department Verification</h3>

            <div class="verification-grid">

                <div>✓ Cadastral & Survey</div>
                <div>✓ Land Records / RoR</div>
                <div>✓ Registration & Legal</div>
                <div>✓ Land Use & Planning</div>
                <div>✓ Property Tax & Municipal</div>

            </div>

            <hr>

            <h3>🛰 Satellite Verification</h3>

            <p>
                ${land.cadastral.satelliteChange}
            </p>

        </div>
    `;
}
// Window Exports
window.switchTab = switchTab;
window.toggleSubmenu = toggleSubmenu;
window.switchAppSubTab = switchAppSubTab;
window.toggleSidebar = toggleSidebar;
window.trackApplicationById = trackApplicationById;
window.loadTrackingDetails = loadTrackingDetails;
window.openOwnerChangeModal = openOwnerChangeModal;
window.openOwnerChangeForParcel = openOwnerChangeForParcel;
window.handleOwnerChangeSubmit = handleOwnerChangeSubmit;
window.openServiceModal = openServiceModal;
window.handleGenericServiceSubmit = handleGenericServiceSubmit;
window.filterDocsByCategory = filterDocsByCategory;
window.handleProfileUpdate = handleProfileUpdate;
window.handleSupportSubmit = handleSupportSubmit;
window.markAllNotificationsRead = markAllNotificationsRead;
window.openResubmitDocModal = openResubmitDocModal;
window.handleResubmitDocSubmit = handleResubmitDocSubmit;
window.closeModal = closeModal;
window.viewParcelProfile = viewParcelProfile;
window.handleLogout = handleLogout;
