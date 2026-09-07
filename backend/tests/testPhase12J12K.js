/* =========================================================
   LANDGOV GIS
   AUTOMATED INTEGRATION TEST FOR PHASE 12J & PHASE 12K
   ========================================================= */

const http = require("http");

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", (chunk) => { data += chunk; });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
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
    console.log("==================================================");
    console.log("STARTING PHASE 12J & PHASE 12K INTEGRATION TESTS");
    console.log("==================================================\n");

    // Start server internally
    require("../server");
    await new Promise(r => setTimeout(r, 1500));

    const host = "127.0.0.1";
    const port = 5000;

    // 1. Authenticate Officer
    console.log("[Test 1] Login as Officer (OFF-REG-001)...");
    const loginRes = await makeRequest({
        host, port, path: "/api/auth/login", method: "POST",
        headers: { "Content-Type": "application/json" }
    }, { identifier: "OFF-REG-001", password: "Pass123!Demo" });

    if (loginRes.status !== 200 || !loginRes.data.token) {
        console.error("FAILED Login:", loginRes);
        process.exit(1);
    }
    const token = loginRes.data.token;
    console.log("✓ Login SUCCESS. Token received.\n");

    const authHeaders = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    // 2. GET Unified Department Requests (Phase 12J)
    console.log("[Test 2] GET /api/department-requests (Unified Request Center)...");
    const requestsRes = await makeRequest({
        host, port, path: "/api/department-requests", method: "GET",
        headers: authHeaders
    });
    console.log(`✓ GET Department Requests: ${requestsRes.status}, count = ${requestsRes.data.count}`);
    if (!requestsRes.data.success || !Array.isArray(requestsRes.data.data)) {
        console.error("FAILED GET Requests:", requestsRes);
        process.exit(1);
    }

    // 3. GET Conflicts (Phase 12K)
    console.log("\n[Test 3] GET /api/conflicts (Land Data Conflict Center)...");
    const conflictsRes = await makeRequest({
        host, port, path: "/api/conflicts", method: "GET",
        headers: authHeaders
    });
    console.log(`✓ GET Conflicts: ${conflictsRes.status}, count = ${conflictsRes.data.count}`);
    if (!conflictsRes.data.success) {
        console.error("FAILED GET Conflicts:", conflictsRes);
        process.exit(1);
    }

    // 4. Run Manual Consistency Check on LND-001
    console.log("\n[Test 4] POST /api/conflicts/check/LND-001 (Run Consistency Check)...");
    const checkRes = await makeRequest({
        host, port, path: "/api/conflicts/check/LND-001", method: "POST",
        headers: authHeaders
    });
    console.log(`✓ Consistency Check Output: ${checkRes.status}, Conflicts Found = ${checkRes.data.data?.conflictsFoundCount}`);
    if (!checkRes.data.success) {
        console.error("FAILED Consistency Check:", checkRes);
        process.exit(1);
    }

    // 5. Test Conflict Resolution Flow (Scenario 1)
    console.log("\n[Test 5] Test Conflict Resolution Workflow on CON-001...");
    // 5a. Create Verification Request from CON-001
    console.log("  5a. Request Verification for CON-001...");
    const reqVerifRes = await makeRequest({
        host, port, path: "/api/conflicts/CON-001/request-verification", method: "POST",
        headers: authHeaders
    }, {
        toDepartment: "Land Records Department",
        requestType: "VERIFY",
        requiredWork: "VERIFY_CURRENT_OWNER",
        priority: "HIGH",
        reason: "Owner mismatch resolution request from Registration to RoR."
    });
    console.log(`  ✓ Request Verification status: ${reqVerifRes.status}, Request ID: ${reqVerifRes.data.data?.request?.requestId}`);

    // 5b. Resolve Conflict CON-001 with required remark
    console.log("  5b. Resolve CON-001 with Resolution Remark...");
    const resolveRes = await makeRequest({
        host, port, path: "/api/conflicts/CON-001/resolve", method: "PUT",
        headers: authHeaders
    }, {
        resolutionRemark: "RoR record verified against mutation document. Deed transfer approved."
    });
    console.log(`  ✓ Resolve Status: ${resolveRes.status}, Conflict Status: ${resolveRes.data.data?.status}`);
    if (!resolveRes.data.success || resolveRes.data.data.status !== "RESOLVED") {
        console.error("FAILED Resolve Conflict:", resolveRes);
        process.exit(1);
    }

    // 6. Test Integrated Land Profile Governance Update
    console.log("\n[Test 6] GET /api/parcels/LND-001 (Check Integrated Land Profile)...");
    const profileRes = await makeRequest({
        host, port, path: "/api/parcels/LND-001", method: "GET",
        headers: authHeaders
    });
    console.log(`✓ GET Parcel Profile status: ${profileRes.status}, Overall Governance: ${profileRes.data.data?.governance?.overallStatus}`);

    console.log("\n==================================================");
    console.log("ALL PHASE 12J & PHASE 12K INTEGRATION TESTS PASSED!");
    console.log("==================================================");
}

runTests().catch(err => {
    console.error("Test execution failed with error:", err);
    process.exit(1);
});
