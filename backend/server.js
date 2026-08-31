/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   BACKEND SERVER

   Technology:
   Node.js
   Express
   CORS

   This is our first API server.
   ========================================================= */


/* =========================================================
   1. IMPORT PACKAGES
   ========================================================= */

const express = require("express");

const cors = require("cors");

const parcels = require("./data/parcels");


/* =========================================================
   2. CREATE EXPRESS APPLICATION
   ========================================================= */

const app = express();


/* =========================================================
   3. MIDDLEWARE
   ========================================================= */

app.use(cors());

app.use(express.json());


/* =========================================================
   4. SERVER PORT
   ========================================================= */

const PORT = 5000;


/* =========================================================
   5. HOME ROUTE
   ========================================================= */

app.get("/", (req, res) => {

    res.json({

        message:
            "LandGov GIS API is running",

        project:
            "SIH26014",

        version:
            "1.0.0"

    });

});


/* =========================================================
   6. HEALTH CHECK API
   ========================================================= */

app.get("/api/health", (req, res) => {

    res.json({

        status: "healthy",

        service:
            "LandGov GIS Backend",

        timestamp:
            new Date().toISOString()

    });

});


/* =========================================================
   PARCEL APIs
   ========================================================= */


/* ---------------------------------------------------------
   GET ALL PARCELS
   --------------------------------------------------------- */

app.get("/api/parcels", (req, res) => {

    res.json({

        success: true,

        count: parcels.length,

        data: parcels

    });

});


/* ---------------------------------------------------------
   GET SINGLE PARCEL
   --------------------------------------------------------- */

app.get("/api/parcels/:id", (req, res) => {

    const parcelId =
        req.params.id;


    const parcel =
        parcels.find(
            item =>
                item.id.toLowerCase() ===
                parcelId.toLowerCase()
        );


    if (!parcel) {

        return res.status(404).json({

            success: false,

            message:
                "Parcel not found"

        });

    }


    res.json({

        success: true,

        data: parcel

    });

});


/* =========================================================
   7. START SERVER
   ========================================================= */

app.listen(
    PORT,
    () => {

        console.log(
            "===================================="
        );

        console.log(
            "LandGov GIS Backend"
        );

        console.log(
            "===================================="
        );

        console.log(
            `Server running on http://localhost:${PORT}`
        );

        console.log(
            `Health API: http://localhost:${PORT}/api/health`
        );

    }
);
