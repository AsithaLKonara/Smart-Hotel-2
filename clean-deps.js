const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

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

pkg.dependencies['pg'] = '^8.11.3';
pkg.dependencies['jose'] = '^5.1.3';
pkg.dependencies['k6'] = '0.0.0';
pkg.devDependencies['glob'] = '^10.3.10';

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json cleaned');
