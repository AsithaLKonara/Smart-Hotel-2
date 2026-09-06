const fs = require('fs');
const pkgPath = '/Volumes/240GB SSD/Projects/Smart-Hotel-2/package.json';
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.devDependencies && pkg.devDependencies['eslint-config-next']) {
    pkg.devDependencies['eslint-config-next'] = '^16.2.9'; // match next version
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json eslint-config-next updated.');
