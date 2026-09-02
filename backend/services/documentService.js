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
        parcelId: (newDoc.parcelId || "").trim().toUpperCase(),
        documentType: (newDoc.documentType || "OTHER").trim().toUpperCase(),
        documentNumber: (newDoc.documentNumber || "").trim(),
        title: (newDoc.title || "Uploaded Document").trim(),
        issuingDepartment: (newDoc.issuingDepartment || "General Authority").trim(),
        issueDate: newDoc.issueDate || new Date().toISOString().split("T")[0],
        status: newDoc.status || "AVAILABLE",
        fileName: newDoc.fileName || null,
        fileType: newDoc.fileType || null,
        fileSize: newDoc.fileSize || 0,
        storageStatus: newDoc.storageStatus || "STORED",
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

module.exports = {
    getAllDocuments,
    getDocumentById,
    getDocumentsByParcelId,
    getDocumentsByType,
    generateDocumentId,
    addDocumentRecord,
    VALID_DOCUMENT_TYPES,
    VALID_STATUSES
};

