/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   PARCEL DATA

   This is currently demo data.

   Later this file can be replaced by:
   - PostgreSQL
   - PostGIS
   - Government GIS APIs
   - State land records APIs
   ========================================================= */


const parcels = [

    {
        id: "LND-001",

        surveyNumber: "SUR-101",

        owner: "Demo Land Owner",

        landType: "Residential",

        area: "2,400 sq.ft",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Residential",

        taxStatus: "Paid",

        restrictions: "No major restrictions",

        buildingPermission: "Eligible",

        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ]
    },


    {
        id: "LND-002",

        surveyNumber: "SUR-102",

        owner: "Demo Property Owner",

        landType: "Commercial",

        area: "4,800 sq.ft",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Commercial",

        taxStatus: "Pending",

        restrictions: "Road setback applicable",

        buildingPermission: "Requires approval",

        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ]
    },


    {
        id: "LND-003",

        surveyNumber: "SUR-103",

        owner: "Demo Agricultural Owner",

        landType: "Agricultural",

        area: "1.2 Acres",

        district: "Coimbatore",

        village: "Demo Village",

        status: "Active",

        landUse: "Agricultural",

        taxStatus: "Paid",

        restrictions:
            "Agricultural land restrictions",

        buildingPermission: "Restricted",

        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ]
    }

];


/* =========================================================
   EXPORT
   ========================================================= */

module.exports = parcels;