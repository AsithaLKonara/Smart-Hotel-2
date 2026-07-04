const fs = require('fs');
const path = require('path');
const glob = require('glob');

function extractApiInfo(appDir) {
    // Find all files named route.ts or route.js within appDir
    const apiFiles = glob.sync('**/{route.ts,route.js}', { cwd: appDir, absolute: true });
    const endpoints = [];

    for (const file of apiFiles) {
        const relativePath = path.relative(appDir, file);
        // Convert something like `api/bookings/route.ts` -> `/api/bookings`
        let endpointRoute = '/' + relativePath.replace(/\\/g, '/').replace(/\/route\.[tj]s$/, '');
        if (endpointRoute === '/route.ts' || endpointRoute === '/route.js') {
            endpointRoute = '/';
        }
        
        const fileContent = fs.readFileSync(file, 'utf8');
        
        const methods = [];
        const supportedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
        
        for (const method of supportedMethods) {
            // Regex to find exported functions for specific HTTP methods
            const regex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\s*\\(`, 'g');
            if (regex.test(fileContent)) {
                methods.push(method);
            }
        }
        
        if (methods.length > 0) {
            endpoints.push({
                route: endpointRoute,
                methods: methods,
                file: relativePath
            });
        }
    }
    
    return endpoints;
}

try {
    const appDir = path.join(__dirname, '..', 'app');
    
    // Check if package exists, since we use glob
    try {
        require.resolve('glob');
    } catch (e) {
        console.error("Please install glob first: npm install glob");
        process.exit(1);
    }
    
    const endpoints = extractApiInfo(appDir);
    
    const outputPath = path.join(__dirname, '..', 'docs', 'api_inventory.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(endpoints, null, 2));
    
    console.log(`API extraction complete. Found ${endpoints.length} endpoints.`);
} catch (error) {
    console.error("Error extracting API:", error);
}
