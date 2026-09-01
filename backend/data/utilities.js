
/* =========================================================
   LANDGOV GIS
   SIH26014

   UTILITIES / INFRASTRUCTURE DATA

   DEMO DATA ONLY

   This represents infrastructure and utility services
   associated with or located near a land parcel.
   ========================================================= */


const utilitiesData = [

    {
        parcelId: "LND-001",

        electricity: {
            available: true,
            connectionStatus: "Connected",
            provider: "Demo Electricity Department",
            connectionNumber: "ELEC-001"
        },

        water: {
            available: true,
            connectionStatus: "Connected",
            source: "Municipal Water Supply",
            connectionNumber: "WATER-001"
        },

        sewerage: {
            available: true,
            connectionStatus: "Connected",
            type: "Underground Sewerage"
        },

        road: {
            available: true,
            roadType: "Paved Road",
            roadWidth: "30 ft",
            accessStatus: "Direct Access"
        },

        telecom: {
            available: true,
            serviceType: "Fiber + Mobile Network",
            provider: "Demo Telecom Provider"
        },

        overallStatus: "Good",

        lastUpdated: "2026-08-15"
    },


    {
        parcelId: "LND-002",

        electricity: {
            available: true,
            connectionStatus: "Connected",
            provider: "Demo Electricity Department",
            connectionNumber: "ELEC-002"
        },

        water: {
            available: true,
            connectionStatus: "Available",
            source: "Municipal Water Supply",
            connectionNumber: null
        },

        sewerage: {
            available: true,
            connectionStatus: "Available",
            type: "Underground Sewerage"
        },

        road: {
            available: true,
            roadType: "Paved Road",
            roadWidth: "40 ft",
            accessStatus: "Direct Access"
        },

        telecom: {
            available: true,
            serviceType: "Fiber + Mobile Network",
            provider: "Demo Telecom Provider"
        },

        overallStatus: "Good",

        lastUpdated: "2026-08-20"
    },


    {
        parcelId: "LND-003",

        electricity: {
            available: true,
            connectionStatus: "Available",
            provider: "Demo Electricity Department",
            connectionNumber: null
        },

        water: {
            available: false,
            connectionStatus: "Not Available",
            source: "Groundwater / Local Source",
            connectionNumber: null
        },

        sewerage: {
            available: false,
            connectionStatus: "Not Available",
            type: "Septic System Required"
        },

        road: {
            available: true,
            roadType: "Village Road",
            roadWidth: "15 ft",
            accessStatus: "Limited Access"
        },

        telecom: {
            available: true,
            serviceType: "Mobile Network",
            provider: "Demo Telecom Provider"
        },

        overallStatus: "Limited",

        lastUpdated: "2026-08-10"
    }

];


module.exports = utilitiesData;
