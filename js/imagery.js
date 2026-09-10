/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   IMAGERY.JS

   Frontend imagery module — comparison, change map overlays,
   and verification workflow integration.
   ========================================================= */

(function () {
    "use strict";

    /* =========================================================
       1. INITIALIZATION
       ========================================================= */

    function initImageryComparisonWidget(parcelId, imageryData) {
        if (!imageryData || !imageryData.imagery) return;

        const satellite = imageryData.imagery.filter(i => i.source === "SATELLITE");
        if (satellite.length >= 2) {
            const beforeSelect = document.getElementById("imagery-before-date");
            const afterSelect = document.getElementById("imagery-after-date");

            if (beforeSelect && satellite.length > 0) {
                beforeSelect.selectedIndex = 0;
            }
            if (afterSelect && satellite.length > 1) {
                afterSelect.selectedIndex = satellite.length - 1;
            }
        }
    }

    /* =========================================================
       2. CHANGE MAP OVERLAY
       ========================================================= */

    async function loadImageryChangeOverlay(parcelId) {
        if (!window.imageryChangeLayer || !window.imageryDetectionLayer) return;

        window.imageryChangeLayer.clearLayers();
        window.imageryDetectionLayer.clearLayers();

        try {
            const result = await getImageryChanges(parcelId);
            if (!result || !result.success || !result.changes || result.changes.length === 0) return;

            const parcel = window.landParcels ? window.landParcels.find(p => p.id === parcelId) : null;
            if (!parcel || !parcel.coordinates) return;

            result.changes.forEach(change => {
                if (!change.changePolygons || change.changePolygons.length === 0) {
                    const bounds = parcel.coordinates;
                    const center = getPolygonCenter(bounds);

                    const circleMarker = L.circleMarker(center, {
                        radius: 8,
                        color: getChangeColor(change.changeCategory),
                        fillColor: getChangeColor(change.changeCategory),
                        fillOpacity: 0.6,
                        weight: 2
                    });

                    circleMarker.bindPopup(buildChangePopup(change));
                    circleMarker.addTo(window.imageryChangeLayer);
                }

                const detMarker = L.circleMarker(
                    parcel.coordinates[0] || [11.02, 76.95],
                    {
                        radius: 5,
                        color: "#7c3aed",
                        fillColor: "#7c3aed",
                        fillOpacity: 0.5,
                        weight: 1
                    }
                );
                detMarker.bindPopup(`
                    <div style="font-size:12px; min-width:150px;">
                        <strong>${change.changeId}</strong><br>
                        <span style="color:${getChangeColor(change.changeCategory)};">${change.changeLabel}</span><br>
                        Confidence: ${change.confidence}%
                    </div>
                `);
                detMarker.addTo(window.imageryDetectionLayer);
            });

        } catch (e) {
            console.warn("Imagery overlay load failed:", e);
        }
    }

    function getChangeColor(category) {
        const colors = {
            "NEW_CONSTRUCTION": "#dc2626",
            "BUILDING_EXPANSION": "#b45309",
            "VEGETATION_LOSS": "#16a34a",
            "AGRICULTURAL_TO_BUILTUP": "#dc2626",
            "WATERBODY_CHANGE": "#0284c7",
            "ROAD_CHANGE": "#d97706",
            "POSSIBLE_ENCROACHMENT": "#7c3aed",
            "NO_SIGNIFICANT_CHANGE": "#64748b"
        };
        return colors[category] || "#64748b";
    }

    function getPolygonCenter(coords) {
        if (!coords || coords.length === 0) return [11.02, 76.95];
        let lat = 0, lng = 0;
        coords.forEach(c => {
            lat += c[0];
            lng += c[1];
        });
        return [lat / coords.length, lng / coords.length];
    }

    function buildChangePopup(change) {
        const govStatus = change.governanceResult?.status || "UNKNOWN";
        let govColor = "#16a34a";
        if (govStatus === "POTENTIAL_VIOLATION") govColor = "#dc2626";
        else if (govStatus === "REVIEW_REQUIRED") govColor = "#d97706";

        return `
            <div style="font-size:12px; min-width:200px;">
                <strong style="font-size:13px;">${change.changeLabel}</strong><br>
                <span style="color:${getChangeColor(change.changeCategory)}; font-weight:700;">${change.changeCategory}</span><br>
                <div style="margin-top:6px;">
                    <strong>Confidence:</strong> ${change.confidence}%<br>
                    <strong>Area Changed:</strong> ${change.changedArea}<br>
                    <strong>Period:</strong> ${change.beforeDate} → ${change.afterDate}<br>
                    <strong>Governance:</strong> <span style="color:${govColor}; font-weight:700;">${govStatus}</span>
                </div>
                <div style="margin-top:8px; font-size:11px; color:#64748b;">
                    ${change.governanceResult?.message || ''}
                </div>
                ${change.governanceResult?.requiresVerification ? `
                    <button onclick="openImageryVerificationModal('${change.parcelId}', '${change.changeId}', '${govStatus}')" style="margin-top:8px; padding:4px 10px; background:#b45309; color:white; border:none; border-radius:3px; font-size:11px; font-weight:600; cursor:pointer;">
                        📤 Request Verification
                    </button>
                ` : ''}
            </div>
        `;
    }

    /* =========================================================
       3. SWIPE COMPARISON (Pure CSS/JS)
       ========================================================= */

    function createSwipeComparison(containerId, beforeSrc, afterSrc, beforeLabel, afterLabel) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="imagery-swipe-container">
                <div class="imagery-swipe-before">
                    <div class="imagery-swipe-label">${beforeLabel || 'Before'}</div>
                    <div class="imagery-swipe-image-placeholder">
                        <div class="imagery-swipe-placeholder-icon">🛰️</div>
                        <div class="imagery-swipe-placeholder-text">${beforeLabel || 'Before Image'}</div>
                        <div class="imagery-swipe-placeholder-sub">Mock satellite imagery</div>
                    </div>
                </div>
                <div class="imagery-swipe-after">
                    <div class="imagery-swipe-label">${afterLabel || 'After'}</div>
                    <div class="imagery-swipe-image-placeholder">
                        <div class="imagery-swipe-placeholder-icon">🛰️</div>
                        <div class="imagery-swipe-placeholder-text">${afterLabel || 'After Image'}</div>
                        <div class="imagery-swipe-placeholder-sub">Mock satellite imagery</div>
                    </div>
                </div>
                <div class="imagery-swipe-divider" id="imagery-swipe-divider">
                    <div class="imagery-swipe-handle">⟷</div>
                </div>
                <input type="range" min="0" max="100" value="50" class="imagery-swipe-slider" id="imagery-swipe-slider" />
            </div>
        `;

        const slider = document.getElementById("imagery-swipe-slider");
        const divider = document.getElementById("imagery-swipe-divider");
        const before = container.querySelector(".imagery-swipe-before");
        const after = container.querySelector(".imagery-swipe-after");

        if (slider && divider && before && after) {
            slider.addEventListener("input", function () {
                const val = this.value;
                divider.style.left = val + "%";
                after.style.clipPath = `inset(0 0 0 ${val}%)`;
                before.style.clipPath = `inset(0 ${100 - val}% 0 0)`;
            });
        }
    }

    /* =========================================================
       4. LOAD OVERLAY ON PARCEL CLICK
       ========================================================= */

    function hookParcelClickForImagery() {
        const origDrawParcel = window.drawParcel;
        if (typeof origDrawParcel !== "function") return;

        window.drawParcel = function (parcel) {
            origDrawParcel(parcel);

            const polygon = window.parcelPolygons[parcel.id];
            if (polygon) {
                polygon.on("click", function () {
                    setTimeout(() => {
                        loadImageryChangeOverlay(parcel.id);
                    }, 500);
                });
            }
        };
    }

    /* =========================================================
       5. PUBLIC API
       ========================================================= */

    window.initImageryComparisonWidget = initImageryComparisonWidget;
    window.loadImageryChangeOverlay = loadImageryChangeOverlay;
    window.createSwipeComparison = createSwipeComparison;
    window.hookParcelClickForImagery = hookParcelClickForImagery;

    /* Auto-hook on load */
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", hookParcelClickForImagery);
    } else {
        hookParcelClickForImagery();
    }

})();
