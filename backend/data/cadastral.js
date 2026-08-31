
/* =========================================================
   LANDGOV GIS
   SIH26014

   CADASTRAL DATA

   Cadastral information describes the official
   survey/parcel boundary information.

   This is DEMO data for now.
   ========================================================= */


const cadastralData = [

    {
        parcelId: "LND-001",

        surveyNumber: "SUR-101",

        subDivisionNumber: "1A",

        village: "Demo Village",

        taluk: "Coimbatore South",

        district: "Coimbatore",

        state: "Tamil Nadu",

        area: "2,400 sq.ft",

        boundaryStatus: "Verified",

        mapReference: "CAD-MAP-001",

        coordinates: [
            [11.0200, 76.9500],
            [11.0200, 76.9530],
            [11.0175, 76.9530],
            [11.0175, 76.9500]
        ]
    },


    {
        parcelId: "LND-002",

        surveyNumber: "SUR-102",

        subDivisionNumber: "1B",

        village: "Demo Village",

        taluk: "Coimbatore South",

        district: "Coimbatore",

        state: "Tamil Nadu",

        area: "4,800 sq.ft",

        boundaryStatus: "Verified",

        mapReference: "CAD-MAP-002",

        coordinates: [
            [11.0200, 76.9540],
            [11.0200, 76.9570],
            [11.0175, 76.9570],
            [11.0175, 76.9540]
        ]
    },


    {
        parcelId: "LND-003",

        surveyNumber: "SUR-103",

        subDivisionNumber: "2A",

        village: "Demo Village",

        taluk: "Coimbatore South",

        district: "Coimbatore",

        state: "Tamil Nadu",

        area: "1.2 Acres",

        boundaryStatus: "Pending Verification",

        mapReference: "CAD-MAP-003",

        coordinates: [
            [11.0155, 76.9500],
            [11.0155, 76.9530],
            [11.0130, 76.9530],
            [11.0130, 76.9500]
        ]
    }

];


module.exports = cadastralData;
