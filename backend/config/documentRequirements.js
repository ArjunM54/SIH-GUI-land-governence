/* =========================================================
   LANDGOV GIS
   DOCUMENT REQUIREMENT CONFIGURATION ENGINE

   Defines application-specific document requirement rules
   and maps each document type to responsible government officer
   departments for verification.
   ========================================================= */

const DEPARTMENT_NAMES = {
    cadastral: "Cadastral & Survey Department",
    ror: "Land Records Department",
    registration: "Registration Department",
    landUse: "Land Use & Planning Department",
    propertyTax: "Property Tax & Municipal Department"
};

const DOCUMENT_REQUIREMENTS = {
    "OWNER_CHANGE": [
        {
            documentType: "SALE_DEED",
            title: "Sale Deed / Title Conveyance",
            description: "Registered sale deed, gift deed, or title transfer agreement.",
            required: true,
            responsibleDepartments: ["registration"],
            departmentLabels: ["Registration Department"]
        },
        {
            documentType: "IDENTITY_PROOF",
            title: "Identity Proof (Aadhaar / PAN / Passport)",
            description: "Government-issued identity proof of new and current owner.",
            required: true,
            responsibleDepartments: ["registration", "ror"],
            departmentLabels: ["Registration Department", "Land Records (RoR)"]
        },
        {
            documentType: "PREVIOUS_OWNERSHIP_DOCUMENT",
            title: "Previous Ownership Document / Encumbrance Cert",
            description: "Prior title deed or encumbrance certificate (EC) verifying clear title.",
            required: true,
            responsibleDepartments: ["ror"],
            departmentLabels: ["Land Records (RoR) Department"]
        },
        {
            documentType: "SURVEY_DOCUMENT",
            title: "Survey Sketch / Cadastral Boundary Record",
            description: "FMB / Field Measurement Book sketch or approved survey map.",
            required: true,
            responsibleDepartments: ["cadastral"],
            departmentLabels: ["Cadastral & Survey Department"]
        },
        {
            documentType: "LAND_USE_DOCUMENT",
            title: "Zoning & Land Use Clearance",
            description: "Master plan zoning approval or land-use non-objection certificate.",
            required: false,
            responsibleDepartments: ["landUse"],
            departmentLabels: ["Land Use & Planning Department"]
        },
        {
            documentType: "PROPERTY_TAX_RECEIPT",
            title: "Property Tax Paid Receipt",
            description: "Latest municipal property tax payment receipt for the parcel.",
            required: false,
            responsibleDepartments: ["propertyTax"],
            departmentLabels: ["Property Tax & Municipal Department"]
        }
    ],
    "MUTATION_REQUEST": [
        {
            documentType: "SALE_DEED",
            title: "Title Transfer Document",
            description: "Registered deed or inheritance succession document.",
            required: true,
            responsibleDepartments: ["ror"],
            departmentLabels: ["Land Records (RoR) Department"]
        },
        {
            documentType: "IDENTITY_PROOF",
            title: "Identity Proof of Rights Holder",
            description: "Government photo identity proof.",
            required: true,
            responsibleDepartments: ["ror"],
            departmentLabels: ["Land Records (RoR) Department"]
        },
        {
            documentType: "PROPERTY_TAX_RECEIPT",
            title: "Tax Clearance Certificate",
            description: "Clearance of outstanding municipal dues.",
            required: true,
            responsibleDepartments: ["propertyTax"],
            departmentLabels: ["Property Tax Department"]
        }
    ],
    "PROPERTY_REGISTRATION": [
        {
            documentType: "SALE_DEED",
            title: "Draft Sale Deed / Agreement",
            description: "Draft deed for registration approval.",
            required: true,
            responsibleDepartments: ["registration"],
            departmentLabels: ["Registration Department"]
        },
        {
            documentType: "IDENTITY_PROOF",
            title: "Buyer & Seller Photo ID",
            description: "Aadhaar / PAN card copies.",
            required: true,
            responsibleDepartments: ["registration"],
            departmentLabels: ["Registration Department"]
        }
    ],
    "LAND_USE_REQUEST": [
        {
            documentType: "LAND_USE_DOCUMENT",
            title: "Proposed Site & Building Layout Plan",
            description: "Architectural layout map for land-use conversion.",
            required: true,
            responsibleDepartments: ["landUse"],
            departmentLabels: ["Land Use & Planning Department"]
        },
        {
            documentType: "SURVEY_DOCUMENT",
            title: "Cadastral Survey Map",
            description: "Boundary survey record.",
            required: true,
            responsibleDepartments: ["cadastral"],
            departmentLabels: ["Cadastral & Survey Department"]
        }
    ],
    "PROPERTY_TAX_SERVICES": [
        {
            documentType: "PROPERTY_TAX_RECEIPT",
            title: "Tax Assessment / Payment Proof",
            description: "Recent tax bill or receipt copy.",
            required: true,
            responsibleDepartments: ["propertyTax"],
            departmentLabels: ["Property Tax & Municipal Department"]
        }
    ]
};

/**
 * Returns required document configuration for an application type.
 */
function getDocumentRequirementsForType(appType = "OWNER_CHANGE") {
    const key = String(appType).trim().toUpperCase().replace(/\s+/g, "_");
    return DOCUMENT_REQUIREMENTS[key] || DOCUMENT_REQUIREMENTS["OWNER_CHANGE"];
}

module.exports = {
    DEPARTMENT_NAMES,
    DOCUMENT_REQUIREMENTS,
    getDocumentRequirementsForType
};
