/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   MAP.JS

   GIS map initialized with visual governance and conflict layer.
   ========================================================= */

/* Initialize global caches and maps */
window.parcelGovernance = window.parcelGovernance || {};
window.parcelPolygons = window.parcelPolygons || {};


/* =========================================================
   1. CREATE MAP
   ========================================================= */

const map = L.map("map").setView(
    [11.0168, 76.9558],
    13
);

/* Make map available globally */
window.map = map;


/* =========================================================
   2. OPENSTREETMAP
   ========================================================= */

const openStreetMapLayer = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }
).addTo(map);


/* =========================================================
   3. PARCEL LAYER
   ========================================================= */

const parcelLayer = L.layerGroup().addTo(map);

/* Make available globally */
window.parcelLayer = parcelLayer;


/* =========================================================
   4. GOVERNANCE STYLING & STATUS HELPERS
   ========================================================= */

const GOVERNANCE_STYLES = {
    VALID: {
        color: "#16a34a",
        weight: 2,
        fillColor: "#4ade80",
        fillOpacity: 0.35
    },
    WARNING: {
        color: "#d97706",
        weight: 2,
        fillColor: "#fbbf24",
        fillOpacity: 0.45
    },
    CONFLICT: {
        color: "#dc2626",
        weight: 2,
        fillColor: "#f87171",
        fillOpacity: 0.50
    }
};

/**
 * Determines the visual map status for a parcel based on cached assessment.
 * Priority: CONFLICT -> WARNING -> VALID
 */
function getParcelMapStatus(parcelId) {
    const cached = window.parcelGovernance && window.parcelGovernance[parcelId];
    if (!cached) return "VALID";

    const conflictData = cached.conflicts;
    const govData = cached.governance;

    // Check CONFLICT priority
    if (conflictData && (conflictData.highestSeverity === "HIGH" || (conflictData.conflicts && conflictData.conflicts.some(c => c.severity === "HIGH" || c.status === "CONFLICT")))) {
        return "CONFLICT";
    }
    if (govData && (govData.overallStatus === "CONFLICT" || govData.riskLevel === "HIGH")) {
        const hasHighConflict = govData.checks && govData.checks.some(c => c.status === "CONFLICT" && c.severity === "HIGH");
        if (hasHighConflict) return "CONFLICT";
    }

    // Check WARNING priority
    if (conflictData && (conflictData.highestSeverity === "MEDIUM" || conflictData.conflictCount > 0 || (conflictData.conflicts && conflictData.conflicts.length > 0))) {
        return "WARNING";
    }
    if (govData && (govData.overallStatus === "REVIEW_REQUIRED" || govData.riskLevel === "MEDIUM" || (govData.issues && govData.issues.length > 0))) {
        return "WARNING";
    }

    return "VALID";
}

/**
 * Applies governance styling to a Leaflet polygon.
 */
function applyGovernanceStyle(polygon, status) {
    const style = GOVERNANCE_STYLES[status] || GOVERNANCE_STYLES.VALID;
    polygon.setStyle(style);
    polygon._govStatus = status;
}

/**
 * Builds HTML content for the parcel Leaflet popup.
 */
function buildParcelPopupContent(parcel, status, riskLevel, conflictCount) {
    let badgeIcon = "🟢";
    let badgeText = "VALID";
    let badgeClass = "status-valid";

    if (status === "CONFLICT") {
        badgeIcon = "🔴";
        badgeText = "CONFLICT";
        badgeClass = "status-conflict";
    } else if (status === "WARNING") {
        badgeIcon = "🟡";
        badgeText = "REVIEW REQUIRED";
        badgeClass = "status-warning";
    }

    const displayRisk = riskLevel || (status === "CONFLICT" ? "HIGH" : (status === "WARNING" ? "MEDIUM" : "LOW"));
    const displayConflicts = conflictCount !== undefined ? conflictCount : (status === "VALID" ? 0 : "-");

    return `
        <div style="font-family: Arial, sans-serif; padding: 2px; min-width: 170px;">
            <strong style="font-size: 15px; color: #0f172a; display: block; margin-bottom: 4px;">${parcel.id}</strong>
            <div style="margin-bottom: 8px;">
                <span class="popup-status-badge ${badgeClass}">${badgeIcon} ${badgeText}</span>
            </div>
            <div style="font-size: 12px; color: #475569; line-height: 1.6;">
                <strong>Survey Number:</strong> ${parcel.surveyNumber}<br>
                <strong>Land Use:</strong> ${parcel.landUse}<br>
                <strong>Area:</strong> ${parcel.area}<br>
                <strong>Governance:</strong> ${badgeIcon} ${badgeText}<br>
                <strong>Risk:</strong> <span style="font-weight:700; color:${displayRisk === 'HIGH' ? '#dc2626' : (displayRisk === 'MEDIUM' ? '#d97706' : '#16a34a')};">${displayRisk}</span><br>
                <strong>Conflicts:</strong> ${displayConflicts}
            </div>
            <div style="margin-top: 12px;">
                <button
                    onclick="openCompleteLandProfile('${parcel.id}')"
                    style="
                        width: 100%;
                        padding: 8px 12px;
                        border: none;
                        border-radius: 6px;
                        background: #2563eb;
                        color: white;
                        font-weight: 600;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background 0.2s ease;
                    "
                    onmouseover="this.style.background='#1d4ed8'"
                    onmouseout="this.style.background='#2563eb'"
                >
                    View Details
                </button>
            </div>
        </div>
    `;
}


/* =========================================================
   5. DRAW PARCEL
   ========================================================= */

function drawParcel(parcel) {
    const initialStatus = getParcelMapStatus(parcel.id);
    const initialStyle = GOVERNANCE_STYLES[initialStatus] || {
        color: "#2563eb",
        weight: 2,
        fillColor: "#60a5fa",
        fillOpacity: 0.35
    };

    const polygon = L.polygon(
        parcel.coordinates,
        initialStyle
    );

    polygon._govStatus = initialStatus;
    polygon.addTo(parcelLayer);

    // Store polygon reference
    window.parcelPolygons[parcel.id] = polygon;

    /* Popup */
    polygon.bindPopup(buildParcelPopupContent(parcel, initialStatus, "LOW", 0));

    /* Parcel Click -> Open Complete Land Profile */
    polygon.on("click", function () {
        openCompleteLandProfile(parcel.id);
    });

    /* Hover effect */
    polygon.on("mouseover", function () {
        const currentStatus = polygon._govStatus || "VALID";
        const baseStyle = GOVERNANCE_STYLES[currentStatus] || GOVERNANCE_STYLES.VALID;
        polygon.setStyle({
            fillOpacity: Math.min(0.85, baseStyle.fillOpacity + 0.25),
            weight: 3.5
        });
    });

    polygon.on("mouseout", function () {
        const currentStatus = polygon._govStatus || "VALID";
        const baseStyle = GOVERNANCE_STYLES[currentStatus] || GOVERNANCE_STYLES.VALID;
        polygon.setStyle(baseStyle);
    });
}


/* =========================================================
   6. ASYNC GOVERNANCE ANALYSIS LOADER
   ========================================================= */

async function loadGovernanceForParcels() {
    if (!window.landParcels || window.landParcels.length === 0) return;

    showMapLoadingBadge("Analyzing governance status...");

    try {
        // Attempt bulk fetching if available, or fetch per parcel asynchronously
        let bulkGov = null;
        let bulkConflicts = null;

        try {
            const [govRes, confRes] = await Promise.all([
                getAllGovernance(),
                getAllConflicts()
            ]);
            if (govRes && govRes.success) bulkGov = govRes.data;
            if (confRes && confRes.success) bulkConflicts = confRes.data;
        } catch (e) {
            console.log("Bulk governance fetch not used, falling back to individual calls.");
        }

        for (const parcel of window.landParcels) {
            const parcelId = parcel.id;

            // Skip if already cached
            if (!window.parcelGovernance[parcelId]) {
                try {
                    let govData = null;
                    let confData = null;

                    if (bulkGov) {
                        const found = bulkGov.find(item => item.parcelId === parcelId);
                        if (found) govData = found.data;
                    } else {
                        const res = await getGovernanceByParcelId(parcelId);
                        if (res && res.success) govData = res.data;
                    }

                    if (bulkConflicts) {
                        const found = bulkConflicts.find(item => item.parcelId === parcelId);
                        if (found) confData = found.data;
                    } else {
                        const res = await getConflictsByParcelId(parcelId);
                        if (res && res.success) confData = res.data;
                    }

                    window.parcelGovernance[parcelId] = {
                        governance: govData,
                        conflicts: confData
                    };
                } catch (err) {
                    console.warn(`Governance analysis unavailable for: ${parcelId}`, err);
                    // Do NOT treat API error as a conflict. Keep default parcel state.
                    window.parcelGovernance[parcelId] = { governance: null, conflicts: null };
                }
            }

            // Update polygon style & popup for parcel
            const polygon = window.parcelPolygons[parcelId];
            if (polygon) {
                const status = getParcelMapStatus(parcelId);
                applyGovernanceStyle(polygon, status);

                const cached = window.parcelGovernance[parcelId];
                const riskLevel = cached.conflicts?.highestSeverity || cached.governance?.riskLevel || "LOW";
                const conflictCount = cached.conflicts?.conflictCount || 0;

                polygon.setPopupContent(buildParcelPopupContent(parcel, status, riskLevel, conflictCount));
            }
        }
    } catch (error) {
        console.error("Error analyzing governance status:", error);
    } finally {
        hideMapLoadingBadge();
    }
}

/* Loading badge helpers */
function showMapLoadingBadge(message) {
    let badge = document.getElementById("map-governance-loading-badge");
    if (!badge) {
        badge = document.createElement("div");
        badge.id = "map-governance-loading-badge";
        badge.className = "map-governance-loading-badge";
        const mapContainer = document.getElementById("map");
        if (mapContainer) mapContainer.style.position = "relative";
        if (mapContainer) mapContainer.appendChild(badge);
    }
    badge.innerHTML = `<div class="loading-badge-spinner"></div> ${message}`;
    badge.style.display = "flex";
}

function hideMapLoadingBadge() {
    const badge = document.getElementById("map-governance-loading-badge");
    if (badge) {
        badge.style.display = "none";
    }
}


/* =========================================================
   7. LOAD PARCELS FROM BACKEND
   ========================================================= */

async function loadParcels() {
    try {
        console.log("Loading land parcels from backend...");
        const response = await getParcels();

        if (!response.success) {
            throw new Error("Backend returned an unsuccessful response.");
        }

        const parcels = response.data;
        window.landParcels = parcels;

        /* Clear old parcels */
        parcelLayer.clearLayers();
        window.parcelPolygons = {};

        /* Draw parcels immediately */
        parcels.forEach(function (parcel) {
            drawParcel(parcel);
        });

        console.log(`Loaded ${parcels.length} parcels from API.`);

        /* Asynchronously analyze governance status and update map */
        loadGovernanceForParcels();

    } catch (error) {
        console.error("Unable to load parcels:", error);
        window.landParcels = [];
        if (error && error.message && (error.message.includes("401") || error.message.includes("UNAUTHORIZED"))) {
            showUnauthenticatedMapNotice();
        }
    }
}

function showUnauthenticatedMapNotice() {
    let notice = document.getElementById("map-unauth-notice");
    if (!notice) {
        notice = document.createElement("div");
        notice.id = "map-unauth-notice";
        notice.style.cssText = "position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 1000; background: rgba(220, 38, 38, 0.95); color: white; padding: 12px 20px; border-radius: 8px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 12px; font-family: system-ui, -apple-system, sans-serif;";
        const mapContainer = document.getElementById("map");
        if (mapContainer) {
            mapContainer.style.position = "relative";
            mapContainer.appendChild(notice);
        }
    }
    notice.innerHTML = `🔒 <span>Authentication required to view parcels.</span> <a href="login.html" style="color: #fff; background: rgba(255,255,255,0.25); padding: 4px 10px; border-radius: 4px; text-decoration: none; font-weight: bold;">Log In</a>`;
    notice.style.display = "flex";
}


/* =========================================================
   8. MAP CLICK
   ========================================================= */

map.on("click", function (event) {
    const latitude = event.latlng.lat.toFixed(6);
    const longitude = event.latlng.lng.toFixed(6);

    console.log("Selected coordinates:", latitude, longitude);

    L.popup()
        .setLatLng(event.latlng)
        .setContent(`
            <strong>Selected Location</strong>
            <br><br>
            Latitude: ${latitude}
            <br>
            Longitude: ${longitude}
        `)
        .openOn(map);
});


/* =========================================================
   9. GOVERNANCE MAP LEGEND CONTROL
   ========================================================= */

const governanceLegend = L.control({ position: "bottomright" });

governanceLegend.onAdd = function () {
    const div = L.DomUtil.create("div", "governance-legend");
    div.innerHTML = `
        <h4>LAND GOVERNANCE STATUS</h4>
        <div class="legend-item">
            <span class="legend-dot valid"></span>
            <div class="legend-text">
                <span class="legend-title" style="color: #16a34a;">🟢 VALID</span>
                <span class="legend-desc">Land records appear consistent</span>
            </div>
        </div>
        <div class="legend-item">
            <span class="legend-dot warning"></span>
            <div class="legend-text">
                <span class="legend-title" style="color: #d97706;">🟡 REVIEW REQUIRED</span>
                <span class="legend-desc">Administrative review recommended</span>
            </div>
        </div>
        <div class="legend-item">
            <span class="legend-dot conflict"></span>
            <div class="legend-text">
                <span class="legend-title" style="color: #dc2626;">🔴 CONFLICT</span>
                <span class="legend-desc">High-priority governance conflict detected</span>
            </div>
        </div>
    `;
    return div;
};

governanceLegend.addTo(map);


/* =========================================================
   10. BASE MAP & LAYER CONTROL
   ========================================================= */

const baseMaps = {
    "OpenStreetMap": openStreetMapLayer
};

const overlayMaps = {
    "Land Parcels": parcelLayer
};

const layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
window.layerControl = layerControl;


/* =========================================================
   11. SCALE
   ========================================================= */

L.control.scale({
    imperial: false
}).addTo(map);


/* =========================================================
   12. START
   ========================================================= */

loadParcels();

console.log("GIS map with Visual Governance & Conflict Layer initialized.");
