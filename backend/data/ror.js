
/* =========================================================
   LANDGOV GIS
   SIH26014

   RECORD OF RIGHTS (RoR)

   DEMO DATA ONLY

   This represents rights/ownership information
   associated with land parcels.

   In the real system, this data would come from
   authorized land-record systems/APIs.
   ========================================================= */


const rorData = [
    {
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        recordNumber: "ROR-2026-001",
        rightsHolder: "Demo Agricultural Owner",
        ownerName: "Demo Agricultural Owner",
        ownershipType: "Individual",
        ownershipShare: "100%",
        possessionStatus: "Self",
        landClassification: "Agricultural",
        landUse: "Agricultural",
        area: "1.2 Acres",
        district: "Coimbatore",
        taluk: "Coimbatore South",
        village: "Demo Village",
        tenureType: "Freehold",
        registrationStatus: "Registered",
        mutationStatus: "Updated",
        rorStatus: "VERIFIED",
        lastUpdated: "2026-08-15",
        updatedBy: "OFF-ROR-001",
        ownershipHistory: [
            {
                date: "2026-09-01",
                owner: "Demo Agricultural Owner",
                ownershipType: "Individual",
                document: "Sale Deed REG-2026-045",
                mutationNumber: "MUT-2026-008",
                status: "Pending Mutation"
            },
            {
                date: "2024-05-18",
                owner: "Previous Owner (Ramesh Kumar)",
                ownershipType: "Individual",
                document: "Sale Deed REG-2024-021",
                mutationNumber: "MUT-2024-003",
                status: "Completed"
            },
            {
                date: "2018-02-10",
                owner: "Original Ancestral Owner",
                ownershipType: "Ancestral / Joint",
                document: "Patta Transfer Deed 2018",
                mutationNumber: "MUT-2018-001",
                status: "Completed"
            }
        ],
        mutations: [
            {
                mutationId: "MUT-2026-008",
                parcelId: "LND-001",
                type: "Ownership Transfer",
                currentOwner: "Demo Agricultural Owner",
                proposedOwner: "Suresh Kumar",
                reason: "Sale Deed Execution",
                supportingDocument: "REG-2026-045",
                status: "PENDING",
                priority: "HIGH",
                currentStage: "Ownership Verification",
                stages: [
                    { name: "Mutation Requested", status: "COMPLETED" },
                    { name: "Document Verification", status: "COMPLETED" },
                    { name: "Cadastral Verification", status: "COMPLETED" },
                    { name: "Ownership Verification", status: "IN_PROGRESS" },
                    { name: "Dispute Check", status: "PENDING" },
                    { name: "Approval", status: "PENDING" },
                    { name: "RoR Update", status: "PENDING" }
                ],
                submittedDate: "2026-09-01T10:00:00Z"
            }
        ],
        disputes: [
            {
                disputeId: "DISP-2026-001",
                parcelId: "LND-001",
                type: "Inheritance Claim",
                severity: "Medium",
                description: "Sibling filed objection claiming partial ownership share.",
                reportedBy: "OFF-ROR-001",
                reportedAt: "2026-09-02T11:00:00Z",
                status: "OPEN"
            }
        ],
        recordCorrections: []
    },
    {
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        recordNumber: "ROR-2026-002",
        rightsHolder: "Demo Property Owner",
        ownerName: "Demo Property Owner",
        ownershipType: "Corporate / Commercial",
        ownershipShare: "100%",
        possessionStatus: "Tenant / Commercial Leased",
        landClassification: "Commercial",
        landUse: "Commercial",
        area: "4,800 sq.ft",
        district: "Coimbatore",
        taluk: "Coimbatore South",
        village: "Demo Village",
        tenureType: "Freehold",
        registrationStatus: "Registered",
        mutationStatus: "Pending",
        rorStatus: "PENDING VERIFICATION",
        lastUpdated: "2026-08-20",
        updatedBy: "OFF-ROR-001",
        ownershipHistory: [
            {
                date: "2025-11-12",
                owner: "Demo Property Owner",
                ownershipType: "Corporate",
                document: "Deed REG-2025-110",
                mutationNumber: "MUT-2025-014",
                status: "Completed"
            }
        ],
        mutations: [
            {
                mutationId: "MUT-2026-002",
                parcelId: "LND-002",
                type: "Ownership Transfer",
                currentOwner: "Demo Property Owner",
                proposedOwner: "Industrial Infra Ltd",
                reason: "Commercial Acquisition",
                supportingDocument: "REG-2026-099",
                status: "PENDING",
                priority: "HIGH",
                currentStage: "Document Verification",
                stages: [
                    { name: "Mutation Requested", status: "COMPLETED" },
                    { name: "Document Verification", status: "IN_PROGRESS" },
                    { name: "Cadastral Verification", status: "PENDING" },
                    { name: "Ownership Verification", status: "PENDING" },
                    { name: "Dispute Check", status: "PENDING" },
                    { name: "Approval", status: "PENDING" },
                    { name: "RoR Update", status: "PENDING" }
                ],
                submittedDate: "2026-08-28T14:30:00Z"
            }
        ],
        disputes: [],
        recordCorrections: []
    },
    {
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        recordNumber: "ROR-2026-003",
        rightsHolder: "Demo Land Owner",
        ownerName: "Demo Land Owner",
        ownershipType: "Individual",
        ownershipShare: "100%",
        possessionStatus: "Self",
        landClassification: "Residential",
        landUse: "Residential",
        area: "2,400 sq.ft",
        district: "Coimbatore",
        taluk: "Coimbatore South",
        village: "Demo Village",
        tenureType: "Freehold",
        registrationStatus: "Registered",
        mutationStatus: "Updated",
        rorStatus: "VERIFIED",
        lastUpdated: "2026-08-10",
        updatedBy: "OFF-ROR-001",
        ownershipHistory: [
            {
                date: "2023-04-10",
                owner: "Demo Land Owner",
                ownershipType: "Individual",
                document: "Gift Deed REG-2023-012",
                mutationNumber: "MUT-2023-002",
                status: "Completed"
            }
        ],
        mutations: [],
        disputes: [],
        recordCorrections: []
    }
];

module.exports = rorData;