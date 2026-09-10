/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   LAND CHANGE VERIFICATION DATA STORE

   Stores land change verification records, image uploads metadata,
   pixel difference metrics, visual change detection results,
   and officer verification submissions.
   ========================================================= */

const fs = require("fs");
const path = require("path");

// Initial sample data for demonstration (e.g., LND-003)
const landChangeRecords = [
    {
        verificationId: "LCV-LND-003-001",
        parcelId: "LND-003",
        surveyNumber: "SUR-103",
        oldImage: {
            filename: "old_lnd003_2023.jpg",
            url: "/uploads/land-change/sample_old_lnd003.jpg",
            date: "2023-04-15",
            source: "SATELLITE",
            description: "Historical agricultural satellite imagery (Sentinel-2)"
        },
        newImage: {
            filename: "new_lnd003_2026.jpg",
            url: "/uploads/land-change/sample_new_lnd003.jpg",
            date: "2026-08-20",
            source: "DRONE",
            description: "Recent high-resolution drone survey"
        },
        analysis: {
            status: "CHANGE_DETECTED",
            analysisType: "Visual Change Detection",
            changePercentage: 18.4,
            changedAreaSqFt: 960,
            confidence: "HIGH",
            possibleChanges: [
                "Structure/building-like change",
                "Land surface modified",
                "Vegetation cover reduced"
            ],
            previousLandCondition: "Agricultural / Vacant Land",
            currentLandCondition: "New unverified structure detected in central section",
            detectedAt: "2026-08-22T10:30:00Z"
        },
        verification: {
            status: "FIELD_INSPECTION_REQUIRED",
            officerId: "OFF-LU-001",
            officerName: "Ravi Planner",
            department: "Land Use & Planning Department",
            remarks: "Visual difference indicates possible construction on agricultural land without recorded building permit.",
            evidenceDocId: "DOC-EVID-003",
            followUpRequired: true,
            updatedAt: "2026-08-23T14:15:00Z"
        },
        createdAt: "2026-08-22T10:30:00Z"
    }
];

/**
 * Get all land change records for a parcel
 */
function getChangeRecordsByParcel(parcelId) {
    if (!parcelId) return [];
    const target = String(parcelId).trim().toUpperCase();
    return landChangeRecords.filter(r => String(r.parcelId).toUpperCase() === target);
}

/**
 * Get single verification record by ID
 */
function getChangeRecordById(verificationId) {
    if (!verificationId) return null;
    return landChangeRecords.find(r => r.verificationId === verificationId) || null;
}

/**
 * Save new or update existing land change record
 */
function saveChangeRecord(record) {
    const existingIndex = landChangeRecords.findIndex(r => r.verificationId === record.verificationId);
    if (existingIndex >= 0) {
        landChangeRecords[existingIndex] = {
            ...landChangeRecords[existingIndex],
            ...record,
            updatedAt: new Date().toISOString()
        };
        return landChangeRecords[existingIndex];
    } else {
        const newRecord = {
            verificationId: record.verificationId || `LCV-${record.parcelId}-${Date.now().toString().slice(-4)}`,
            ...record,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        landChangeRecords.unshift(newRecord);
        return newRecord;
    }
}

/**
 * Update verification submission for a record
 */
function updateOfficerVerification(parcelId, verificationData) {
    const records = getChangeRecordsByParcel(parcelId);
    let targetRecord = records[0];

    if (!targetRecord) {
        // Create base record if none exists
        targetRecord = saveChangeRecord({
            parcelId: String(parcelId).toUpperCase(),
            surveyNumber: verificationData.surveyNumber || "SUR-103",
            oldImage: verificationData.oldImage || null,
            newImage: verificationData.newImage || null,
            analysis: verificationData.analysis || {
                status: "CHANGE_DETECTED",
                analysisType: "Visual Change Detection",
                changePercentage: verificationData.changePercentage || 12.5,
                confidence: "MEDIUM",
                possibleChanges: ["Officer flagged land change"],
                previousLandCondition: "Recorded classification",
                currentLandCondition: "Officer verified condition"
            }
        });
    }

    targetRecord.verification = {
        status: verificationData.verificationStatus || "VERIFIED",
        officerId: verificationData.officerId || "OFFICER",
        officerName: verificationData.officerName || "Officer",
        department: verificationData.department || "Land Governance Department",
        remarks: verificationData.remarks || "",
        evidenceDocId: verificationData.evidenceDocId || null,
        followUpRequired: verificationData.followUpRequired === true || verificationData.followUpRequired === "yes",
        updatedAt: new Date().toISOString()
    };

    targetRecord.updatedAt = new Date().toISOString();
    return targetRecord;
}

module.exports = {
    landChangeRecords,
    getChangeRecordsByParcel,
    getChangeRecordById,
    saveChangeRecord,
    updateOfficerVerification
};
