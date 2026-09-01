
/* =========================================================
   LANDGOV GIS
   SIH26014

   LAND RESTRICTIONS DATA

   DEMO DATA ONLY

   This module represents restrictions that may affect
   development or use of a land parcel.

   In a real implementation, this information would come
   from authorized government departments and GIS layers.
   ========================================================= */


const restrictionsData = [

    {
        parcelId: "LND-001",

        restrictionStatus: "Clear",

        riskLevel: "Low",

        restrictions: [],

        floodRisk: "Low",

        waterBodyRestriction: false,

        roadWideningRestriction: false,

        governmentAcquisition: false,

        environmentalRestriction: false,

        heritageRestriction: false,

        developmentRestriction: false,

        remarks:
            "No major restrictions identified.",

        lastChecked: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        restrictionStatus: "Restricted",

        riskLevel: "Medium",

        restrictions: [
            "Road Widening"
        ],

        floodRisk: "Low",

        waterBodyRestriction: false,

        roadWideningRestriction: true,

        governmentAcquisition: false,

        environmentalRestriction: false,

        heritageRestriction: false,

        developmentRestriction: true,

        remarks:
            "Part of the parcel may be affected by future road widening.",

        lastChecked: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        restrictionStatus: "Restricted",

        riskLevel: "High",

        restrictions: [
            "Agricultural Protection",
            "Development Restriction"
        ],

        floodRisk: "Medium",

        waterBodyRestriction: false,

        roadWideningRestriction: false,

        governmentAcquisition: false,

        environmentalRestriction: true,

        heritageRestriction: false,

        developmentRestriction: true,

        remarks:
            "Non-agricultural development requires prior approval.",

        lastChecked: "2026-08-10"
    }

];


module.exports = restrictionsData;
