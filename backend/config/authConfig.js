/* =========================================================
   LANDGOV GIS
   AUTHENTICATION CONFIGURATION
   ========================================================= */

module.exports = {
    JWT_SECRET: process.env.JWT_SECRET || "sih26014-digital-land-governance-secret-key-2026",
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "8h",
    SALT_ROUNDS: 10
};
