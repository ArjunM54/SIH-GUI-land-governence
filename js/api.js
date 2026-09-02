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

async function apiRequest(endpoint, options = {}) {

    try {

        const response =
            await fetch(
                `${API_BASE_URL}${endpoint}`,
                options
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
   GET COMPLETE LAND PROFILE
   ========================================================= */

async function getLandProfile(parcelId) {

    try {

        console.log(
            "Fetching land profile:",
            parcelId
        );


        const response =
            await fetch(
                `http://localhost:5000/api/land-profile/${parcelId}`
            );


        if (!response.ok) {

            throw new Error(
                `HTTP error: ${response.status}`
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Unable to load land profile"
            );

        }


        console.log(
            "Land profile received:",
            result.data
        );


        return result.data;

    }

    catch (error) {

        console.error(
            "Land profile API error:",
            error
        );

        throw error;

    }

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
   6. GOVERNANCE & CONFLICT API
   ========================================================= */

async function getGovernanceByParcelId(parcelId) {
    return await apiRequest(`/api/governance/${parcelId}`);
}

async function getAllGovernance() {
    return await apiRequest("/api/governance");
}

async function getConflictsByParcelId(parcelId) {
    return await apiRequest(`/api/conflicts/${parcelId}`);
}

async function getAllConflicts() {
    return await apiRequest("/api/conflicts");
}

/* Proposal Validation API */
async function validateProposal(parcelId, proposal) {
    return await apiRequest("/api/proposals/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            parcelId,
            proposal
        })
    });
}

async function validateProposalForAll(proposal) {
    return await apiRequest("/api/proposals/all", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            proposal
        })
    });
}

/* Audit Trail API */
async function getAuditRecord(auditId) {
    return await apiRequest(`/api/audits/${auditId}`);
}

async function getAuditHistoryByParcel(parcelId) {
    return await apiRequest(`/api/audits/parcel/${parcelId}`);
}

async function getAllAudits(limit = 20) {
    return await apiRequest(`/api/audits?limit=${limit}`);
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


