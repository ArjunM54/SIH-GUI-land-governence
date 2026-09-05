/* =========================================================
   LANDGOV GIS
   PHASE 12 — INTEGRATED LAND PARCEL WORKSPACE TEST SUITE
   ========================================================= */

const http = require("http");
const { getIntegratedLandProfile } = require("../data/landProfile");
const { canAccessParcel } = require("../services/parcelAccessService");

console.log("==================================================");
console.log("RUNNING PHASE 12 INTEGRATED WORKSPACE TESTS");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`✓ PASS: ${message}`);
        testsPassed++;
    } else {
        console.error(`❌ FAIL: ${message}`);
        testsFailed++;
    }
}

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => data += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
        });
        req.on("error", (err) => reject(err));
        if (postData) {
            req.write(JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    // 1. Direct Data Layer Tests
    console.log("\n--- TEST GROUP 1: INTEGRATED PROFILE DATA GENERATION ---");

    const profile1 = getIntegratedLandProfile("LND-001");
    assert(profile1 !== null, "LND-001 integrated profile generated");
    assert(profile1.parcel && profile1.parcel.id === "LND-001", "LND-001 parcel data present");
    assert(profile1.cadastral && profile1.cadastral.surveyStatus === "Verified", "LND-001 cadastral data verified");
    assert(profile1.ror && profile1.ror.rorStatus === "VERIFIED", "LND-001 RoR data verified");
    assert(profile1.registration && profile1.registration.status === "APPROVED", "LND-001 registration approved");
    assert(profile1.landUse && profile1.landUse.zoningStatus === "COMPATIBLE", "LND-001 land use compatible");
    assert(profile1.propertyTax && profile1.propertyTax.outstandingAmount === 0, "LND-001 property tax cleared with 0 outstanding");
    assert(profile1.buildingPermission && profile1.buildingPermission.buildingPermissionStatus === "Approved", "LND-001 building permission approved");
    assert(profile1.restrictions && profile1.restrictions.restrictionStatus === "Clear", "LND-001 restrictions clear");
    assert(Array.isArray(profile1.documents), "LND-001 documents array present");
    assert(Array.isArray(profile1.timeline) && profile1.timeline.length > 0, "LND-001 timeline events present");
    assert(profile1.governance && profile1.governance.overallStatus === "VERIFIED", "LND-001 overall governance status is VERIFIED");

    console.log("\n--- TEST GROUP 2: OUTSTANDING TAX SCENARIO (LND-002) ---");
    const profile2 = getIntegratedLandProfile("LND-002");
    assert(profile2 !== null, "LND-002 integrated profile generated");
    assert(profile2.propertyTax && profile2.propertyTax.outstandingAmount > 0, `LND-002 outstanding tax is ₹${profile2.propertyTax.outstandingAmount}`);
    assert(profile2.governance && profile2.governance.overallStatus === "REVIEW REQUIRED", "LND-002 overall governance status is REVIEW REQUIRED due to outstanding tax");

    console.log("\n--- TEST GROUP 3: INCOMPLETE / CONFLICT SCENARIO (LND-003) ---");
    const profile3 = getIntegratedLandProfile("LND-003");
    assert(profile3 !== null, "LND-003 integrated profile generated");
    assert(profile3.governance && (profile3.governance.overallStatus === "REVIEW REQUIRED" || profile3.governance.overallStatus === "CONFLICT DETECTED"), `LND-003 overall status is ${profile3.governance?.overallStatus}`);

    console.log("\n--- TEST GROUP 4: AUTHORIZATION & PERMISSIONS ---");
    const adminUser = { role: "admin", permissions: ["*"] };
    const citizenUser = { role: "citizen", assignedParcels: ["LND-001"] };
    const unauthorizedCitizen = { role: "citizen", assignedParcels: ["LND-005"] };

    assert(canAccessParcel(adminUser, "LND-001") === true, "Admin can access LND-001");
    assert(canAccessParcel(citizenUser, "LND-001") === true, "Authorized citizen can access LND-001");
    assert(canAccessParcel(unauthorizedCitizen, "LND-001") === false, "Unauthorized citizen cannot access LND-001");

    console.log("\n--- TEST GROUP 5: HTTP API INTEGRATION TESTS ---");
    try {
        // Login as Citizen to get token
        const loginRes = await makeRequest({
            hostname: "localhost",
            port: 5000,
            path: "/api/auth/login",
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }, { identifier: "citizen@landgov.gov", password: "Pass123!Demo" });

        assert(loginRes.statusCode === 200 && loginRes.body.token, "Citizen login successful, JWT received");
        const token = loginRes.body.token;

        // Call GET /api/parcels/LND-001/integrated-profile
        const apiRes1 = await makeRequest({
            hostname: "localhost",
            port: 5000,
            path: "/api/parcels/LND-001/integrated-profile",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(apiRes1.statusCode === 200, "HTTP GET /api/parcels/LND-001/integrated-profile returns 200 OK");
        assert(apiRes1.body.success === true && apiRes1.body.data.governance.overallStatus === "VERIFIED", "HTTP response returns GOVERNANCE VERIFIED for LND-001");

        // Call GET /api/parcels/LND-002/integrated-profile (unauthorized for citizen cit-001 who only owns LND-001)
        const apiRes2 = await makeRequest({
            hostname: "localhost",
            port: 5000,
            path: "/api/parcels/LND-002/integrated-profile",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(apiRes2.statusCode === 403, "HTTP GET /api/parcels/LND-002/integrated-profile returns 403 FORBIDDEN for unauthorized citizen");

        // Call GET without token
        const noAuthRes = await makeRequest({
            hostname: "localhost",
            port: 5000,
            path: "/api/parcels/LND-001/integrated-profile",
            method: "GET"
        });
        assert(noAuthRes.statusCode === 401, "HTTP GET /api/parcels/LND-001/integrated-profile without auth header returns 401 UNAUTHORIZED");

    } catch (e) {
        console.error("HTTP test error:", e);
    }

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log("==================================================");

    process.exit(testsFailed > 0 ? 1 : 0);
}

runTests();
