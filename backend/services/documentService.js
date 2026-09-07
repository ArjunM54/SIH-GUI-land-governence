/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DOCUMENT SERVICE
   Handles queries for document metadata associated with parcels.
   ========================================================= */

const documents = require("../data/documents");

const VALID_DOCUMENT_TYPES = [
    "OWNERSHIP",
    "REGISTRATION",
    "LAND_USE",
    "PROPERTY_TAX",
    "BUILDING_PERMISSION",
    "RESTRICTIONS",
    "UTILITIES",
    "OTHER"
];

const VALID_STATUSES = [
    "AVAILABLE",
    "PENDING",
    "EXPIRED",
    "UNAVAILABLE"
];

/**
 * Returns all document metadata records.
 * @returns {Array} List of document objects
 */
function getAllDocuments() {
    return Array.isArray(documents) ? [...documents] : [];
}

/**
 * Retrieves a document by its documentId.
 * @param {string} documentId
 * @returns {Object|null} Document record or null if not found
 */
function getDocumentById(documentId) {
    if (!documentId || typeof documentId !== "string") {
        return null;
    }

    const targetId = documentId.trim().toUpperCase();
    const foundDoc = documents.find(
        doc => (doc.documentId || "").toUpperCase() === targetId
    );

    return foundDoc ? { ...foundDoc } : null;
}

/**
 * Retrieves all documents associated with a specific parcelId.
 * @param {string} parcelId
 * @returns {Array} Array of matching document records
 */
function getDocumentsByParcelId(parcelId) {
    if (!parcelId || typeof parcelId !== "string") {
        return [];
    }

    const targetParcelId = parcelId.trim().toUpperCase();
    return documents
        .filter(doc => (doc.parcelId || "").toUpperCase() === targetParcelId)
        .map(doc => ({ ...doc }));
}

/**
 * Retrieves documents for a specific parcelId filtered by documentType.
 * @param {string} parcelId
 * @param {string} documentType
 * @returns {Array} Array of matching document records
 */
function getDocumentsByType(parcelId, documentType) {
    if (!parcelId || typeof parcelId !== "string") {
        return [];
    }

    if (!documentType || typeof documentType !== "string") {
        return [];
    }

    const targetParcelId = parcelId.trim().toUpperCase();
    const targetType = documentType.trim().toUpperCase();

    return documents
        .filter(
            doc =>
                (doc.parcelId || "").toUpperCase() === targetParcelId &&
                (doc.documentType || "").toUpperCase() === targetType
        )
        .map(doc => ({ ...doc }));
}

/**
 * Generates an incremental document ID.
 * Format: DOC-00010, DOC-00011, etc.
 */
function generateDocumentId() {
    let maxIdNum = 0;
    documents.forEach(doc => {
        const match = (doc.documentId || "").match(/^DOC-(\d+)$/i);
        if (match) {
            const num = parseInt(match[1], 10);
            if (num > maxIdNum) maxIdNum = num;
        }
    });
    const nextNum = maxIdNum + 1;
    return `DOC-${String(nextNum).padStart(5, "0")}`;
}

/**
 * Adds a new document metadata record to the in-memory store.
 * @param {Object} newDoc
 * @returns {Object} Created document record
 */
function addDocumentRecord(newDoc) {
    const documentId = newDoc.documentId || generateDocumentId();
    const record = {
        documentId,
        applicationId: newDoc.applicationId || null,
        parcelId: (newDoc.parcelId || "").trim().toUpperCase(),
        documentType: (newDoc.documentType || "OTHER").trim().toUpperCase(),
        documentNumber: (newDoc.documentNumber || "").trim(),
        title: (newDoc.title || "Uploaded Document").trim(),
        issuingDepartment: (newDoc.issuingDepartment || "General Authority").trim(),
        issueDate: newDoc.issueDate || new Date().toISOString().split("T")[0],
        status: newDoc.status || "AVAILABLE",
        verificationStatus: newDoc.verificationStatus || "PENDING",
        required: newDoc.required !== undefined ? newDoc.required : true,
        responsibleDepartments: Array.isArray(newDoc.responsibleDepartments) ? newDoc.responsibleDepartments : ["registration"],
        fileName: newDoc.fileName || null,
        originalFileName: newDoc.originalFileName || newDoc.fileName || "Document.pdf",
        fileType: newDoc.fileType || "application/pdf",
        fileSize: newDoc.fileSize || 0,
        storageStatus: newDoc.storageStatus || "STORED",
        version: newDoc.version || 1,
        uploadedBy: newDoc.uploadedBy || "Citizen",
        uploadedAt: newDoc.uploadedAt || new Date().toISOString(),
        verifiedBy: newDoc.verifiedBy || null,
        verifiedAt: newDoc.verifiedAt || null,
        verificationRemarks: newDoc.verificationRemarks || null,
        textExtraction: newDoc.textExtraction || {
            status: "UNAVAILABLE",
            characterCount: 0,
            preview: null
        },
        description: (newDoc.description || "").trim(),
        createdAt: newDoc.createdAt || new Date().toISOString()
    };

    documents.push(record);
    return { ...record };
}

/**
 * Retrieves all documents belonging to a specific master Application ID.
 */
function getDocumentsByApplicationId(applicationId) {
    if (!applicationId) return [];
    const appKey = String(applicationId).trim().toUpperCase();
    return documents.filter(d => (d.applicationId || "").toUpperCase() === appKey);
}

/**
 * Retrieves documents mapped to a specific Officer Department.
 */

function getDocumentsForDepartment(departmentKey) {

    if (!departmentKey) {
        return [];
    }

    const officerType =
        String(departmentKey)
            .trim()
            .toLowerCase();

    const deptMap = {
        cadastral_officer: "cadastral",
        land_records_officer: "ror",
        registration_officer: "registration",
        land_use_officer: "landUse",
        property_tax_officer: "propertyTax"
    };

    const targetDept =
        deptMap[officerType] || officerType;


    return documents.filter(doc => {

        /*
         * IMPORTANT:
         *
         * Only citizen/application documents
         * should appear in this queue.
         */
        const isCitizenApplicationDocument =
            !!doc.applicationId;


        /*
         * Old government/static documents
         * without applicationId should not be
         * mixed with the citizen application queue.
         */
        if (!isCitizenApplicationDocument) {
            return false;
        }


        /*
         * If responsibleDepartments exists,
         * use it.
         */
        if (
            Array.isArray(doc.responsibleDepartments) &&
            doc.responsibleDepartments.length > 0
        ) {

            return doc.responsibleDepartments.some(
                department =>
                    String(department)
                        .trim()
                        .toLowerCase() ===
                    targetDept.toLowerCase()
            );
        }


        /*
         * Backward compatibility:
         *
         * If an old citizen application document
         * has applicationId but no department list,
         * show it to all five departments.
         */
        return [
            "cadastral",
            "ror",
            "registration",
            "landUse",
            "propertyTax"
        ].includes(targetDept);
    });
}

/**
 * Updates document-level verification decision and remarks.
 */
function verifyDocumentRecord(officerUser, documentId, decision, remarks) {
    const doc = getDocumentById(documentId);
    if (!doc) {
        return { success: false, message: "Document not found." };
    }

    const now = new Date().toISOString();
    const statusVal = (decision || "VERIFIED").toUpperCase();
    let finalStatus = "VERIFIED";
    if (statusVal === "REJECTED") finalStatus = "REJECTED";
    else if (statusVal === "DOCUMENT_REQUIRED" || statusVal === "REQUEST_DOCUMENT") finalStatus = "DOCUMENT_REQUIRED";

    doc.verificationStatus = finalStatus;
    doc.verifiedBy = officerUser.name || officerUser.officerId || officerUser.email;
    doc.verifiedAt = now;
    doc.verificationRemarks = remarks || `${officerUser.name || 'Officer'} verified document.`;

    const auditService = require("./auditService");
    auditService.logEvent({
        actor: officerUser.officerId || officerUser.email,
        target: doc.documentId,
        action: `DOCUMENT_${finalStatus}`,
        result: "SUCCESS",
        details: { applicationId: doc.applicationId, documentType: doc.documentType, remarks }
    });

    return { success: true, status: finalStatus, document: doc, message: `Document '${doc.title || doc.documentId}' status set to ${finalStatus}.` };
}

module.exports = {
    getAllDocuments,
    getDocumentById,
    getDocumentsByParcelId,
    getDocumentsByType,
    getDocumentsByApplicationId,
    getDocumentsForDepartment,
    generateDocumentId,
    addDocumentRecord,
    verifyDocumentRecord,
    VALID_DOCUMENT_TYPES,
    VALID_STATUSES
};


