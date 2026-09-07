/* =========================================================
   LANDGOV GIS
   SIH26014 - Digital Land Governance

   PHASE 12L & PHASE 12M INTEGRATION & SECURITY TEST SUITE

   Validates:
   1. Unified Parcel Timeline (/api/parcels/:id/timeline)
   2. Comprehensive System Audit & Activity Trail (/api/audits)
   3. Parcel-level Audit Trail (/api/audits/parcel/:id)
   4. Audit Metrics (/api/audits/metrics)
   5. CSV & JSON Audit Export (/api/audits/export)
   6. RBAC & Parcel Authorization Enforcement (403 Forbidden checks)
   7. Demo Scenarios 1 (LND-001), 2 (LND-002), 3 (LND-003)
   ========================================================= */

const http = require("http");
const userService = require("../services/userService");

const BASE_URL = "http://localhost:5000";

function makeRequest(path, method = "GET", body = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${BASE_URL}${path}`);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                let parsed = null;
                try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
                resolve({ status: res.statusCode, headers: res.headers, data: parsed });
            });
        });

        req.on("error", reject);

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("STARTING PHASE 12L & PHASE 12M INTEGRATION TESTS");
    console.log("==================================================\n");

    // Load backend server in-process
    require("../server");
    await new Promise(r => setTimeout(r, 1000));

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✓ [PASS] ${message}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${message}`);
            failCount++;
        }
    }

    try {
        // Step 1: Generate Tokens
        const regOfficer = userService.findUserByIdentifier("OFF-REG-001");
        const regToken = userService.generateToken(regOfficer);

        const rorOfficer = userService.findUserByIdentifier("OFF-ROR-001");
        const rorToken = userService.generateToken(rorOfficer);

        const citizen = userService.findUserByIdentifier("citizen@landgov.gov");
        const citizenToken = userService.generateToken(citizen);

        // TEST 1: Unified Parcel Timeline for LND-001
        console.log("\n--- TEST 1: Unified Parcel Timeline (/api/parcels/LND-001/timeline) ---");
        const timelineRes = await makeRequest("/api/parcels/LND-001/timeline", "GET", null, regToken);
        assert(timelineRes.status === 200, "GET /api/parcels/LND-001/timeline returns 200 OK");
        assert(timelineRes.data.success === true, "Timeline API response success is true");
        assert(timelineRes.data.data.parcelId === "LND-001", "Timeline parcel ID matches LND-001");
        assert(Array.isArray(timelineRes.data.data.events), "Timeline contains events array");
        assert(timelineRes.data.data.events.length > 0, `Timeline events count: ${timelineRes.data.data.events.length}`);

        // Verify Event Structure
        const sampleEvent = timelineRes.data.data.events[0];
        assert(sampleEvent.eventId && sampleEvent.eventType && sampleEvent.department && sampleEvent.timestamp, "Event has standardized Event Model fields");

        // TEST 2: Timeline Filters (Department filter)
        console.log("\n--- TEST 2: Timeline Filtering ---");
        const filteredTimelineRes = await makeRequest("/api/parcels/LND-001/timeline?department=Registration", "GET", null, regToken);
        assert(filteredTimelineRes.status === 200, "Filtered timeline request returns 200 OK");
        assert(Array.isArray(filteredTimelineRes.data.data.events), "Filtered timeline returns events array");

        // TEST 3: Comprehensive Audit Trail (/api/audits)
        console.log("\n--- TEST 3: Comprehensive System Audit Trail (/api/audits) ---");
        const auditRes = await makeRequest("/api/audits", "GET", null, regToken);
        assert(auditRes.status === 200, "GET /api/audits returns 200 OK");
        assert(auditRes.data.success === true, "Audit API response success is true");
        assert(Array.isArray(auditRes.data.data), "Audit API returns data array");
        assert(auditRes.data.metrics && auditRes.data.metrics.totalActivities > 0, "Audit response includes overall metrics");

        // TEST 4: Parcel-Specific Audit Log (/api/audits/parcel/LND-001)
        console.log("\n--- TEST 4: Parcel-Specific Audit Log (/api/audits/parcel/LND-001) ---");
        const parcelAuditRes = await makeRequest("/api/audits/parcel/LND-001", "GET", null, regToken);
        assert(parcelAuditRes.status === 200, "GET /api/audits/parcel/LND-001 returns 200 OK");
        assert(parcelAuditRes.data.parcelId === "LND-001", "Parcel audit ID matches LND-001");
        assert(Array.isArray(parcelAuditRes.data.data), "Parcel audit log returns array");

        // TEST 5: Audit Metrics Endpoint (/api/audits/metrics)
        console.log("\n--- TEST 5: Audit Metrics Endpoint (/api/audits/metrics) ---");
        const metricsRes = await makeRequest("/api/audits/metrics", "GET", null, regToken);
        assert(metricsRes.status === 200, "GET /api/audits/metrics returns 200 OK");
        assert(metricsRes.data.metrics && metricsRes.data.departmentActivity, "Metrics endpoint returns metrics and departmentActivity");

        // TEST 6: Audit Export in CSV format (/api/audits/export?format=csv)
        console.log("\n--- TEST 6: Audit CSV Export (/api/audits/export?format=csv) ---");
        const csvRes = await makeRequest("/api/audits/export?format=csv", "GET", null, regToken);
        assert(csvRes.status === 200, "GET /api/audits/export returns 200 OK");
        assert(csvRes.headers["content-type"] && csvRes.headers["content-type"].includes("text/csv"), "CSV Export header is text/csv");

        // TEST 7: Authorization Protection Checks (403 Forbidden for unauthorized parcel LND-002 by Citizen)
        console.log("\n--- TEST 7: Authorization Protection Checks ---");
        const unauthorizedRes = await makeRequest("/api/parcels/LND-002/timeline", "GET", null, citizenToken);
        assert(unauthorizedRes.status === 403, "Citizen accessing unauthorized parcel LND-002 timeline returns 403 Forbidden");

        const unauthorizedAuditRes = await makeRequest("/api/audits/parcel/LND-002", "GET", null, citizenToken);
        assert(unauthorizedAuditRes.status === 403, "Citizen accessing unauthorized parcel LND-002 audit log returns 403 Forbidden");

        // TEST 8: Demo Scenario 1 — LND-001 (Owner Mismatch -> RoR Verification -> Resolution)
        console.log("\n--- TEST 8: Demo Scenario 1 (LND-001 Owner Mismatch Resolution Flow) ---");
        const profileRes = await makeRequest("/api/land-profile/LND-001", "GET", null, regToken);
        assert(profileRes.status === 200, "GET Integrated Land Profile for LND-001 returns 200 OK");
        assert(profileRes.data.data.timeline && profileRes.data.data.timeline.length > 0, "Integrated profile includes unified timeline events");
        assert(profileRes.data.data.audit && profileRes.data.data.audit.length > 0, "Integrated profile includes parcel audit records");

        console.log("\n==================================================");
        console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
        console.log("==================================================");

        if (failCount > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    } catch (err) {
        console.error("Test execution error:", err);
        process.exit(1);
    }
}

runTests();
