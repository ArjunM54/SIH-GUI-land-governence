
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
        parcelId: "LND-001",

        assessmentNumber: "TAX-2026-001",

        propertyType: "Residential",

        taxYear: "2026-2027",

        annualTax: 12500,

        amountPaid: 12500,

        outstandingAmount: 0,

        paymentStatus: "Paid",

        lastPaymentDate: "2026-07-15",

        assessmentStatus: "Verified",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        assessmentNumber: "TAX-2026-002",

        propertyType: "Commercial",

        taxYear: "2026-2027",

        annualTax: 32000,

        amountPaid: 16000,

        outstandingAmount: 16000,

        paymentStatus: "Partially Paid",

        lastPaymentDate: "2026-06-20",

        assessmentStatus: "Verified",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        assessmentNumber: "TAX-2026-003",

        propertyType: "Agricultural",

        taxYear: "2026-2027",

        annualTax: 5000,

        amountPaid: 0,

        outstandingAmount: 5000,

        paymentStatus: "Pending",

        lastPaymentDate: null,

        assessmentStatus: "Under Review",

        lastUpdated: "2026-08-10"
    }

];


module.exports = propertyTaxData;
