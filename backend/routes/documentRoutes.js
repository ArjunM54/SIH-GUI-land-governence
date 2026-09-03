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
    VALID_DOCUMENT_TYPES
} = require("../services/documentService");

const {
    processDocumentUpload,
    resolveStoredFilePath
} = require("../services/documentUploadService");

const { getLandProfile } = require("../data/landProfile");
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

        const filePath = resolveStoredFilePath(doc);
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
