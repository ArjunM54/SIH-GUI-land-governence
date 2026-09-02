/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DOCUMENT ROUTES
   Express routes for document & evidence retrieval, upload, and file access.
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

// Configure Multer for in-memory buffer handling (Max 10 MB)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    }
});

/* =========================================================
   GET /api/documents
   Get all available document metadata records.
   ========================================================= */
router.get("/", (req, res) => {
    try {
        const docs = getAllDocuments();
        return res.json({
            success: true,
            count: docs.length,
            documents: docs
        });
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching document records."
        });
    }
});

/* =========================================================
   POST /api/documents/upload
   Upload a supporting land document for a parcel.
   ========================================================= */
router.post("/upload", (req, res, next) => {
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

        const result = await processDocumentUpload(metadata, fileObject);

        if (!result.success) {
            return res.status(result.statusCode || 400).json({
                success: false,
                message: result.error || "Document upload failed."
            });
        }

        return res.status(201).json(result);
    } catch (error) {
        console.error("[Document API] Error in POST /api/documents/upload:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error processing document upload."
        });
    }
});

/* =========================================================
   GET /api/documents/parcel/:parcelId
   Get all documents for a specific parcel.
   ========================================================= */
router.get("/parcel/:parcelId", (req, res) => {
    try {
        const { parcelId } = req.params;

        if (!parcelId || typeof parcelId !== "string" || parcelId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Invalid parcel ID provided."
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

        const docs = getDocumentsByParcelId(normalizedParcelId);

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

/* =========================================================
   GET /api/documents/parcel/:parcelId/type/:documentType
   Get documents for a specific parcel filtered by document type.
   ========================================================= */
router.get("/parcel/:parcelId/type/:documentType", (req, res) => {
    try {
        const { parcelId, documentType } = req.params;

        if (!parcelId || typeof parcelId !== "string" || parcelId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Invalid parcel ID provided."
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

        const profile = getLandProfile(normalizedParcelId);
        if (!profile) {
            return res.status(404).json({
                success: false,
                parcelId: normalizedParcelId,
                documentType: normalizedType,
                message: `Parcel '${normalizedParcelId}' not found.`,
                count: 0,
                documents: []
            });
        }

        const docs = getDocumentsByType(normalizedParcelId, normalizedType);

        return res.json({
            success: true,
            parcelId: normalizedParcelId,
            documentType: normalizedType,
            count: docs.length,
            documents: docs
        });
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents/parcel/:parcelId/type/:documentType:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching documents by type."
        });
    }
});

/* =========================================================
   GET /api/documents/:documentId/file
   Safely stream/download stored document file.
   ========================================================= */
router.get("/:documentId/file", (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId || typeof documentId !== "string" || documentId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID provided."
            });
        }

        const normalizedDocId = documentId.trim().toUpperCase();
        const doc = getDocumentById(normalizedDocId);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: `Document '${normalizedDocId}' not found.`
            });
        }

        if (!doc.fileName) {
            return res.status(404).json({
                success: false,
                message: `No file attached to document '${normalizedDocId}'.`
            });
        }

        const filePath = resolveStoredFilePath(doc.fileName);
        if (!filePath) {
            return res.status(404).json({
                success: false,
                message: `Stored file for document '${normalizedDocId}' was not found on server.`
            });
        }

        if (doc.fileType) {
            res.setHeader("Content-Type", doc.fileType);
        }

        return res.sendFile(filePath);
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents/:documentId/file:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error streaming document file."
        });
    }
});

/* =========================================================
   GET /api/documents/:documentId
   Get document details by document ID.
   ========================================================= */
router.get("/:documentId", (req, res) => {
    try {
        const { documentId } = req.params;

        if (!documentId || typeof documentId !== "string" || documentId.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Invalid document ID provided."
            });
        }

        const normalizedDocId = documentId.trim().toUpperCase();
        const doc = getDocumentById(normalizedDocId);

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: `Document '${normalizedDocId}' not found.`
            });
        }

        return res.json({
            success: true,
            document: doc
        });
    } catch (error) {
        console.error("[Document API] Error in GET /api/documents/:documentId:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error fetching document details."
        });
    }
});

module.exports = router;
