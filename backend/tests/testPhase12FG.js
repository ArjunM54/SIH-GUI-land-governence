/* =========================================================
   LANDGOV GIS
   PHASE 12F & 12G — PROPERTY TAX & BUILDING PERMISSION INTEGRATION TEST SUITE
   ========================================================= */

const http = require("http");
const { getIntegratedLandProfile } = require("../data/landProfile");
const { canAccessParcel } = require("../services/parcelAccessService");

console.log("==================================================");
console.log("RUNNING PHASE 12F & 12G TEST SUITE");
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
    assert(profile1.propertyTax !== null, "LND-001 propertyTax object present");
    assert(profile1.propertyTax.outstandingAmount === 0, "LND-001 property tax demand cleared (0 outstanding)");
    assert(profile1.buildingPermission !== null, "LND-001 buildingPermission object present");
    assert(profile1.buildingPermission.buildingPermissionStatus === "Approved", "Building permission is Approved");

    console.log("\n--- TEST GROUP 2: HTTP API ENDPOINTS (PROPERTY TAX & BUILDING) ---");
    try {
        // Login as Officer to get JWT with access to all demo parcels
        const loginRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/auth/login",
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }, { identifier: "cadastral@landgov.gov", password: "NewPass123!Demo" });

        assert(loginRes.statusCode === 200 && loginRes.body.token, "User login successful, JWT received");
        const token = loginRes.body.token;

        // 1. GET /api/parcels/LND-001/property-tax
        const taxRes1 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/property-tax",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(taxRes1.statusCode === 200, "GET /api/parcels/LND-001/property-tax returns 200 OK");
        assert(taxRes1.body.success === true, "Response success is true");
        assert(taxRes1.body.data.parcelId === "LND-001", "Tax parcelId matches LND-001");
        assert(taxRes1.body.data.outstandingAmount === 0, "Tax outstanding amount is 0");
        assert(taxRes1.body.data.clearance.clearanceStatus === "CLEARED", "Tax clearance status is CLEARED");
        assert(taxRes1.body.data.assessment !== null, "Tax assessment details object present");
        assert(Array.isArray(taxRes1.body.data.paymentHistory), "Tax payment history array present");
        assert(taxRes1.body.data.ownerCrossCheck !== null, "Tax owner cross-check object present");

        // 2. GET /api/parcels/LND-002/property-tax (Outstanding dues scenario)
        const taxRes2 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-002/property-tax",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(taxRes2.statusCode === 200, "GET /api/parcels/LND-002/property-tax returns 200 OK");
        assert(taxRes2.body.data.outstandingAmount > 0, `LND-002 outstanding amount is ₹${taxRes2.body.data.outstandingAmount}`);
        assert(taxRes2.body.data.clearance.clearanceStatus === "OUTSTANDING", "LND-002 clearance status is OUTSTANDING");

        // 3. GET /api/parcels/LND-001/building
        const bpRes1 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/building",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });

        assert(bpRes1.statusCode === 200, "GET /api/parcels/LND-001/building returns 200 OK");
        assert(bpRes1.body.success === true, "Response success is true");
        assert(bpRes1.body.data.parcelId === "LND-001", "Building parcelId matches LND-001");
        assert(bpRes1.body.data.buildingSummary.buildingStatus === "APPROVED", "Building status is APPROVED");
        assert(bpRes1.body.data.permission !== null, "Building permission object present");
        assert(bpRes1.body.data.permission.applicationNumber === "BP-2026-001", "Application number matches BP-2026-001");
        assert(bpRes1.body.data.buildingPlan !== null, "Approved building plan object present");
        assert(bpRes1.body.data.compliance !== null, "Building compliance object present");
        assert(bpRes1.body.data.compliance.status === "COMPLIANT", "Compliance status is COMPLIANT");
        assert(bpRes1.body.data.landUseCrossCheck !== null, "Land use cross-check object present");
        assert(bpRes1.body.data.permissionDeviationCrossCheck !== null, "Permission deviation cross-check object present");

        // 4. Unauthorized access check
        const unauthTax = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/property-tax",
            method: "GET"
        });
        assert(unauthTax.statusCode === 401, "Unauthenticated property tax access rejected with 401");

        const unauthBp = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/building",
            method: "GET"
        });
        assert(unauthBp.statusCode === 401, "Unauthenticated building access rejected with 401");

        // 5. Forbidden parcel access check
        const forbiddenTax = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-005/property-tax",
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        });
        assert(forbiddenTax.statusCode === 403, "Forbidden tax access to unassigned parcel rejected with 403");

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
