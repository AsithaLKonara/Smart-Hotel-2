// Script to perform simple UI <-> API Gap Analysis
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function analyzeGap() {
    const apiFile = path.join(__dirname, '..', 'docs', 'api_inventory.json');
    const uiFile = path.join(__dirname, '..', 'docs', 'ui_inventory.json');
    
    if (!fs.existsSync(apiFile) || !fs.existsSync(uiFile)) {
        console.error("Missing inventory files. Run schema/api/ui extraction first.");
        return;
    }
    
    const apiInventory = JSON.parse(fs.readFileSync(apiFile, 'utf8'));
    const uiInventory = JSON.parse(fs.readFileSync(uiFile, 'utf8'));
    
    // Create a list of all routes
    const apiRoutes = apiInventory.map(api => api.route);
    
    // Find all fetch calls in UI files
    const appDir = path.join(__dirname, '..', 'app');
    const componentsDir = path.join(__dirname, '..', 'components');
    const allFiles = [
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: appDir, absolute: true }),
        ...glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: componentsDir, absolute: true })
    ];
    
    const usedEndpoints = new Set();
    const endpointCalls = {};
    
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Simple regex to find fetch('/api/...') or axios.get('/api/...')
        const fetchRegex = /['"`](\/api\/[^'"`?]+)/g;
        let match;
        while ((match = fetchRegex.exec(content)) !== null) {
            let endpoint = match[1];
            // Normalize dynamic segments somewhat if possible, but keep it simple for now
            usedEndpoints.add(endpoint);
            if (!endpointCalls[endpoint]) {
                endpointCalls[endpoint] = [];
            }
            endpointCalls[endpoint].push(path.relative(path.join(__dirname, '..'), file));
        }
    }
    
    // Compare
    const unusedApis = [];
    for (const api of apiInventory) {
        // Very basic matching, doesn't perfectly handle dynamic routes like /api/tasks/[id]
        // But gives a rough estimate
        const baseRoute = api.route.replace(/\[.*?\]/g, ''); // strip dynamic parts for loose matching
        
        let found = false;
        for (const used of usedEndpoints) {
            if (used.includes(baseRoute)) {
                found = true;
                break;
            }
        }
        
        if (!found) {
            unusedApis.push(api.route);
        }
    }
    
    const report = {
        totalApis: apiInventory.length,
        totalUsedEndpointsDetected: usedEndpoints.size,
        potentiallyUnusedApis: unusedApis,
        endpointUsageMap: endpointCalls
    };
    
    const outputPath = path.join(__dirname, '..', 'docs', 'gap_analysis_ui_api.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    
    console.log(`Gap Analysis complete. Found ${unusedApis.length} potentially unused APIs out of ${apiInventory.length}.`);
}

analyzeGap();
