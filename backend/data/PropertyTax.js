
/* =========================================================
   LANDGOV GIS
   SIH26014

   PROPERTY TAX DATA

   DEMO DATA ONLY

   This represents property-tax information associated
   with a land parcel.
   ========================================================= */


const propertyTaxData = [
    {
        requestId: "CLR-2026-001",
        assessmentId: "PTX-2026-001",
        parcelId: "LND-001",
        surveyNumber: "SUR-101",
        propertyType: "Agricultural / Residential Transition",
        taxYear: "2026-2027",
        annualTax: 12500,
        taxDemand: 12500,
        amountPaid: 12500,
        outstandingAmount: 0,
        penalty: 0,
        totalDue: 0,
        paymentStatus: "Paid",
        assessmentStatus: "VERIFIED",
        taxClearanceStatus: "CLEARED",
        lastPaymentDate: "2026-07-15",
        paymentReference: "PAY-TAX-2026-001",
        paymentMode: "Treasury E-Challan Portal",
        transactionReference: "TXN-88491023",
        municipalPropertyId: "MUN-PROP-001",
        builtUpArea: "4,000 sq.ft",
        landArea: "2.5 Acres (108,900 sq.ft)",
        numberOfFloors: 2,
        buildingStatus: "Approved Plan (BP-2026-001)",
        roadAccess: "AVAILABLE (30 ft Bitumen Road)",
        utilitiesStatus: {
            water: "AVAILABLE (Municipal Tap - Consumer #W-8819)",
            electricity: "AVAILABLE (TNEB Commercial Meter #E-9902)",
            sewerage: "AVAILABLE (Underground Sewerage System)"
        },
        priority: "HIGH",
        status: "CLEARED",
        currentStage: "COMPLETED",
        assignedOfficer: "OFF-TAX-001",
        lastUpdated: "2026-08-15",
        taxHistory: [
            {
                year: "2025-2026",
                demand: 12000,
                paid: 12000,
                outstanding: 0,
                status: "Paid",
                paymentRef: "PAY-TAX-2025-001"
            },
            {
                year: "2024-2025",
                demand: 11500,
                paid: 11500,
                outstanding: 0,
                status: "Paid",
                paymentRef: "PAY-TAX-2024-001"
            }
        ],
        clearanceRequests: [
            {
                clearanceId: "CLR-2026-001",
                fromDepartment: "Registration Department",
                purpose: "Property Transfer & Sale Deed Registration",
                status: "CLEARED",
                requestedDate: "2026-08-28"
            }
        ]
    },
    {
        requestId: "CLR-2026-002",
        assessmentId: "PTX-2026-002",
        parcelId: "LND-002",
        surveyNumber: "SUR-102",
        propertyType: "Commercial Facility",
        taxYear: "2026-2027",
        annualTax: 32000,
        taxDemand: 32000,
        amountPaid: 16000,
        outstandingAmount: 16000,
        penalty: 1500,
        totalDue: 17500,
        paymentStatus: "Partially Paid",
        assessmentStatus: "VERIFIED",
        taxClearanceStatus: "OUTSTANDING",
        lastPaymentDate: "2026-06-20",
        paymentReference: "PAY-TAX-2026-002",
        paymentMode: "Net Banking",
        transactionReference: "TXN-77391092",
        municipalPropertyId: "MUN-PROP-002",
        builtUpArea: "7,500 sq.ft",
        landArea: "1.2 Acres (52,272 sq.ft)",
        numberOfFloors: 3,
        buildingStatus: "Under Review (BP-2026-002)",
        roadAccess: "AVAILABLE (60 ft State Highway)",
        utilitiesStatus: {
            water: "AVAILABLE (Municipal Tap)",
            electricity: "AVAILABLE (Commercial High Tension Meter)",
            sewerage: "PENDING (Septic Tank Connection)"
        },
        priority: "HIGH",
        status: "PENDING",
        currentStage: "OUTSTANDING_DUES_CHECK",
        assignedOfficer: "OFF-TAX-001",
        lastUpdated: "2026-08-20",
        taxHistory: [
            {
                year: "2025-2026",
                demand: 30000,
                paid: 30000,
                outstanding: 0,
                status: "Paid",
                paymentRef: "PAY-TAX-2025-002"
            }
        ],
        clearanceRequests: [
            {
                clearanceId: "CLR-2026-002",
                fromDepartment: "Registration Department",
                purpose: "Property Lease Registration",
                status: "PENDING",
                requestedDate: "2026-08-30"
            }
        ]
    },
    {
        requestId: "CLR-2026-003",
        assessmentId: "PTX-2026-003",
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        propertyType: "Agricultural Land",
        taxYear: "2026-2027",
        annualTax: 5000,
        taxDemand: 5000,
        amountPaid: 0,
        outstandingAmount: 5000,
        penalty: 0,
        totalDue: 5000,
        paymentStatus: "Pending",
        assessmentStatus: "UNDER_REVIEW",
        taxClearanceStatus: "PENDING",
        lastPaymentDate: null,
        paymentReference: null,
        paymentMode: "N/A",
        transactionReference: null,
        municipalPropertyId: "MUN-PROP-003",
        builtUpArea: "1,000 sq.ft (Storage Shed)",
        landArea: "0.8 Acres (34,848 sq.ft)",
        numberOfFloors: 1,
        buildingStatus: "Agricultural Structure Only",
        roadAccess: "AVAILABLE (20 ft Village Pathway)",
        utilitiesStatus: {
            water: "AVAILABLE (Irrigation Well)",
            electricity: "AVAILABLE (Agricultural Tariff)",
            sewerage: "NOT AVAILABLE"
        },
        priority: "MEDIUM",
        status: "PENDING",
        currentStage: "ASSESSMENT_REVIEW",
        assignedOfficer: "OFF-TAX-001",
        lastUpdated: "2026-08-10",
        taxHistory: [
            {
                year: "2025-2026",
                demand: 4500,
                paid: 4500,
                outstanding: 0,
                status: "Paid",
                paymentRef: "PAY-TAX-2025-003"
            }
        ],
        clearanceRequests: []
    }
];

module.exports = propertyTaxData;
