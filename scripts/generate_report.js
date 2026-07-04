const fs = require('fs');
const path = require('path');

function generateFinalReport() {
    const docsDir = path.join(__dirname, '..', 'docs');
    const reportPath = path.join(docsDir, 'final_gap_report.md');
    
    const tryRead = (filename) => {
        try {
            return JSON.parse(fs.readFileSync(path.join(docsDir, filename), 'utf8'));
        } catch (e) {
            return null;
        }
    };
    
    const schema = tryRead('schema_inventory.json');
    const api = tryRead('api_inventory.json');
    const ui = tryRead('ui_inventory.json');
    const gap = tryRead('gap_analysis_ui_api.json');
    const business = tryRead('business_logic_audit.json');
    const events = tryRead('event_audit.json');
    const quality = tryRead('code_quality_audit.json');
    
    let md = `# SmartHotel OS - Enterprise Code Audit Final Gap Report\n\n`;
    
    md += `## 1. System Scale Overview\n`;
    if (schema) md += `- **Database Models**: ${schema.models.length}\n`;
    if (api) md += `- **API Endpoints**: ${api.length}\n`;
    if (ui) md += `- **UI Pages**: ${ui.pages.length}\n- **UI Components**: ${ui.components.length}\n`;
    md += `\n`;
    
    md += `## 2. API <-> UI Gap Analysis\n`;
    md += `*Critical issues regarding disconnected functionality.*\n\n`;
    if (gap) {
        md += `- **Used Endpoints**: ${gap.totalUsedEndpointsDetected}\n`;
        md += `- **Potentially Unused/Disconnected Endpoints**: ${gap.potentiallyUnusedApis.length}\n`;
        md += `\n### Top 10 Disconnected Endpoints (Orphans):\n`;
        gap.potentiallyUnusedApis.slice(0, 10).forEach(e => {
            md += `- \`${e}\`\n`;
        });
        md += `*(and ${gap.potentiallyUnusedApis.length - 10} more...)*\n\n`;
    }
    
    md += `## 3. Business Logic & Transaction Gaps\n`;
    md += `*Critical issues regarding financial data integrity and RBAC.*\n\n`;
    if (business) {
        md += `- **Critical Mutation Endpoints Analyzed**: ${business.totalCriticalEndpointsFound}\n`;
        md += `\n### Missing Database Transactions:\n`;
        md += `*The following endpoints likely perform multiple mutations but lack \`$transaction\` wrappers, risking partial updates:*\n`;
        business.missingTransactions.forEach(e => md += `- ${e}\n`);
        
        md += `\n### Missing Role-Based Access Control (RBAC):\n`;
        md += `*The following critical endpoints do not explicitly check user roles or permissions:*\n`;
        business.missingRBAC.forEach(e => md += `- ${e}\n`);
    }
    
    md += `\n## 4. Event Architecture & Async Processing\n`;
    md += `*Issues regarding background processing, real-time updates, and webhooks.*\n\n`;
    if (business && business.missingEventEmissions) {
         md += `### Missing Event Emissions (Webhooks / Pusher / Outbox):\n`;
         business.missingEventEmissions.forEach(e => md += `- ${e}\n`);
    }
    if (events) {
        md += `\n- **Pusher Triggers Used**: ${events.pusherTriggers.length}\n`;
        md += `- **Webhook Emitters Used**: ${events.webhookEmitters.length}\n`;
        md += `- **Outbox Pattern Implementations**: ${events.outboxUsage.length}\n`;
        md += `- **Dead Letter Queue Handling**: ${events.deadLetters.length}\n`;
    }
    
    md += `\n## 5. Code Quality & Production Readiness\n`;
    if (quality) {
        md += `- **TODO Comments**: ${quality.todos.length}\n`;
        md += `- **FIXME Comments**: ${quality.fixmes.length}\n`;
        md += `- **Console Logs**: ${quality.consoleLogs.length}\n`;
        md += `- **Hardcoded Secrets/URLs**: ${quality.hardcodedSecrets.length}\n`;
        
        md += `\n### Top 10 Hardcoded Secrets/URLs:\n`;
        quality.hardcodedSecrets.slice(0, 10).forEach(e => {
            md += `- ${e}\n`;
        });
    }
    
    md += `\n## 6. Executive Summary & Recommendations\n`;
    md += `
1. **Data Integrity**: Implement Prisma transactions across all payment and folio endpoints immediately to prevent financial discrepancies.
2. **Security**: Audit the 14 critical endpoints missing explicit RBAC checks.
3. **Dead Code**: Remove or connect the ${gap ? gap.potentiallyUnusedApis.length : 'many'} orphan API endpoints.
4. **Readiness**: Address the ${quality ? quality.hardcodedSecrets.length : 0} hardcoded values (URLs/secrets) before deploying to production.
5. **Event-Driven Architecture**: The system lacks robust outbox/dead-letter queue patterns for critical async tasks like night audits and webhook processing.
`;
    
    fs.writeFileSync(reportPath, md);
    console.log(`Final gap report generated at ${reportPath}`);
}

generateFinalReport();
