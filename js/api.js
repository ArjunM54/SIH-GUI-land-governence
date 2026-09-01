/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   API.JS

   Responsible for communicating with the backend API.
   ========================================================= */


/* =========================================================
   1. BACKEND URL
   ========================================================= */

const API_BASE_URL =
    "http://localhost:5000";


/* =========================================================
   2. GENERIC API REQUEST
   ========================================================= */

async function apiRequest(endpoint) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`
            );


        /* Check HTTP status */

        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );

        }


        /* Convert response to JSON */

        const data =
            await response.json();


        return data;

    }

    catch (error) {

        console.error(
            "API request failed:",
            error
        );


        throw error;

    }

}


/* =========================================================
   3. GET ALL PARCELS
   ========================================================= */

async function getParcels() {

    return await apiRequest(
        "/api/parcels"
    );

}


/* =========================================================
   4. GET SINGLE PARCEL
   ========================================================= */

async function getParcelById(
    parcelId
) {

    return await apiRequest(
        `/api/parcels/${parcelId}`
    );

}


/* =========================================================
   5. GET UTILITIES
   ========================================================= */

async function getUtilities() {

    return await apiRequest(
        "/api/utilities"
    );

}


async function getUtilitiesByParcelId(
    parcelId
) {

    return await apiRequest(
        `/api/utilities/${parcelId}`
    );

}


/* =========================================================
   6. GET LAND PROFILE
   ========================================================= */

async function getLandProfile(
    parcelId
) {

    return await apiRequest(
        `/api/land-profile/${parcelId}`
    );

}


/* =========================================================
   7. CHECK BACKEND HEALTH
   ========================================================= */

async function checkBackendHealth() {

    return await apiRequest(
        "/api/health"
    );

}


/* =========================================================
   8. API READY
   ========================================================= */

console.log(
    "LandGov API client initialized."
);

