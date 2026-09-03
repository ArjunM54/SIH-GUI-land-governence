/* =========================================================
   LANDGOV GIS
   PARCEL-LEVEL ACCESS CONTROL SERVICE

   Enforces fine-grained parcel authorization for Citizens,
   Officers, and Administrators based on assignedParcels claims.
   ========================================================= */

/**
 * Evaluates whether a given user is authorized to access a specific parcel.
 * @param {Object} user - Authenticated user object
 * @param {string} parcelId - Target parcel identifier (e.g., 'LND-001')
 * @returns {boolean} - true if authorized, false otherwise
 */
function canAccessParcel(user, parcelId) {
    if (!user || !parcelId) return false;

    // Active status check
    if (user.status === "disabled" || user.active === false) {
        return false;
    }

    // Admin or global access override
    if (user.role === "admin" || (Array.isArray(user.assignedParcels) && user.assignedParcels.includes("*"))) {
        return true;
    }

    // Citizen or Officer specific parcel assignment check
    const normalizedTarget = String(parcelId).trim().toUpperCase();
    const assigned = Array.isArray(user.assignedParcels) ? user.assignedParcels : [];

    return assigned.some(id => String(id).trim().toUpperCase() === normalizedTarget);
}

/**
 * Filters an array of parcel objects according to the user's parcel access permissions.
 * @param {Object} user - Authenticated user object
 * @param {Array} parcels - List of full parcel objects
 * @returns {Array} - Filtered array of authorized parcel objects
 */
function filterParcelsForUser(user, parcels = []) {
    if (!user) return [];
    if (user.role === "admin" || (Array.isArray(user.assignedParcels) && user.assignedParcels.includes("*"))) {
        return parcels;
    }

    return parcels.filter(p => canAccessParcel(user, p.id || p.parcelId));
}

module.exports = {
    canAccessParcel,
    filterParcelsForUser
};
