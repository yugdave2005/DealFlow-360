const fs = require('fs');
const pdfParse = require('pdf-parse');
const filePath = 'd:\\\\PCC 2026 Problem Statements & Template\\\\DealFlow360.pdf';
let dataBuffer = fs.readFileSync(filePath);

const parse = typeof pdfParse === 'function' ? pdfParse : (pdfParse.default || pdfParse.pdf);
try {
    parse(dataBuffer).then(function(data) {
        console.log(data.text);
    }).catch(function(error) {
        console.error("Parse error:", error);
    });
} catch (e) {
    console.error("Sync error:", e, Object.keys(pdfParse));
}
