/* =========================================================
   LANDGOV GIS
   PHASE 11F — INTER-DEPARTMENTAL PARCEL VERIFICATION TEST SUITE
   ========================================================= */

const http = require("http");

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body });
                }
            });
        });
        req.on("error", reject);
        if (postData) {
            req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
        }
        req.end();
    });
}

async function runTests() {
    console.log("=========================================");
    console.log("RUNNING PHASE 11F INTER-DEPARTMENTAL REQUEST TEST SUITE");
    console.log("=========================================\n");

    const host = "localhost";
    const port = 5000;

    // Credentials for testing officers
    const regToken = "OFF-REG-001";
    const cadToken = "OFF-CAD-001";
    const rorToken = "OFF-ROR-001";
    const taxToken = "OFF-TAX-001";

    let createdReqId = null;

    try {
        // TEST 1: Registration Officer creates Cadastral verification request for LND-003
        console.log("TEST 1: Creating Cadastral Verification Request (Registration -> Cadastral)...");
        const res1 = await makeRequest({
            host, port, path: "/api/department-requests", method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regToken}`
            }
        }, {
            parcelId: "LND-003",
            toDepartment: "Cadastral & Survey Department",
            requestType: "VERIFY",
            requiredWork: "VERIFY_BOUNDARY",
            priority: "NORMAL",
            reason: "Verify boundary for deed registration approval."
        });

        console.log(`Response Status: ${res1.status}`);
        console.log(`Response Body:`, JSON.stringify(res1.body, null, 2));

        if (res1.status !== 201 || !res1.body.success) {
            throw new Error("TEST 1 FAILED: Could not create request.");
        }
        createdReqId = res1.body.data.requestId;
        console.log(`✓ TEST 1 PASSED: Created Request ${createdReqId}\n`);

        // TEST 2: Duplicate request prevention
        console.log("TEST 2: Attempting Duplicate Request (Same parcel, target, and work)...");
        const res2 = await makeRequest({
            host, port, path: "/api/department-requests", method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regToken}`
            }
        }, {
            parcelId: "LND-003",
            toDepartment: "Cadastral & Survey Department",
            requestType: "VERIFY",
            requiredWork: "VERIFY_BOUNDARY",
            priority: "NORMAL",
            reason: "Duplicate attempt."
        });

        console.log(`Response Status: ${res2.status} (Expected 409)`);
        console.log(`Response Body:`, JSON.stringify(res2.body));

        if (res2.status !== 409 && res2.status !== 400) {
            throw new Error(`TEST 2 FAILED: Expected 409 Conflict, got ${res2.status}`);
        }
        console.log("✓ TEST 2 PASSED: Duplicate request rejected.\n");

        // TEST 3: Unauthorized Officer tries to accept request (Tax officer trying to accept Cadastral request)
        console.log("TEST 3: Unauthorized Department Acceptance Attempt (Tax Officer accepting Cadastral Request)...");
        const res3 = await makeRequest({
            host, port, path: `/api/department-requests/${createdReqId}/accept`, method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${taxToken}`
            }
        });

        console.log(`Response Status: ${res3.status} (Expected 403)`);
        console.log(`Response Body:`, JSON.stringify(res3.body));

        if (res3.status !== 403) {
            throw new Error(`TEST 3 FAILED: Expected 403 Forbidden, got ${res3.status}`);
        }
        console.log("✓ TEST 3 PASSED: Unauthorized officer blocked.\n");

        // TEST 4: Authorized Cadastral Officer accepts request
        console.log("TEST 4: Authorized Cadastral Officer Accepts Request...");
        const res4 = await makeRequest({
            host, port, path: `/api/department-requests/${createdReqId}/accept`, method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cadToken}`
            }
        });

        console.log(`Response Status: ${res4.status}`);
        console.log(`New Status:`, res4.body.data ? res4.body.data.status : "N/A");

        if (res4.status !== 200 || res4.body.data.status !== "ACCEPTED") {
            throw new Error("TEST 4 FAILED: Could not accept request.");
        }
        console.log("✓ TEST 4 PASSED: Request ACCEPTED.\n");

        // TEST 5: Cadastral Officer begins work
        console.log("TEST 5: Cadastral Officer Begins Work...");
        const res5 = await makeRequest({
            host, port, path: `/api/department-requests/${createdReqId}/start`, method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cadToken}`
            }
        });

        if (res5.status !== 200 || res5.body.data.status !== "IN_PROGRESS") {
            throw new Error("TEST 5 FAILED: Could not start work.");
        }
        console.log("✓ TEST 5 PASSED: Request IN_PROGRESS.\n");

        // TEST 6: Cadastral Officer completes request with VERIFIED result
        console.log("TEST 6: Cadastral Officer Completes Verification...");
        const res6 = await makeRequest({
            host, port, path: `/api/department-requests/${createdReqId}/complete`, method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${cadToken}`
            }
        }, {
            result: "VERIFIED",
            remarks: "Cadastral boundary matches GIS master dataset perfectly.",
            informationProvided: "North: Road, South: Plot SUR-102, East: Drain, West: Govt Reserve.",
            supportingDocument: "DOC-CAD-2026-99"
        });

        console.log(`Response Status: ${res6.status}`);
        console.log(`Response Data:`, JSON.stringify(res6.body.data.response, null, 2));

        if (res6.status !== 200 || res6.body.data.status !== "COMPLETED") {
            throw new Error("TEST 6 FAILED: Could not complete request.");
        }
        console.log("✓ TEST 6 PASSED: Request COMPLETED with response.\n");

        // TEST 7: Property Tax Clearance Request (Registration -> Tax) with NOT_CLEARED result
        console.log("TEST 7: Property Tax Clearance Flow (Registration -> Tax Officer)...");
        const res7a = await makeRequest({
            host, port, path: "/api/department-requests", method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regToken}`
            }
        }, {
            parcelId: "LND-003",
            toDepartment: "Property Tax & Municipal Department",
            requestType: "CLEARANCE",
            requiredWork: "PROPERTY_TAX_CLEARANCE",
            priority: "URGENT",
            reason: "Verify tax clearance for pending registration."
        });

        const taxReqId = res7a.body.data.requestId;

        // Tax Officer accepts and completes with NOT_CLEARED
        await makeRequest({
            host, port, path: `/api/department-requests/${taxReqId}/accept`, method: "PUT",
            headers: { "Authorization": `Bearer ${taxToken}` }
        });

        const res7b = await makeRequest({
            host, port, path: `/api/department-requests/${taxReqId}/complete`, method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${taxToken}`
            }
        }, {
            result: "NOT_CLEARED",
            remarks: "Outstanding municipal dues of ₹12,500 pending.",
            informationProvided: "Outstanding amount ₹12,500 due for FY 2025-26."
        });

        console.log(`Tax Request ${taxReqId} Result: ${res7b.body.data.response.result}`);
        console.log(`Tax Remarks: ${res7b.body.data.response.remarks}`);

        if (res7b.body.data.response.result !== "NOT_CLEARED") {
            throw new Error("TEST 7 FAILED: Result should be NOT_CLEARED.");
        }
        console.log("✓ TEST 7 PASSED: Tax clearance failure handling working.\n");

        // TEST 8: Parcel Authorization Check for Unauthorized Parcel
        console.log("TEST 8: Parcel Authorization Check (Unauthorized Parcel LND-999)...");
        const res8 = await makeRequest({
            host, port, path: "/api/department-requests", method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${regToken}`
            }
        }, {
            parcelId: "LND-999",
            toDepartment: "Cadastral & Survey Department",
            requestType: "VERIFY",
            requiredWork: "VERIFY_BOUNDARY",
            priority: "NORMAL",
            reason: "Unauthorized parcel check."
        });

        console.log(`Response Status: ${res8.status} (Expected 403)`);
        if (res8.status !== 403) {
            throw new Error(`TEST 8 FAILED: Expected 403 Forbidden, got ${res8.status}`);
        }
        console.log("✓ TEST 8 PASSED: Unauthorized parcel access blocked.\n");

        console.log("=========================================");
        console.log("ALL PHASE 11F TESTS PASSED SUCCESSFULLY!");
        console.log("=========================================");

    } catch (e) {
        console.error("\n❌ TEST SUITE ERROR:", e.message);
        process.exit(1);
    }
}

runTests();
