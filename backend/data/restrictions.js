/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND RESTRICTIONS & REGULATORY CONSTRAINTS DATA
   ========================================================= */

const restrictionsData = [
    {
        parcelId: "LND-001",
        restrictionStatus: "Clear",
        riskLevel: "Low",
        restrictions: [],
        floodRisk: "Low",
        waterBodyRestriction: false,
        roadWideningRestriction: false,
        governmentAcquisition: false,
        environmentalRestriction: false,
        heritageRestriction: false,
        developmentRestriction: false,
        remarks: "No major land restrictions identified. Full regulatory clearance verified.",
        lastChecked: "2026-08-15",
        
        court: {
            status: "CLEAR",
            caseNumber: null,
            court: "District Civil High Court, Coimbatore",
            caseType: "None",
            filingDate: null,
            restrictionType: "Litigation Stay",
            restrictionStatus: "NOT AVAILABLE",
            orderDate: null,
            orderReference: null,
            remarks: "No active litigation or judicial stay order recorded."
        },
        acquisition: {
            acquisitionStatus: "NOT UNDER ACQUISITION",
            notificationNumber: null,
            notificationDate: null,
            authority: "District Revenue & Land Acquisition Office",
            acquisitionPurpose: null,
            affectedArea: "0.00 Sq.Ft",
            status: "CLEAR",
            remarks: "Parcel is not subject to state or national land acquisition."
        },
        environmental: {
            zone: "Urban Residential Buffer",
            protectedArea: "No",
            ecoSensitiveZone: "No",
            bufferRequirement: "Standard 3m boundary setback",
            environmentalClearance: "NOT REQUIRED",
            restrictionStatus: "CLEAR",
            authority: "State Environmental Impact Assessment Authority"
        },
        forest: {
            forestClassification: "Non-Forest Land",
            reservedForest: "No",
            protectedForest: "No",
            forestBoundary: "Outside 5km Forest Buffer Zone",
            clearanceRequirement: "NOT REQUIRED",
            status: "NOT FOREST"
        },
        waterBody: {
            waterBodyType: "Noyyal River Canal (Feeder Track)",
            waterBodyName: "Local Secondary Feeder",
            bufferRequirement: "15m Primary Channel Buffer",
            distance: "120m North-East",
            restrictionStatus: "CLEAR",
            authority: "Public Works Department (PWD) - Water Resources",
            gisLayer: "GIS-LAYER-WATER-001"
        },
        road: {
            roadWidening: "No",
            proposedRoad: "State Highway 162 Bypass Alignment",
            rightOfWay: "12m Existing Road Width",
            reservation: "None",
            infrastructureCorridor: "Standard Road Access",
            affectedArea: "0.00 Sq.Ft",
            status: "CLEAR"
        },
        heritage: {
            heritageZone: "No",
            protectedStructure: "None",
            buffer: "Outside Protected Monument Zone",
            authority: "State Archaeological Department",
            restriction: "Standard Building By-Laws",
            status: "CLEAR"
        },
        development: {
            developmentRestriction: "Standard Urban Residential Controls",
            setback: "Front: 3.0m, Rear: 2.0m, Sides: 1.5m",
            maximumHeight: "12.0m (F+2)",
            groundCoverage: "60%",
            floorAreaRatio: "1.75",
            permittedUse: "Residential Dwellings, Mixed Ground Floor Local Retail",
            restrictedUse: "Heavy Industrial, Hazardous Chemical Storage",
            approvalRequirement: "Local Planning Authority Building Approval",
            status: "PERMITTED"
        },
        restrictionRegister: [
            {
                restrictionId: "RST-00101",
                category: "Land Use / Planning",
                description: "Residential Building Line Setback Compliance",
                authority: "Local Planning Authority (LPA)",
                startDate: "2024-01-01",
                endDate: "2035-12-31",
                status: "ACTIVE",
                source: "LPA Master Plan 2026",
                verification: "VERIFIED"
            }
        ],
        clearance: {
            clearanceStatus: "CLEARED",
            clearanceReference: "CLR-RST-2026-001",
            authority: "District Land Governance & Regulatory Board",
            date: "2026-08-15",
            validUntil: "2030-08-14",
            verifiedBy: "OFF-REG-001"
        },
        verification: {
            status: "VERIFIED",
            verifiedBy: "OFF-REG-001",
            department: "Restrictions & Regulatory Board",
            verifiedAt: "2026-08-15",
            remarks: "All statutory land restrictions inspected and cleared."
        }
    },

    {
        parcelId: "LND-002",
        restrictionStatus: "Restricted",
        riskLevel: "Medium",
        restrictions: [
            "Road Widening Buffer",
            "Setback Reservation"
        ],
        floodRisk: "Low",
        waterBodyRestriction: false,
        roadWideningRestriction: true,
        governmentAcquisition: false,
        environmentalRestriction: false,
        heritageRestriction: false,
        developmentRestriction: true,
        remarks: "Front frontage (120 Sq.Ft) reserved for State Highway 162 road widening alignment.",
        lastChecked: "2026-08-20",

        court: {
            status: "CLEAR",
            caseNumber: null,
            court: "District Civil High Court, Coimbatore",
            caseType: "None",
            filingDate: null,
            restrictionType: "Litigation Stay",
            restrictionStatus: "NOT AVAILABLE",
            orderDate: null,
            orderReference: null,
            remarks: "No active litigation or judicial stay order recorded."
        },
        acquisition: {
            acquisitionStatus: "UNDER REVIEW",
            notificationNumber: "LA-NOTIF-2025-089",
            notificationDate: "2025-11-10",
            authority: "Highways & Land Acquisition Department",
            acquisitionPurpose: "State Highway 162 Frontage Expansion",
            affectedArea: "120.00 Sq.Ft Frontage Strip",
            status: "PENDING",
            remarks: "Front strip subject to highway expansion notification."
        },
        environmental: {
            zone: "Commercial Development Zone",
            protectedArea: "No",
            ecoSensitiveZone: "No",
            bufferRequirement: "Standard Commercial Buffer",
            environmentalClearance: "NOT REQUIRED",
            restrictionStatus: "CLEAR",
            authority: "State Pollution Control Board"
        },
        forest: {
            forestClassification: "Non-Forest Land",
            reservedForest: "No",
            protectedForest: "No",
            forestBoundary: "Outside Forest Buffer Zone",
            clearanceRequirement: "NOT REQUIRED",
            status: "NOT FOREST"
        },
        waterBody: {
            waterBodyType: "None",
            waterBodyName: "None",
            bufferRequirement: "None",
            distance: "450m South",
            restrictionStatus: "CLEAR",
            authority: "Public Works Department (PWD)",
            gisLayer: "GIS-LAYER-WATER-001"
        },
        road: {
            roadWidening: "Yes",
            proposedRoad: "State Highway 162 4-Lane Alignment",
            rightOfWay: "18m Proposed Road Width",
            reservation: "3.5m Front Alignment Reservation",
            infrastructureCorridor: "Highways Infrastructure Corridor",
            affectedArea: "120.00 Sq.Ft",
            status: "ACTIVE RESTRICTION"
        },
        heritage: {
            heritageZone: "No",
            protectedStructure: "None",
            buffer: "Outside Heritage Zone",
            authority: "State Archaeological Department",
            restriction: "Standard Building By-Laws",
            status: "CLEAR"
        },
        development: {
            developmentRestriction: "Front Setback Reservation for Road Expansion",
            setback: "Front Setback Reserved: 3.5m, Rear: 2.0m, Sides: 2.0m",
            maximumHeight: "15.0m (F+3)",
            groundCoverage: "50%",
            floorAreaRatio: "2.00",
            permittedUse: "Commercial Office, Retail",
            restrictedUse: "Permanent Heavy Construction on Front 3.5m Strip",
            approvalRequirement: "Highways NOC & Local Planning Approval",
            status: "RESTRICTED"
        },
        restrictionRegister: [
            {
                restrictionId: "RST-00201",
                category: "Road / Infrastructure",
                description: "Road Widening Frontage Buffer Reservation (3.5m)",
                authority: "State Highways & Urban Infrastructure Dept",
                startDate: "2025-04-12",
                endDate: "2035-12-31",
                status: "ACTIVE",
                source: "Highways GIS Alignment Layer",
                verification: "VERIFIED"
            },
            {
                restrictionId: "RST-00202",
                category: "Development Control",
                description: "No permanent masonry structure within road setback area",
                authority: "Coimbatore Local Planning Authority",
                startDate: "2025-04-12",
                endDate: "2035-12-31",
                status: "ACTIVE",
                source: "LPA Development Control Rules",
                verification: "VERIFIED"
            }
        ],
        clearance: {
            clearanceStatus: "PENDING",
            clearanceReference: "CLR-RST-2026-002-PENDING",
            authority: "State Highways Clearance Board",
            date: "2025-04-12",
            validUntil: "2027-04-11",
            verifiedBy: "OFF-HIGH-001"
        },
        verification: {
            status: "REVIEW REQUIRED",
            verifiedBy: "OFF-HIGH-001",
            department: "Highways & Planning Department",
            verifiedAt: "2026-08-20",
            remarks: "Road widening restriction active. Structural expansion requires Highways NOC."
        }
    },

    {
        parcelId: "LND-003",
        restrictionStatus: "Restricted",
        riskLevel: "High",
        restrictions: [
            "Agricultural Protection Zone",
            "Water Body Buffer Constraint",
            "Development Restriction"
        ],
        floodRisk: "Medium",
        waterBodyRestriction: true,
        roadWideningRestriction: false,
        governmentAcquisition: false,
        environmentalRestriction: true,
        heritageRestriction: false,
        developmentRestriction: true,
        remarks: "Parcel falls within Agricultural Protection Zone and 30m Water Body Buffer.",
        lastChecked: "2026-08-10",

        court: {
            status: "PENDING",
            caseNumber: "OS-2025-410",
            court: "Sub-Court Civil Division, Coimbatore",
            caseType: "Title & Agricultural Land Classification Suit",
            filingDate: "2025-09-14",
            restrictionType: "Interim Injunction Order",
            restrictionStatus: "ACTIVE",
            orderDate: "2025-10-02",
            orderReference: "INJ-ORD-2025-91",
            remarks: "Pending suit regarding non-agricultural conversion rights."
        },
        acquisition: {
            acquisitionStatus: "NOT UNDER ACQUISITION",
            notificationNumber: null,
            notificationDate: null,
            authority: "District Revenue Office",
            acquisitionPurpose: null,
            affectedArea: "0.00 Sq.Ft",
            status: "CLEAR",
            remarks: "Not under government acquisition."
        },
        environmental: {
            zone: "Eco-Sensitive Agricultural Zone",
            protectedArea: "Agricultural Catchment Zone",
            ecoSensitiveZone: "Yes",
            bufferRequirement: "30m Water Body Buffer Strip",
            environmentalClearance: "REQUIRED FOR CONVERSION",
            restrictionStatus: "RESTRICTED",
            authority: "State Environmental Conservation Board"
        },
        forest: {
            forestClassification: "Agricultural Fringe Land",
            reservedForest: "No",
            protectedForest: "No",
            forestBoundary: "Outside Reserved Forest Boundary",
            clearanceRequirement: "NOT REQUIRED",
            status: "NOT FOREST"
        },
        waterBody: {
            waterBodyType: "Irrigation Canal & Seasonal Stream",
            waterBodyName: "South Feeder Canal #4",
            bufferRequirement: "30m No-Construction Buffer Zone",
            distance: "15m Boundary Proximity",
            restrictionStatus: "ACTIVE RESTRICTION",
            authority: "Public Works Department (PWD) Water Resources",
            gisLayer: "GIS-LAYER-WATER-003"
        },
        road: {
            roadWidening: "No",
            proposedRoad: "Village Panchayat Rural Road",
            rightOfWay: "6m Rural Access Road",
            reservation: "Standard Setback",
            infrastructureCorridor: "Rural Agricultural Corridor",
            affectedArea: "0.00 Sq.Ft",
            status: "CLEAR"
        },
        heritage: {
            heritageZone: "No",
            protectedStructure: "None",
            buffer: "Outside Heritage Zone",
            authority: "State Archaeological Board",
            restriction: "None",
            status: "CLEAR"
        },
        development: {
            developmentRestriction: "Non-agricultural commercial development strictly restricted",
            setback: "Water Body Buffer: 30m, Road Setback: 5m",
            maximumHeight: "7.0m (Single Floor Agricultural Store/Farmhouse)",
            groundCoverage: "15%",
            floorAreaRatio: "0.25",
            permittedUse: "Paddy Cultivation, Organic Farming, Farmhouse Structure",
            restrictedUse: "Commercial Residential Apartments, Shopping Malls, Industrial Units",
            approvalRequirement: "District Land Conversion Committee & PWD Clearance",
            status: "HIGHLY RESTRICTED"
        },
        restrictionRegister: [
            {
                restrictionId: "RST-00301",
                category: "Court / Legal",
                description: "Interim Court Injunction on Commercial Conversion (OS-2025-410)",
                authority: "Sub-Court Civil Division",
                startDate: "2025-10-02",
                endDate: "-",
                status: "ACTIVE",
                source: "Judicial Registry",
                verification: "VERIFIED"
            },
            {
                restrictionId: "RST-00302",
                category: "Water Body",
                description: "30m Statutory Buffer Zone along South Feeder Canal",
                authority: "Public Works Department (PWD)",
                startDate: "2020-01-01",
                endDate: "2040-12-31",
                status: "ACTIVE",
                source: "PWD Waterway GIS Layer",
                verification: "VERIFIED"
            },
            {
                restrictionId: "RST-00303",
                category: "Environmental",
                description: "Agricultural Catchment Zone Protection",
                authority: "State Environmental Board",
                startDate: "2022-06-15",
                endDate: "2035-12-31",
                status: "ACTIVE",
                source: "State Eco Zoning Framework",
                verification: "VERIFIED"
            }
        ],
        clearance: {
            clearanceStatus: "NOT CLEARED",
            clearanceReference: "CLR-RST-2026-003-REJECTED",
            authority: "District Land Conversion Committee",
            date: "2026-02-18",
            validUntil: "-",
            verifiedBy: "OFF-PWD-001"
        },
        verification: {
            status: "CONFLICT",
            verifiedBy: "OFF-PWD-001",
            department: "Water Resources & Revenue Department",
            verifiedAt: "2026-08-10",
            remarks: "Active court injunction and PWD canal buffer restriction present."
        }
    }
];

module.exports = restrictionsData;
