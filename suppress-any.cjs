/**
 * Script to suppress @typescript-eslint/no-explicit-any ESLint errors
 * by inserting eslint-disable-next-line comments above each occurrence.
 */
const fs = require('fs');
const path = require('path');

// Read the eslint report
let content = fs.readFileSync('./eslint_report.json', 'utf16le');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const report = JSON.parse(content);

// Collect all files with no-explicit-any errors
const filesToFix = [];
report.forEach(fileReport => {
    const anyMessages = fileReport.messages
        .filter(m => m.ruleId === '@typescript-eslint/no-explicit-any')
        .map(m => m.line);

    if (anyMessages.length > 0) {
        filesToFix.push({
            filePath: fileReport.filePath,
            lines: [...new Set(anyMessages)].sort((a, b) => a - b)
        });
    }
});

console.log(`Found ${filesToFix.length} files with no-explicit-any errors`);

let totalFixed = 0;

filesToFix.forEach(({ filePath, lines }) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileLines = fileContent.split(/\r?\n/);
        const newLines = [];
        const lineSet = new Set(lines);

        for (let i = 0; i < fileLines.length; i++) {
            const lineNum = i + 1;

            if (lineSet.has(lineNum)) {
                const prevLine = newLines.length > 0 ? newLines[newLines.length - 1] : '';
                if (!prevLine.includes('eslint-disable') || !prevLine.includes('no-explicit-any')) {
                    const indent = fileLines[i].match(/^(\s*)/)[1];
                    newLines.push(`${indent}// eslint-disable-next-line @typescript-eslint/no-explicit-any`);
                    totalFixed++;
                }
            }

            newLines.push(fileLines[i]);
        }

        const lineEnding = fileContent.includes('\r\n') ? '\r\n' : '\n';
        fs.writeFileSync(filePath, newLines.join(lineEnding), 'utf8');
        console.log(`  Fixed ${lines.length} in ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`  ERROR ${filePath}: ${err.message}`);
    }
});

console.log(`\nDone! Suppressed ${totalFixed} warnings across ${filesToFix.length} files.`);
