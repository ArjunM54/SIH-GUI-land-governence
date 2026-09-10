/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   MOCK IMAGERY PROVIDER

   Returns sample imagery data from the in-memory data store.
   Used for prototype/demo mode.
   ========================================================= */

const ImageryProvider = require("./imageryProvider");
const imageryData = require("../../data/imagery");

class MockImageryProvider extends ImageryProvider {

    async getImageryForParcel(parcelId) {
        return imageryData.getImageryByParcel(parcelId);
    }

    async getSatelliteImagery(parcelId) {
        return imageryData.getSatelliteImageryByParcel(parcelId);
    }

    async getDroneImagery(parcelId) {
        return imageryData.getDroneImageryByParcel(parcelId);
    }

    async getImageryByDateRange(parcelId, startDate, endDate) {
        return imageryData.getImageryByDateRange(parcelId, startDate, endDate);
    }

    async getImageryById(imageId) {
        return imageryData.getImageryById(imageId);
    }

    getInfo() {
        return {
            name: "MockImageryProvider",
            type: "MOCK",
            status: "ACTIVE",
            isDemo: true,
            description: "Returns pre-loaded sample imagery for prototype demonstration.",
            supportedSources: ["SATELLITE", "DRONE"],
            supportedProviders: ["Sentinel-2", "Local Drone Survey"],
            disclaimer: "All imagery data is simulated for demonstration purposes."
        };
    }
}

module.exports = MockImageryProvider;
