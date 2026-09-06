/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DOCUMENT & EVIDENCE DATA MODEL
   ========================================================= */

const documents = [
    {
        documentId: "DOC-00001",
        parcelId: "LND-003",
        documentType: "OWNERSHIP",
        documentNumber: "ROR-2026-003",
        title: "Record of Rights (Patta/Chitta)",
        issuingDepartment: "Revenue Department",
        issueDate: "2026-01-15",
        uploadedDate: "2026-01-16",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-ROR-001",
        verifiedDate: "2026-01-18",
        sourceDepartment: "RoR / Revenue Department",
        version: "v2.0",
        versionHistory: [
            { version: "v1.0", date: "2022-04-10", status: "SUPERSEDED", remarks: "Initial Patta registration" },
            { version: "v2.0", date: "2026-01-15", status: "VERIFIED", remarks: "Updated agricultural Title Record" }
        ],
        fileName: "ROR-2026-003-LND003.pdf",
        description: "Official Record of Rights establishing agricultural title and boundary rights.",
        createdAt: "2026-09-02T10:00:00.000Z"
    },
    {
        documentId: "DOC-00002",
        parcelId: "LND-003",
        documentType: "PROPERTY_TAX",
        documentNumber: "TAX-2026-0892",
        title: "Property Tax Clearance Certificate",
        issuingDepartment: "Municipal Administration",
        issueDate: "2026-02-10",
        uploadedDate: "2026-02-11",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-TAX-001",
        verifiedDate: "2026-02-12",
        sourceDepartment: "Property Tax Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2026-02-10", status: "VERIFIED", remarks: "Annual tax clearance receipt" }
        ],
        fileName: "TAX-2026-0892-LND003.pdf",
        description: "Tax receipt showing full clearance of local land revenues for assessment year 2025-26.",
        createdAt: "2026-09-02T10:15:00.000Z"
    },
    {
        documentId: "DOC-00003",
        parcelId: "LND-001",
        documentType: "OWNERSHIP",
        documentNumber: "ROR-2026-001",
        title: "Record of Rights (Residential Title)",
        issuingDepartment: "Revenue Department",
        issueDate: "2025-11-20",
        uploadedDate: "2025-11-21",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-ROR-001",
        verifiedDate: "2025-11-22",
        sourceDepartment: "RoR / Revenue Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2025-11-20", status: "VERIFIED", remarks: "Certified RoR Title Extract" }
        ],
        fileName: "ROR-2026-001-LND001.pdf",
        description: "Certified ownership record for residential parcel LND-001.",
        createdAt: "2026-09-02T09:00:00.000Z"
    },
    {
        documentId: "DOC-00004",
        parcelId: "LND-001",
        documentType: "BUILDING_PERMISSION",
        documentNumber: "BPM-2025-4102",
        title: "Approved Building Plan Permission",
        issuingDepartment: "Local Planning Authority",
        issueDate: "2025-12-05",
        uploadedDate: "2025-12-06",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-MUN-001",
        verifiedDate: "2025-12-07",
        sourceDepartment: "Municipal Building Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2025-12-05", status: "VERIFIED", remarks: "Approved residential structural plan" }
        ],
        fileName: "BPM-2025-4102-LND001.pdf",
        description: "Approved building approval for residential structure layout.",
        createdAt: "2026-09-02T09:30:00.000Z"
    },
    {
        documentId: "DOC-00005",
        parcelId: "LND-001",
        documentType: "PROPERTY_TAX",
        documentNumber: "TAX-2026-0101",
        title: "Annual Property Tax Receipt",
        issuingDepartment: "Municipal Corporation",
        issueDate: "2026-01-10",
        uploadedDate: "2026-01-11",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-TAX-001",
        verifiedDate: "2026-01-12",
        sourceDepartment: "Property Tax Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2026-01-10", status: "VERIFIED", remarks: "Property tax receipt cleared" }
        ],
        fileName: "TAX-2026-0101-LND001.pdf",
        description: "Annual tax payment receipt for LND-001.",
        createdAt: "2026-09-02T09:45:00.000Z"
    },
    {
        documentId: "DOC-00006",
        parcelId: "LND-002",
        documentType: "OWNERSHIP",
        documentNumber: "ROR-2026-002",
        title: "Record of Rights (Commercial Property)",
        issuingDepartment: "Revenue Department",
        issueDate: "2024-08-14",
        uploadedDate: "2024-08-15",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-ROR-001",
        verifiedDate: "2024-08-16",
        sourceDepartment: "RoR / Revenue Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2024-08-14", status: "VERIFIED", remarks: "Commercial RoR title extract" }
        ],
        fileName: "ROR-2026-002-LND002.pdf",
        description: "Ownership documentation for commercial zone parcel LND-002.",
        createdAt: "2026-09-02T08:00:00.000Z"
    },
    {
        documentId: "DOC-00007",
        parcelId: "LND-002",
        documentType: "PROPERTY_TAX",
        documentNumber: "TAX-2026-0202",
        title: "Property Tax Assessment Notice",
        issuingDepartment: "Municipal Corporation",
        issueDate: "2026-03-01",
        uploadedDate: "2026-03-02",
        status: "PENDING",
        verificationStatus: "PENDING",
        verifiedBy: "OFF-TAX-001",
        verifiedDate: null,
        sourceDepartment: "Property Tax Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2026-03-01", status: "PENDING", remarks: "Awaiting tax verification payment" }
        ],
        fileName: "TAX-2026-0202-LND002.pdf",
        description: "Tax assessment notice currently flagged as pending verification.",
        createdAt: "2026-09-02T08:30:00.000Z"
    },
    {
        documentId: "DOC-00008",
        parcelId: "LND-002",
        documentType: "BUILDING_PERMISSION",
        documentNumber: "BPM-2022-098",
        title: "Legacy Commercial Occupancy Permit",
        issuingDepartment: "Urban Development Authority",
        issueDate: "2022-05-18",
        uploadedDate: "2022-05-19",
        status: "EXPIRED",
        verificationStatus: "EXPIRED",
        verifiedBy: "OFF-MUN-001",
        verifiedDate: "2022-05-20",
        sourceDepartment: "Municipal Building Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2022-05-18", status: "EXPIRED", remarks: "Legacy occupancy permit expired" }
        ],
        fileName: "BPM-2022-098-LND002.pdf",
        description: "Expired building permit record requiring renewal.",
        createdAt: "2026-09-02T08:45:00.000Z"
    },
    {
        documentId: "DOC-00009",
        parcelId: "LND-002",
        documentType: "RESTRICTIONS",
        documentNumber: "RST-2025-002",
        title: "Road Setback & Buffer Compliance Record",
        issuingDepartment: "Highways & Planning Department",
        issueDate: "2025-04-12",
        uploadedDate: "2025-04-13",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-HIGH-001",
        verifiedDate: "2025-04-14",
        sourceDepartment: "Highways & Planning Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2025-04-12", status: "VERIFIED", remarks: "Highway alignment buffer record" }
        ],
        fileName: "RST-2025-002-LND002.pdf",
        description: "Regulatory clearance document regarding road widening buffer restrictions.",
        createdAt: "2026-09-02T08:50:00.000Z"
    },
    {
        documentId: "DOC-00010",
        parcelId: "LND-001",
        documentType: "REGISTRATION",
        documentNumber: "REG-2026-0101",
        title: "Registered Sale Deed",
        issuingDepartment: "Registration Department",
        issueDate: "2025-10-15",
        uploadedDate: "2025-10-16",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-REG-001",
        verifiedDate: "2025-10-17",
        sourceDepartment: "Registration Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2025-10-15", status: "VERIFIED", remarks: "Sub-Registrar Certified Sale Deed" }
        ],
        fileName: "REG-2026-0101-LND001.pdf",
        description: "Registered sale deed document confirming residential transfer.",
        createdAt: "2026-09-02T09:10:00.000Z"
    },
    {
        documentId: "DOC-00011",
        parcelId: "LND-001",
        documentType: "CADASTRAL",
        documentNumber: "CAD-SUR-101",
        title: "Certified Cadastral Survey Map",
        issuingDepartment: "Cadastral & Survey Department",
        issueDate: "2025-09-01",
        uploadedDate: "2025-09-02",
        status: "VERIFIED",
        verificationStatus: "VERIFIED",
        verifiedBy: "OFF-CAD-001",
        verifiedDate: "2025-09-03",
        sourceDepartment: "Cadastral Department",
        version: "v1.0",
        versionHistory: [
            { version: "v1.0", date: "2025-09-01", status: "VERIFIED", remarks: "FMB / Cadastral map sheet" }
        ],
        fileName: "CAD-SUR-101-LND001.pdf",
        description: "Official Field Measurement Book (FMB) survey map sheet.",
        createdAt: "2026-09-02T09:15:00.000Z"
    }
];

module.exports = documents;
