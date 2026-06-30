const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const modelsDir = path.join(__dirname, '../prisma/models');

if (fs.existsSync(modelsDir)) {
  fs.rmSync(modelsDir, { recursive: true, force: true });
}
fs.mkdirSync(modelsDir);

const content = fs.readFileSync(schemaPath, 'utf8');
const blocks = content.split('// ==========================================');

// blocks[0] is the base
fs.writeFileSync(path.join(modelsDir, '00-base.prisma'), blocks[0].trim() + '\n\n');

for (let i = 1; i < blocks.length; i++) {
  const block = blocks[i].trim();
  if (!block) continue;
  
  // Extract the header (first line)
  const lines = block.split('\n');
  let header = lines[0].replace('//', '').trim();
  
  // Some blocks might not start with a clear header if the splitting went weird
  if (!header || header.length > 50) {
     header = `chunk-${i}`;
  }
  
  const filename = String(i).padStart(2, '0') + '-' + header.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.prisma';
  
  const fullContent = `// ==========================================\n// ${header}\n// ==========================================\n${block.replace(lines[0], '').trim()}`;
  fs.writeFileSync(path.join(modelsDir, filename), fullContent.trim() + '\n\n');
}

console.log('Schema split successfully.');
