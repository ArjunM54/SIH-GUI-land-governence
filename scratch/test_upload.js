const fs = require('fs');
const path = require('path');

async function runTests() {
    console.log("=== PHASE 9 BACKEND API TESTS ===");

    // 1. Test Valid PDF Upload
    console.log("\n[Test 1] Uploading PDF to LND-003...");
    const formData = new FormData();
    formData.append("parcelId", "LND-003");
    formData.append("documentType", "OWNERSHIP");
    formData.append("documentNumber", "ROR-UPLOAD-2026");
    formData.append("title", "Uploaded Record of Rights Evidence");
    formData.append("issuingDepartment", "Revenue Department");
    formData.append("issueDate", "2026-09-02");
    formData.append("description", "Uploaded PDF evidence file for parcel LND-003.");

    const pdfBuffer = fs.readFileSync(path.resolve(__dirname, "text-sample.pdf"));
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("file", blob, "text-sample.pdf");

    const res1 = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        body: formData
    });
    const data1 = await res1.json();
    console.log("Upload HTTP Status:", res1.status);
    console.log("Upload Response:", JSON.stringify(data1, null, 2));

    const uploadedDocId = data1.document ? data1.document.documentId : null;

    // 2. Test Invalid Parcel Upload
    console.log("\n[Test 2] Uploading to non-existent parcel LND-999...");
    const formData2 = new FormData();
    formData2.append("parcelId", "LND-999");
    formData2.append("documentType", "OWNERSHIP");
    formData2.append("file", blob, "test-document.pdf");

    const res2 = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        body: formData2
    });
    const data2 = await res2.json();
    console.log("Invalid Parcel HTTP Status:", res2.status);
    console.log("Response:", JSON.stringify(data2, null, 2));

    // 3. Test Invalid File Extension / Mime Type
    console.log("\n[Test 3] Uploading disallowed file type (.exe)...");
    const formData3 = new FormData();
    formData3.append("parcelId", "LND-003");
    formData3.append("documentType", "OWNERSHIP");
    const exeBlob = new Blob(["echo dangerous"], { type: "application/x-msdownload" });
    formData3.append("file", exeBlob, "script.exe");

    const res3 = await fetch("http://localhost:5000/api/documents/upload", {
        method: "POST",
        body: formData3
    });
    const data3 = await res3.json();
    console.log("Disallowed File HTTP Status:", res3.status);
    console.log("Response:", JSON.stringify(data3, null, 2));

    // 4. Test GET Document File Stream
    if (uploadedDocId) {
        console.log(`\n[Test 4] Streaming uploaded file GET /api/documents/${uploadedDocId}/file...`);
        const res4 = await fetch(`http://localhost:5000/api/documents/${uploadedDocId}/file`);
        console.log("File Stream HTTP Status:", res4.status);
        console.log("Content-Type Header:", res4.headers.get("content-type"));
        const bytes = await res4.arrayBuffer();
        console.log("Streamed Bytes Length:", bytes.byteLength);
    }

    // 5. Test Audit Integration after Upload
    console.log("\n[Test 5] Validating proposal for LND-003 after document upload...");
    const res5 = await fetch("http://localhost:5000/api/proposals/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            parcelId: "LND-003",
            proposal: { activityType: "AGRICULTURAL", developmentType: "EXTENSION" }
        })
    });
    const data5 = await res5.json();
    console.log("Proposal Audit Reference:", data5.auditId);
    
    if (data5.auditId) {
        const res6 = await fetch(`http://localhost:5000/api/audits/${data5.auditId}`);
        const data6 = await res6.json();
        console.log("Audit Evidence Document IDs:", data6.data.evidence.documentIds);
    }

    console.log("\n=== TESTS COMPLETED ===");
}

runTests().catch(err => console.error("Test execution failed:", err));
