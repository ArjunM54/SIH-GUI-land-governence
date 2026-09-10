/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   IMAGERY PROVIDER INTERFACE

   Abstract base for satellite/drone imagery providers.
   All providers must implement these methods.
   ========================================================= */

/**
 * @typedef {Object} ImageryRecord
 * @property {string} id - Unique image ID
 * @property {string} parcelId - Associated parcel ID
 * @property {string} source - SATELLITE | DRONE
 * @property {string} provider - Provider name (e.g. Sentinel-2)
 * @property {string} date - ISO date string
 * @property {string} imageUrl - Path/URL to image
 * @property {string} resolution - Spatial resolution
 * @property {string} imageType - OPTICAL | SAR | RGB_ORTHO
 * @property {number} cloudCover - Cloud cover percentage
 */

class ImageryProvider {
    /**
     * Get all imagery records for a parcel.
     * @param {string} parcelId
     * @returns {Promise<ImageryRecord[]>}
     */
    async getImageryForParcel(parcelId) {
        throw new Error("Provider must implement getImageryForParcel()");
    }

    /**
     * Get satellite imagery only for a parcel.
     * @param {string} parcelId
     * @returns {Promise<ImageryRecord[]>}
     */
    async getSatelliteImagery(parcelId) {
        throw new Error("Provider must implement getSatelliteImagery()");
    }

    /**
     * Get drone imagery only for a parcel.
     * @param {string} parcelId
     * @returns {Promise<ImageryRecord[]>}
     */
    async getDroneImagery(parcelId) {
        throw new Error("Provider must implement getDroneImagery()");
    }

    /**
     * Get imagery within a date range.
     * @param {string} parcelId
     * @param {string} startDate - ISO date
     * @param {string} endDate - ISO date
     * @returns {Promise<ImageryRecord[]>}
     */
    async getImageryByDateRange(parcelId, startDate, endDate) {
        throw new Error("Provider must implement getImageryByDateRange()");
    }

    /**
     * Get a single imagery record by ID.
     * @param {string} imageId
     * @returns {Promise<ImageryRecord|null>}
     */
    async getImageryById(imageId) {
        throw new Error("Provider must implement getImageryById()");
    }

    /**
     * Get provider status/info.
     * @returns {Object}
     */
    getInfo() {
        return {
            name: "BaseProvider",
            type: "UNKNOWN",
            status: "UNCONFIGURED",
            isDemo: true
        };
    }
}

module.exports = ImageryProvider;
