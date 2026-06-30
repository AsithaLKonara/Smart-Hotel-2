const fs = require('fs');
const path = require('path');

function mergePrismaSchema() {
  const modelsDir = path.join(__dirname, '../prisma/models');
  const targetSchemaPath = path.join(__dirname, '../prisma/schema.prisma');

  if (!fs.existsSync(modelsDir)) {
    console.error('No prisma/models directory found. Assuming schema.prisma is already canonical.');
    return;
  }

  const files = fs.readdirSync(modelsDir)
    .filter(f => f.endsWith('.prisma'))
    .sort(); // Sorting ensures 00-base.prisma comes first

  let mergedContent = '';

  for (const file of files) {
    const content = fs.readFileSync(path.join(modelsDir, file), 'utf8');
    mergedContent += `// ---> Merged from ${file}\n\n`;
    mergedContent += content;
    mergedContent += '\n\n';
  }

  fs.writeFileSync(targetSchemaPath, mergedContent.trim() + '\n');
  console.log(`Successfully merged ${files.length} modular .prisma files into schema.prisma`);
}

mergePrismaSchema();
