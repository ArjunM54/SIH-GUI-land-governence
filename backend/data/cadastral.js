
/* =========================================================
   LANDGOV GIS
   SIH26014

   CADASTRAL DATA

   Cadastral information describes the official
   survey/parcel boundary information.

   This is DEMO data for now.
   ========================================================= */


const cadastralData = [
    {
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        subDivisionNumber: "1A",
        owner: "Demo Agricultural Owner",
        village: "Demo Village",
        taluk: "Coimbatore South",
        district: "Coimbatore",
        state: "Tamil Nadu",
        area: "1.2 Acres",
        areaSqM: 4856,
        landType: "Agricultural",
        landUse: "Agricultural",
        boundaryStatus: "Pending Verification",
        surveyStatus: "Verified",
        surveyDate: "2026-08-20",
        surveyOfficer: "OFF-CAD-001",
        previousSurveyNumber: "SUR-099",
        surveyReference: "CAD-REF-2026-101",
        mapReference: "CAD-MAP-001",
        geometryStatus: "Active Polygon Available",
        northBoundary: "Public Road (12m width)",
        southBoundary: "Parcel LND-005 (Survey SUR-105)",
        eastBoundary: "Agricultural Drain / Channel",
        westBoundary: "Survey SUR-100 (Government Land)",
        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ],
        surveyHistory: [
            { date: "2026-08-20", action: "Boundary inspection & survey update", officer: "OFF-CAD-001", status: "Pending Verification", notes: "Field survey completed using DGPS." },
            { date: "2025-03-12", action: "Re-survey for subdivision 1A", officer: "OFF-CAD-002", status: "Verified", notes: "Subdivision boundary demarcated." },
            { date: "2022-01-15", action: "Initial Cadastral Mapping", officer: "OFF-CAD-001", status: "Verified", notes: "Original revenue survey entry." }
        ],
        inspectionRemarks: [
            { id: "INSP-001", date: "2026-08-20", officer: "OFF-CAD-001", remarks: "Field boundary markers verified at North-East corner. West boundary encroaches 0.2m into buffer zone." }
        ],
        conflicts: [
            {
                conflictId: "CONF-2026-001",
                parcelId: "LND-001",
                type: "Boundary Overlap",
                severity: "High",
                description: "Overlapping boundary claim with neighboring parcel SUR-100 on West edge.",
                reportedBy: "OFF-CAD-001",
                reportedAt: "2026-08-22T10:30:00Z",
                status: "OPEN"
            }
        ],
        requests: [
            {
                requestId: "REQ-2026-001",
                fromDepartment: "Registration Department",
                parcelId: "LND-001",
                request: "Confirm cadastral boundary before transfer deed approval.",
                priority: "HIGH",
                status: "PENDING",
                createdAt: "2026-08-25T09:00:00Z"
            }
        ],
        cases: [
            {
                caseId: "CASE-2026-001",
                parcelId: "LND-001",
                caseType: "Boundary Verification",
                priority: "HIGH",
                stage: "Cadastral Verification",
                assignedOfficer: "OFF-CAD-001",
                status: "IN PROGRESS",
                deadline: "2026-09-15"
            }
        ]
    },
    {
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        subDivisionNumber: "1B",
        owner: "Demo Property Owner",
        village: "Demo Village",
        taluk: "Coimbatore South",
        district: "Coimbatore",
        state: "Tamil Nadu",
        area: "4,800 sq.ft",
        areaSqM: 445,
        landType: "Commercial",
        landUse: "Commercial",
        boundaryStatus: "Verified",
        surveyStatus: "Verified",
        surveyDate: "2026-07-15",
        surveyOfficer: "OFF-CAD-001",
        previousSurveyNumber: "SUR-098",
        surveyReference: "CAD-REF-2026-102",
        mapReference: "CAD-MAP-002",
        geometryStatus: "Active Polygon Available",
        northBoundary: "National Highway 47",
        southBoundary: "Private Access Road (6m)",
        eastBoundary: "Commercial Complex LND-007",
        westBoundary: "Vacant Plot SUR-104",
        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ],
        surveyHistory: [
            { date: "2026-07-15", action: "Commercial Zoning Survey", officer: "OFF-CAD-001", status: "Verified", notes: "Setback alignment confirmed." }
        ],
        inspectionRemarks: [
            { id: "INSP-002", date: "2026-07-15", officer: "OFF-CAD-001", remarks: "All boundary stones intact. Setbacks adhere to municipal guidelines." }
        ],
        conflicts: [],
        requests: [],
        cases: []
    },
    {
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        subDivisionNumber: "2A",
        owner: "Demo Land Owner",
        village: "Demo Village",
        taluk: "Coimbatore South",
        district: "Coimbatore",
        state: "Tamil Nadu",
        area: "2,400 sq.ft",
        areaSqM: 223,
        landType: "Residential",
        landUse: "Residential",
        boundaryStatus: "Pending Verification",
        surveyStatus: "Under Review",
        surveyDate: "2026-08-30",
        surveyOfficer: "OFF-CAD-002",
        previousSurveyNumber: "SUR-097",
        surveyReference: "CAD-REF-2026-103",
        mapReference: "CAD-MAP-003",
        geometryStatus: "Active Polygon Available",
        northBoundary: "Municipal Street",
        southBoundary: "Residential Plot LND-008",
        eastBoundary: "Residential Plot LND-009",
        westBoundary: "Storm Water Drain",
        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ],
        surveyHistory: [
            { date: "2026-08-30", action: "New Boundary Verification Request", officer: "OFF-CAD-002", status: "Pending Verification", notes: "Citizen submitted boundary verification request." }
        ],
        inspectionRemarks: [],
        conflicts: [],
        requests: [
            {
                requestId: "REQ-2026-002",
                fromDepartment: "Land Records Department",
                parcelId: "LND-003",
                request: "Verify survey boundaries for mutation application MUT-2026-005.",
                priority: "MEDIUM",
                status: "PENDING",
                createdAt: "2026-08-31T14:20:00Z"
            }
        ],
        cases: [
            {
                caseId: "CASE-2026-002",
                parcelId: "LND-003",
                caseType: "Mutation Boundary Audit",
                priority: "MEDIUM",
                stage: "Survey Verification",
                assignedOfficer: "OFF-CAD-001",
                status: "IN PROGRESS",
                deadline: "2026-09-20"
            }
        ]
    }
];

module.exports = cadastralData;
