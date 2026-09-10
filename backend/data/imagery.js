/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   IMAGERY DATA STORE

   Mock satellite and drone imagery records for parcels.

   Later this file can be replaced by:
   - Real Sentinel-2 API integration
   - VEDAS imagery provider
   - Drone image upload system
   - Cloud storage (S3/Azure Blob)
   ========================================================= */

const imageryRecords = [

    /* =========================================================
       LND-001 — Residential Parcel (Coimbatore)
       ========================================================= */

    {
        id: "IMG-001",
        parcelId: "LND-001",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2019-03-15",
        imageUrl: "/mock/imagery/LND-001/sat-2019-03-15.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 3,
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20190315T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-002",
        parcelId: "LND-001",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2021-06-20",
        imageUrl: "/mock/imagery/LND-001/sat-2021-06-20.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 8,
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20210620T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-003",
        parcelId: "LND-001",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2023-09-10",
        imageUrl: "/mock/imagery/LND-001/sat-2023-09-10.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 12,
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20230910T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-004",
        parcelId: "LND-001",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2026-08-20",
        imageUrl: "/mock/imagery/LND-001/sat-2026-08-20.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 2,
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20260820T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-DRN-001",
        parcelId: "LND-001",
        source: "DRONE",
        provider: "Local Drone Survey",
        date: "2026-07-15",
        imageUrl: "/mock/imagery/LND-001/drone-2026-07-15.png",
        resolution: "0.1m",
        imageType: "RGB_ORTHO",
        cloudCover: 0,
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        surveyMetadata: {
            droneModel: "DJI Phantom 4 RTK",
            flightAltitude: "120m AGL",
            overlap: "80% frontal, 70% side",
            groundSamplingDistance: "3.2 cm/pixel",
            weather: "Clear",
            surveyTeam: "Field Verification Unit - Coimbatore"
        },
        verificationStatus: "VERIFIED",
        metadata: { missionId: "DRN-MISSION-001", processingLevel: "ORTHOMOSAIC" }
    },

    /* =========================================================
       LND-002 — Commercial Parcel (Coimbatore)
       ========================================================= */

    {
        id: "IMG-005",
        parcelId: "LND-002",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2020-01-10",
        imageUrl: "/mock/imagery/LND-002/sat-2020-01-10.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 5,
        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20200110T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-006",
        parcelId: "LND-002",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2022-05-18",
        imageUrl: "/mock/imagery/LND-002/sat-2022-05-18.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 15,
        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20220518T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-007",
        parcelId: "LND-002",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2024-11-05",
        imageUrl: "/mock/imagery/LND-002/sat-2024-11-05.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 7,
        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20241105T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-008",
        parcelId: "LND-002",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2026-08-18",
        imageUrl: "/mock/imagery/LND-002/sat-2026-08-18.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 4,
        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20260818T050000", processingLevel: "L2A" }
    },

    /* =========================================================
       LND-003 — Agricultural Parcel (Coimbatore)
       This parcel has the most interesting change detection results
       ========================================================= */

    {
        id: "IMG-009",
        parcelId: "LND-003",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2019-04-22",
        imageUrl: "/mock/imagery/LND-003/sat-2019-04-22.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 6,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20190422T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-010",
        parcelId: "LND-003",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2021-07-14",
        imageUrl: "/mock/imagery/LND-003/sat-2021-07-14.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 10,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20210714T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-011",
        parcelId: "LND-003",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2023-12-01",
        imageUrl: "/mock/imagery/LND-003/sat-2023-12-01.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 3,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20231201T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-012",
        parcelId: "LND-003",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2024-06-25",
        imageUrl: "/mock/imagery/LND-003/sat-2024-06-25.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 1,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20240625T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-013",
        parcelId: "LND-003",
        source: "SATELLITE",
        provider: "Sentinel-2",
        date: "2026-08-15",
        imageUrl: "/mock/imagery/LND-003/sat-2026-08-15.png",
        resolution: "10m",
        imageType: "OPTICAL",
        cloudCover: 2,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        bandInfo: { bands: ["B02", "B03", "B04"], composite: "RGB" },
        metadata: { sceneId: "S2A_MSIL2A_20260815T050000", processingLevel: "L2A" }
    },
    {
        id: "IMG-DRN-002",
        parcelId: "LND-003",
        source: "DRONE",
        provider: "Local Drone Survey",
        date: "2026-08-01",
        imageUrl: "/mock/imagery/LND-003/drone-2026-08-01.png",
        resolution: "0.05m",
        imageType: "RGB_ORTHO",
        cloudCover: 0,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        surveyMetadata: {
            droneModel: "DJI Matrice 350 RTK",
            flightAltitude: "80m AGL",
            overlap: "85% frontal, 75% side",
            groundSamplingDistance: "1.8 cm/pixel",
            weather: "Clear, wind 5 km/h",
            surveyTeam: "Field Verification Unit - Coimbatore"
        },
        verificationStatus: "PENDING",
        metadata: { missionId: "DRN-MISSION-002", processingLevel: "ORTHOMOSAIC" }
    },
    {
        id: "IMG-DRN-003",
        parcelId: "LND-003",
        source: "DRONE",
        provider: "Local Drone Survey",
        date: "2026-03-10",
        imageUrl: "/mock/imagery/LND-003/drone-2026-03-10.png",
        resolution: "0.08m",
        imageType: "RGB_ORTHO",
        cloudCover: 0,
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        surveyMetadata: {
            droneModel: "DJI Phantom 4 RTK",
            flightAltitude: "100m AGL",
            overlap: "80% frontal, 70% side",
            groundSamplingDistance: "2.7 cm/pixel",
            weather: "Partly cloudy",
            surveyTeam: "Field Verification Unit - Coimbatore"
        },
        verificationStatus: "VERIFIED",
        metadata: { missionId: "DRN-MISSION-003", processingLevel: "ORTHOMOSAIC" }
    }
];

/* =========================================================
   MOCK CHANGE DETECTION RESULTS
   ========================================================= */

const changeDetectionResults = [

    /* LND-003: Agricultural → Construction detected */
    {
        changeId: "CHG-001",
        parcelId: "LND-003",
        beforeDate: "2021-07-14",
        afterDate: "2026-08-15",
        detectionDate: "2026-08-20",
        changeCategory: "AGRICULTURAL_TO_BUILTUP",
        changeLabel: "Agricultural to Built-up Conversion",
        confidence: 91,
        changedArea: "1,250 sq.ft",
        changedAreaSqFt: 1250,
        changePercentage: 8.2,
        previousLandUse: "Agricultural",
        currentLandUse: "Built-up (Unverified)",
        isMock: true,
        disclaimer: "This is a prototype/mock change detection result. Not an actual AI prediction.",
        governanceResult: {
            status: "POTENTIAL_VIOLATION",
            message: "Potential unauthorized construction detected on agricultural land — requires departmental verification.",
            buildingPermission: "RESTRICTED",
            landUseViolation: true,
            requiresVerification: true
        },
        changePolygons: [
            {
                polygonId: "POLY-001",
                category: "NEW_CONSTRUCTION",
                color: "#dc2626",
                coordinates: [
                    [11.0148, 76.9510],
                    [11.0148, 76.9520],
                    [11.0142, 76.9520],
                    [11.0142, 76.9510]
                ],
                area: "850 sq.ft",
                confidence: 93,
                description: "New rectangular structure detected in northwest section of parcel"
            },
            {
                polygonId: "POLY-002",
                category: "ROAD_CHANGE",
                color: "#d97706",
                coordinates: [
                    [11.0145, 76.9508],
                    [11.0145, 76.9525],
                    [11.0143, 76.9525],
                    [11.0143, 76.9508]
                ],
                area: "400 sq.ft",
                confidence: 87,
                description: "New unpaved access path detected leading to construction area"
            }
        ],
        beforeImage: {
            id: "IMG-010",
            date: "2021-07-14",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-003/sat-2021-07-14.png",
            resolution: "10m"
        },
        afterImage: {
            id: "IMG-013",
            date: "2026-08-15",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-003/sat-2026-08-15.png",
            resolution: "10m"
        },
        verificationStatus: "PENDING"
    },

    /* LND-001: Minor vegetation change */
    {
        changeId: "CHG-002",
        parcelId: "LND-001",
        beforeDate: "2019-03-15",
        afterDate: "2026-08-20",
        detectionDate: "2026-08-22",
        changeCategory: "NO_SIGNIFICANT_CHANGE",
        changeLabel: "No Significant Change Detected",
        confidence: 78,
        changedArea: "120 sq.ft",
        changedAreaSqFt: 120,
        changePercentage: 0.5,
        previousLandUse: "Residential",
        currentLandUse: "Residential",
        isMock: true,
        disclaimer: "This is a prototype/mock change detection result. Not an actual AI prediction.",
        governanceResult: {
            status: "NO_VIOLATION",
            message: "No governance violations detected. Parcel usage appears consistent with recorded land use.",
            buildingPermission: "Eligible",
            landUseViolation: false,
            requiresVerification: false
        },
        changePolygons: [
            {
                polygonId: "POLY-003",
                category: "VEGETATION_LOSS",
                color: "#16a34a",
                coordinates: [
                    [11.0190, 76.9510],
                    [11.0190, 76.9515],
                    [11.0187, 76.9515],
                    [11.0187, 76.9510]
                ],
                area: "120 sq.ft",
                confidence: 72,
                description: "Minor vegetation reduction in garden area — likely seasonal variation"
            }
        ],
        beforeImage: {
            id: "IMG-001",
            date: "2019-03-15",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-001/sat-2019-03-15.png",
            resolution: "10m"
        },
        afterImage: {
            id: "IMG-004",
            date: "2026-08-20",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-001/sat-2026-08-20.png",
            resolution: "10m"
        },
        verificationStatus: "RESOLVED"
    },

    /* LND-002: Building expansion detected */
    {
        changeId: "CHG-003",
        parcelId: "LND-002",
        beforeDate: "2020-01-10",
        afterDate: "2026-08-18",
        detectionDate: "2026-08-19",
        changeCategory: "BUILDING_EXPANSION",
        changeLabel: "Building Expansion Detected",
        confidence: 85,
        changedArea: "980 sq.ft",
        changedAreaSqFt: 980,
        changePercentage: 4.1,
        previousLandUse: "Commercial",
        currentLandUse: "Commercial",
        isMock: true,
        disclaimer: "This is a prototype/mock change detection result. Not an actual AI prediction.",
        governanceResult: {
            status: "REVIEW_REQUIRED",
            message: "Building expansion detected. Commercial land use is compatible, but expansion may require updated building permission.",
            buildingPermission: "Requires approval",
            landUseViolation: false,
            requiresVerification: true
        },
        changePolygons: [
            {
                polygonId: "POLY-004",
                category: "BUILDING_EXPANSION",
                color: "#b45309",
                coordinates: [
                    [11.0195, 76.9550],
                    [11.0195, 76.9562],
                    [11.0188, 76.9562],
                    [11.0188, 76.9550]
                ],
                area: "980 sq.ft",
                confidence: 88,
                description: "Building footprint expansion detected on eastern side of existing commercial structure"
            }
        ],
        beforeImage: {
            id: "IMG-005",
            date: "2020-01-10",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-002/sat-2020-01-10.png",
            resolution: "10m"
        },
        afterImage: {
            id: "IMG-008",
            date: "2026-08-18",
            source: "SATELLITE",
            provider: "Sentinel-2",
            imageUrl: "/mock/imagery/LND-002/sat-2026-08-18.png",
            resolution: "10m"
        },
        verificationStatus: "PENDING"
    }
];

/* =========================================================
   MOCK LAND-USE CHANGE TIMELINE
   ========================================================= */

const landUseTimeline = [
    {
        parcelId: "LND-003",
        entries: [
            { year: "2019", date: "2019-04-22", landUse: "Agricultural", label: "Agricultural (Paddy cultivation)", source: "SATELLITE", confidence: 95 },
            { year: "2021", date: "2021-07-14", landUse: "Agricultural", label: "Agricultural (Paddy cultivation)", source: "SATELLITE", confidence: 94 },
            { year: "2023", date: "2023-12-01", landUse: "Transitional", label: "Land clearing detected", source: "SATELLITE", confidence: 82 },
            { year: "2024", date: "2024-06-25", landUse: "Construction", label: "Construction activity detected", source: "SATELLITE", confidence: 88 },
            { year: "2026", date: "2026-08-15", landUse: "Built-up", label: "Building expansion detected", source: "SATELLITE", confidence: 91 }
        ]
    },
    {
        parcelId: "LND-001",
        entries: [
            { year: "2019", date: "2019-03-15", landUse: "Residential", label: "Residential (Established)", source: "SATELLITE", confidence: 96 },
            { year: "2021", date: "2021-06-20", landUse: "Residential", label: "Residential (No change)", source: "SATELLITE", confidence: 95 },
            { year: "2023", date: "2023-09-10", landUse: "Residential", label: "Residential (Minor vegetation change)", source: "SATELLITE", confidence: 93 },
            { year: "2026", date: "2026-08-20", landUse: "Residential", label: "Residential (Stable)", source: "SATELLITE", confidence: 94 }
        ]
    },
    {
        parcelId: "LND-002",
        entries: [
            { year: "2020", date: "2020-01-10", landUse: "Commercial", label: "Commercial (Established)", source: "SATELLITE", confidence: 94 },
            { year: "2022", date: "2022-05-18", landUse: "Commercial", label: "Commercial (No change)", source: "SATELLITE", confidence: 92 },
            { year: "2024", date: "2024-11-05", landUse: "Commercial", label: "Building expansion detected", source: "SATELLITE", confidence: 85 },
            { year: "2026", date: "2026-08-18", landUse: "Commercial", label: "Commercial (Expanded)", source: "SATELLITE", confidence: 87 }
        ]
    }
];

/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function getImageryByParcel(parcelId) {
    if (!parcelId) return [];
    const target = String(parcelId).trim().toUpperCase();
    return imageryRecords.filter(r => r.parcelId.toUpperCase() === target);
}

function getSatelliteImageryByParcel(parcelId) {
    return getImageryByParcel(parcelId).filter(r => r.source === "SATELLITE");
}

function getDroneImageryByParcel(parcelId) {
    return getImageryByParcel(parcelId).filter(r => r.source === "DRONE");
}

function getImageryById(imageId) {
    if (!imageId) return null;
    const target = String(imageId).trim().toUpperCase();
    return imageryRecords.find(r => r.id.toUpperCase() === target) || null;
}

function getImageryByDateRange(parcelId, beforeDate, afterDate) {
    const all = getSatelliteImageryByParcel(parcelId);
    return all.filter(r => {
        const d = r.date;
        if (beforeDate && d < beforeDate) return false;
        if (afterDate && d > afterDate) return false;
        return true;
    });
}

function getChangeDetection(parcelId) {
    if (!parcelId) return [];
    const target = String(parcelId).trim().toUpperCase();
    return changeDetectionResults.filter(r => r.parcelId.toUpperCase() === target);
}

function getChangeById(changeId) {
    if (!changeId) return null;
    const target = String(changeId).trim().toUpperCase();
    return changeDetectionResults.find(r => r.changeId.toUpperCase() === target) || null;
}

function getLandUseTimelineByParcel(parcelId) {
    if (!parcelId) return null;
    const target = String(parcelId).trim().toUpperCase();
    return landUseTimeline.find(t => t.parcelId.toUpperCase() === target) || null;
}

function getComparisonResult(parcelId, beforeDate, afterDate) {
    const before = getSatelliteImageryByParcel(parcelId)
        .filter(r => r.date <= beforeDate)
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null;

    const after = getSatelliteImageryByParcel(parcelId)
        .filter(r => r.date >= afterDate)
        .sort((a, b) => a.date.localeCompare(b.date))[0] || null;

    const changes = getChangeDetection(parcelId).filter(c => {
        return c.beforeDate <= (before ? before.date : "") &&
               c.afterDate >= (after ? after.date : "");
    });

    return {
        parcelId,
        before: before || null,
        after: after || null,
        changes: changes.length > 0 ? changes : null,
        isMock: true,
        disclaimer: "Demo comparison data. Real imagery integration pending."
    };
}

/* =========================================================
   EXPORT
   ========================================================= */

module.exports = {
    imageryRecords,
    changeDetectionResults,
    landUseTimeline,
    getImageryByParcel,
    getSatelliteImageryByParcel,
    getDroneImageryByParcel,
    getImageryById,
    getImageryByDateRange,
    getChangeDetection,
    getChangeById,
    getLandUseTimelineByParcel,
    getComparisonResult
};
