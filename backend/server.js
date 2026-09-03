
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

const registrationRoutes =
    require("./routes/registrationRoutes");

const PropertyTaxRoutes =
    require("./routes/PropertyTaxRoutes");

const BuildingPermissionRoutes =
    require("./routes/BuildingPermissionRoutes");

const restrictionsRoutes =
    require("./routes/restrictionsRoutes");

const utilitiesRoutes =
    require("./routes/utilitiesRoutes");

const governanceRoutes =
    require("./routes/governanceRoutes");

const conflictRoutes =
    require("./routes/conflictRoutes");

const proposalRoutes =
    require("./routes/proposalRoutes");

const auditRoutes =
    require("./routes/auditRoutes");

const documentRoutes =
    require("./routes/documentRoutes");

const { verifyAuth } = require("./middleware/authMiddleware");
const authRoutes = require("./routes/authRoutes");
const citizenRoutes = require("./routes/citizenRoutes");
const officerRoutes = require("./routes/officerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userService = require("./services/userService");


/* =========================================================
   3. CREATE EXPRESS APP
   ========================================================= */

const app = express();


/* =========================================================
   4. MIDDLEWARE
   ========================================================= */

app.use(cors());

app.use(express.json());

app.use(verifyAuth);



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

app.use(
    "/api/registration",
    registrationRoutes
);

app.use(
    "/api/property-tax",
    PropertyTaxRoutes
);

app.use(
    "/api/building-permission",
    BuildingPermissionRoutes
);

app.use(
    "/api/restrictions",
    restrictionsRoutes
);

app.use(
    "/api/utilities",
    utilitiesRoutes
);

app.use(
    "/api/governance",
    governanceRoutes
);

app.use(
    "/api/conflicts",
    conflictRoutes
);

app.use(
    "/api/proposals",
    proposalRoutes
);

app.use(
    "/api/audits",
    auditRoutes
);

app.use(
    "/api/documents",
    documentRoutes
);

/* Authentication & Governance Routes */
app.use("/api/auth", authRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/officer", officerRoutes);
app.use("/api/admin", adminRoutes);

/* Users JSON Endpoint (Viewable in Browser) */
app.get(["/users.json", "/api/users"], (req, res) => {
    res.json({
        success: true,
        citizens: userService.listUsers("citizen"),
        officers: userService.listUsers("officer"),
        admins: userService.listUsers("admin"),
        totalUsers: userService.listUsers().length
    });
});





/* =========================================================
   9. START SERVER
   ========================================================= */

const server = app.listen(
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

        console.log(
            `Registration API: http://localhost:${PORT}/api/registration`
        );

        console.log(
            `Property Tax API: http://localhost:${PORT}/api/property-tax`
        );

        console.log(
            `Building Permission API: http://localhost:${PORT}/api/building-permission`
        );

        console.log(
            `Restrictions API: http://localhost:${PORT}/api/restrictions`
        );

        console.log(
            `Utilities API: http://localhost:${PORT}/api/utilities`
        );

        console.log(
            `Governance API: http://localhost:${PORT}/api/governance`
        );

        console.log(
            `Conflict API: http://localhost:${PORT}/api/conflicts`
        );

        console.log(
            `Proposal Validation API: http://localhost:${PORT}/api/proposals/validate`
        );

        console.log(
            `Audit Trail API: http://localhost:${PORT}/api/audits`
        );

        console.log(
            `Document API: http://localhost:${PORT}/api/documents`
        );

        console.log(
            `Users API (JSON): http://localhost:${PORT}/api/users`
        );

        console.log(
            `Users JSON Direct: http://localhost:${PORT}/users.json`
        );

        console.log("====================================");
    }
);

/* ========================================================= 
SERVER ERROR HANDLER 
========================================================= */

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
    } else {
        console.error("SERVER ERROR:", error);
    }
});


/* ========================================================= 
KEEP SERVER RUNNING
========================================================= */

process.on("exit", (code) => {
    console.log(
        `Node process exiting with code: ${code}`
    );
});
