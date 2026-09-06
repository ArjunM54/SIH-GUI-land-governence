/* =========================================================
   LANDGOV GIS
   AUTOMATED TEST SUITE FOR PHASE 12H & PHASE 12I
   (Restrictions & Regulatory Constraints + Documents & Evidence)
   ========================================================= */

const http = require("http");
const { getIntegratedLandProfile } = require("../data/landProfile");

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
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
            req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=================================================");
    console.log("RUNNING PHASE 12H & 12I AUTOMATED TEST SUITE");
    console.log("=================================================\n");

    let total = 0;
    let passed = 0;

    function assert(condition, message) {
        total++;
        if (condition) {
            passed++;
            console.log(`  ✓ PASS: ${message}`);
        } else {
            console.error(`  ✕ FAIL: ${message}`);
        }
    }

    try {
        console.log("--- TEST GROUP 1: DATA LAYER INTEGRATION ---");
        const profile1 = getIntegratedLandProfile("LND-001");
        assert(profile1 !== null, "LND-001 integrated profile retrieved");
        assert(profile1.restrictions !== null, "LND-001 restrictions object present");
        assert(profile1.restrictions.restrictionStatus === "Clear", "LND-001 restriction status is Clear");
        assert(Array.isArray(profile1.documents), "LND-001 documents array present");
        assert(profile1.documents.length >= 4, "LND-001 has at least 4 documents");

        const profile2 = getIntegratedLandProfile("LND-002");
        assert(profile2 !== null, "LND-002 integrated profile retrieved");
        assert(profile2.restrictions.roadWideningRestriction === true, "LND-002 has active road widening restriction");

        const profile3 = getIntegratedLandProfile("LND-003");
        assert(profile3 !== null, "LND-003 integrated profile retrieved");
        assert(profile3.restrictions.waterBodyRestriction === true, "LND-003 has water body restriction");
        assert(profile3.restrictions.court.status === "PENDING", "LND-003 has pending court injunction");

        console.log("\n--- TEST GROUP 2: HTTP API ENDPOINTS & SECURITY ---");

        // Login as Officer
        console.log("Authenticating Officer (cadastral@landgov.gov)...");
        const loginRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/auth/login",
            method: "POST",
            headers: { "Content-Type": "application/json" }
        }, {
            identifier: "cadastral@landgov.gov",
            password: "NewPass123!Demo"
        });

        assert(loginRes.statusCode === 200, "Login HTTP status is 200");
        assert(loginRes.body && loginRes.body.token, "JWT token obtained");

        const token = loginRes.body ? loginRes.body.token : "";
        const authHeaders = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        };

        // Security Checks
        console.log("Security & Authorization Checks...");
        const unauthRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/restrictions",
            method: "GET"
        });
        assert(unauthRes.statusCode === 401, "Unauthenticated /restrictions returns 401 Unauthorized");

        const unauthDocRes = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/documents",
            method: "GET"
        });
        assert(unauthDocRes.statusCode === 401, "Unauthenticated /documents returns 401 Unauthorized");

        // Phase 12H — Restrictions API (LND-001)
        console.log("\n--- TEST GROUP 3: PHASE 12H RESTRICTIONS ENDPOINTS ---");
        const rest001 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/restrictions",
            method: "GET",
            headers: authHeaders
        });

        assert(rest001.statusCode === 200, "GET /api/parcels/LND-001/restrictions returns 200 OK");
        assert(rest001.body.success === true, "Response success is true");
        assert(rest001.body.data.parcelId === "LND-001", "Parcel ID matches LND-001");
        assert(rest001.body.data.restrictionStatus === "CLEAR", "Restriction Status is CLEAR for LND-001");
        assert(rest001.body.data.court.status === "CLEAR", "Court status is CLEAR");
        assert(rest001.body.data.acquisition.acquisitionStatus === "NOT UNDER ACQUISITION", "Acquisition status is NOT UNDER ACQUISITION");
        assert(rest001.body.data.waterBody.restrictionStatus === "CLEAR", "Water Body restriction status is CLEAR");
        assert(rest001.body.data.clearance.clearanceStatus === "CLEARED", "Clearance status is CLEARED");

        // Phase 12H — Restrictions API (LND-002 - Road Widening)
        const rest002 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-002/restrictions",
            method: "GET",
            headers: authHeaders
        });

        assert(rest002.statusCode === 200, "GET /api/parcels/LND-002/restrictions returns 200 OK");
        assert(rest002.body.data.restrictionStatus === "RESTRICTED", "Restriction Status is RESTRICTED for LND-002");
        assert(rest002.body.data.road.roadWidening === "Yes", "Road Widening is Yes");
        assert(rest002.body.data.road.status === "ACTIVE RESTRICTION", "Road status is ACTIVE RESTRICTION");
        assert(rest002.body.data.restrictionRegister.length >= 2, "Restriction register contains itemized records");

        // Phase 12H — Restrictions API (LND-003 - Court & Water Body Buffer)
        const rest003 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-003/restrictions",
            method: "GET",
            headers: authHeaders
        });

        assert(rest003.statusCode === 200, "GET /api/parcels/LND-003/restrictions returns 200 OK");
        assert(rest003.body.data.restrictionStatus === "RESTRICTED", "Restriction Status is RESTRICTED for LND-003");
        assert(rest003.body.data.court.status === "PENDING", "Court Case status is PENDING (Active Litigation)");
        assert(rest003.body.data.waterBody.restrictionStatus === "ACTIVE RESTRICTION", "Water Body restriction is ACTIVE RESTRICTION");
        assert(rest003.body.data.crossCheck.title === "PROTOTYPE REGULATORY CHECK", "Prototype Regulatory Check title present");

        // Phase 12I — Documents API (LND-001)
        console.log("\n--- TEST GROUP 4: PHASE 12I DOCUMENTS ENDPOINTS ---");
        const doc001 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-001/documents",
            method: "GET",
            headers: authHeaders
        });

        assert(doc001.statusCode === 200, "GET /api/parcels/LND-001/documents returns 200 OK");
        assert(doc001.body.success === true, "Response success is true");
        assert(doc001.body.data.summary.totalDocuments >= 4, "LND-001 has at least 4 documents filed");
        assert(doc001.body.data.checklist.length === 7, "Required document checklist contains 7 statutory items");
        assert(doc001.body.data.checklist.some(c => c.requiredType === "OWNERSHIP" && c.status === "AVAILABLE"), "RoR Document is AVAILABLE");
        assert(doc001.body.data.checklist.some(c => c.requiredType === "BUILDING_PERMISSION" && c.status === "AVAILABLE"), "Building Permission is AVAILABLE");

        // Phase 12I — Documents API (LND-002)
        const doc002 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-002/documents",
            method: "GET",
            headers: authHeaders
        });

        assert(doc002.statusCode === 200, "GET /api/parcels/LND-002/documents returns 200 OK");
        assert(doc002.body.data.summary.pendingVerification >= 1, "LND-002 has pending verification document");
        assert(doc002.body.data.summary.expiredDocuments >= 1, "LND-002 has expired occupancy permit document");
        assert(doc002.body.data.documents.some(d => d.documentType === "RESTRICTIONS"), "Road Setback compliance document present");

        // Integrated Profile Integration
        console.log("\n--- TEST GROUP 5: GOVERNANCE INTEGRATION & RECOVERY ---");
        const prof002 = await makeRequest({
            hostname: "127.0.0.1",
            port: 5000,
            path: "/api/parcels/LND-002/integrated-profile",
            method: "GET",
            headers: authHeaders
        });

        assert(prof002.statusCode === 200, "Integrated profile for LND-002 returned 200 OK");
        assert(prof002.body.data.governance.departmentStatuses.restrictions === "RESTRICTED", "Restrictions department status is RESTRICTED for LND-002");

        console.log("\n=================================================");
        console.log(`TEST RESULTS: ${passed} / ${total} TESTS PASSED (${Math.round((passed/total)*100)}%)`);
        console.log("=================================================");

        if (passed === total) {
            process.exit(0);
        } else {
            process.exit(1);
        }

    } catch (e) {
        console.error("Test execution failed:", e);
        process.exit(1);
    }
}

runTests();
