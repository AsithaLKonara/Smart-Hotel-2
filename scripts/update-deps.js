const fs = require('fs');
const pkgPath = '/Volumes/240GB SSD/Projects/Smart-Hotel-2/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// 1. Remove @types/dotenv
if (pkg.devDependencies && pkg.devDependencies['@types/dotenv']) {
    delete pkg.devDependencies['@types/dotenv'];
}

// 2. Upgrade eslint to 9
if (pkg.devDependencies && pkg.devDependencies['eslint']) {
    pkg.devDependencies['eslint'] = '^9.10.0';
}

// 3. Upgrade multer to 2.x to avoid the vulnerability warning
if (pkg.dependencies && pkg.dependencies['multer']) {
    pkg.dependencies['multer'] = '^2.0.0-rc.4';
}

// 4. Overrides for globally deprecated packages
if (!pkg.overrides) pkg.overrides = {};
pkg.overrides['glob'] = '^11.0.0';
pkg.overrides['rimraf'] = '^6.0.1';

// Remove old glob@7 / glob@8 overrides if any
delete pkg.overrides['glob@7'];
delete pkg.overrides['glob@8'];

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated successfully.');
