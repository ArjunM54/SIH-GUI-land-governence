const fs = require('fs');

function buildValidPdf(textLines) {
    const streamContent = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n` +
        textLines.map(line => `(${line.replace(/[()]/g, '')}) '`).join('\n') +
        `\nET\n`;

    const bodyParts = [];
    bodyParts.push('%PDF-1.4\n');

    const offsets = [];

    function addObj(str) {
        const currentOffset = bodyParts.reduce((acc, p) => acc + Buffer.byteLength(p, 'utf8'), 0);
        offsets.push(currentOffset);
        bodyParts.push(str + '\n');
    }

    addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');
    addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj');
    addObj('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj');
    addObj('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
    addObj(`5 0 obj\n<< /Length ${Buffer.byteLength(streamContent, 'utf8')} >>\nstream\n${streamContent}endstream\nendobj`);

    const startXref = bodyParts.reduce((acc, p) => acc + Buffer.byteLength(p, 'utf8'), 0);

    let xrefStr = `xref\n0 6\n0000000000 65535 f \n`;
    for (let i = 0; i < 5; i++) {
        xrefStr += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    }
    xrefStr += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`;

    bodyParts.push(xrefStr);
    return Buffer.from(bodyParts.join(''), 'utf8');
}

const pdfBuf = buildValidPdf([
    "GOVERNMENT OF TAMIL NADU REVENUE DEPARTMENT",
    "RECORD OF RIGHTS - PATTA PASSBOOK EVIDENCE",
    "Survey No: SUR-103 Parcel ID: LND-003 District: Coimbatore",
    "Land Ownership Verification: Validated Title Holder",
    "Status: AVAILABLE"
]);

fs.writeFileSync('scratch/text-sample.pdf', pdfBuf);

async function testPdfParse() {
    const pdfParse = require('../backend/node_modules/pdf-parse');
    const parsed = await pdfParse(pdfBuf);
    console.log("PDF Parse Test Output:\n", parsed.text);
}

testPdfParse().catch(err => console.error("PDF test error:", err));
