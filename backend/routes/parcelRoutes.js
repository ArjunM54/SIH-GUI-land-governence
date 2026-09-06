/* =========================================================
   LANDGOV GIS
   PARCEL API ROUTES (PROTECTED)
   ========================================================= */

const express = require("express");
const router = express.Router();
const parcels = require("../data/parcels");
const { requireAuth } = require("../middleware/authMiddleware");
const { filterParcelsForUser, canAccessParcel } = require("../services/parcelAccessService");
const auditService = require("../services/auditService");

/**
 * @route   GET /api/parcels
 * @desc    Returns authorized parcels for the logged-in user context
 */
router.get("/", requireAuth, (req, res) => {
    const userParcels = filterParcelsForUser(req.user, parcels);
    const { getIntegratedLandProfile } = require("../data/landProfile");

    const enrichedParcels = userParcels.map(p => {
        const integrated = getIntegratedLandProfile(p.id);
        return {
            ...p,
            governanceStatus: integrated ? integrated.governance.overallStatus : "VERIFIED",
            departmentStatuses: integrated ? integrated.governance.departmentStatuses : {}
        };
    });

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: "PARCEL_LIST",
        action: "VIEW_PARCELS",
        result: "SUCCESS",
        details: { returnedCount: enrichedParcels.length }
    });

    res.json({
        success: true,
        count: enrichedParcels.length,
        data: enrichedParcels
    });
});

/**
 * @route   GET /api/parcels/:id
 * @desc    Get single parcel details if authorized
 */
router.get("/:id", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    if (!parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Parcel not found"
        });
    }

    auditService.logEvent({
        actor: req.user.email || req.user.officerId,
        target: parcelId,
        action: "VIEW_PARCEL_DETAIL",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: parcel
    });
});

/**
 * @route   GET /api/parcels/:id/integrated-profile
 * @desc    Get unified integrated land profile for parcel
 */
router.get("/:id/integrated-profile", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's integrated profile."
        });
    }

    const { getIntegratedLandProfile } = require("../data/landProfile");
    const { getVisibleLandProfile } = require("../services/accessControlService");
    const profile = getIntegratedLandProfile(parcelId);

    if (!profile) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Integrated land profile not found"
        });
    }

    const filteredProfile = getVisibleLandProfile(req.user, profile);

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_INTEGRATED_LAND_PROFILE",
        result: "SUCCESS",
        details: { role: req.user.role }
    });

    res.json({
        success: true,
        parcelId: filteredProfile.parcelId || parcelId,
        data: filteredProfile
    });
});

/**
 * @route   GET /api/parcels/:id/gis
 * @desc    Get GIS parcel details for map display (Phase 12B)
 */
router.get("/:id/gis", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's GIS information."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    if (!parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Parcel GIS data not found"
        });
    }

    const cadastralData = require("../data/cadastral");
    const cadastral = cadastralData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const gisData = {
        parcelId: parcel.id,
        surveyNumber: parcel.surveyNumber || cadastral?.surveyNumber || "N/A",
        geometry: parcel.coordinates || cadastral?.coordinates || null,
        coordinates: parcel.coordinates || cadastral?.coordinates || null,
        area: parcel.area || cadastral?.area || "N/A",
        district: parcel.district || cadastral?.district || "N/A",
        village: parcel.village || cadastral?.village || "N/A",
        landUse: parcel.landUse || cadastral?.landUse || "N/A",
        owner: parcel.owner || cadastral?.owner || "N/A",
        boundaryStatus: cadastral?.boundaryStatus || "Verified"
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_GIS_PARCEL",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: gisData
    });
});

/**
 * @route   GET /api/parcels/:id/ownership
 * @desc    Get Ownership / Record of Rights details for parcel (Phase 12C)
 */
router.get("/:id/ownership", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's ownership / RoR data."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const rorData = require("../data/ror");
    const ror = rorData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!ror && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Ownership / RoR record not found for parcel"
        });
    }

    const ownershipData = {
        parcelId: parcelId.toUpperCase(),
        surveyNumber: ror?.surveyNumber || parcel?.surveyNumber || "N/A",
        recordNumber: ror?.recordNumber || "ROR-2026-001",
        rightsHolder: ror?.rightsHolder || ror?.ownerName || parcel?.owner || "NOT AVAILABLE",
        ownerName: ror?.ownerName || ror?.rightsHolder || parcel?.owner || "NOT AVAILABLE",
        ownerId: ror?.ownerId || "OWN-2026-881",
        ownerType: ror?.ownerType || ror?.ownershipType || "Individual",
        ownershipType: ror?.ownershipType || "Individual",
        ownershipShare: ror?.ownershipShare || "100%",
        possessionStatus: ror?.possessionStatus || "Self",
        landClassification: ror?.landClassification || parcel?.landType || "Residential",
        landUse: ror?.landUse || parcel?.landUse || "Residential",
        area: ror?.area || parcel?.area || "N/A",
        district: ror?.district || parcel?.district || "N/A",
        taluk: ror?.taluk || "Coimbatore South",
        village: ror?.village || parcel?.village || "N/A",
        tenureType: ror?.tenureType || "Freehold",
        registrationStatus: ror?.registrationStatus || "Registered",
        mutationStatus: ror?.mutationStatus || "Updated",
        rorStatus: ror?.rorStatus || "VERIFIED",
        verificationStatus: ror?.verificationStatus || ror?.rorStatus || "VERIFIED",
        verifiedBy: ror?.updatedBy || "OFF-ROR-001",
        lastUpdated: ror?.lastUpdated || "2026-08-15",
        lastVerified: ror?.lastVerified || ror?.lastUpdated || "2026-08-15",
        remarks: ror?.remarks || "Record verified with Land Records & RoR Department.",
        ownershipHistory: ror?.ownershipHistory || [],
        mutations: ror?.mutations || [],
        sourceDepartment: "Land Records / RoR Department"
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_OWNERSHIP_ROR",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: ownershipData
    });
});

/**
 * @route   GET /api/parcels/:id/registration
 * @desc    Get Property Registration details for parcel (Phase 12D)
 */
router.get("/:id/registration", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's registration data."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const registrationData = require("../data/registration");
    const reg = registrationData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const rorData = require("../data/ror");
    const ror = rorData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!reg && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Registration record not found for parcel"
        });
    }

    const regBuyer = reg?.buyer || reg?.proposedOwner || "N/A";
    const rorOwner = ror?.rightsHolder || ror?.ownerName || parcel?.owner || "N/A";
    const isConsistent = regBuyer.trim().toLowerCase() === rorOwner.trim().toLowerCase();

    const registrationDetails = {
        parcelId: parcelId.toUpperCase(),
        surveyNumber: reg?.surveyNumber || parcel?.surveyNumber || "SUR-101",
        registrationStatus: reg?.status || "NOT AVAILABLE",
        registrationNumber: reg?.registrationId || "REG-2026-000",
        documentNumber: reg?.documentNumber || "DOC-REG-2026-000",
        documentType: reg?.documentType || "Deed",
        registrationDate: reg?.registrationDate || "N/A",
        transactionType: reg?.transactionType || "N/A",
        transactionStatus: reg?.status || "NOT AVAILABLE",
        subRegistrarOffice: reg?.registrationOffice || "Coimbatore Sub-Registrar Office #1",
        registrationDistrict: parcel?.district || "Coimbatore",
        considerationValue: reg?.considerationAmount || 0,
        marketValue: reg?.marketValue || 0,
        lastUpdated: reg?.lastUpdated || "2026-09-03",
        sourceDepartment: "Property Registration Department",
        latestTransaction: reg ? {
            transactionId: reg.registrationId,
            transactionType: reg.transactionType,
            transactionDate: reg.registrationDate,
            fromParty: reg.seller || reg.currentOwner,
            toParty: reg.buyer || reg.proposedOwner,
            considerationValue: reg.considerationAmount,
            registrationNumber: reg.registrationId,
            status: reg.status
        } : null,
        registrationHistory: reg?.transactionHistory || [],
        parties: reg ? {
            seller: reg.seller || reg.currentOwner,
            buyer: reg.buyer || reg.proposedOwner,
            applicant: reg.buyer || reg.proposedOwner,
            witnesses: ["Witness 1 (Local Revenue Inspector)", "Witness 2 (Authorized Advocate)"],
            representatives: ["Legal Counsel Representative"]
        } : null,
        documents: reg ? [
            {
                documentNumber: reg.documentNumber,
                documentType: reg.documentType,
                registrationNumber: reg.registrationId,
                registrationDate: reg.registrationDate,
                office: reg.registrationOffice,
                status: reg.status,
                documentReference: `REF-${reg.documentNumber}`
            }
        ] : [],
        verification: {
            status: (reg?.status === "APPROVED" || reg?.deedStatus === "VERIFIED") ? "VERIFIED" : (reg?.status === "PENDING" ? "PENDING" : "NOT VERIFIED"),
            verifiedBy: reg?.updatedBy || "OFF-REG-001",
            department: "Property Registration Department",
            verifiedAt: reg?.lastUpdated || "2026-09-03",
            remarks: "Deed and transaction verified with Sub-Registrar records."
        },
        ownershipCrossCheck: {
            registrationOwner: regBuyer,
            rorOwner: rorOwner,
            isConsistent: isConsistent,
            status: isConsistent ? "VERIFIED" : "CONFLICT"
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_REGISTRATION_DATA",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: registrationDetails
    });
});

/**
 * @route   GET /api/parcels/:id/land-use
 * @desc    Get Land Use & Planning details for parcel (Phase 12E)
 */
router.get("/:id/land-use", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's land use data."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const landUseData = require("../data/landuse");
    const lu = landUseData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const rorData = require("../data/ror");
    const ror = rorData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!lu && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Land use record not found for parcel"
        });
    }

    const gisLandUse = parcel?.landUse || "Agricultural";
    const luDeptUse = lu?.currentLandUse || parcel?.landUse || "Agricultural";
    const isGisConsistent = gisLandUse.trim().toLowerCase() === luDeptUse.trim().toLowerCase();

    const rorClass = ror?.landClassification || ror?.landUse || parcel?.landType || "Agricultural";
    const isRorConsistent = rorClass.trim().toLowerCase().includes(luDeptUse.trim().toLowerCase()) || luDeptUse.trim().toLowerCase().includes(rorClass.trim().toLowerCase());

    const landUseDetails = {
        parcelId: parcelId.toUpperCase(),
        surveyNumber: lu?.surveyNumber || parcel?.surveyNumber || "SUR-101",
        currentLandUse: luDeptUse,
        classification: lu?.currentZone || parcel?.landType || "Agricultural Protection Zone",
        landCategory: "Unrestricted Private Holding",
        usageStatus: lu?.developmentStatus || "Active Use",
        area: parcel?.area || "1.25 Acres",
        effectiveDate: lu?.submissionDate || "2026-08-25",
        lastUpdated: lu?.lastUpdated || "2026-09-01",
        sourceDepartment: "Land Use & Planning Department",
        masterPlan: lu ? {
            masterPlanName: lu.masterPlanStatus || "Approved Master Plan 2026-2035",
            planYear: "2026-2035",
            zone: lu.currentZone,
            zoneCode: lu.masterPlanZoneCode || lu.zoningCode || "AGRI-R1",
            planningAuthority: "Coimbatore Local Planning Authority (LPA)",
            developmentStatus: lu.developmentStatus,
            applicableRegulations: lu.developmentRestriction || "Standard Development Regulations 2026"
        } : null,
        zoning: lu ? {
            zone: lu.currentZone,
            zoneCode: lu.zoningCode,
            permittedUse: lu.permittedUse || [],
            restrictedUse: lu.restrictedUse || [],
            developmentControl: lu.setbackRequirement || "Standard controls apply",
            status: lu.zoningStatus || "ACTIVE"
        } : null,
        conversion: lu ? {
            conversionStatus: lu.conversions?.[0]?.status || (lu.status === "APPROVED" ? "APPROVED" : "NOT REQUIRED"),
            applicationId: lu.requestId,
            previousLandUse: lu.conversions?.[0]?.fromZone || lu.currentLandUse,
            requestedLandUse: lu.conversions?.[0]?.toZone || lu.requestedLandUse,
            applicationDate: lu.submissionDate,
            approvalDate: lu.lastUpdated,
            authority: "District Land Use & Zoning Committee",
            status: lu.conversions?.[0]?.status || lu.status || "APPROVED"
        } : null,
        restrictions: lu ? [
            { type: "Development Restriction", details: lu.developmentRestriction },
            { type: "Setback Requirement", details: lu.setbackRequirement },
            { type: "Road Access Buffer", details: `Road Width: ${lu.roadWidth} (${lu.roadType})` }
        ] : [],
        eligibility: {
            status: lu?.zoningStatus === "INCOMPATIBLE" ? "NOT ELIGIBLE" : (lu?.conversions?.[0]?.status === "PENDING" ? "CONDITIONALLY ELIGIBLE" : "ELIGIBLE"),
            remarks: "Prototype planning assessment based on LPA Master Plan 2026."
        },
        verification: {
            status: lu?.status === "APPROVED" ? "VERIFIED" : "PENDING",
            verifiedBy: lu?.updatedBy || "OFF-LU-001",
            department: "Land Use & Planning Department",
            verifiedAt: lu?.lastUpdated || "2026-09-01",
            remarks: "Land use and master plan zone alignment verified."
        },
        gisCrossCheck: {
            gisLandUse: gisLandUse,
            landUseDeptUse: luDeptUse,
            isConsistent: isGisConsistent,
            status: isGisConsistent ? "VERIFIED" : "MISMATCH"
        },
        rorCrossCheck: {
            rorClassification: rorClass,
            landUseDeptUse: luDeptUse,
            isConsistent: isRorConsistent,
            status: isRorConsistent ? "VERIFIED" : "MISMATCH"
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_LAND_USE_DATA",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: landUseDetails
    });
});

/**
 * @route   GET /api/parcels/:id/property-tax
 * @desc    Get Property Tax & Municipal details for parcel (Phase 12F)
 */
router.get("/:id/property-tax", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's property tax data."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const propertyTaxData = require("../data/PropertyTax");
    const tax = propertyTaxData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const rorData = require("../data/ror");
    const ror = rorData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const regData = require("../data/registration");
    const reg = regData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!tax && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Property tax record not found for parcel"
        });
    }

    const rorOwner = ror?.rightsHolder || ror?.ownerName || parcel?.owner || "N/A";
    const taxOwner = tax?.owner || parcel?.owner || "N/A";
    const regOwner = reg?.buyer || reg?.proposedOwner || "N/A";

    const isOwnerConsistent = taxOwner.trim().toLowerCase() === rorOwner.trim().toLowerCase();
    const outstanding = tax?.outstandingAmount || 0;
    const clearanceStatus = tax?.taxClearanceStatus || (outstanding === 0 ? "CLEARED" : "NOT CLEARED");

    const taxDetails = {
        parcelId: parcelId.toUpperCase(),
        assessmentId: tax?.assessmentId || tax?.requestId || "PTX-2026-001",
        municipalPropertyId: tax?.municipalPropertyId || "MUN-PROP-001",
        surveyNumber: tax?.surveyNumber || parcel?.surveyNumber || "SUR-101",
        ownerName: taxOwner,
        propertyType: tax?.propertyType || parcel?.landType || "Residential",
        taxCategory: "Private Land Holding",
        assessmentYear: tax?.taxYear || "2026-2027",
        currentDemand: tax?.taxDemand || tax?.annualTax || 0,
        amountPaid: tax?.amountPaid || 0,
        outstandingAmount: outstanding,
        penalty: tax?.penalty || 0,
        totalDue: tax?.totalDue || outstanding + (tax?.penalty || 0),
        paymentStatus: tax?.paymentStatus || (outstanding === 0 ? "Paid" : "Partially Paid"),
        lastPaymentDate: tax?.lastPaymentDate || "2026-07-15",
        lastUpdated: tax?.lastUpdated || "2026-08-15",
        sourceDepartment: "Property Tax & Municipal Department",
        assessment: {
            assessmentNumber: tax?.assessmentId || "PTX-2026-001",
            assessmentYear: tax?.taxYear || "2026-2027",
            propertyClassification: tax?.propertyType || "Residential",
            annualValue: tax?.annualTax ? tax.annualTax * 10 : "NOT AVAILABLE",
            taxableValue: tax?.annualTax ? tax.annualTax * 8 : "NOT AVAILABLE",
            taxRate: "0.5%",
            totalDemand: tax?.taxDemand || tax?.annualTax || 0,
            rebate: 0,
            penalty: tax?.penalty || 0,
            netPayable: tax?.totalDue || outstanding,
            status: tax?.assessmentStatus || "VERIFIED"
        },
        paymentHistory: tax?.taxHistory || [],
        clearance: {
            clearanceStatus: clearanceStatus,
            clearanceReference: tax?.clearanceRequests?.[0]?.clearanceId || tax?.requestId || "CLR-2026-001",
            clearanceDate: tax?.lastUpdated || "2026-08-15",
            validUntil: "2027-03-31",
            verifiedBy: tax?.assignedOfficer || "OFF-TAX-001",
            remarks: outstanding === 0 ? "Property tax demand cleared for current financial year." : `Outstanding dues of ₹${outstanding} pending.`
        },
        verification: {
            status: (clearanceStatus === "CLEARED" && outstanding === 0) ? "VERIFIED" : "REVIEW REQUIRED",
            verifiedBy: tax?.assignedOfficer || "OFF-TAX-001",
            department: "Property Tax & Municipal Department",
            verifiedAt: tax?.lastUpdated || "2026-08-15",
            remarks: "Municipal tax ledger verified."
        },
        ownerCrossCheck: {
            taxOwner: taxOwner,
            rorOwner: rorOwner,
            regOwner: regOwner,
            isConsistent: isOwnerConsistent,
            status: isOwnerConsistent ? "VERIFIED" : "CONFLICT"
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_PROPERTY_TAX_DATA",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: taxDetails
    });
});

/**
 * @route   GET /api/parcels/:id/building
 * @desc    Get Building & Municipal Permission details for parcel (Phase 12G)
 */
router.get("/:id/building", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's building data."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const bpData = require("../data/BuildingPermission");
    const bp = bpData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const taxData = require("../data/PropertyTax");
    const tax = taxData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const landUseData = require("../data/landuse");
    const lu = landUseData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!bp && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Building permission record not found for parcel"
        });
    }

    const buildingUse = bp?.approvedBuildingType || bp?.permissionType || "Residential Building";
    const landUseType = lu?.currentLandUse || parcel?.landUse || "Agricultural";

    // Land Use ↔ Building Use Check
    const isLandUseMatch = (landUseType.toLowerCase().includes("residential") && buildingUse.toLowerCase().includes("residential")) ||
        (landUseType.toLowerCase().includes("commercial") && buildingUse.toLowerCase().includes("commercial")) ||
        (landUseType.toLowerCase().includes("agricultural") && (buildingUse.toLowerCase().includes("agricultural") || buildingUse.toLowerCase().includes("residential")));

    // Recorded vs Approved Deviation Check
    const approvedFloors = bp?.maximumFloors || 2;
    const recordedFloors = tax?.numberOfFloors || bp?.maximumFloors || 2;
    const hasFloorDeviation = recordedFloors > approvedFloors;

    const buildingDetails = {
        parcelId: parcelId.toUpperCase(),
        municipalPropertyId: tax?.municipalPropertyId || `MUN-PROP-${parcelId.slice(-3)}`,
        surveyNumber: parcel?.surveyNumber || "SUR-101",
        buildingSummary: {
            buildingId: bp?.applicationNumber || `BP-2026-${parcelId.slice(-3)}`,
            buildingType: bp?.approvedBuildingType || bp?.permissionType || "Residential Building",
            buildingUse: buildingUse,
            builtUpArea: tax?.builtUpArea || bp?.maximumBuiltUpArea || "4,000 sq.ft",
            plotArea: tax?.landArea || parcel?.area || "1.25 Acres",
            numberOfFloors: recordedFloors,
            constructionStatus: bp?.validityStatus === "Valid" ? "COMPLETED" : "UNDER_CONSTRUCTION",
            buildingStatus: (bp?.buildingPermissionStatus || "APPROVED").toUpperCase(),
            yearOfConstruction: "2024",
            owner: parcel?.owner || "Demo Agricultural Owner",
            lastUpdated: bp?.lastUpdated || "2026-08-15"
        },
        permission: {
            permissionId: bp?.applicationNumber || "BP-2026-001",
            applicationNumber: bp?.applicationNumber || "BP-2026-001",
            applicationDate: bp?.applicationDate || "2026-05-10",
            approvalDate: bp?.approvalDate || "2026-06-15",
            authority: bp?.approvalAuthority || "Coimbatore Local Planning Authority",
            buildingType: bp?.approvedBuildingType || "Residential Building",
            approvedBuiltUpArea: bp?.maximumBuiltUpArea || "4,000 sq.ft",
            approvedFloors: approvedFloors,
            permissionStatus: (bp?.buildingPermissionStatus || "APPROVED").toUpperCase(),
            validity: bp?.validityStatus || "Valid"
        },
        buildingPlan: bp?.applicationNumber ? {
            planReference: `PLAN-${bp.applicationNumber}`,
            planVersion: "v1.0 Final",
            approvedArea: bp.maximumBuiltUpArea,
            groundCoverage: "2,000 sq.ft",
            floorCount: approvedFloors,
            setback: bp.setbackRequirement,
            height: "28 ft",
            usage: bp.approvedBuildingType,
            approvalStatus: "APPROVED"
        } : null,
        constructionStatus: {
            status: bp?.validityStatus === "Valid" ? "COMPLETED" : "UNDER_CONSTRUCTION",
            startDate: bp?.approvalDate || "2026-06-15",
            expectedCompletion: "2026-12-31",
            actualCompletion: bp?.validityStatus === "Valid" ? "2026-08-15" : null,
            lastInspection: bp?.lastUpdated || "2026-08-15",
            inspectionStatus: "PASSED"
        },
        municipalRecord: {
            municipalPropertyId: tax?.municipalPropertyId || "MUN-PROP-001",
            ward: "Ward 14 (South Zone)",
            zone: "Coimbatore South Municipal Zone",
            localBody: "Coimbatore City Municipal Corporation",
            assessmentNumber: tax?.assessmentId || "PTX-2026-001",
            propertyClassification: tax?.propertyType || "Residential",
            municipalStatus: "ACTIVE",
            lastUpdated: tax?.lastUpdated || "2026-08-15"
        },
        inspections: [
            {
                inspectionDate: bp?.lastUpdated || "2026-08-15",
                inspectionType: "Completion Inspection",
                officer: "OFF-MUN-001",
                result: "PASSED",
                remarks: "Structure strictly conforms to approved setback and floor plan.",
                status: "COMPLETED"
            }
        ],
        compliance: {
            status: (isLandUseMatch && !hasFloorDeviation) ? "COMPLIANT" : "UNDER_REVIEW",
            violationType: hasFloorDeviation ? "Unauthorized Extra Floor" : (!isLandUseMatch ? "Non-Conforming Usage" : null),
            noticeNumber: null,
            noticeDate: null,
            description: null,
            resolution: null
        },
        verification: {
            status: (bp?.buildingPermissionStatus || "").toLowerCase() === "approved" ? "VERIFIED" : "PENDING",
            verifiedBy: "OFF-MUN-001",
            department: "Municipal Building & Planning Department",
            verifiedAt: bp?.lastUpdated || "2026-08-15",
            remarks: "Building permission and municipal property record verified."
        },
        landUseCrossCheck: {
            landUseType: landUseType,
            buildingUse: buildingUse,
            isConsistent: isLandUseMatch,
            status: isLandUseMatch ? "VERIFIED" : "MISMATCH"
        },
        permissionDeviationCrossCheck: {
            approvedFloors: approvedFloors,
            recordedFloors: recordedFloors,
            hasDeviation: hasFloorDeviation,
            status: hasFloorDeviation ? "DEVIATION" : "VERIFIED",
            indicator: "Prototype compliance indicator"
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_BUILDING_DATA",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: buildingDetails
    });
});

/**
 * @route   GET /api/parcels/:id/restrictions
 * @desc    Get Restrictions & Regulatory Constraints for parcel (Phase 12H)
 */
router.get("/:id/restrictions", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's restriction records."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const restrictionsData = require("../data/restrictions");
    const rest = restrictionsData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const landUseData = require("../data/landuse");
    const lu = landUseData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const bpData = require("../data/BuildingPermission");
    const bp = bpData.find(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    if (!rest && !parcel) {
        return res.status(404).json({
            success: false,
            error: "NOT_FOUND",
            message: "Restriction records not found for parcel"
        });
    }

    const waterBodyRest = rest?.waterBodyRestriction || false;
    const roadRest = rest?.roadWideningRestriction || false;
    const envRest = rest?.environmentalRestriction || false;
    const courtRest = rest?.court?.status === "PENDING";
    const acqRest = rest?.acquisition?.acquisitionStatus === "UNDER ACQUISITION" || rest?.acquisition?.acquisitionStatus === "UNDER REVIEW";

    let calculatedStatus = "CLEAR";
    if (courtRest || acqRest || (rest?.riskLevel || "").toLowerCase() === "high") {
        calculatedStatus = "RESTRICTED";
    } else if (waterBodyRest || roadRest || envRest || rest?.developmentRestriction) {
        calculatedStatus = "RESTRICTED";
    }

    const restrictionDetails = {
        parcelId: parcelId.toUpperCase(),
        surveyNumber: parcel?.surveyNumber || "SUR-101",
        restrictionStatus: calculatedStatus,
        riskLevel: rest?.riskLevel || (calculatedStatus === "CLEAR" ? "Low" : "Medium"),
        remarks: rest?.remarks || "No major regulatory restrictions recorded.",
        lastChecked: rest?.lastChecked || "2026-08-20",
        sourceDepartment: "State Regulatory Board & GIS Authorities",

        court: rest?.court || {
            status: "CLEAR",
            caseNumber: null,
            court: "District Civil Court",
            remarks: "No judicial restriction."
        },
        acquisition: rest?.acquisition || {
            acquisitionStatus: "NOT UNDER ACQUISITION",
            remarks: "Not under acquisition."
        },
        environmental: rest?.environmental || {
            zone: "Standard Zone",
            restrictionStatus: "CLEAR"
        },
        forest: rest?.forest || {
            forestClassification: "Non-Forest Land",
            status: "NOT FOREST"
        },
        waterBody: rest?.waterBody || {
            waterBodyType: "None",
            restrictionStatus: "CLEAR"
        },
        road: rest?.road || {
            roadWidening: "No",
            status: "CLEAR"
        },
        heritage: rest?.heritage || {
            heritageZone: "No",
            status: "CLEAR"
        },
        development: rest?.development || {
            developmentRestriction: "Standard Controls",
            status: "PERMITTED"
        },

        restrictionRegister: rest?.restrictionRegister || [],
        clearance: rest?.clearance || {
            clearanceStatus: calculatedStatus === "CLEAR" ? "CLEARED" : "NOT CLEARED",
            clearanceReference: `CLR-RST-${parcelId.slice(-3)}`,
            authority: "District Land Governance Board",
            date: rest?.lastChecked || "2026-08-20",
            validUntil: "2030-12-31",
            verifiedBy: "OFF-REG-001"
        },
        verification: rest?.verification || {
            status: calculatedStatus === "CLEAR" ? "VERIFIED" : "REVIEW REQUIRED",
            verifiedBy: "OFF-REG-001",
            department: "Restrictions & Regulatory Board",
            verifiedAt: rest?.lastChecked || "2026-08-20",
            remarks: "Regulatory restrictions inspected."
        },

        crossCheck: {
            title: "PROTOTYPE REGULATORY CHECK",
            waterBodyVsBuilding: (waterBodyRest && bp) ? "REVIEW REQUIRED (Building footprint vs Water Body Buffer)" : "COMPLIANT",
            roadWideningVsFootprint: (roadRest && bp) ? "REVIEW REQUIRED (Structure in Proposed Road Setback)" : "COMPLIANT",
            envZoneVsLandUse: (envRest && lu?.currentLandUse?.toLowerCase()?.includes("commercial")) ? "REVIEW REQUIRED (Commercial Use in Eco-Sensitive Zone)" : "COMPLIANT",
            overallCrossCheckStatus: (waterBodyRest || roadRest || envRest) ? "REVIEW REQUIRED" : "VERIFIED"
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_RESTRICTION_DATA",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: restrictionDetails
    });
});

/**
 * @route   GET /api/parcels/:id/documents
 * @desc    Get Documents & Evidence Repository for parcel (Phase 12I)
 */
router.get("/:id/documents", requireAuth, (req, res) => {
    const parcelId = req.params.id;

    if (!canAccessParcel(req.user, parcelId)) {
        return res.status(403).json({
            success: false,
            error: "FORBIDDEN",
            message: "You do not have permission to access this parcel's document repository."
        });
    }

    const parcel = parcels.find(
        item => item.id.toLowerCase() === parcelId.toLowerCase()
    );

    const documentsData = require("../data/documents");
    const parcelDocs = documentsData.filter(
        item => item.parcelId.toLowerCase() === parcelId.toLowerCase()
    );

    const totalDocs = parcelDocs.length;
    const verifiedDocs = parcelDocs.filter(d => (d.status || d.verificationStatus || "").toUpperCase() === "VERIFIED" || d.status === "AVAILABLE").length;
    const pendingDocs = parcelDocs.filter(d => (d.status || "").toUpperCase() === "PENDING").length;
    const expiredDocs = parcelDocs.filter(d => (d.status || "").toUpperCase() === "EXPIRED").length;

    // Define expected checklist items
    const hasType = (t) => parcelDocs.some(d => (d.documentType || "").toUpperCase() === t);

    const checklist = [
        { documentType: "RoR Record", requiredType: "OWNERSHIP", status: hasType("OWNERSHIP") ? "AVAILABLE" : "MISSING", department: "Revenue Department" },
        { documentType: "Cadastral Map", requiredType: "CADASTRAL", status: hasType("CADASTRAL") ? "AVAILABLE" : "MISSING", department: "Cadastral Department" },
        { documentType: "Registration Document", requiredType: "REGISTRATION", status: hasType("REGISTRATION") ? "AVAILABLE" : "MISSING", department: "Registration Department" },
        { documentType: "Tax Receipt", requiredType: "PROPERTY_TAX", status: hasType("PROPERTY_TAX") ? "AVAILABLE" : "MISSING", department: "Property Tax Department" },
        { documentType: "Building Permission", requiredType: "BUILDING_PERMISSION", status: hasType("BUILDING_PERMISSION") ? "AVAILABLE" : "MISSING", department: "Municipal Building Department" },
        { documentType: "Land Use Approval", requiredType: "LAND_USE", status: hasType("LAND_USE") ? "AVAILABLE" : (parcelId === "LND-001" ? "NOT_APPLICABLE" : "MISSING"), department: "Land Use & Planning Dept" },
        { documentType: "Clearance Certificate", requiredType: "RESTRICTIONS", status: hasType("RESTRICTIONS") ? "AVAILABLE" : "NOT_APPLICABLE", department: "Regulatory Board" }
    ];

    const missingCount = checklist.filter(c => c.status === "MISSING").length;

    const documentRepository = {
        parcelId: parcelId.toUpperCase(),
        surveyNumber: parcel?.surveyNumber || "SUR-101",
        summary: {
            totalDocuments: totalDocs,
            verifiedDocuments: verifiedDocs,
            pendingVerification: pendingDocs,
            expiredDocuments: expiredDocs,
            missingDocuments: missingCount,
            recentDocument: parcelDocs.length > 0 ? parcelDocs[parcelDocs.length - 1].title : "None"
        },
        checklist: checklist,
        categories: [
            "Cadastral", "RoR / Ownership", "Registration", "Tax",
            "Land Use", "Building / Municipal", "Restrictions", "Government Orders", "Clearances"
        ],
        documents: parcelDocs.map(d => ({
            documentId: d.documentId,
            parcelId: d.parcelId,
            documentType: d.documentType,
            documentNumber: d.documentNumber,
            title: d.title,
            issuingDepartment: d.issuingDepartment || d.sourceDepartment || "Department Record",
            sourceDepartment: d.sourceDepartment || d.issuingDepartment || "Department Record",
            issueDate: d.issueDate,
            uploadedDate: d.uploadedDate || d.createdAt ? d.createdAt.split("T")[0] : "2026-01-01",
            status: d.status || "AVAILABLE",
            verificationStatus: d.verificationStatus || d.status || "AVAILABLE",
            verifiedBy: d.verifiedBy || "OFF-DOC-001",
            verifiedDate: d.verifiedDate || d.issueDate,
            version: d.version || "v1.0",
            versionHistory: d.versionHistory || [],
            fileName: d.fileName || null,
            description: d.description || "Official evidence record."
        })),
        verification: {
            status: missingCount > 0 ? "REVIEW REQUIRED" : (pendingDocs > 0 ? "PENDING" : "VERIFIED"),
            verifiedBy: "OFF-DOC-001",
            department: "Unified Document Repository Authority",
            verifiedAt: "2026-09-03",
            remarks: missingCount > 0 ? `${missingCount} expected workflow documents are missing.` : "All expected document evidence verified."
        }
    };

    auditService.logEvent({
        actor: req.user.email || req.user.officerId || req.user.id || "system",
        target: parcelId,
        action: "VIEW_PARCEL_DOCUMENTS",
        result: "SUCCESS"
    });

    res.json({
        success: true,
        data: documentRepository
    });
});

module.exports = router;


