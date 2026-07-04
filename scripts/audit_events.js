const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeEvents() {
    const reportPath = path.join(__dirname, '..', 'docs', 'event_audit.json');
    const appDir = path.join(__dirname, '..', 'app');
    const libDir = path.join(__dirname, '..', 'lib');
    
    const allFiles = [
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: appDir, absolute: true }),
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: libDir, absolute: true })
    ];
    
    const analysis = {
        pusherTriggers: [],
        webhookEmitters: [],
        outboxUsage: [],
        deadLetters: []
    };
    
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const relativeFile = path.relative(path.join(__dirname, '..'), file);
        
        if (/pusher\.trigger/i.test(content)) {
            analysis.pusherTriggers.push(relativeFile);
        }
        if (/webhook/i.test(content) && /fetch|axios|post/i.test(content)) {
            analysis.webhookEmitters.push(relativeFile);
        }
        if (/db\.outbox/i.test(content) || /prisma\.outbox/i.test(content)) {
            analysis.outboxUsage.push(relativeFile);
        }
        if (/dlq|dead[\s-]*letter/i.test(content)) {
            analysis.deadLetters.push(relativeFile);
        }
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    console.log(`Event audit complete.`);
}

analyzeEvents();
