/* =========================================================
   LANDGOV GIS
   PHASE 10 AUTOMATED TEST SUITE (30 TEST SCENARIOS)

   Validates JWT Authentication, Password Hashing, RBAC,
   Officer Permissions, Parcel-Level Access Control, Data Field
   Filtering, and Document Security.
   ========================================================= */

const http = require("http");

const BASE_URL = "http://localhost:5000";

function makeRequest(path, method = "GET", headers = {}, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    parsed = { raw: data };
                }
                resolve({ statusCode: res.statusCode, body: parsed });
            });
        });

        req.on("error", reject);
        if (body) {
            req.write(typeof body === "string" ? body : JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("RUNNING PHASE 10 AUTOMATED SECURITY TEST SUITE");
    console.log("==================================================\n");

    let passed = 0;
    let failed = 0;

    async function assertTest(testNo, title, testFn) {
        try {
            const success = await testFn();
            if (success) {
                console.log(`[PASS] Test ${testNo}: ${title}`);
                passed++;
            } else {
                console.error(`[FAIL] Test ${testNo}: ${title}`);
                failed++;
            }
        } catch (err) {
            console.error(`[FAIL] Test ${testNo}: ${title} - Error:`, err.message);
            failed++;
        }
    }

    let citizenToken = "";
    let officerCadastralToken = "";
    let officerRoRToken = "";
    let officerRegToken = "";
    let officerLUToken = "";
    let officerTaxToken = "";
    let adminToken = "";

    // 1. AUTHENTICATION TESTS
    await assertTest(1, "Citizen Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "arjun@gmail.com", password: "arjun" });
        if (res.statusCode === 200 && res.body.success && res.body.token) {
            citizenToken = res.body.token;
            return true;
        }
        return false;
    });

    await assertTest(2, "Cadastral Officer Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "cadastral@landgov.gov", password: "NewPass123!Demo" });
        if (res.statusCode === 200 && res.body.success && res.body.token) {
            officerCadastralToken = res.body.token;
            return true;
        }
        return false;
    });

    await assertTest(3, "RoR Officer Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "ror@landgov.gov", password: "Pass123!Demo" });
        if (res.statusCode === 200 && res.body.success && res.body.token) {
            officerRoRToken = res.body.token;
            return true;
        }
        return false;
    });

    await assertTest(4, "Admin Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "admin@landgov.gov", password: "Pass123!Demo" });
        if (res.statusCode === 200 && res.body.success && res.body.token) {
            adminToken = res.body.token;
            return true;
        }
        return false;
    });

    await assertTest(5, "Login with Incorrect Password returns 401", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "arjun@gmail.com", password: "WrongPassword" });
        return res.statusCode === 401 && res.body.error === "INVALID_CREDENTIALS";
    });

    await assertTest(6, "Login with Non-existent User returns 401", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "nonexistent@landgov.gov", password: "Pass123!Demo" });
        return res.statusCode === 401 && res.body.error === "INVALID_CREDENTIALS";
    });

    await assertTest(7, "Protected Route Without Token returns 401", async () => {
        const res = await makeRequest("/api/parcels", "GET");
        return res.statusCode === 401;
    });

    await assertTest(8, "Protected Route With Malformed Token returns 401", async () => {
        const res = await makeRequest("/api/parcels", "GET", { Authorization: "Bearer malformed.jwt.token" });
        return res.statusCode === 401;
    });

    // 2. CITIZEN PERMISSION & PARCEL ACCESS TESTS
    await assertTest(9, "Citizen GET /api/parcels returns only authorized parcels", async () => {
        const res = await makeRequest("/api/parcels", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 200 && Array.isArray(res.body.data) && res.body.data.length < 1420;
    });

    await assertTest(10, "Citizen GET /api/land-profile/LND-001 (assigned parcel) succeeds", async () => {
        const res = await makeRequest("/api/land-profile/LND-001", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 200 && res.body.success && res.body.data.parcel;
    });

    await assertTest(11, "Citizen GET /api/land-profile/LND-002 (unassigned parcel) returns 403", async () => {
        const res = await makeRequest("/api/land-profile/LND-002", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 403;
    });

    await assertTest(12, "Citizen GET /api/cadastral/LND-001 (missing permission) returns 403", async () => {
        const res = await makeRequest("/api/cadastral/LND-001", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 403;
    });

    await assertTest(13, "Citizen GET /api/admin/metrics (admin route) returns 403", async () => {
        const res = await makeRequest("/api/admin/metrics", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 403;
    });

    await assertTest(14, "Citizen GET /api/documents/parcel/LND-001 (assigned parcel) succeeds", async () => {
        const res = await makeRequest("/api/documents/parcel/LND-001", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 200 && Array.isArray(res.body.documents);
    });

    await assertTest(15, "Citizen GET /api/documents/parcel/LND-002 (unassigned parcel) returns 403", async () => {
        const res = await makeRequest("/api/documents/parcel/LND-002", "GET", { Authorization: `Bearer ${citizenToken}` });
        return res.statusCode === 403;
    });

    // 3. OFFICER PERMISSION & DEPARTMENT TESTS
    await assertTest(16, "Cadastral Officer GET /api/cadastral/LND-001 succeeds", async () => {
        const res = await makeRequest("/api/cadastral/LND-001", "GET", { Authorization: `Bearer ${officerCadastralToken}` });
        return res.statusCode === 200 && res.body.data;
    });

    await assertTest(17, "Cadastral Officer GET /api/ror/LND-001 (missing ror.view permission) returns 403", async () => {
        const res = await makeRequest("/api/ror/LND-001", "GET", { Authorization: `Bearer ${officerCadastralToken}` });
        return res.statusCode === 403;
    });

    await assertTest(18, "RoR Officer GET /api/ror/LND-001 succeeds", async () => {
        const res = await makeRequest("/api/ror/LND-001", "GET", { Authorization: `Bearer ${officerRoRToken}` });
        return res.statusCode === 200 && res.body.data;
    });

    await assertTest(19, "Registration Officer Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "registration@landgov.gov", password: "Pass123!Demo" });
        if (res.statusCode === 200 && res.body.token) officerRegToken = res.body.token;
        return res.statusCode === 200;
    });

    await assertTest(20, "Registration Officer GET /api/registration/LND-001 succeeds", async () => {
        const res = await makeRequest("/api/registration/LND-001", "GET", { Authorization: `Bearer ${officerRegToken}` });
        return res.statusCode === 200 && res.body.data;
    });

    await assertTest(21, "Land Use Officer Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "landuse@landgov.gov", password: "Pass123!Demo" });
        if (res.statusCode === 200 && res.body.token) officerLUToken = res.body.token;
        return res.statusCode === 200;
    });

    await assertTest(22, "Land Use Officer GET /api/land-use/LND-001 succeeds", async () => {
        const res = await makeRequest("/api/land-use/LND-001", "GET", { Authorization: `Bearer ${officerLUToken}` });
        return res.statusCode === 200 && res.body.data;
    });

    await assertTest(23, "Property Tax Officer Login with Valid Credentials", async () => {
        const res = await makeRequest("/api/auth/login", "POST", {}, { identifier: "tax@landgov.gov", password: "Pass123!Demo" });
        if (res.statusCode === 200 && res.body.token) officerTaxToken = res.body.token;
        return res.statusCode === 200;
    });

    await assertTest(24, "Property Tax Officer GET /api/property-tax/LND-001 succeeds", async () => {
        const res = await makeRequest("/api/property-tax/LND-001", "GET", { Authorization: `Bearer ${officerTaxToken}` });
        return res.statusCode === 200 && res.body.data;
    });

    // 4. ADMIN TESTS
    await assertTest(25, "Admin GET /api/parcels returns full list of parcels", async () => {
        const res = await makeRequest("/api/parcels", "GET", { Authorization: `Bearer ${adminToken}` });
        return res.statusCode === 200 && Array.isArray(res.body.data);
    });

    await assertTest(26, "Admin GET /api/admin/metrics succeeds", async () => {
        const res = await makeRequest("/api/admin/metrics", "GET", { Authorization: `Bearer ${adminToken}` });
        return res.statusCode === 200 && res.body.metrics;
    });

    await assertTest(27, "Admin GET /api/admin/officers succeeds", async () => {
        const res = await makeRequest("/api/admin/officers", "GET", { Authorization: `Bearer ${adminToken}` });
        return res.statusCode === 200 && Array.isArray(res.body.officers);
    });

    await assertTest(28, "Admin GET /api/admin/audit-logs succeeds", async () => {
        const res = await makeRequest("/api/admin/audit-logs", "GET", { Authorization: `Bearer ${adminToken}` });
        return res.statusCode === 200 && Array.isArray(res.body.logs);
    });

    // 5. PROPOSAL VALIDATION AUTHORIZATION TESTS
    await assertTest(29, "Citizen POST /api/proposals/validate for assigned parcel (LND-001) succeeds", async () => {
        const res = await makeRequest("/api/proposals/validate", "POST", { Authorization: `Bearer ${citizenToken}` }, {
            parcelId: "LND-001",
            proposal: { activityType: "RESIDENTIAL", developmentType: "NEW_BUILDING", proposedArea: 500 }
        });
        return res.statusCode === 200 && res.body.success;
    });

    await assertTest(30, "Citizen POST /api/proposals/validate for unassigned parcel (LND-002) returns 403", async () => {
        const res = await makeRequest("/api/proposals/validate", "POST", { Authorization: `Bearer ${citizenToken}` }, {
            parcelId: "LND-002",
            proposal: { activityType: "RESIDENTIAL", developmentType: "NEW_BUILDING", proposedArea: 500 }
        });
        return res.statusCode === 403;
    });

    console.log("\n==================================================");
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
    console.log("==================================================\n");

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error("Test execution error:", err);
    process.exit(1);
});
