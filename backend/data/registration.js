
/* =========================================================
   LANDGOV GIS
   SIH26014

   PROPERTY REGISTRATION DATA

   DEMO DATA ONLY

   This represents property registration / deed
   information associated with a land parcel.
   ========================================================= */


const registrationData = [
    {
        registrationId: "REG-2026-045",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        documentNumber: "DOC-REG-2026-045",
        documentType: "Sale Deed",
        transactionType: "Sale",
        seller: "Demo Agricultural Owner",
        buyer: "Demo New Owner",
        currentOwner: "Demo Agricultural Owner",
        proposedOwner: "Demo New Owner",
        registrationDate: "2026-09-03",
        submissionDate: "2026-09-01",
        executionDate: "2026-08-30",
        registrationOffice: "Coimbatore Sub-Registrar Office #1",
        considerationAmount: 3500000,
        marketValue: 3800000,
        stampDutyRequired: 266000,
        stampDutyPaid: 266000,
        registrationFee: 38000,
        paymentReference: "PAY-STAMP-2026-8891",
        paymentDate: "2026-09-01",
        status: "PENDING",
        currentStage: "TAX_CLEARANCE",
        checklist: {
            cadastral: "VERIFIED",
            ror: "VERIFIED",
            deed: "VERIFIED",
            stampDuty: "VERIFIED",
            encumbrance: "CLEAR",
            taxClearance: "PENDING",
            landUse: "VERIFIED",
            restrictions: "CLEAR"
        },
        deedStatus: "VERIFIED",
        stampDutyStatus: "VERIFIED",
        encumbranceStatus: "CLEAR",
        taxClearanceStatus: "PENDING",
        landUseStatus: "VERIFIED",
        restrictionStatus: "CLEAR",
        lastUpdated: "2026-09-03",
        updatedBy: "OFF-REG-001",
        transactionHistory: [
            {
                year: "2024",
                type: "Sale Deed Execution",
                seller: "Ramesh Kumar",
                buyer: "Demo Agricultural Owner",
                docRef: "REG-2024-021",
                consideration: 2500000,
                status: "Completed"
            },
            {
                year: "2018",
                type: "Ancestral Partition",
                seller: "Ancestral Trust",
                buyer: "Ramesh Kumar",
                docRef: "REG-2018-009",
                consideration: 0,
                status: "Completed"
            }
        ],
        requests: [
            {
                requestId: "REQ-TAX-001",
                toDepartment: "Property Tax & Municipal Department",
                fromDepartment: "Registration Department",
                parcelId: "LND-001",
                request: "Verify property tax clearance before registration REG-2026-045.",
                priority: "HIGH",
                status: "PENDING",
                createdAt: "2026-09-03T10:00:00Z"
            }
        ]
    },
    {
        registrationId: "REG-2026-002",
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        documentNumber: "DOC-REG-2026-002",
        documentType: "Commercial Lease Deed",
        transactionType: "Lease",
        seller: "Demo Property Owner",
        buyer: "Industrial Infra Ltd",
        currentOwner: "Demo Property Owner",
        proposedOwner: "Industrial Infra Ltd",
        registrationDate: "2026-08-20",
        submissionDate: "2026-08-15",
        executionDate: "2026-08-10",
        registrationOffice: "Coimbatore Sub-Registrar Office #1",
        considerationAmount: 12000000,
        marketValue: 12000000,
        stampDutyRequired: 840000,
        stampDutyPaid: 840000,
        registrationFee: 120000,
        paymentReference: "PAY-STAMP-2026-7712",
        paymentDate: "2026-08-15",
        status: "PENDING",
        currentStage: "DEED_VERIFICATION",
        checklist: {
            cadastral: "PENDING",
            ror: "PENDING",
            deed: "UNDER_REVIEW",
            stampDuty: "VERIFIED",
            encumbrance: "CHECK_REQUIRED",
            taxClearance: "PENDING",
            landUse: "VERIFIED",
            restrictions: "CLEAR"
        },
        deedStatus: "UNDER_REVIEW",
        stampDutyStatus: "VERIFIED",
        encumbranceStatus: "CHECK_REQUIRED",
        taxClearanceStatus: "PENDING",
        landUseStatus: "VERIFIED",
        restrictionStatus: "CLEAR",
        lastUpdated: "2026-08-20",
        updatedBy: "OFF-REG-001",
        transactionHistory: [
            {
                year: "2023",
                type: "Commercial Sale Deed",
                seller: "City Infra Corp",
                buyer: "Demo Property Owner",
                docRef: "REG-2023-088",
                consideration: 10000000,
                status: "Completed"
            }
        ],
        requests: []
    },
    {
        registrationId: "REG-2026-003",
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        documentNumber: "DOC-REG-2026-003",
        documentType: "Gift Deed",
        transactionType: "Gift",
        seller: "Original Owner",
        buyer: "Demo Land Owner",
        currentOwner: "Demo Land Owner",
        proposedOwner: "Demo Land Owner",
        registrationDate: "2023-04-10",
        submissionDate: "2023-04-05",
        executionDate: "2023-04-01",
        registrationOffice: "Coimbatore Sub-Registrar Office #1",
        considerationAmount: 1800000,
        marketValue: 1800000,
        stampDutyRequired: 126000,
        stampDutyPaid: 126000,
        registrationFee: 18000,
        paymentReference: "PAY-STAMP-2023-1102",
        paymentDate: "2023-04-05",
        status: "APPROVED",
        currentStage: "COMPLETED",
        checklist: {
            cadastral: "VERIFIED",
            ror: "VERIFIED",
            deed: "VERIFIED",
            stampDuty: "VERIFIED",
            encumbrance: "CLEAR",
            taxClearance: "CLEARED",
            landUse: "VERIFIED",
            restrictions: "CLEAR"
        },
        deedStatus: "VERIFIED",
        stampDutyStatus: "VERIFIED",
        encumbranceStatus: "CLEAR",
        taxClearanceStatus: "CLEARED",
        landUseStatus: "VERIFIED",
        restrictionStatus: "CLEAR",
        lastUpdated: "2026-08-10",
        updatedBy: "OFF-REG-001",
        transactionHistory: [],
        requests: []
    }
];

module.exports = registrationData;
