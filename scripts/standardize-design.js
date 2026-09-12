const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = ['app', 'components'];
const ROOT_DIR = process.cwd();

const REPLACEMENTS = [
  // Radii & Shadows
  { regex: /rounded-\[40px\]/g, replacement: 'rounded-xl' },
  { regex: /rounded-3xl/g, replacement: 'rounded-xl' },
  { regex: /rounded-2xl/g, replacement: 'rounded-lg' },
  { regex: /shadow-2xl/g, replacement: 'shadow-sm' },
  { regex: /shadow-luxury/g, replacement: 'shadow-sm' },
  
  // Backgrounds & Gradients
  { regex: /bg-\[#0c0c0c\]/g, replacement: 'bg-card' },
  { regex: /bg-\[#090514\]/g, replacement: 'bg-background' },
  { regex: /bg-white\/\[0\.02\]/g, replacement: 'bg-muted\/50' },
  { regex: /bg-white\/\[0\.01\]/g, replacement: 'bg-muted\/30' },
  { regex: /bg-white\/5/g, replacement: 'bg-muted\/50' },
  { regex: /bg-gold-gradient/g, replacement: 'bg-primary\/10' },
  { regex: /bg-midnight-gradient/g, replacement: 'bg-card' },
  
  // Borders
  { regex: /border-white\/5/g, replacement: 'border-border' },
  { regex: /border-white\/10/g, replacement: 'border-border' },
  { regex: /border-white\/\[0\.05\]/g, replacement: 'border-border' },
  { regex: /border-purple-950\/[0-9]+/g, replacement: 'border-border' },
  { regex: /border-rose-500\/[0-9]+/g, replacement: 'border-border' },
  { regex: /border-amber-500\/[0-9]+/g, replacement: 'border-border' },
  { regex: /border-emerald-500\/[0-9]+/g, replacement: 'border-border' },
  
  // Text Opacity & Colors
  { regex: /text-white\/20/g, replacement: 'text-muted-foreground' },
  { regex: /text-white\/30/g, replacement: 'text-muted-foreground' },
  { regex: /text-white\/40/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-400/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-500/g, replacement: 'text-muted-foreground' },
  { regex: /text-slate-600/g, replacement: 'text-muted-foreground' },
  
  // Typography Noise
  { regex: /text-\[10px\]/g, replacement: 'text-xs' },
  { regex: /text-\[9px\]/g, replacement: 'text-xs' },
  { regex: /text-\[8px\]/g, replacement: 'text-xs' },
  { regex: /text-\[7px\]/g, replacement: 'text-xs' },
  { regex: /tracking-widest/g, replacement: '' },
  { regex: /tracking-\[0\.3em\]/g, replacement: '' },
  { regex: /tracking-tighter/g, replacement: '' },
  { regex: /uppercase/g, replacement: '' }, // risky but usually on badges
  { regex: /font-black/g, replacement: 'font-bold' },
  { regex: /font-extrabold/g, replacement: 'font-bold' },
];

let filesModified = 0;

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  for (const { regex, replacement } of REPLACEMENTS) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      hasChanges = true;
    }
  }

  // Cleanup potential double spaces from removed classes
  if (hasChanges) {
    content = content.replace(/  +/g, ' ');
    fs.writeFileSync(filePath, content, 'utf8');
    filesModified++;
    console.log(`Updated: ${filePath.replace(ROOT_DIR, '')}`);
  }
}

console.log('Starting global design standardization...');
for (const dir of DIRECTORIES_TO_SCAN) {
  const targetPath = path.join(ROOT_DIR, dir);
  if (fs.existsSync(targetPath)) {
    processDirectory(targetPath);
  }
}

console.log(`\nCompleted! Standardized ${filesModified} files.`);
