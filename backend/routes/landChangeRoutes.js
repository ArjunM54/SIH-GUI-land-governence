/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   LAND CHANGE VERIFICATION API ROUTES

   Endpoints for uploading historical/current imagery,
   running visual change analysis, recording verification decisions,
   and retrieving parcel temporal change history.
   ========================================================= */

const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

const { requireAuth } = require("../middleware/authMiddleware");
const { canAccessParcel } = require("../services/parcelAccessService");
const auditService = require("../services/auditService");
const parcels = require("../data/parcels");
const landChangeStore = require("../data/landChange");

/* Ensure uploads directory exists */
const uploadsDir = path.join(__dirname, "../uploads/land-change");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

/* Multer Storage Config */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `img-${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

/* Multer File Filter & Limits */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPG, JPEG, PNG, and WEBP images are supported."));
        }
    }
});

/* All routes require authentication */
router.use(requireAuth);

/* =========================================================
   1. GET /api/land-change/:parcelId
   Get land change records & verifications for a parcel
   ========================================================= */
router.get("/:parcelId", (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view land change records for this parcel."
            });
        }

        const parcel = parcels.find(p => p.id.toUpperCase() === targetParcelId);
        if (!parcel) {
            return res.status(404).json({
                success: false,
                error: "NOT_FOUND",
                message: `Parcel ${targetParcelId} not found.`
            });
        }

        const records = landChangeStore.getChangeRecordsByParcel(targetParcelId);

        auditService.logEvent({
            actor: req.user.officerId || req.user.email || req.user.uid || "USER",
            target: targetParcelId,
            action: "LAND_CHANGE_VIEWED",
            result: "SUCCESS",
            details: {
                role: req.user.role,
                recordCount: records.length
            }
        });

        res.json({
            success: true,
            parcelId: targetParcelId,
            records: records,
            count: records.length
        });
    } catch (e) {
        console.error("[LandChange GET Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   2. POST /api/land-change/upload
   Upload Old & New Land Imagery
   ========================================================= */
router.post("/upload", (req, res) => {
    const uploadFields = upload.fields([
        { name: "oldImage", maxCount: 1 },
        { name: "newImage", maxCount: 1 }
    ]);

    uploadFields(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                error: "UPLOAD_ERROR",
                message: err.message || "Error uploading images."
            });
        }

        try {
            const { parcelId, oldDate, oldSource, oldDesc, newDate, newSource, newDesc } = req.body;
            const targetParcelId = String(parcelId || "").trim().toUpperCase();

            if (!targetParcelId) {
                return res.status(400).json({
                    success: false,
                    error: "BAD_REQUEST",
                    message: "parcelId is required."
                });
            }

            if (!canAccessParcel(req.user, targetParcelId)) {
                return res.status(403).json({
                    success: false,
                    error: "FORBIDDEN",
                    message: "You do not have permission to upload imagery for this parcel."
                });
            }

            // Citizens cannot upload official verification imagery unless authorized
            if (req.user.role === "citizen") {
                return res.status(403).json({
                    success: false,
                    error: "FORBIDDEN",
                    message: "Only authorized officers can submit land change imagery."
                });
            }

            const oldFile = req.files && req.files.oldImage ? req.files.oldImage[0] : null;
            const newFile = req.files && req.files.newImage ? req.files.newImage[0] : null;

            const oldImageData = oldFile ? {
                filename: oldFile.filename,
                originalName: oldFile.originalname,
                url: `/uploads/land-change/${oldFile.filename}`,
                size: oldFile.size,
                date: oldDate || new Date().toISOString().split("T")[0],
                source: oldSource || "Satellite",
                description: oldDesc || ""
            } : null;

            const newImageData = newFile ? {
                filename: newFile.filename,
                originalName: newFile.originalname,
                url: `/uploads/land-change/${newFile.filename}`,
                size: newFile.size,
                date: newDate || new Date().toISOString().split("T")[0],
                source: newSource || "Drone",
                description: newDesc || ""
            } : null;

            const recordId = `LCV-${targetParcelId}-${Date.now()}`;
            const parcelObj = parcels.find(p => p.id.toUpperCase() === targetParcelId);

            const savedRecord = landChangeStore.saveChangeRecord({
                verificationId: recordId,
                parcelId: targetParcelId,
                surveyNumber: parcelObj ? parcelObj.surveyNumber : "N/A",
                oldImage: oldImageData,
                newImage: newImageData,
                analysis: null,
                verification: {
                    status: "PENDING",
                    remarks: "Images uploaded. Pending change analysis.",
                    updatedAt: new Date().toISOString()
                }
            });

            auditService.logEvent({
                actor: req.user.officerId || req.user.email || req.user.uid,
                target: targetParcelId,
                action: "LAND_IMAGE_UPLOADED",
                result: "SUCCESS",
                details: {
                    verificationId: savedRecord.verificationId,
                    hasOldImage: !!oldFile,
                    hasNewImage: !!newFile,
                    role: req.user.role,
                    officerId: req.user.officerId || null
                }
            });

            res.status(201).json({
                success: true,
                message: "Land imagery uploaded successfully.",
                data: savedRecord
            });
        } catch (e) {
            console.error("[LandChange Upload Error]:", e);
            res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
        }
    });
});

/* =========================================================
   3. POST /api/land-change/analyze
   Record visual change analysis metrics
   ========================================================= */
router.post("/analyze", (req, res) => {
    try {
        const { verificationId, parcelId, changePercentage, changedAreaSqFt, confidence, possibleChanges, previousLandCondition, currentLandCondition } = req.body;
        const targetParcelId = String(parcelId || "").trim().toUpperCase();

        if (!targetParcelId) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "parcelId is required."
            });
        }

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to analyze changes for this parcel."
            });
        }

        auditService.logEvent({
            actor: req.user.officerId || req.user.email || req.user.uid,
            target: targetParcelId,
            action: "LAND_CHANGE_ANALYSIS_STARTED",
            result: "SUCCESS",
            details: { verificationId, role: req.user.role }
        });

        const records = landChangeStore.getChangeRecordsByParcel(targetParcelId);
        let record = verificationId ? landChangeStore.getChangeRecordById(verificationId) : records[0];

        const pct = parseFloat(changePercentage) || 0;
        const hasChange = pct > 2.0;

        const analysisData = {
            status: hasChange ? "CHANGE_DETECTED" : "NO_SIGNIFICANT_CHANGE",
            analysisType: "Visual Change Detection",
            changePercentage: Math.round(pct * 10) / 10,
            changedAreaSqFt: parseFloat(changedAreaSqFt) || Math.round(pct * 50),
            confidence: confidence || (pct > 15 ? "HIGH" : (pct > 5 ? "MEDIUM" : "LOW")),
            possibleChanges: Array.isArray(possibleChanges) ? possibleChanges : [
                hasChange ? "Structure/building-like change" : "No major visual change"
            ],
            previousLandCondition: previousLandCondition || "Agricultural / Recorded Classification",
            currentLandCondition: currentLandCondition || (hasChange ? "Visual surface modification detected" : "No major visual modification"),
            detectedAt: new Date().toISOString()
        };

        if (record) {
            record.analysis = analysisData;
            landChangeStore.saveChangeRecord(record);
        } else {
            record = landChangeStore.saveChangeRecord({
                verificationId: verificationId || `LCV-${targetParcelId}-${Date.now()}`,
                parcelId: targetParcelId,
                surveyNumber: "SUR-103",
                analysis: analysisData,
                verification: { status: "PENDING", remarks: "Visual change analysis recorded." }
            });
        }

        auditService.logEvent({
            actor: req.user.officerId || req.user.email || req.user.uid,
            target: targetParcelId,
            action: "LAND_CHANGE_ANALYSIS_COMPLETED",
            result: "SUCCESS",
            details: {
                verificationId: record.verificationId,
                status: analysisData.status,
                changePercentage: analysisData.changePercentage,
                role: req.user.role
            }
        });

        res.json({
            success: true,
            message: "Visual change analysis saved successfully.",
            data: record
        });
    } catch (e) {
        console.error("[LandChange Analyze Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   4. POST /api/land-change/:parcelId/verify
   Submit Officer Verification Decision
   ========================================================= */
router.post("/:parcelId/verify", (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (req.user.role === "citizen") {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "Citizens are not authorized to submit official officer verifications."
            });
        }

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to verify land changes for this parcel."
            });
        }

        const { verificationStatus, remarks, evidenceDocId, followUpRequired, surveyNumber } = req.body;

        if (!verificationStatus) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: "verificationStatus is required."
            });
        }

        const validStatuses = ["PENDING", "VERIFIED", "FLAGGED", "FIELD_INSPECTION_REQUIRED", "REJECTED"];
        if (!validStatuses.includes(verificationStatus.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: "BAD_REQUEST",
                message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
            });
        }

        const updatedRecord = landChangeStore.updateOfficerVerification(targetParcelId, {
            verificationStatus: verificationStatus.toUpperCase(),
            officerId: req.user.officerId || req.user.uid || "OFF-001",
            officerName: req.user.name || "Authorized Officer",
            department: req.user.department || "Land Governance Department",
            remarks: remarks || "",
            evidenceDocId: evidenceDocId || null,
            followUpRequired: followUpRequired === true || followUpRequired === "true" || followUpRequired === "yes",
            surveyNumber: surveyNumber
        });

        auditService.logEvent({
            actor: req.user.officerId || req.user.email || req.user.uid,
            target: targetParcelId,
            action: "LAND_CHANGE_VERIFICATION_SUBMITTED",
            result: "SUCCESS",
            details: {
                verificationId: updatedRecord.verificationId,
                status: updatedRecord.verification.status,
                officerId: updatedRecord.verification.officerId,
                department: updatedRecord.verification.department,
                remarks: updatedRecord.verification.remarks
            }
        });

        res.json({
            success: true,
            message: "Officer land change verification submitted successfully.",
            data: updatedRecord
        });
    } catch (e) {
        console.error("[LandChange Verify Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

/* =========================================================
   5. GET /api/land-change/:parcelId/history
   Get temporal land change history timeline
   ========================================================= */
router.get("/:parcelId/history", (req, res) => {
    try {
        const { parcelId } = req.params;
        const targetParcelId = String(parcelId).trim().toUpperCase();

        if (!canAccessParcel(req.user, targetParcelId)) {
            return res.status(403).json({
                success: false,
                error: "FORBIDDEN",
                message: "You do not have permission to view change history for this parcel."
            });
        }

        const records = landChangeStore.getChangeRecordsByParcel(targetParcelId);

        const timelineEvents = records.map(r => ({
            id: r.verificationId,
            date: r.updatedAt ? r.updatedAt.split("T")[0] : r.createdAt.split("T")[0],
            timestamp: r.updatedAt || r.createdAt,
            title: r.verification?.status === "VERIFIED"
                ? "Officer Land Change Verified"
                : (r.verification?.status === "FIELD_INSPECTION_REQUIRED"
                    ? "Field Inspection Flagged for Land Change"
                    : "Temporal Land Imagery Change Detected"),
            department: r.verification?.department || "Land Governance Unit",
            officer: r.verification?.officerName || "System / Satellite Unit",
            status: r.verification?.status || "PENDING",
            changePercentage: r.analysis?.changePercentage || 0,
            details: `Old Image: ${r.oldImage?.date || 'N/A'} | New Image: ${r.newImage?.date || 'N/A'} | Remarks: ${r.verification?.remarks || 'N/A'}`
        }));

        res.json({
            success: true,
            parcelId: targetParcelId,
            history: timelineEvents
        });
    } catch (e) {
        console.error("[LandChange History Error]:", e);
        res.status(500).json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
});

module.exports = router;
