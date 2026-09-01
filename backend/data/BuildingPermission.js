
/* =========================================================
   LANDGOV GIS
   SIH26014

   BUILDING PERMISSION DATA

   DEMO DATA ONLY

   This represents building/development permission
   information associated with a land parcel.
   ========================================================= */


const buildingPermissionData = [

    {
        parcelId: "LND-001",

        applicationNumber: "BP-2026-001",

        buildingPermissionStatus: "Approved",

        permissionType: "Residential Construction",

        approvedBuildingType: "Residential Building",

        maximumFloors: 2,

        maximumBuiltUpArea: "4,000 sq.ft",

        setbackRequirement: "Front: 10 ft, Side: 5 ft",

        parkingRequirement: "2 vehicles",

        approvalAuthority:
            "Demo Local Planning Authority",

        applicationDate: "2026-05-10",

        approvalDate: "2026-06-15",

        validityStatus: "Valid",

        documentStatus: "Verified",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        applicationNumber: "BP-2026-002",

        buildingPermissionStatus: "Under Review",

        permissionType: "Commercial Construction",

        approvedBuildingType: "Commercial Building",

        maximumFloors: 3,

        maximumBuiltUpArea: "7,500 sq.ft",

        setbackRequirement: "Front: 15 ft, Side: 8 ft",

        parkingRequirement: "10 vehicles",

        approvalAuthority:
            "Demo Local Planning Authority",

        applicationDate: "2026-07-05",

        approvalDate: null,

        validityStatus: "Pending",

        documentStatus: "Under Review",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        applicationNumber: null,

        buildingPermissionStatus: "Restricted",

        permissionType: "Agricultural Land",

        approvedBuildingType:
            "Agricultural Structures Only",

        maximumFloors: 1,

        maximumBuiltUpArea: "1,000 sq.ft",

        setbackRequirement:
            "As per agricultural regulations",

        parkingRequirement: "Not Applicable",

        approvalAuthority:
            "Demo Local Planning Authority",

        applicationDate: null,

        approvalDate: null,

        validityStatus: "Restricted",

        documentStatus: "Not Applicable",

        lastUpdated: "2026-08-10"
    }

];


module.exports = buildingPermissionData;
