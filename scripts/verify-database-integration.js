#!/usr/bin/env node

/**
 * Database Integration Verification Script
 * Checks all API endpoints for real database usage vs mock data
 */

const fs = require('fs')
const path = require('path')

const API_DIR = path.join(__dirname, '../app/api')
const COMPONENTS_DIR = path.join(__dirname, '../components')

// Patterns to detect
const REAL_DB_PATTERNS = [
  /prisma\.(user|room|booking|foodMenu|foodOrder|staff|task|inventory|gallery|setting|navigationLink|faq|heroSlide|socialLink|amenity|nearbyAttraction|footerLink)\.(findMany|findUnique|findFirst|create|update|delete|count|aggregate)/gi,
  /prisma\.\$connect/gi,
  /prisma\.\$queryRaw/gi,
  /prisma\.\$runCommandRaw/gi,
]

const MOCK_DATA_PATTERNS = [
  /const\s+\w+\s*=\s*\[.*\{.*id:.*\}/s,
  /mock|Mock|MOCK|hardcoded|hard-coded|fake|Fake|FAKE|dummy|Dummy|DUMMY|sample.*data|test.*data/i,
  /useState.*\[\s*\{/s,
]

function findFiles(dir, extension = '.ts') {
  const files = []
  const items = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name)
    if (item.isDirectory()) {
      files.push(...findFiles(fullPath, extension))
    } else if (item.name.endsWith(extension)) {
      files.push(fullPath)
    }
  }
  
  return files
}

function checkFile(filePath, patterns, type) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const results = {
    file: path.relative(process.cwd(), filePath),
    hasRealDB: false,
    hasMockData: false,
    matches: []
  }
  
  for (const pattern of patterns) {
    const matches = content.match(pattern)
    if (matches) {
      if (type === 'real-db') {
        results.hasRealDB = true
      } else if (type === 'mock') {
        results.hasMockData = true
      }
      results.matches.push(...matches)
    }
  }
  
  return results
}

console.log('🔍 Database Integration Verification\n')
console.log('=' .repeat(60))

// Check API routes
console.log('\n📡 Checking API Routes...')
const apiFiles = findFiles(API_DIR, '.ts')
const apiResults = {
  total: apiFiles.length,
  realDB: 0,
  mockData: 0,
  files: []
}

for (const file of apiFiles) {
  const realDBResult = checkFile(file, REAL_DB_PATTERNS, 'real-db')
  const mockResult = checkFile(file, MOCK_DATA_PATTERNS, 'mock')
  
  if (realDBResult.hasRealDB) {
    apiResults.realDB++
  }
  if (mockResult.hasMockData) {
    apiResults.mockData++
    apiResults.files.push({
      file: realDBResult.file,
      hasRealDB: realDBResult.hasRealDB,
      hasMockData: mockResult.hasMockData
    })
  }
}

console.log(`✅ Total API files: ${apiResults.total}`)
console.log(`✅ Files using real database: ${apiResults.realDB}`)
console.log(`⚠️  Files with potential mock data: ${apiResults.mockData}`)

if (apiResults.files.length > 0) {
  console.log('\n⚠️  Files with mock data patterns:')
  apiResults.files.forEach(f => {
    console.log(`   - ${f.file}`)
  })
}

// Check components
console.log('\n🎨 Checking Frontend Components...')
const componentFiles = findFiles(COMPONENTS_DIR, '.tsx')
const componentResults = {
  total: componentFiles.length,
  mockData: 0,
  files: []
}

for (const file of componentFiles) {
  const mockResult = checkFile(file, MOCK_DATA_PATTERNS, 'mock')
  if (mockResult.hasMockData) {
    componentResults.mockData++
    componentResults.files.push(mockResult.file)
  }
}

console.log(`✅ Total component files: ${componentResults.total}`)
console.log(`⚠️  Components with mock data patterns: ${componentResults.mockData}`)

if (componentResults.files.length > 0 && componentResults.files.length <= 10) {
  console.log('\n⚠️  Components with mock data:')
  componentResults.files.forEach(f => {
    console.log(`   - ${f}`)
  })
} else if (componentResults.files.length > 10) {
  console.log('\n⚠️  Components with mock data (showing first 10):')
  componentResults.files.slice(0, 10).forEach(f => {
    console.log(`   - ${f}`)
  })
  console.log(`   ... and ${componentResults.files.length - 10} more`)
}

// Summary
console.log('\n' + '='.repeat(60))
console.log('📊 SUMMARY')
console.log('='.repeat(60))
console.log(`\n✅ API Routes:`)
console.log(`   - Total: ${apiResults.total}`)
console.log(`   - Using Real Database: ${apiResults.realDB} (${Math.round(apiResults.realDB/apiResults.total*100)}%)`)
console.log(`   - With Mock Data: ${apiResults.mockData}`)

console.log(`\n⚠️  Frontend Components:`)
console.log(`   - Total: ${componentResults.total}`)
console.log(`   - With Mock Data Patterns: ${componentResults.mockData}`)

console.log(`\n🎯 Assessment:`)
if (apiResults.realDB === apiResults.total && apiResults.mockData === 0) {
  console.log('   ✅ ALL API routes use real database - NO mock data found!')
} else if (apiResults.realDB === apiResults.total) {
  console.log('   ✅ ALL API routes use real database')
  console.log('   ⚠️  Some files have mock data patterns (may be false positives)')
} else {
  console.log('   ⚠️  Some API routes may not use real database')
}

if (componentResults.mockData > 0) {
  console.log(`   ⚠️  ${componentResults.mockData} components have mock data patterns`)
  console.log('   Note: This is common for display components - check if they connect to APIs')
}

console.log('\n' + '='.repeat(60))
console.log('✅ Verification Complete\n')

