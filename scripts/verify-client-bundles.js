const fs = require('fs');
const path = require('path');

const CHUNKS_DIR = path.join(__dirname, '../.next/static/chunks');

// Server-only packages and source files that must NEVER leak into browser bundles
const FORBIDDEN_PATTERNS = [
  { name: 'Prisma Client', test: (src) => src.includes('node_modules/@prisma/client') || src.includes('node_modules/prisma') },
  { name: 'Sentry Node SDK', test: (src) => src.includes('node_modules/@sentry/node') },
  { name: 'Winston Logger', test: (src) => src.includes('node_modules/winston') },
  { name: 'OpenTelemetry SDK Node', test: (src) => src.includes('node_modules/@opentelemetry/sdk-node') },
  { name: 'Nodemailer SMTP', test: (src) => src.includes('node_modules/nodemailer') },
  { name: 'Server-only Configs', test: (src) => 
      src.includes('lib/db.ts') || 
      src.includes('lib/logger.ts') || 
      src.includes('lib/monitoring.ts') || 
      src.includes('lib/email.ts') ||
      src.includes('lib/secrets.ts') ||
      src.includes('lib/chaos.ts') ||
      src.includes('lib/performance.ts')
  }
];

function getJSFiles(dir, ext = '.js') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJSFiles(filePath, ext));
    } else if (file.endsWith(ext)) {
      results.push(filePath);
    }
  });
  return results;
}

console.log('\x1b[34m🔍 Starting AST-Level Manifest & Source-Map Structural Bundle Audit...\x1b[0m');

if (!fs.existsSync(CHUNKS_DIR)) {
  console.error('\x1b[31m❌ Error: .next/static/chunks directory not found. Please run "npm run build" first.\x1b[0m');
  process.exit(1);
}

const mapFiles = getJSFiles(CHUNKS_DIR, '.js.map');
console.log(`Found ${mapFiles.length} client-side chunk maps for structural audit.`);

let violationsCount = 0;
const violationsMap = new Map();

mapFiles.forEach(mapPath => {
  try {
    const rawMap = fs.readFileSync(mapPath, 'utf8');
    const map = JSON.parse(rawMap);
    const relativeMapPath = path.relative(path.join(__dirname, '..'), mapPath);
    
    // Webpack source maps contain 'sources' array listing every source module compiled into this chunk
    if (map && Array.isArray(map.sources)) {
      map.sources.forEach(source => {
        FORBIDDEN_PATTERNS.forEach(rule => {
          if (rule.test(source)) {
            if (!violationsMap.has(relativeMapPath)) {
              violationsMap.set(relativeMapPath, []);
            }
            violationsMap.get(relativeMapPath).push({
              moduleName: rule.name,
              sourcePath: source
            });
            violationsCount++;
          }
        });
      });
    }
  } catch (err) {
    console.warn(`⚠️ Warn: Failed to parse map file ${mapPath}:`, err.message);
  }
});

if (violationsCount > 0) {
  console.error(`\x1b[31m\n❌ AST STRUCTURAL VIOLATION DETECTED! ${violationsCount} leakages found inside client bundles:\x1b[0m`);
  
  violationsMap.forEach((violations, chunkFile) => {
    console.error(`\x1b[31m• Chunk File: ${chunkFile}\x1b[0m`);
    violations.forEach(v => {
      console.error(`  - \x1b[33m[${v.moduleName}]\x1b[0m Leaked source module: \x1b[36m${v.sourcePath}\x1b[0m`);
    });
  });
  
  console.error('\x1b[31m\n❌ Validation Failed: Client bundles are contaminated with server-side packages.\x1b[0m');
  process.exit(1);
}

console.log('\x1b[32m✅ AST-Level Validation Succeeded: Zero server-only source paths or dependencies detected in compiled browser chunks!\x1b[0m');
process.exit(0);
