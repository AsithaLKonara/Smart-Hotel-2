const fs = require('fs');
const path = require('path');
const glob = require('glob');

function extractUiInfo(appDir, componentsDir) {
    const pages = glob.sync('**/page.{tsx,jsx}', { cwd: appDir, absolute: true });
    const components = glob.sync('**/*.{tsx,jsx}', { cwd: componentsDir, absolute: true });
    
    const uiInventory = {
        pages: [],
        components: []
    };
    
    for (const file of pages) {
        const relativePath = path.relative(appDir, file);
        let route = '/' + relativePath.replace(/\\/g, '/').replace(/\/page\.[tx]sx$/, '');
        if (route === '/page.tsx' || route === '/page.jsx') {
            route = '/';
        }
        
        uiInventory.pages.push({
            route: route,
            file: relativePath
        });
    }
    
    for (const file of components) {
        const relativePath = path.relative(componentsDir, file);
        const name = path.basename(file, path.extname(file));
        
        uiInventory.components.push({
            name: name,
            file: relativePath
        });
    }
    
    return uiInventory;
}

try {
    const appDir = path.join(__dirname, '..', 'app');
    const componentsDir = path.join(__dirname, '..', 'components');
    
    try {
        require.resolve('glob');
    } catch (e) {
        console.error("Please install glob first: npm install glob");
        process.exit(1);
    }
    
    const uiInventory = extractUiInfo(appDir, componentsDir);
    
    const outputPath = path.join(__dirname, '..', 'docs', 'ui_inventory.json');
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(uiInventory, null, 2));
    
    console.log(`UI extraction complete. Found ${uiInventory.pages.length} pages and ${uiInventory.components.length} components.`);
} catch (error) {
    console.error("Error extracting UI:", error);
}
