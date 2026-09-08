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
                if (errData && (errData.message || errData.error)) {
                    errMessage = errData.message || errData.error;
                }
            } catch (e) { }
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

async function getApplicationRequirements(appType) {
    return await apiRequest(`/api/documents/requirements/${appType}`);
}

async function getApplicationDocuments(applicationId) {
    return await apiRequest(`/api/documents/application/${applicationId}`);
}

async function uploadRequirementDocument(applicationId, formData) {
    const token = window.AuthManager ? window.AuthManager.getToken() : "";
    const response = await fetch(`${API_BASE_URL}/api/documents/application/${applicationId}/upload-requirement`, {
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

async function getOfficerDepartmentDocuments() {
    return await apiRequest("/api/officer/documents");
}

async function verifyOfficerDocument(documentId, status, remarks) {
    return await apiRequest(`/api/documents/${documentId}/verify`, {
        method: "POST",
        body: JSON.stringify({ status, remarks })
    });
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
    return await apiRequest("/api/citizen/applications");
}

async function submitCitizenRequest(data) {
    return await apiRequest("/api/citizen/applications/service", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function getCitizenDashboardSummary() {
    return await apiRequest("/api/citizen/dashboard-summary");
}

async function getCitizenMyLand() {
    return await apiRequest("/api/citizen/my-land");
}

async function getCitizenApplications() {
    return await apiRequest("/api/citizen/applications");
}

async function getCitizenApplicationById(id) {
    return await apiRequest(`/api/citizen/applications/${id}`);
}

async function submitOwnerChangeApplication(data) {
    return await apiRequest("/api/citizen/applications/owner-change", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function submitServiceApplication(data) {
    return await apiRequest("/api/citizen/applications/service", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function resubmitApplicationDocument(appId, deptKey, documentName) {
    return await apiRequest(`/api/citizen/applications/${appId}/resubmit-document`, {
        method: "POST",
        body: JSON.stringify({ deptKey, documentName })
    });
}

async function getLandOwnershipHistory(parcelId) {
    return await apiRequest(`/api/citizen/properties/${parcelId}/history`);
}

async function getApplicationTimeline(appId) {
    return await apiRequest(`/api/applications/${appId}/timeline`);
}

async function getApplicationByNumber(appNum) {
    return await apiRequest(`/api/applications/number/${appNum}`);
}

async function getCitizenServices() {
    return await apiRequest("/api/citizen/services");
}

async function getCitizenDocuments() {
    return await apiRequest("/api/citizen/documents");
}

async function getCitizenPropertyTax() {
    return await apiRequest("/api/citizen/property-tax");
}

async function getCitizenNotifications() {
    return await apiRequest("/api/citizen/notifications");
}

async function markNotificationRead(id) {
    return await apiRequest(`/api/citizen/notifications/${id}/read`, { method: "PATCH" });
}

async function getCitizenProfile() {
    return await apiRequest("/api/citizen/profile");
}

async function updateCitizenProfile(data) {
    return await apiRequest("/api/citizen/profile", {
        method: "PUT",
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

async function getCadastralParcelDetail(parcelId) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}`);
}

async function verifyCadastralParcelBoundary(parcelId, verificationResult, remarks) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}/verify-boundary`, {
        method: "POST",
        body: JSON.stringify({ verificationResult, remarks })
    });
}

async function updateCadastralSurvey(parcelId, surveyData) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}/survey`, {
        method: "PUT",
        body: JSON.stringify(surveyData)
    });
}

async function reportCadastralConflict(parcelId, conflictData) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}/conflicts`, {
        method: "POST",
        body: JSON.stringify(conflictData)
    });
}

async function addCadastralInspection(parcelId, inspectionDate, remarks) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}/inspections`, {
        method: "POST",
        body: JSON.stringify({ inspectionDate, remarks })
    });
}

async function addCadastralDocument(parcelId, docData) {
    return await apiRequest(`/api/officer/cadastral/parcels/${parcelId}/documents`, {
        method: "POST",
        body: JSON.stringify(docData)
    });
}

async function respondDepartmentRequest(requestId, responseStatus, remarks) {
    return await apiRequest(`/api/officer/cadastral/requests/${requestId}/respond`, {
        method: "POST",
        body: JSON.stringify({ responseStatus, remarks })
    });
}

async function getRoRParcelDetail(parcelId) {
    return await apiRequest(`/api/officer/ror/parcels/${parcelId}`);
}

async function verifyOwnership(parcelId, verificationResult, remarks) {
    return await apiRequest(`/api/officer/ror/parcels/${parcelId}/verify-ownership`, {
        method: "POST",
        body: JSON.stringify({ verificationResult, remarks })
    });
}

async function approveMutation(mutationId, remarks) {
    return await apiRequest(`/api/officer/ror/mutations/${mutationId}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function rejectMutation(mutationId, rejectionReason, remarks) {
    return await apiRequest(`/api/officer/ror/mutations/${mutationId}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason, remarks })
    });
}

async function requestMutationInformation(mutationId, infoRequired, reason) {
    return await apiRequest(`/api/officer/ror/mutations/${mutationId}/request-information`, {
        method: "POST",
        body: JSON.stringify({ infoRequired, reason })
    });
}

async function reportOwnershipDispute(parcelId, disputeData) {
    return await apiRequest(`/api/officer/ror/parcels/${parcelId}/disputes`, {
        method: "POST",
        body: JSON.stringify(disputeData)
    });
}

async function correctRoRRecord(parcelId, correctionData) {
    return await apiRequest(`/api/officer/ror/parcels/${parcelId}/record`, {
        method: "PUT",
        body: JSON.stringify(correctionData)
    });
}

async function verifyRoRDocument(documentId, verificationStatus, remarks) {
    return await apiRequest(`/api/officer/ror/documents/${documentId}/verify`, {
        method: "POST",
        body: JSON.stringify({ verificationStatus, remarks })
    });
}

async function getRegistrationParcelDetail(parcelId) {
    return await apiRequest(`/api/officer/registration/parcels/${parcelId}`);
}

async function verifyDeed(registrationId, verificationResult, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/verify-deed`, {
        method: "POST",
        body: JSON.stringify({ verificationResult, remarks })
    });
}

async function verifyStampDuty(registrationId, paymentRef, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/verify-stamp-duty`, {
        method: "POST",
        body: JSON.stringify({ paymentRef, remarks })
    });
}

async function performEncumbranceCheck(registrationId, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/encumbrance-check`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function requestTaxClearance(registrationId, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/request-tax-clearance`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function approveRegistrationTransfer(registrationId, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function rejectRegistration(registrationId, rejectionReason, remarks) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason, remarks })
    });
}

async function requestRegistrationInformation(registrationId, infoRequired, reason) {
    return await apiRequest(`/api/officer/registration/requests/${registrationId}/request-information`, {
        method: "POST",
        body: JSON.stringify({ infoRequired, reason })
    });
}

async function getLandUseParcelDetail(parcelId) {
    return await apiRequest(`/api/officer/land-use/parcels/${parcelId}`);
}

async function verifyEnvironmentalStatus(parcelId, environmentalStatus, remarks) {
    return await apiRequest(`/api/officer/land-use/parcels/${parcelId}/environmental-check`, {
        method: "POST",
        body: JSON.stringify({ environmentalStatus, remarks })
    });
}

async function verifyRoadAccess(parcelId, roadAccessStatus, roadWidth, remarks) {
    return await apiRequest(`/api/officer/land-use/parcels/${parcelId}/road-access`, {
        method: "POST",
        body: JSON.stringify({ roadAccessStatus, roadWidth, remarks })
    });
}

async function reportPlanningConflict(parcelId, conflictData) {
    return await apiRequest(`/api/officer/land-use/parcels/${parcelId}/conflicts`, {
        method: "POST",
        body: JSON.stringify(conflictData)
    });
}

async function reviewBuildingPermission(applicationId, status, remarks) {
    return await apiRequest(`/api/officer/land-use/building-permissions/${applicationId}/review`, {
        method: "POST",
        body: JSON.stringify({ status, remarks })
    });
}

async function approveLandUseConversionReq(requestId, remarks) {
    return await apiRequest(`/api/officer/land-use/conversions/${requestId}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function rejectLandUseConversionReq(requestId, rejectionReason, remarks) {
    return await apiRequest(`/api/officer/land-use/conversions/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason, remarks })
    });
}

async function requestLandUseInformation(requestId, infoRequired, reason) {
    return await apiRequest(`/api/officer/land-use/conversions/${requestId}/request-information`, {
        method: "POST",
        body: JSON.stringify({ infoRequired, reason })
    });
}

async function getPropertyTaxParcelDetail(parcelId) {
    return await apiRequest(`/api/officer/property-tax/parcels/${parcelId}`);
}

async function verifyTaxAssessment(assessmentId, remarks) {
    return await apiRequest(`/api/officer/property-tax/assessments/${assessmentId}/verify`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function verifyTaxPaymentRecord(paymentId, remarks) {
    return await apiRequest(`/api/officer/property-tax/payments/${paymentId}/verify`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function approveTaxClearanceReq(requestId, remarks) {
    return await apiRequest(`/api/officer/property-tax/clearance-requests/${requestId}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks })
    });
}

async function rejectTaxClearanceReq(requestId, rejectionReason, remarks) {
    return await apiRequest(`/api/officer/property-tax/clearance-requests/${requestId}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason, remarks })
    });
}

async function requestTaxClearanceInfo(requestId, infoRequired, reason) {
    return await apiRequest(`/api/officer/property-tax/clearance-requests/${requestId}/more-info`, {
        method: "POST",
        body: JSON.stringify({ infoRequired, reason })
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

/* =========================================================
   INTER-DEPARTMENTAL PARCEL VERIFICATION REQUEST APIS
   ========================================================= */

async function getDepartmentRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return await apiRequest(`/api/department-requests${query ? `?${query}` : ''}`);
}

async function getDepartmentRequestById(requestId) {
    return await apiRequest(`/api/department-requests/${requestId}`);
}

async function createDepartmentRequest(data) {
    return await apiRequest("/api/department-requests", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function acceptDepartmentRequest(requestId) {
    return await apiRequest(`/api/department-requests/${requestId}/accept`, {
        method: "PUT"
    });
}

async function startDepartmentRequest(requestId) {
    return await apiRequest(`/api/department-requests/${requestId}/start`, {
        method: "PUT"
    });
}

async function requestMoreInfoDepartment(requestId, notes) {
    return await apiRequest(`/api/department-requests/${requestId}/more-info`, {
        method: "PUT",
        body: JSON.stringify({ notes })
    });
}

async function completeDepartmentRequest(requestId, completionData) {
    return await apiRequest(`/api/department-requests/${requestId}/complete`, {
        method: "PUT",
        body: JSON.stringify(completionData)
    });
}

async function rejectDepartmentRequest(requestId, reason) {
    return await apiRequest(`/api/department-requests/${requestId}/reject`, {
        method: "PUT",
        body: JSON.stringify({ reason })
    });
}

async function escalateDepartmentRequest(requestId, reason) {
    return await apiRequest(`/api/department-requests/${requestId}/escalate`, {
        method: "PUT",
        body: JSON.stringify({ reason })
    });
}

async function cancelDepartmentRequest(requestId, reason) {
    return await apiRequest(`/api/department-requests/${requestId}/cancel`, {
        method: "PUT",
        body: JSON.stringify({ reason })
    });
}

async function getParcelDepartmentRequests(parcelId) {
    return await apiRequest(`/api/department-requests/parcels/${parcelId}/department-requests`);
}

async function getOfficerDepartmentDocuments() {
    return await apiRequest("/api/officer/documents");
}

async function verifyOfficerDocument(documentId, decision, remarks) {
    return await apiRequest(`/api/documents/${encodeURIComponent(documentId)}/verify`, {
        method: "POST",
        body: JSON.stringify({ status: decision, remarks })
    });
}




async function updateVerificationStage(
    applicationId,
    deptKey,
    decision,
    verificationRemarks,
    requestedDocument = ""
) {

    if (!applicationId) {
        throw new Error(
            "Application ID is required."
        );
    }

    const validDepartments = [
        "cadastral",
        "ror",
        "registration",
        "landUse",
        "propertyTax"
    ];

    if (!validDepartments.includes(deptKey)) {
        throw new Error(
            `Invalid department: ${deptKey}`
        );
    }

    return await apiRequest(
        `/api/applications/${encodeURIComponent(applicationId)}/status`,
        {
            method: "PATCH",

            body: JSON.stringify({
                deptKey: deptKey,
                status: decision,
                remarks:
                    verificationRemarks || "",
                requestedDocument:
                    requestedDocument || ""
            })
        }
    );
}

// Expose to API object & window
window.API = window.API || {};
window.API.getOfficerDepartmentDocuments = getOfficerDepartmentDocuments;
window.API.verifyOfficerDocument = verifyOfficerDocument;
window.API.updateVerificationStage = updateVerificationStage;
window.API.getApplicationTimeline = getApplicationTimeline;
window.API.getApplicationByNumber = getApplicationByNumber;

window.getApplicationTimeline = getApplicationTimeline;
window.getApplicationByNumber = getApplicationByNumber;

window.getDepartmentRequests = getDepartmentRequests;
window.getDepartmentRequestById = getDepartmentRequestById;
window.createDepartmentRequest = createDepartmentRequest;
window.acceptDepartmentRequest = acceptDepartmentRequest;
window.startDepartmentRequest = startDepartmentRequest;
window.requestMoreInfoDepartment = requestMoreInfoDepartment;
window.completeDepartmentRequest = completeDepartmentRequest;
window.rejectDepartmentRequest = rejectDepartmentRequest;
window.escalateDepartmentRequest = escalateDepartmentRequest;
window.cancelDepartmentRequest = cancelDepartmentRequest;
window.getParcelDepartmentRequests = getParcelDepartmentRequests;
window.getOfficerDepartmentDocuments = getOfficerDepartmentDocuments;
window.verifyOfficerDocument = verifyOfficerDocument;
window.updateVerificationStage = updateVerificationStage;

console.log("LandGov API client initialized with Auth, Officer & Department Request methods.");





