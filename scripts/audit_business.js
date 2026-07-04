const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeBusinessLogic() {
    const reportPath = path.join(__dirname, '..', 'docs', 'business_logic_audit.json');
    const apiDir = path.join(__dirname, '..', 'app', 'api');
    
    // Look for files related to bookings, folios, payments, night audit
    const criticalAreas = [
        'bookings',
        'folios',
        'payments',
        'night-audit'
    ];
    
    const analysis = {
        totalCriticalEndpointsFound: 0,
        missingTransactions: [],
        missingEventEmissions: [],
        missingRBAC: []
    };
    
    const allFiles = glob.sync('**/{route.ts,route.js}', { cwd: apiDir, absolute: true });
    
    for (const file of allFiles) {
        let isCritical = false;
        for (const area of criticalAreas) {
            if (file.includes(area)) {
                isCritical = true;
                break;
            }
        }
        
        if (!isCritical) continue;
        
        analysis.totalCriticalEndpointsFound++;
        const content = fs.readFileSync(file, 'utf8');
        const relativeFile = path.relative(path.join(__dirname, '..'), file);
        
        // 1. Check for Transactions (db.$transaction or prisma.$transaction)
        // If it's a mutation (POST/PUT/PATCH/DELETE), it probably should have a transaction
        if (/(POST|PUT|PATCH|DELETE)/.test(content) && !/\$transaction/.test(content)) {
            analysis.missingTransactions.push(relativeFile);
        }
        
        // 2. Check for Event Emissions (pusher, webhooks, outbox)
        // Critical mutations should emit events
        if (/(POST|PUT|PATCH|DELETE)/.test(content) && !/pusher|trigger|outbox|webhook/i.test(content)) {
            analysis.missingEventEmissions.push(relativeFile);
        }
        
        // 3. Check for RBAC / Auth
        if (!/getServerSession|requireAuth|checkRole|checkPermission|authOptions/i.test(content)) {
            analysis.missingRBAC.push(relativeFile);
        }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`Business logic audit complete. Analyzed ${analysis.totalCriticalEndpointsFound} critical endpoints.`);
}

analyzeBusinessLogic();
