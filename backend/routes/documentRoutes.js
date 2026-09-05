/* =========================================================
   LANDGOV GIS
   DOCUMENT ROUTES (PROTECTED BY JWT & PARCEL ACCESS)
   ========================================================= */

const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
    getAllDocuments,
    getDocumentById,
    getDocumentsByParcelId,
    getDocumentsByType,
    getDocumentsByApplicationId,
    getDocumentsForDepartment,
    verifyDocumentRecord,
    VALID_DOCUMENT_TYPES
} = require("../services/documentService");

const { getDocumentRequirementsForType } = require("../config/documentRequirements");

const {
    processDocumentUpload,
    resolveStoredFilePath
} = require("../services/documentUploadService");

const { getLandProfile } = require("../data/landProfile");
const { getApplicationById } = require("../services/applicationService");
const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const { filterDocumentData } = require("../services/accessControlService");
const auditService = require("../services/auditService");

// Configure Multer for in-memory buffer handling (Max 10 MB)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

/**
 * GET /api/documents/requirements/:appType
 * Returns required document metadata schema for application type
 */
router.get("/requirements/:appType", (req, res) => {
    try {
        const { appType } = req.params;
        const requirements = getDocumentRequirementsForType(appType);
        return res.json({
            success: true,
            appType: appType.toUpperCase(),
            requirements
        });
    } catch (error) {
        console.error("[Document API] Error getting requirements:", error);
        return res.status(500).json({ success: false, message: "Error fetching requirements." });
    }
});

/**
 * GET /api/documents/application/:applicationId
 * Fetch all documents associated with a specific application ID
 */
router.get("/application/:applicationId", requireAuth, (req, res) => {
    try {
        const { applicationId } = req.params;
        const app = getApplicationById(applicationId);
        if (!app) {
            return res.status(404).json({ success: false, message: `Application ${applicationId} not found.` });
        }

        const docs = getDocumentsByApplicationId(applicationId);
        return res.json({
            success: true,
            applicationId,
            count: docs.length,
            documents: docs
        });
    } catch (error) {
        console.error("[Document API] Error getting application docs:", error);
        return res.status(500).json({ success: false, message: "Error fetching application documents." });
    }
});

/**
 * POST /api/documents/application/:applicationId/upload-requirement
 * Upload/resubmit a specific document requirement for an existing application
 */
router.post("/application/:applicationId/upload-requirement", requireAuth, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message || "Upload error." });
        }
        next();
    });
}, async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { reqKey, docType } = req.body;
        const fileObject = req.file;

        const app = getApplicationById(applicationId);
        if (!app) {
            return res.status(404).json({ success: false, message: `Application ${applicationId} not found.` });
        }

        const requirements = getDocumentRequirementsForType(app.type);
        const reqConfig = requirements.find(r => r.key === reqKey) || {
            key: reqKey || "custom",
            title: reqKey || "Document",
            docType: docType || "SUPPORTING_DOC",
            responsibleDepartments: ["cadastral", "ror", "registration", "landUse", "propertyTax"]
        };

        const result = await processDocumentUpload({
            parcelId: app.parcelId,
            docType: reqConfig.docType || docType || "OTHER",
            title: `${reqConfig.title} - Resubmission`,
            applicationId: app.applicationId,
            reqKey: reqConfig.key,
            responsibleDepartments: reqConfig.responsibleDepartments,
            uploadedBy: req.user.email || req.user.uid
        }, fileObject);

        if (!result.success) {
            return res.status(400).json(result);
        }

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: applicationId,
            action: "RESUBMIT_DOCUMENT_REQUIREMENT",
            result: "SUCCESS",
            details: { reqKey, documentId: result.document?.documentId }
        });

        return res.status(201).json({
            success: true,
            message: `Document '${reqConfig.title}' uploaded/updated successfully.`,
            document: result.document
        });
    } catch (error) {
        console.error("[Document API] Error uploading requirement:", error);
        return res.status(500).json({ success: false, message: "Error uploading requirement." });
    }
});

/**
 * GET /api/documents/view/:documentId
 * Stream PDF/Document inline for viewing in browser iframe/viewer modal
 */
router.get("/view/:documentId", requireAuth, (req, res) => {
    try {
        const { documentId } = req.params;
        const doc = getDocumentById(documentId);

        if (!doc) {
            return res.status(404).json({ success: false, message: `Document '${documentId}' not found.` });
        }

        const filePath = resolveStoredFilePath(doc.fileName || doc.filePath);
        if (!filePath) {
            return res.status(404).json({ success: false, message: "Physical document file not found." });
        }

        const mimeType = doc.mimeType || (filePath.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
        res.setHeader("Content-Type", mimeType);
        res.setHeader("Content-Disposition", `inline; filename="${doc.fileName || 'document.pdf'}"`);

        return res.sendFile(filePath);
    } catch (error) {
        console.error("[Document API] Error streaming document view:", error);
        return res.status(500).json({ success: false, message: "Error streaming document." });
    }
});

/**
 * POST /api/documents/:documentId/verify
 * Allows officer to approve or reject a specific document assigned to their department
 */
router.post("/:documentId/verify", requireAuth, (req, res) => {
    try {
        const { documentId } = req.params;
        const { status, remarks } = req.body; // status: 'VERIFIED' or 'REJECTED'

        if (!['VERIFIED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be 'VERIFIED' or 'REJECTED'." });
        }

        const updatedDoc = verifyDocumentRecord(documentId, req.user, status, remarks);
        if (!updatedDoc) {
            return res.status(404).json({ success: false, message: `Document '${documentId}' not found.` });
        }

        auditService.logEvent({
            actor: req.user.officerId || req.user.email,
            target: documentId,
            action: "VERIFY_DOCUMENT",
            result: "SUCCESS",
            details: { status, remarks }
        });

        return res.json({
            success: true,
            message: `Document ${status.toLowerCase()} successfully by ${req.user.name || req.user.role}.`,
            document: updatedDoc
        });
    } catch (error) {
        console.error("[Document API] Error verifying document:", error);
        return res.status(500).json({ success: false, message: error.message || "Error verifying document." });
    }
});

/**
 * GET /api/documents
 * Returns authorized documents for the user
 */
router.get("/", requireAuth, (req, res) => {
    try {
        const rawDocs = getAllDocuments();
        const authorizedDocs = filterDocumentData(req.user, rawDocs);
        return res.json({
            success: true,
            count: authorizedDocs.length,
            documents: authorizedDocs
        });
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching document records."
        });
    }
});

/**
 * POST /api/documents/upload
 * Upload a supporting document for an authorized parcel
 */
router.post("/upload", requireAuth, (req, res, next) => {
    upload.single("file")(req, res, (err) => {
        if (err) {
            if (err instanceof multer.MulterError) {
                if (err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({
                        success: false,
                        message: "File size exceeds the 10 MB limit."
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message || "Invalid file upload."
            });
        }
        next();
    });
}, async (req, res) => {
    try {
        const metadata = req.body || {};
        const fileObject = req.file;

        if (metadata.parcelId && !canAccessParcel(req.user, metadata.parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to upload documents for this parcel."
            });
        }

        metadata.uploadedBy = req.user.email || req.user.uid;

        const result = await processDocumentUpload(metadata, fileObject);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.error || "Document upload failed."
            });
        }

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: metadata.parcelId || "DOCUMENT_UPLOAD",
            action: "UPLOAD_DOCUMENT",
            result: "SUCCESS"
        });

        return res.status(201).json(result);
    } catch (error) {
        console.error("[Document API] Error in POST /api/documents/upload:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error processing document upload."
        });
    }
});

/**
 * GET /api/documents/parcel/:parcelId
 * Get all authorized documents for a specific parcel.
 */
router.get("/parcel/:parcelId", requireAuth, (req, res) => {
    try {
        const { parcelId } = req.params;

        if (!canAccessParcel(req.user, parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view documents for this parcel."
            });
        }

        const normalizedParcelId = parcelId.trim().toUpperCase();
        const profile = getLandProfile(normalizedParcelId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                parcelId: normalizedParcelId,
                message: `Parcel '${normalizedParcelId}' not found.`,
                count: 0,
                documents: []
            });
        }

        const rawDocs = getDocumentsByParcelId(normalizedParcelId);
        const docs = filterDocumentData(req.user, rawDocs);

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: normalizedParcelId,
            action: "VIEW_PARCEL_DOCUMENTS",
            result: "SUCCESS"
        });

        return res.json({
            success: true,
            parcelId: normalizedParcelId,
            count: docs.length,
            documents: docs
        });
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents/parcel/:parcelId:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching parcel documents."
        });
    }
});

/**
 * GET /api/documents/parcel/:parcelId/type/:documentType
 */
router.get("/parcel/:parcelId/type/:documentType", requireAuth, (req, res) => {
    try {
        const { parcelId, documentType } = req.params;

        if (!canAccessParcel(req.user, parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view documents for this parcel."
            });
        }

        const normalizedParcelId = parcelId.trim().toUpperCase();
        const normalizedType = (documentType || "").trim().toUpperCase();

        if (!VALID_DOCUMENT_TYPES.includes(normalizedType)) {
            return res.status(400).json({
                success: false,
                message: `Invalid document type '${documentType}'. Supported types: ${VALID_DOCUMENT_TYPES.join(", ")}.`
            });
        }

        const rawDocs = getDocumentsByType(normalizedParcelId, normalizedType);
        const docs = filterDocumentData(req.user, rawDocs);

        return res.json({
            success: true,
            parcelId: normalizedParcelId,
            documentType: normalizedType,
            count: docs.length,
            documents: docs
        });
    } catch (error) {
        console.error("[Document API] Error fetching typed documents:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching documents by type."
        });
    }
});

/**
 * GET /api/documents/:documentId
 */
router.get("/:documentId", requireAuth, (req, res) => {
    try {
        const { documentId } = req.params;
        const doc = getDocumentById(documentId);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: `Document '${documentId}' not found.`
            });
        }

        if (doc.parcelId && !canAccessParcel(req.user, doc.parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view this document."
            });
        }

        const filtered = filterDocumentData(req.user, [doc]);
        if (filtered.length === 0) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Access restricted to this document."
            });
        }

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: documentId,
            action: "VIEW_DOCUMENT_METADATA",
            result: "SUCCESS"
        });

        return res.json({
            success: true,
            document: filtered[0]
        });
    } catch (error) {
        console.error("[Document API] Error fetching document by ID:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching document."
        });
    }
});

/**
 * GET /api/documents/:documentId/file
 */
router.get("/:documentId/file", requireAuth, (req, res) => {
    try {
        const { documentId } = req.params;
        const doc = getDocumentById(documentId);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: `Document '${documentId}' not found.`
            });
        }

        if (doc.parcelId && !canAccessParcel(req.user, doc.parcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to download this document file."
            });
        }

        const filtered = filterDocumentData(req.user, [doc]);
        if (filtered.length === 0) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Access restricted to this document file."
            });
        }

        const filePath = resolveStoredFilePath(doc.fileName || doc.filePath);
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Physical file for document '${documentId}' could not be located.`
            });
        }

        auditService.logEvent({
            actor: req.user.email || req.user.officerId,
            target: documentId,
            action: "DOWNLOAD_DOCUMENT_FILE",
            result: "SUCCESS"
        });

        return res.sendFile(filePath);
    } catch (error) {
        console.error("[Document API] Error downloading file:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error serving document file."
        });
    }
});

module.exports = router;
