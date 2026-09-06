const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// 1. Remove unused dependencies (from previous cleanup)
const toRemove = [
    'webpack',
    'cypress',
    'react-query',
    'pusher',
    'pusher-js',
    'exceljs',
    'fast-xml-parser',
    'bson',
    'hls.js',
    'csv-parse',
    'pdfkit',
    'critters',
    '@testing-library/user-event',
    'nyc',
    'baseline-browser-mapping',
    'webpack-bundle-analyzer'
];

toRemove.forEach(dep => {
    delete pkg.dependencies[dep];
    delete pkg.devDependencies[dep];
});

// 2. Add missing dependencies
pkg.dependencies['pg'] = '^8.11.3';
pkg.dependencies['jose'] = '^5.1.3';
pkg.dependencies['k6'] = '0.0.0';
pkg.devDependencies['glob'] = '^10.3.10';

// 3. Upgrade vulnerable dependencies manually to fixed versions
const upgrades = {
    "next": "^16.3.4",
    "sharp": "^0.33.2",
    "axios": "^1.18.0",
    "next-auth": "^4.24.11",
    "@faker-js/faker": "^10.6.0",
    "postcss": "^8.5.11",
    "lighthouse": "^13.4.1"
};

for (const [dep, ver] of Object.entries(upgrades)) {
    if (pkg.dependencies[dep]) pkg.dependencies[dep] = ver;
    if (pkg.devDependencies[dep]) pkg.devDependencies[dep] = ver;
}

// 4. Overrides for transitive vulnerabilities
pkg.overrides = pkg.overrides || {};
pkg.overrides['brace-expansion'] = '^2.1.3';
pkg.overrides['browserslist'] = '^4.28.7';
pkg.overrides['extract-zip'] = '^2.0.2';
pkg.overrides['fast-uri'] = '^3.1.6';
pkg.overrides['fflate'] = '^0.8.3';
pkg.overrides['ip-address'] = '^10.3.1';
pkg.overrides['js-yaml'] = '^4.1.0';
pkg.overrides['nanoid'] = '^3.3.8';
pkg.overrides['postcss-selector-parser'] = '^6.1.2';
pkg.overrides['qs'] = '^6.13.1';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
