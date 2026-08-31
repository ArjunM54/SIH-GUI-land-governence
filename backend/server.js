
/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   MAIN BACKEND SERVER
   ========================================================= */


/* =========================================================
   1. IMPORT PACKAGES
   ========================================================= */

const express = require("express");

const cors = require("cors");

/* =========================================================
   2. IMPORT ROUTES
   ========================================================= */

const parcelRoutes =
    require("./routes/parcelRoutes");

const cadastralRoutes =
    require("./routes/cadastralRoutes");

const rorRoutes =
    require("./routes/rorRoutes");

const landProfileRoutes =
    require("./routes/landProfileRoutes");

const landUseRoutes =
    require("./routes/landUseRoutes");

/* =========================================================
   3. CREATE EXPRESS APP
   ========================================================= */

const app = express();


/* =========================================================
   4. MIDDLEWARE
   ========================================================= */

app.use(cors());

app.use(express.json());


/* =========================================================
   5. PORT
   ========================================================= */

const PORT = 5000;


/* =========================================================
   6. HOME API
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
   7. HEALTH CHECK
   ========================================================= */

app.get(
    "/api/health",
    (req, res) => {

        res.json({

            status: "healthy",

            service:
                "LandGov GIS Backend",

            timestamp:
                new Date().toISOString()

        });

    }
);


/* =========================================================
   8. PARCEL ROUTES
   ========================================================= */

app.use(
    "/api/parcels",
    parcelRoutes
);

app.use(
    "/api/cadastral",
    cadastralRoutes
);

app.use(
    "/api/ror",
    rorRoutes
);

app.use(
    "/api/land-profile",
    landProfileRoutes
);

app.use(
    "/api/land-use",
    landUseRoutes
);

/* =========================================================
   9. START SERVER
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

        console.log(
            `Parcel API: http://localhost:${PORT}/api/parcels`
        );

        console.log(
            `Cadastral API: http://localhost:${PORT}/api/cadastral`
        );

        console.log(
            `RoR API: http://localhost:${PORT}/api/ror`
        );

        console.log(
            `Land Profile API: http://localhost:${PORT}/api/land-profile`
        );

        console.log(
            `Land Use API: http://localhost:${PORT}/api/land-use`
        );


    }
);
