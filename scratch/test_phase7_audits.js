/* =========================================================
   PHASE 7 BACKEND AUDIT TRAIL TEST SUITE
   ========================================================= */

const http = require('http');

// Helper for HTTP JSON requests
function makeRequest(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (err) => reject(err));
        if (payload) req.write(payload);
        req.end();
    });
}

async function runTests() {
    console.log("==================================================");
    console.log("STARTING PHASE 7 AUDIT TRAIL BACKEND TESTS");
    console.log("==================================================\n");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passCount++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failCount++;
        }
    }

    try {
        // 1. Check server health
        const health = await makeRequest('GET', '/api/health');
        assert(health.status === 200 && health.body.status === 'healthy', 'Server health check passed');

        // 2. Validate proposal for LND-001 (Valid POST request)
        const val1 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: {
                activityType: 'RESIDENTIAL',
                developmentType: 'NEW_BUILDING',
                proposedArea: 1500
            }
        });

        assert(val1.status === 200, 'POST /api/proposals/validate returned status 200');
        assert(val1.body.success === true, 'Response contains success: true');
        assert(typeof val1.body.auditId === 'string' && val1.body.auditId.startsWith('AUD-'), `Generated audit ID: ${val1.body.auditId}`);
        const auditId1 = val1.body.auditId;

        // 3. GET /api/audits/:auditId
        const auditRecord = await makeRequest('GET', `/api/audits/${auditId1}`);
        assert(auditRecord.status === 200, `GET /api/audits/${auditId1} returned 200`);
        assert(auditRecord.body.data.auditId === auditId1, 'Audit record auditId matches requested ID');
        assert(auditRecord.body.data.parcelId === 'LND-001', 'Audit record parcelId matches LND-001');
        assert(Array.isArray(auditRecord.body.data.evidence.categories), 'Audit record contains evidence categories array');
        assert(auditRecord.body.data.evidence.categories.length > 0, `Evidence categories present: ${auditRecord.body.data.evidence.categories.join(', ')}`);
        assert(typeof auditRecord.body.data.createdAt === 'string', `Audit record createdAt timestamp present: ${auditRecord.body.data.createdAt}`);

        // 4. Validate proposal for LND-002 and LND-003
        const val2 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-002',
            proposal: {
                activityType: 'COMMERCIAL',
                developmentType: 'CHANGE_OF_USE',
                proposedArea: 2000
            }
        });
        const auditId2 = val2.body.auditId;

        const val3 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: {
                activityType: 'AGRICULTURAL',
                developmentType: 'OTHER',
                proposedArea: 500
            }
        });
        const auditId3 = val3.body.auditId;

        assert(auditId1 !== auditId2 && auditId2 !== auditId3, `Unique incremental audit IDs generated: ${auditId1}, ${auditId2}, ${auditId3}`);

        // 5. GET /api/audits/parcel/LND-001 (Parcel History)
        const history1 = await makeRequest('GET', '/api/audits/parcel/LND-001');
        assert(history1.status === 200, 'GET /api/audits/parcel/LND-001 returned 200');
        assert(history1.body.count === 2, `Parcel LND-001 history count is 2 (actual: ${history1.body.count})`);
        assert(history1.body.data[0].auditId === auditId3, 'Parcel history ordered newest first (AUD-00003 is first)');

        // 6. GET /api/audits (List Audits)
        const allAudits = await makeRequest('GET', '/api/audits?limit=20');
        assert(allAudits.status === 200, 'GET /api/audits returned 200');
        assert(allAudits.body.count >= 3, `List audits count >= 3 (actual: ${allAudits.body.count})`);

        // 7. INVALID REQUEST TESTS (Should NOT create audit records)
        const initialCount = allAudits.body.count;

        // 7a. Invalid parcel
        const inv1 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'INVALID_PARCEL_9999',
            proposal: { activityType: 'RESIDENTIAL', developmentType: 'NEW_BUILDING' }
        });
        assert(inv1.status === 404, 'Invalid parcel returns 404');

        // 7b. Missing proposal
        const inv2 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001'
        });
        assert(inv2.status === 400, 'Missing proposal returns 400');

        // 7c. Invalid activity type
        const inv3 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: { activityType: 'INVALID_ACTIVITY', developmentType: 'NEW_BUILDING' }
        });
        assert(inv3.status === 400, 'Invalid activityType returns 400');

        // 7d. Invalid development type
        const inv4 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: { activityType: 'RESIDENTIAL', developmentType: 'INVALID_DEV_TYPE' }
        });
        assert(inv4.status === 400, 'Invalid developmentType returns 400');

        // 7e. Negative proposedArea
        const inv5 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: { activityType: 'RESIDENTIAL', developmentType: 'NEW_BUILDING', proposedArea: -500 }
        });
        assert(inv5.status === 400, 'Negative proposedArea returns 400');

        // 7f. Non-numeric proposedArea
        const inv6 = await makeRequest('POST', '/api/proposals/validate', {
            parcelId: 'LND-001',
            proposal: { activityType: 'RESIDENTIAL', developmentType: 'NEW_BUILDING', proposedArea: 'NOT_A_NUMBER' }
        });
        assert(inv6.status === 400, 'Non-numeric proposedArea returns 400');

        // Verify count didn't increase after invalid requests
        const afterInvalidAudits = await makeRequest('GET', '/api/audits?limit=20');
        assert(afterInvalidAudits.body.count === initialCount, `No audit records created for invalid requests (count stayed ${initialCount})`);

        // 8. Test 404 for non-existent audit ID
        const nonExistentAudit = await makeRequest('GET', '/api/audits/AUD-99999');
        assert(nonExistentAudit.status === 404, 'GET /api/audits/AUD-99999 returns 404');

        console.log("\n==================================================");
        console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
        console.log("==================================================");

    } catch (err) {
        console.error("Test error:", err);
    }
}

runTests();
