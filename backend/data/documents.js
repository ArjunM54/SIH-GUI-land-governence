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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo ownership evidence record establishing agricultural title and boundary rights.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo tax receipt showing full clearance of local land revenues for assessment year 2025-26.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo ownership record for residential parcel LND-001.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo approved building approval for residential structure layout.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo tax payment receipt for LND-001.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo ownership documentation for commercial zone parcel LND-002.",
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
        status: "PENDING",
        fileName: null,
        description: "Demo tax assessment document currently flagged as pending verification.",
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
        status: "EXPIRED",
        fileName: null,
        description: "Demo expired building permit record requiring renewal.",
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
        status: "AVAILABLE",
        fileName: null,
        description: "Demo regulatory clearance document regarding road widening buffer restrictions.",
        createdAt: "2026-09-02T08:50:00.000Z"
    }
];

module.exports = documents;
