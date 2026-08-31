
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

        rightsHolder: "Demo Land Owner",

        rightType: "Ownership",

        ownershipStatus: "Active",

        tenureType: "Freehold",

        registrationStatus: "Registered",

        mutationStatus: "Updated",

        recordStatus: "Verified",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        surveyNumber: "SUR-102",

        recordNumber: "ROR-2026-002",

        rightsHolder: "Demo Property Owner",

        rightType: "Ownership",

        ownershipStatus: "Active",

        tenureType: "Freehold",

        registrationStatus: "Registered",

        mutationStatus: "Pending",

        recordStatus: "Under Review",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        surveyNumber: "SUR-103",

        recordNumber: "ROR-2026-003",

        rightsHolder: "Demo Agricultural Owner",

        rightType: "Ownership",

        ownershipStatus: "Active",

        tenureType: "Agricultural",

        registrationStatus: "Registered",

        mutationStatus: "Updated",

        recordStatus: "Verified",

        lastUpdated: "2026-08-10"
    }

];


module.exports = rorData;