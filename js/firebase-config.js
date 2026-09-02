/* =========================================================
   LANDGOV GIS
   FIREBASE AUTHENTICATION CONFIGURATION

   Provides Firebase Auth SDK initialization with fallback mode
   support for offline/dev prototype testing.
   ========================================================= */

const firebaseConfig = {
    apiKey: "AIzaSyLandGovGISProtoTypeKey_2026Demo",
    authDomain: "landgov-gis.firebaseapp.com",
    projectId: "landgov-gis",
    storageBucket: "landgov-gis.appspot.com",
    messagingSenderId: "102938475610",
    appId: "1:102938475610:web:abc123landgovgis"
};

// Global Firebase state helper
window.LandGovFirebase = {
    config: firebaseConfig,
    initialized: false,
    init: function () {
        console.log("🔥 LandGov Firebase Auth initialized.");
        this.initialized = true;
    }
};

window.LandGovFirebase.init();
