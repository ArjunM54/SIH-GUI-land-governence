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
        const token = window.AuthManager ? window.AuthManager.getToken() : "";

        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (!response.ok) {
            let errMessage = `API Error: ${response.status}`;
            try {
                const errData = await response.json();
                if (errData && errData.error) {
                    errMessage = errData.error;
                }
            } catch (e) {}
            throw new Error(errMessage);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API request failed:", error);
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
        console.log("Fetching land profile:", parcelId);
        const result = await apiRequest(`/api/land-profile/${parcelId}`);
        const data = result.data || result;
        console.log("Land profile received:", data);
        return data;
    } catch (error) {
        console.error("Land profile API error:", error);
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

/* Document & Evidence API */
async function getAllDocuments() {
    return await apiRequest("/api/documents");
}

async function getDocumentById(documentId) {
    return await apiRequest(`/api/documents/${documentId}`);
}

async function getDocumentsByParcelId(parcelId) {
    return await apiRequest(`/api/documents/parcel/${parcelId}`);
}

async function getDocumentsByType(parcelId, documentType) {
    return await apiRequest(`/api/documents/parcel/${parcelId}/type/${documentType}`);
}

async function uploadDocument(formData) {
    const token = window.AuthManager ? window.AuthManager.getToken() : "";
    const response = await fetch(`${API_BASE_URL}/api/documents/upload`, {
        method: "POST",
        headers: {
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: formData
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `Upload failed with status ${response.status}`);
    }
    return data;
}

function getDocumentFileUrl(documentId) {
    return `${API_BASE_URL}/api/documents/${documentId}/file`;
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
   9. AUTHENTICATION & GOVERNANCE API HELPERS
   ========================================================= */

async function loginUser(identifier, password) {
    return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password })
    });
}

async function registerCitizen(data) {
    return await apiRequest("/api/auth/register-citizen", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function getAuthSession() {
    return await apiRequest("/api/auth/me");
}

async function logoutUser() {
    return await apiRequest("/api/auth/logout", { method: "POST" });
}

/* Citizen API */
async function getCitizenRequests() {
    return await apiRequest("/api/citizen/requests");
}

async function submitCitizenRequest(data) {
    return await apiRequest("/api/citizen/request", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

/* Officer Department APIs */
async function getOfficerDepartmentOverview(officerType) {
    const routeMap = {
        cadastral_officer: "/api/officer/cadastral/overview",
        land_records_officer: "/api/officer/ror/overview",
        registration_officer: "/api/officer/registration/overview",
        land_use_officer: "/api/officer/land-use/overview",
        property_tax_officer: "/api/officer/property-tax/overview"
    };
    const endpoint = routeMap[officerType] || "/api/officer/cadastral/overview";
    return await apiRequest(endpoint);
}

async function verifyCadastralBoundary(parcelId, surveyNo, verificationRemarks) {
    return await apiRequest("/api/officer/cadastral/verify-boundary", {
        method: "POST",
        body: JSON.stringify({ parcelId, surveyNo, verificationRemarks })
    });
}

async function approveRoRMutation(mutationId, status, remarks) {
    return await apiRequest("/api/officer/ror/approve-mutation", {
        method: "POST",
        body: JSON.stringify({ mutationId, status, remarks })
    });
}

async function approvePropertyTransfer(regNo, decision, remarks) {
    return await apiRequest("/api/officer/registration/approve-transfer", {
        method: "POST",
        body: JSON.stringify({ regNo, decision, remarks })
    });
}

async function approveLandUseConversion(conversionId, decision, zoningCode) {
    return await apiRequest("/api/officer/land-use/approve-conversion", {
        method: "POST",
        body: JSON.stringify({ conversionId, decision, zoningCode })
    });
}

async function verifyPropertyTaxClearance(parcelId, clearedAmount, remarks) {
    return await apiRequest("/api/officer/property-tax/verify-clearance", {
        method: "POST",
        body: JSON.stringify({ parcelId, clearedAmount, remarks })
    });
}

/* Admin APIs */
async function getAdminMetrics() {
    return await apiRequest("/api/admin/metrics");
}

async function getAdminOfficers() {
    return await apiRequest("/api/admin/officers");
}

async function createGovernmentOfficer(officerData) {
    return await apiRequest("/api/admin/officers", {
        method: "POST",
        body: JSON.stringify(officerData)
    });
}

async function toggleOfficerStatus(uid, status) {
    return await apiRequest(`/api/admin/officers/${uid}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
    });
}

async function updateOfficerPermissions(uid, permissions) {
    return await apiRequest(`/api/admin/officers/${uid}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissions })
    });
}

async function resetOfficerPassword(uid) {
    return await apiRequest(`/api/admin/officers/${uid}/reset-password`, {
        method: "POST"
    });
}

async function getAdminAuditLogs(limit = 50) {
    return await apiRequest(`/api/admin/audit-logs?limit=${limit}`);
}

console.log("LandGov API client initialized with Auth & Officer methods.");



