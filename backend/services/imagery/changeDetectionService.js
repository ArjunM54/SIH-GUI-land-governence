/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   CHANGE DETECTION SERVICE

   Modular architecture for detecting changes between
   two satellite/drone images of the same parcel.

   Pipeline:
   Image A + Image B
   → Preprocessing
   → Image alignment
   → Difference detection
   → Changed regions
   → Change classification
   → Confidence score

   In MOCK mode: Returns deterministic sample results.
   ========================================================= */

const imageryData = require("../../data/imagery");
const parcels = require("../../data/parcels");

/* =========================================================
   CHANGE CATEGORIES
   ========================================================= */

const CHANGE_CATEGORIES = {
    NEW_CONSTRUCTION: {
        label: "New Construction",
        color: "#dc2626",
        icon: "🏗️",
        severity: "HIGH",
        description: "New building or structure detected"
    },
    BUILDING_EXPANSION: {
        label: "Building Expansion",
        color: "#b45309",
        icon: "📐",
        severity: "MEDIUM",
        description: "Existing structure expanded"
    },
    VEGETATION_LOSS: {
        label: "Vegetation Loss",
        color: "#16a34a",
        icon: "🌳",
        severity: "LOW",
        description: "Vegetation cover reduced"
    },
    AGRICULTURAL_TO_BUILTUP: {
        label: "Agricultural to Built-up",
        color: "#dc2626",
        icon: "⚠️",
        severity: "HIGH",
        description: "Agricultural land converted to built-up area"
    },
    WATERBODY_CHANGE: {
        label: "Waterbody Change",
        color: "#0284c7",
        icon: "💧",
        severity: "MEDIUM",
        description: "Water body area or extent changed"
    },
    ROAD_CHANGE: {
        label: "Road Change",
        color: "#d97706",
        icon: "🛣️",
        severity: "LOW",
        description: "Road or pathway construction/modification detected"
    },
    POSSIBLE_ENCROACHMENT: {
        label: "Possible Encroachment",
        color: "#7c3aed",
        icon: "🚨",
        severity: "HIGH",
        description: "Possible unauthorized land encroachment"
    },
    NO_SIGNIFICANT_CHANGE: {
        label: "No Significant Change",
        color: "#64748b",
        icon: "✓",
        severity: "NONE",
        description: "No significant changes detected"
    }
};

/* =========================================================
   MOCK CHANGE DETECTION ENGINE
   ========================================================= */

/**
 * Performs mock change detection between two dates for a parcel.
 *
 * In a real implementation, this would:
 * 1. Fetch actual satellite images from provider
 * 2. Preprocess (atmospheric correction, cloud masking)
 * 3. Align images (georeferencing)
 * 4. Compute spectral differences (NDVI, NDBI, etc.)
 * 5. Segment changed regions
 * 6. Classify changes
 * 7. Assign confidence scores
 *
 * @param {string} parcelId
 * @param {string} beforeDate - ISO date
 * @param {string} afterDate - ISO date
 * @returns {Object} Change detection result
 */
function detectChanges(parcelId, beforeDate, afterDate) {
    const targetParcel = String(parcelId).trim().toUpperCase();

    const parcel = parcels.find(p => p.id.toUpperCase() === targetParcel);
    if (!parcel) {
        return {
            success: false,
            error: "PARCEL_NOT_FOUND",
            message: `Parcel ${targetParcel} not found.`
        };
    }

    if (!beforeDate || !afterDate) {
        return {
            success: false,
            error: "INVALID_DATES",
            message: "Both beforeDate and afterDate are required."
        };
    }

    if (beforeDate >= afterDate) {
        return {
            success: false,
            error: "INVALID_DATE_RANGE",
            message: "beforeDate must be earlier than afterDate."
        };
    }

    /* Check for pre-computed mock results */
    const existingResults = imageryData.getChangeDetection(targetParcel);
    const matchingResult = existingResults.find(r =>
        r.beforeDate <= beforeDate && r.afterDate >= afterDate
    );

    if (matchingResult) {
        return {
            success: true,
            isMock: true,
            disclaimer: "This is a prototype/mock change detection result. Not an actual AI prediction.",
            data: {
                ...matchingResult,
                pipeline: {
                    preprocessing: { status: "COMPLETED", method: "Mock atmospheric correction" },
                    alignment: { status: "COMPLETED", method: "Mock georeferencing" },
                    differenceDetection: { status: "COMPLETED", method: "Mock spectral differencing" },
                    regionSegmentation: { status: "COMPLETED", method: "Mock region growing" },
                    classification: { status: "COMPLETED", method: "Mock rule-based classification" },
                    confidenceAssignment: { status: "COMPLETED", method: "Mock confidence scoring" }
                }
            }
        };
    }

    /* Generate synthetic result for unmatched date ranges */
    const yearsDiff = (new Date(afterDate) - new Date(beforeDate)) / (365.25 * 24 * 60 * 60 * 1000);

    let syntheticCategory = "NO_SIGNIFICANT_CHANGE";
    let syntheticConfidence = 70;
    let syntheticArea = 0;

    if (parcel.landUse === "Agricultural" && yearsDiff > 3) {
        syntheticCategory = "AGRICULTURAL_TO_BUILTUP";
        syntheticConfidence = 78;
        syntheticArea = Math.round(600 + Math.random() * 400);
    } else if (parcel.landUse === "Commercial" && yearsDiff > 2) {
        syntheticCategory = "BUILDING_EXPANSION";
        syntheticConfidence = 74;
        syntheticArea = Math.round(400 + Math.random() * 300);
    }

    const catInfo = CHANGE_CATEGORIES[syntheticCategory] || CHANGE_CATEGORIES.NO_SIGNIFICANT_CHANGE;

    return {
        success: true,
        isMock: true,
        disclaimer: "This is a prototype/mock change detection result. Not an actual AI prediction.",
        data: {
            changeId: `CHG-SYNTH-${Date.now()}`,
            parcelId: targetParcel,
            beforeDate,
            afterDate,
            detectionDate: new Date().toISOString().split("T")[0],
            changeCategory: syntheticCategory,
            changeLabel: catInfo.label,
            confidence: syntheticConfidence,
            changedArea: `${syntheticArea.toLocaleString()} sq.ft`,
            changedAreaSqFt: syntheticArea,
            changePercentage: Math.round((syntheticArea / 5200) * 100 * 10) / 10,
            previousLandUse: parcel.landUse,
            currentLandUse: syntheticCategory === "NO_SIGNIFICANT_CHANGE" ? parcel.landUse : "Unverified",
            verificationStatus: "PENDING",
            governanceResult: evaluateGovernanceImpact(parcel, syntheticCategory),
            changePolygons: [],
            beforeImage: null,
            afterImage: null,
            pipeline: {
                preprocessing: { status: "COMPLETED", method: "Mock preprocessing" },
                alignment: { status: "COMPLETED", method: "Mock alignment" },
                differenceDetection: { status: "COMPLETED", method: "Mock differencing" },
                regionSegmentation: { status: "COMPLETED", method: "Mock segmentation" },
                classification: { status: "COMPLETED", method: "Mock classification" },
                confidenceAssignment: { status: "COMPLETED", method: "Mock confidence" }
            }
        }
    };
}

/**
 * Evaluate governance impact of a detected change.
 */
function evaluateGovernanceImpact(parcel, changeCategory) {
    const hasBuildingRestriction = parcel.buildingPermission === "Restricted";
    const isLandUseChange = ["AGRICULTURAL_TO_BUILTUP", "NEW_CONSTRUCTION"].includes(changeCategory);
    const isExpansion = changeCategory === "BUILDING_EXPANSION";

    if (isLandUseChange && hasBuildingRestriction) {
        return {
            status: "POTENTIAL_VIOLATION",
            message: `Potential unauthorized construction detected — requires departmental verification. Building permission status: ${parcel.buildingPermission}.`,
            buildingPermission: parcel.buildingPermission,
            landUseViolation: true,
            requiresVerification: true
        };
    }

    if (isExpansion && parcel.buildingPermission === "Requires approval") {
        return {
            status: "REVIEW_REQUIRED",
            message: "Building expansion detected. Updated building permission may be required.",
            buildingPermission: parcel.buildingPermission,
            landUseViolation: false,
            requiresVerification: true
        };
    }

    if (isLandUseChange) {
        return {
            status: "REVIEW_REQUIRED",
            message: "Land use change detected. Verify compliance with local zoning regulations.",
            buildingPermission: parcel.buildingPermission,
            landUseViolation: false,
            requiresVerification: true
        };
    }

    return {
        status: "NO_VIOLATION",
        message: "No governance violations detected. Change appears consistent with recorded land use.",
        buildingPermission: parcel.buildingPermission,
        landUseViolation: false,
        requiresVerification: false
    };
}

/**
 * Get the timeline of land use changes for a parcel.
 */
function getChangeTimeline(parcelId) {
    const timeline = imageryData.getLandUseTimelineByParcel(parcelId);
    if (!timeline) {
        return {
            success: true,
            isMock: true,
            disclaimer: "Demo timeline data.",
            data: { parcelId, entries: [] }
        };
    }

    return {
        success: true,
        isMock: true,
        disclaimer: "Demo timeline data. Based on simulated satellite analysis.",
        data: timeline
    };
}

module.exports = {
    detectChanges,
    getChangeTimeline,
    evaluateGovernanceImpact,
    CHANGE_CATEGORIES
};
