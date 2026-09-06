const fs = require('fs');

const auditFile = fs.readFileSync('audit.json', 'utf8');
const audit = JSON.parse(auditFile);

const overrides = {};
const directUpgrades = {};

for (const [advisoryId, vuln] of Object.entries(audit.vulnerabilities)) {
    if (vuln.isDirect) {
        directUpgrades[vuln.name] = vuln.target; // If there is a target version? Actually let's just get the package and the highest vulnerable version or something
    } else {
        const severity = vuln.severity;
        if (severity === 'high' || severity === 'critical' || severity === 'moderate') {
            // Find what depends on it
            // usually overrides in package.json is just "packagename": "new-version"
        }
    }
}

const res = {
    vulnerabilities: Object.keys(audit.vulnerabilities).map(v => {
        return {
            name: v,
            severity: audit.vulnerabilities[v].severity,
            fixAvailable: audit.vulnerabilities[v].fixAvailable,
            via: audit.vulnerabilities[v].via,
            isDirect: audit.vulnerabilities[v].isDirect
        }
    })
};

fs.writeFileSync('audit-parsed.json', JSON.stringify(res, null, 2));
console.log(`Found ${res.vulnerabilities.length} vulnerabilities`);
