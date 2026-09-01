
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
        parcelId: "LND-001",

        surveyNumber: "SUR-101",

        registrationNumber: "REG-2026-001",

        documentNumber: "DOC-001",

        documentType: "Sale Deed",

        registrationDate: "2024-06-15",

        registrationOffice: "Demo Sub-Registrar Office",

        transactionType: "Sale",

        registrationStatus: "Registered",

        considerationAmount: 2500000,

        encumbranceStatus: "No Encumbrance Reported",

        documentStatus: "Verified",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        surveyNumber: "SUR-102",

        registrationNumber: "REG-2026-002",

        documentNumber: "DOC-002",

        documentType: "Sale Deed",

        registrationDate: "2023-09-20",

        registrationOffice: "Demo Sub-Registrar Office",

        transactionType: "Sale",

        registrationStatus: "Registered",

        considerationAmount: 4800000,

        encumbranceStatus: "Encumbrance Check Required",

        documentStatus: "Under Review",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        surveyNumber: "SUR-103",

        registrationNumber: "REG-2026-003",

        documentNumber: "DOC-003",

        documentType: "Sale Deed",

        registrationDate: "2022-04-10",

        registrationOffice: "Demo Sub-Registrar Office",

        transactionType: "Sale",

        registrationStatus: "Registered",

        considerationAmount: 1500000,

        encumbranceStatus: "No Encumbrance Reported",

        documentStatus: "Verified",

        lastUpdated: "2026-08-10"
    }

];


module.exports = registrationData;
