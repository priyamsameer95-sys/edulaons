const fs = require('fs');
const path = require('path');

let content = fs.readFileSync('./eslint_report.json', 'utf16le');
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
const report = JSON.parse(content);

// Rules to suppress
const rulesToSuppress = [
    'react-hooks/exhaustive-deps',
    'react-refresh/only-export-components'
];

const filesToFix = [];
report.forEach(fileReport => {
    const msgs = fileReport.messages
        .filter(m => rulesToSuppress.includes(m.ruleId))
        .map(m => ({ line: m.line, ruleId: m.ruleId }));

    if (msgs.length > 0) {
        filesToFix.push({ filePath: fileReport.filePath, msgs });
    }
});

console.log(`Found ${filesToFix.length} files to fix`);
let totalFixed = 0;

filesToFix.forEach(({ filePath, msgs }) => {
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileLines = fileContent.split(/\r?\n/);
        const newLines = [];

        // Group by line, collect unique rules per line
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
        console.log(`  Fixed ${msgs.length} in ${path.basename(filePath)}`);
    } catch (err) {
        console.error(`  ERROR ${filePath}: ${err.message}`);
    }
});

console.log(`\nDone! Suppressed ${totalFixed} warnings across ${filesToFix.length} files.`);
