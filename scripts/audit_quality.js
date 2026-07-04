const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeCodeQuality() {
    const reportPath = path.join(__dirname, '..', 'docs', 'code_quality_audit.json');
    const appDir = path.join(__dirname, '..', 'app');
    const componentsDir = path.join(__dirname, '..', 'components');
    const libDir = path.join(__dirname, '..', 'lib');
    
    const allFiles = [
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: appDir, absolute: true }),
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: componentsDir, absolute: true }),
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: libDir, absolute: true })
    ];
    
    const analysis = {
        todos: [],
        fixmes: [],
        hardcodedSecrets: [],
        consoleLogs: []
    };
    
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativeFile = path.relative(path.join(__dirname, '..'), file);
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (/TODO/i.test(line)) {
                analysis.todos.push(`${relativeFile}:${i+1} - ${line.trim()}`);
            }
            if (/FIXME/i.test(line)) {
                analysis.fixmes.push(`${relativeFile}:${i+1} - ${line.trim()}`);
            }
            if (/console\.log/i.test(line)) {
                analysis.consoleLogs.push(`${relativeFile}:${i+1} - ${line.trim()}`);
            }
            // Very naive check for hardcoded secrets / URLs
            if (/(password|secret|key|token|api_key)\s*=\s*['"][^'"]+['"]/i.test(line)) {
                // exclude process.env
                if (!/process\.env/.test(line)) {
                    analysis.hardcodedSecrets.push(`${relativeFile}:${i+1} - ${line.trim()}`);
                }
            }
            if (/(http:\/\/localhost|https:\/\/api\.sandbox)/i.test(line)) {
                analysis.hardcodedSecrets.push(`${relativeFile}:${i+1} - Hardcoded URL: ${line.trim()}`);
            }
        }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`Code quality audit complete.`);
}

analyzeCodeQuality();
