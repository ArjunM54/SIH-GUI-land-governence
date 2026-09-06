/* =========================================================
   LANDGOV GIS
   PHASE 12D & 12E — REGISTRATION & LAND USE INTEGRATION TEST SUITE
   ========================================================= */

const http = require("http");
const { getIntegratedLandProfile } = require("../data/landProfile");
const { canAccessParcel } = require("../services/parcelAccessService");

console.log("==================================================");
console.log("RUNNING PHASE 12D & 12E TEST SUITE");
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
    console.log("\n--- TEST GROUP 1: DATA LAYER INTEGRATION ---");
    const profile1 = getIntegratedLandProfile("LND-001");
    assert(profile1 !== null, "LND-001 integrated profile retrieved");
    assert(profile1.registration !== null, "LND-001 registration object present");
    assert(profile1.registration.registrationId === "REG-2026-045", "Registration ID matches REG-2026-045");
    assert(profile1.landUse !== null, "LND-001 landUse object present");
    assert(profile1.landUse.currentLandUse === "Agricultural", "Land Use is Agricultural");

    console.log("\n--- TEST GROUP 2: HTTP API ENDPOINTS (REGISTRATION & LAND USE) ---");
    try {
        // Login as Citizen to get JWT
        const loginRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/auth/login",
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }, { identifier: "citizen@landgov.gov", password: "Pass123!Demo" });

        assert(loginRes.statusCode === 200 && loginRes.body.token, "User login successful, JWT received");
        const token = loginRes.body.token;

        // 1. GET /api/parcels/LND-001/registration
        const regRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/registration",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        console.log("Registration API status:", regRes.statusCode, "body:", regRes.body);

        assert(regRes.statusCode === 200, "GET /api/parcels/LND-001/registration returns 200 OK");
        assert(regRes.body.success === true, "Response success is true");
        assert(regRes.body.data.parcelId === "LND-001", "Registration parcelId matches LND-001");
        assert(regRes.body.data.registrationStatus === "APPROVED", "Registration status is APPROVED");
        assert(regRes.body.data.latestTransaction !== null, "Latest transaction object present");
        assert(regRes.body.data.latestTransaction.transactionType === "Sale", "Transaction type is Sale");
        assert(Array.isArray(regRes.body.data.registrationHistory), "Registration history array present");
        assert(regRes.body.data.parties !== null, "Transaction parties object present");
        assert(regRes.body.data.verification !== null, "Verification object present");
        assert(regRes.body.data.ownershipCrossCheck !== null, "Ownership cross-check object present");

        // Check ownership cross check
        assert(regRes.body.data.ownershipCrossCheck.registrationOwner === "Demo New Owner", "Registration transferee is Demo New Owner");
        assert(regRes.body.data.ownershipCrossCheck.rorOwner === "Demo Agricultural Owner", "RoR owner is Demo Agricultural Owner");
        assert(regRes.body.data.ownershipCrossCheck.isConsistent === false, "Ownership cross-check detects MISMATCH");

        // 2. GET /api/parcels/LND-001/land-use
        const luRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/land-use",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(luRes.statusCode === 200, "GET /api/parcels/LND-001/land-use returns 200 OK");
        assert(luRes.body.success === true, "Response success is true");
        assert(luRes.body.data.parcelId === "LND-001", "Land use parcelId matches LND-001");
        assert(luRes.body.data.currentLandUse === "Agricultural", "Current land use is Agricultural");
        assert(luRes.body.data.masterPlan !== null, "Master plan object present");
        assert(luRes.body.data.masterPlan.zoneCode === "AGRI-R1", "Master plan zone code matches AGRI-R1");
        assert(luRes.body.data.zoning !== null, "Zoning object present");
        assert(Array.isArray(luRes.body.data.zoning.permittedUse), "Permitted use list present");
        assert(luRes.body.data.conversion !== null, "Land use conversion record present");
        assert(Array.isArray(luRes.body.data.restrictions), "Planning restrictions array present");
        assert(luRes.body.data.eligibility !== null, "Development eligibility object present");
        assert(luRes.body.data.eligibility.status === "CONDITIONALLY ELIGIBLE", "Eligibility status is CONDITIONALLY ELIGIBLE due to pending conversion");
        assert(luRes.body.data.gisCrossCheck !== null, "GIS cross-check object present");
        assert(luRes.body.data.gisCrossCheck.isConsistent === false, "GIS land use cross-check detects MISMATCH (GIS: Residential vs LU Dept: Agricultural)");

        // 3. Unauthorized access check
        const unauthRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/registration",
            method: "GET"
        });
        assert(unauthRes.statusCode === 401, "Unauthenticated registration access rejected with 401");

        const unauthLuRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/land-use",
            method: "GET"
        });
        assert(unauthLuRes.statusCode === 401, "Unauthenticated land-use access rejected with 401");

        // 4. Forbidden parcel access check (LND-005 not assigned to citizen)
        const forbiddenRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-005/registration",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        assert(forbiddenRes.statusCode === 403, "Forbidden registration access to unassigned parcel rejected with 403");

    } catch (err) {
        console.error("HTTP Request Error:", err);
        assert(false, `HTTP tests failed with error: ${err.message}`);
    }

    console.log("\n==================================================");
    console.log(`TEST RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log("==================================================");

    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests();
