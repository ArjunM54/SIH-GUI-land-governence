/* =========================================================
   LANDGOV GIS
   PERMISSIONS & OFFICER TYPE DEFINITIONS

   Client-side permission catalog and helper utilities.
   ========================================================= */

const PERMISSIONS = {
    // Cadastral
    CADASTRAL_VIEW: "cadastral.view",
    CADASTRAL_VERIFY: "cadastral.verify",
    CADASTRAL_UPDATE: "cadastral.update",
    PARCEL_VIEW: "parcel.view",
    PARCEL_VERIFY: "parcel.verify",
    GIS_VIEW: "gis.view",
    GIS_UPDATE: "gis.update",
    SURVEY_VIEW: "survey.view",
    SURVEY_VERIFY: "survey.verify",

    // Land Records / RoR
    ROR_VIEW: "ror.view",
    ROR_VERIFY: "ror.verify",
    ROR_UPDATE: "ror.update",
    OWNERSHIP_VIEW: "ownership.view",
    OWNERSHIP_VERIFY: "ownership.verify",
    OWNERSHIP_UPDATE: "ownership.update",
    MUTATION_VIEW: "mutation.view",
    MUTATION_VERIFY: "mutation.verify",
    MUTATION_APPROVE: "mutation.approve",

    // Registration
    REGISTRATION_VIEW: "registration.view",
    REGISTRATION_VERIFY: "registration.verify",
    REGISTRATION_UPDATE: "registration.update",
    REGISTRATION_APPROVE: "registration.approve",
    TRANSFER_VIEW: "transfer.view",
    TRANSFER_VERIFY: "transfer.verify",
    TRANSFER_APPROVE: "transfer.approve",

    // Land Use & Planning
    LANDUSE_VIEW: "landuse.view",
    LANDUSE_VERIFY: "landuse.verify",
    LANDUSE_UPDATE: "landuse.update",
    LANDUSE_APPROVE: "landuse.approve",
    ZONING_VIEW: "zoning.view",
    ZONING_VERIFY: "zoning.verify",
    ZONING_UPDATE: "zoning.update",
    RESTRICTIONS_VIEW: "restrictions.view",
    RESTRICTIONS_VERIFY: "restrictions.verify",
    RESTRICTIONS_UPDATE: "restrictions.update",

    // Property Tax & Municipal
    TAX_VIEW: "tax.view",
    TAX_VERIFY: "tax.verify",
    TAX_UPDATE: "tax.update",
    TAX_APPROVE: "tax.approve",
    MUNICIPAL_VIEW: "municipal.view",
    MUNICIPAL_VERIFY: "municipal.verify",
    BUILDING_VIEW: "building.view",
    BUILDING_VERIFY: "building.verify",
    BUILDING_APPROVE: "building.approve",

    // Admin
    ADMIN_ALL: "admin.all"
};

const OFFICER_TYPES_INFO = {
    cadastral_officer: {
        title: "Cadastral & Survey Officer",
        department: "Cadastral & Survey Department",
        badgeClass: "badge-cadastral",
        icon: "🗺️",
        defaultOfficerId: "OFF-CAD-001"
    },
    land_records_officer: {
        title: "Land Records / RoR Officer",
        department: "Land Records Department",
        badgeClass: "badge-ror",
        icon: "📜",
        defaultOfficerId: "OFF-ROR-001"
    },
    registration_officer: {
        title: "Registration Officer",
        department: "Registration Department",
        badgeClass: "badge-registration",
        icon: "🖋️",
        defaultOfficerId: "OFF-REG-001"
    },
    land_use_officer: {
        title: "Land Use & Planning Officer",
        department: "Land Use & Planning Department",
        badgeClass: "badge-landuse",
        icon: "🏛️",
        defaultOfficerId: "OFF-LU-001"
    },
    property_tax_officer: {
        title: "Property Tax & Municipal Officer",
        department: "Property Tax & Municipal Department",
        badgeClass: "badge-tax",
        icon: "💰",
        defaultOfficerId: "OFF-TAX-001"
    }
};

/**
 * Check if active user has a required permission
 */
function userHasPermission(user, requiredPermission) {
    if (!user) return false;
    if (user.role === "admin" || (user.permissions && user.permissions.includes("admin.all"))) {
        return true;
    }
    const permissions = user.permissions || [];
    return permissions.includes(requiredPermission);
}

window.PERMISSIONS = PERMISSIONS;
window.OFFICER_TYPES_INFO = OFFICER_TYPES_INFO;
window.userHasPermission = userHasPermission;
