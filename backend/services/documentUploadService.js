/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   DOCUMENT UPLOAD SERVICE
   Handles file validation, secure local storage, basic PDF text
   extraction, and document metadata creation.
   ========================================================= */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");

const { getLandProfile } = require("../data/landProfile");
const {
    addDocumentRecord,
    generateDocumentId,
    VALID_DOCUMENT_TYPES
} = require("./documentService");

const UPLOADS_DIR = path.resolve(__dirname, "../uploads");
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png"
];

// Dangerous extensions to reject explicitly
const DISALLOWED_EXTENSIONS = [
    ".exe", ".bat", ".cmd", ".sh", ".js", ".vbs", ".msi", ".jar", ".com", ".scr", ".php"
];

/**
 * Ensures the uploads directory exists on disk.
 */
function ensureUploadsDirectory() {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
}

/**
 * Processes a document upload request.
 *
 * @param {Object} metadata - { parcelId, documentType, documentNumber, title, issuingDepartment, issueDate, description }
 * @param {Object} fileObject - Express/Multer file object { buffer, originalname, mimetype, size }
 * @returns {Promise<Object>} Process result object
 */
async function processDocumentUpload(metadata = {}, fileObject = null) {
    ensureUploadsDirectory();

    const parcelId = (metadata.parcelId || "").trim().toUpperCase();
    if (!parcelId) {
        return {
            success: false,
            statusCode: 400,
            error: "Missing required 'parcelId' field."
        };
    }

    // Validate Parcel Existence
    const parcelProfile = getLandProfile(parcelId);
    if (!parcelProfile) {
        return {
            success: false,
            statusCode: 404,
            error: `Parcel '${parcelId}' not found.`
        };
    }

    // Validate File Presence
    if (!fileObject || (!fileObject.buffer && !fileObject.path)) {
        return {
            success: false,
            statusCode: 400,
            error: "No file provided for document upload."
        };
    }

    const fileSize = fileObject.size || (fileObject.buffer ? fileObject.buffer.length : 0);
    if (fileSize > MAX_FILE_SIZE_BYTES) {
        return {
            success: false,
            statusCode: 400,
            error: "File size exceeds the 10 MB limit."
        };
    }

    const mimeType = (fileObject.mimetype || "").toLowerCase();
    const originalExt = path.extname(fileObject.originalname || "").toLowerCase();

    if (DISALLOWED_EXTENSIONS.includes(originalExt)) {
        return {
            success: false,
            statusCode: 400,
            error: `Executable file extensions (${originalExt}) are strictly prohibited.`
        };
    }

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        return {
            success: false,
            statusCode: 400,
            error: `Unsupported file type '${mimeType}'. Allowed formats: PDF, JPEG, PNG.`
        };
    }

    // Generate Safe Document ID & Server-side Filename
    const documentId = generateDocumentId();
    const safeExt = originalExt || (mimeType === "application/pdf" ? ".pdf" : ".png");
    const serverFileName = `${documentId}${safeExt}`;
    const targetFilePath = path.join(UPLOADS_DIR, serverFileName);

    // Save File to local backend/uploads/
    let fileBuffer = fileObject.buffer;
    if (fileBuffer && !Buffer.isBuffer(fileBuffer)) {
        fileBuffer = Buffer.from(fileBuffer);
    } else if (!fileBuffer && fileObject.path) {
        fileBuffer = fs.readFileSync(fileObject.path);
    }

    fs.writeFileSync(targetFilePath, fileBuffer);

    // Extract PDF text if format is PDF
    let textExtraction = {
        status: "UNAVAILABLE",
        characterCount: 0,
        preview: null
    };

    if (mimeType === "application/pdf") {
        try {
            const diskBuffer = fs.readFileSync(targetFilePath);
            const parsed = await pdfParse(diskBuffer);
            const extractedText = (parsed.text || "").trim();
            const cleanText = extractedText.replace(/\s+/g, " ");

            if (cleanText.length > 0) {
                const previewSnippet = cleanText.length > 300
                    ? cleanText.substring(0, 300) + "..."
                    : cleanText;

                textExtraction = {
                    status: "SUCCESS",
                    characterCount: cleanText.length,
                    preview: previewSnippet
                };
            } else {
                textExtraction = {
                    status: "FAILED",
                    characterCount: 0,
                    preview: null
                };
            }
        } catch (pdfErr) {
            console.error(`[Document Upload Service] PDF text extraction failed for ${documentId}:`, pdfErr.message);
            textExtraction = {
                status: "FAILED",
                characterCount: 0,
                preview: null
            };
        }
    }

    // Build Document Record
    const rawDocType = (metadata.documentType || "OTHER").trim().toUpperCase();
    const documentType = VALID_DOCUMENT_TYPES.includes(rawDocType) ? rawDocType : "OTHER";

    const newDocumentRecord = addDocumentRecord({
        documentId,
        parcelId,
        documentType,
        documentNumber: metadata.documentNumber || `DOC-NUM-${Date.now()}`,
        title: metadata.title || "Uploaded Land Document",
        issuingDepartment: metadata.issuingDepartment || "Submitted Authority",
        issueDate: metadata.issueDate || new Date().toISOString().split("T")[0],
        status: "AVAILABLE",
        fileName: serverFileName,
        fileType: mimeType,
        fileSize,
        storageStatus: "STORED",
        textExtraction,
        description: metadata.description || "User uploaded evidence document record.",
        createdAt: new Date().toISOString()
    });

    return {
        success: true,
        statusCode: 201,
        message: "Document uploaded and processed successfully.",
        document: newDocumentRecord
    };
}

/**
 * Resolves a stored document file safely to prevent path traversal attacks.
 *
 * @param {string} serverFileName
 * @returns {string|null} Resolved file path or null if invalid/not found
 */
function resolveStoredFilePath(serverFileName) {
    if (!serverFileName || typeof serverFileName !== "string") return null;

    // Prevent path traversal by extracting base filename
    const safeBaseName = path.basename(serverFileName);
    const fullPath = path.join(UPLOADS_DIR, safeBaseName);

    // Verify file stays within UPLOADS_DIR
    if (!fullPath.startsWith(UPLOADS_DIR)) return null;

    if (fs.existsSync(fullPath)) {
        return fullPath;
    }

    return null;
}

module.exports = {
    processDocumentUpload,
    resolveStoredFilePath,
    UPLOADS_DIR
};
