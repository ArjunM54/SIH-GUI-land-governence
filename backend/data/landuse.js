
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND USE / ZONING DATA

   DEMO DATA ONLY

   This module represents the designated use of land
   and basic zoning/development information.
   ========================================================= */


const landUseData = [
    {
        requestId: "LU-2026-003",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        applicantName: "Demo Applicant",
        conversionReason: "Residential housing & commercial plot development",
        submissionDate: "2026-08-25",
        currentLandUse: "Agricultural",
        requestedLandUse: "Residential",
        currentZone: "Agricultural Protection Zone",
        requestedZone: "Mixed Residential Zone (R1)",
        zoningCode: "AGRI-PROTECT-01",
        zoningName: "Agricultural & Residential Transition Zone",
        zoningStatus: "COMPATIBLE",
        developmentStatus: "Developable",
        permittedUse: [
            "Residential Building",
            "Farm House",
            "Low-density Housing",
            "Agricultural Storage"
        ],
        restrictedUse: [
            "Heavy Industry",
            "Hazardous Chemical Storage",
            "High-rise Commercial Complex"
        ],
        developmentRestriction: "Standard 10ft front setback requirement applies",
        masterPlanStatus: "Approved Plan 2026-2035",
        masterPlanZoneCode: "AGRI-R1",
        developmentIntensity: "Medium (FAR 1.5)",
        setbackRequirement: "Front: 10 ft, Side: 5 ft, Rear: 10 ft",
        environmentalStatus: "CLEAR",
        roadAccessStatus: "AVAILABLE",
        roadWidth: "30 ft Public Panchayati Road",
        roadType: "Paved Bitumen Road",
        restrictionStatus: "CLEAR",
        status: "APPROVED",
        currentStage: "COMPLETED",
        priority: "NORMAL",
        assignedOfficer: "OFF-LU-001",
        checklist: {
            cadastral: "VERIFIED",
            ror: "VERIFIED",
            zoning: "COMPATIBLE",
            masterPlan: "VERIFIED",
            environmental: "CLEAR",
            roadAccess: "AVAILABLE",
            restrictions: "CLEAR"
        },
        lastUpdated: "2026-09-01",
        updatedBy: "OFF-LU-001",
        landUseHistory: [
            {
                year: "2024",
                landUse: "Agricultural",
                zone: "Agricultural Protection Zone",
                officer: "OFF-LU-001",
                docRef: "LU-HIST-2024",
                status: "Verified"
            },
            {
                year: "2018",
                landUse: "Agricultural",
                zone: "Agricultural Protection Zone",
                officer: "OFF-LU-001",
                docRef: "LU-HIST-2018",
                status: "Verified"
            }
        ],
        conversions: [
            {
                conversionId: "LU-2026-003",
                fromZone: "Agricultural Protection Zone",
                toZone: "Mixed Residential Zone (R1)",
                currentZone: "Agricultural Protection Zone",
                requestedZone: "Mixed Residential Zone (R1)",
                applicant: "Demo Applicant",
                reason: "Residential development",
                status: "PENDING",
                appliedDate: "2026-08-25"
            }
        ]
    },
    {
        requestId: "LU-2026-004",
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        applicantName: "Industrial Infra Ltd",
        conversionReason: "Commercial logistics & warehouse facility",
        submissionDate: "2026-08-15",
        currentLandUse: "Commercial",
        requestedLandUse: "Industrial",
        currentZone: "Commercial Zone (C1)",
        requestedZone: "Industrial Zone (I2)",
        zoningCode: "C1",
        zoningName: "Commercial Zone",
        zoningStatus: "INCOMPATIBLE",
        developmentStatus: "Restricted",
        permittedUse: [
            "Shop",
            "Office",
            "Commercial Building"
        ],
        restrictedUse: [
            "Heavy Industry",
            "Chemical Plant"
        ],
        developmentRestriction: "Road widening buffer area (15ft front setback) enforced",
        masterPlanStatus: "Commercial Core Zone",
        masterPlanZoneCode: "C1-CORE",
        developmentIntensity: "High (FAR 2.5)",
        setbackRequirement: "Front: 15 ft, Side: 8 ft",
        environmentalStatus: "REVIEW_REQUIRED",
        roadAccessStatus: "AVAILABLE",
        roadWidth: "60 ft State Highway",
        roadType: "Four-lane Bitumen Highway",
        restrictionStatus: "RESTRICTED",
        status: "PENDING",
        currentStage: "PLANNING_REVIEW",
        priority: "MEDIUM",
        assignedOfficer: "OFF-LU-001",
        checklist: {
            cadastral: "PENDING",
            ror: "PENDING",
            zoning: "INCOMPATIBLE",
            masterPlan: "VERIFIED",
            environmental: "REVIEW_REQUIRED",
            roadAccess: "AVAILABLE",
            restrictions: "RESTRICTED"
        },
        lastUpdated: "2026-08-20",
        updatedBy: "OFF-LU-001",
        landUseHistory: [
            {
                year: "2023",
                landUse: "Commercial",
                zone: "Commercial Zone (C1)",
                officer: "OFF-LU-001",
                docRef: "LU-HIST-2023",
                status: "Verified"
            }
        ],
        conversions: [
            {
                conversionId: "LU-2026-004",
                fromZone: "Commercial Zone (C1)",
                toZone: "Industrial Zone (I2)",
                currentZone: "Commercial Zone (C1)",
                requestedZone: "Industrial Zone (I2)",
                applicant: "Industrial Infra Ltd",
                reason: "Warehouse construction",
                status: "PENDING",
                appliedDate: "2026-08-15"
            }
        ]
    },
    {
        requestId: "LU-2026-001",
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        applicantName: "Demo Land Owner",
        conversionReason: "Agricultural storage & farm equipment shed",
        submissionDate: "2023-04-01",
        currentLandUse: "Agricultural",
        requestedLandUse: "Agricultural",
        currentZone: "Agricultural Protection Zone",
        requestedZone: "Agricultural Protection Zone",
        zoningCode: "AG",
        zoningName: "Agricultural Zone",
        zoningStatus: "COMPATIBLE",
        developmentStatus: "Restricted",
        permittedUse: [
            "Agriculture",
            "Farming",
            "Agricultural Storage Shed"
        ],
        restrictedUse: [
            "Large Commercial Building",
            "Industrial Development"
        ],
        developmentRestriction: "Eco-sensitive buffer distance requirement apply",
        masterPlanStatus: "Agricultural Protection Zone",
        masterPlanZoneCode: "AG-PROT",
        developmentIntensity: "Low (FAR 0.5)",
        setbackRequirement: "As per agricultural regulations",
        environmentalStatus: "CLEAR",
        roadAccessStatus: "AVAILABLE",
        roadWidth: "20 ft Village Pathway",
        roadType: "Gravel Access Road",
        restrictionStatus: "CLEAR",
        status: "APPROVED",
        currentStage: "COMPLETED",
        priority: "LOW",
        assignedOfficer: "OFF-LU-001",
        checklist: {
            cadastral: "VERIFIED",
            ror: "VERIFIED",
            zoning: "COMPATIBLE",
            masterPlan: "VERIFIED",
            environmental: "CLEAR",
            roadAccess: "AVAILABLE",
            restrictions: "CLEAR"
        },
        lastUpdated: "2026-08-10",
        updatedBy: "OFF-LU-001",
        landUseHistory: [
            {
                year: "2022",
                landUse: "Agricultural",
                zone: "Agricultural Protection Zone",
                officer: "OFF-LU-001",
                docRef: "LU-HIST-2022",
                status: "Verified"
            }
        ],
        conversions: []
    }
];

module.exports = landUseData;
