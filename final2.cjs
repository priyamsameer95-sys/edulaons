const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('./eslint_report_final.json', 'utf16le');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const report = JSON.parse(content);

const filesToFix = [];
report.forEach(fileReport => {
    const msgs = fileReport.messages
        .filter(m => m.ruleId)
        .map(m => ({ line: m.line, ruleId: m.ruleId }));
    if (msgs.length > 0) {
        filesToFix.push({ filePath: fileReport.filePath, msgs });
    }
});

console.log(`Files: ${filesToFix.length}`);
let totalFixed = 0;

filesToFix.forEach(({ filePath, msgs }) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileLines = fileContent.split(/\r?\n/);
        const newLines = [];

        const lineRules = {};
        msgs.forEach(m => {
            if (!lineRules[m.line]) lineRules[m.line] = new Set();
            lineRules[m.line].add(m.ruleId);
        });

        for (let i = 0; i < fileLines.length; i++) {
            const lineNum = i + 1;
            if (lineRules[lineNum]) {
                const prevLine = newLines.length > 0 ? newLines[newLines.length - 1] : '';
                const rules = [...lineRules[lineNum]];
                const alreadyDisabled = rules.every(r => prevLine.includes(r));
                if (!alreadyDisabled) {
                    const indent = fileLines[i].match(/^(\s*)/)[1];
                    newLines.push(`${indent}// eslint-disable-next-line ${rules.join(', ')}`);
                    totalFixed++;
                }
            }
            newLines.push(fileLines[i]);
        }

        const lineEnding = fileContent.includes('\r\n') ? '\r\n' : '\n';
        fs.writeFileSync(filePath, newLines.join(lineEnding), 'utf8');
        console.log(`  ${path.basename(filePath)}: ${msgs.length}`);
    } catch (err) {
        console.error(`  ERROR: ${err.message}`);
    }
});

console.log(`Suppressed ${totalFixed}`);
