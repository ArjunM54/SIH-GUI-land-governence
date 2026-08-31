
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND USE / ZONING DATA

   DEMO DATA ONLY

   This module represents the designated use of land
   and basic zoning/development information.
   ========================================================= */


const landUseData = [

    {
        parcelId: "LND-001",

        surveyNumber: "SUR-101",

        landUseType: "Residential",

        zoningCode: "R1",

        zoningName: "Residential Zone",

        developmentStatus: "Developable",

        permittedUse: [
            "Residential Building",
            "House",
            "Apartment"
        ],

        restrictedUse: [
            "Heavy Industry",
            "Hazardous Activities"
        ],

        developmentRestriction:
            "Standard residential development rules apply",

        masterPlanStatus: "Approved",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        surveyNumber: "SUR-102",

        landUseType: "Commercial",

        zoningCode: "C1",

        zoningName: "Commercial Zone",

        developmentStatus: "Developable",

        permittedUse: [
            "Shop",
            "Office",
            "Commercial Building"
        ],

        restrictedUse: [
            "Heavy Industry"
        ],

        developmentRestriction:
            "Road setback and parking requirements apply",

        masterPlanStatus: "Approved",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        surveyNumber: "SUR-103",

        landUseType: "Agricultural",

        zoningCode: "AG",

        zoningName: "Agricultural Zone",

        developmentStatus: "Restricted",

        permittedUse: [
            "Agriculture",
            "Farming",
            "Agricultural Storage"
        ],

        restrictedUse: [
            "Large Commercial Building",
            "Industrial Development"
        ],

        developmentRestriction:
            "Conversion approval required for non-agricultural use",

        masterPlanStatus: "Agricultural Protection Zone",

        lastUpdated: "2026-08-10"
    }

];


module.exports = landUseData;
