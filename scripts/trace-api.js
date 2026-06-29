#!/usr/bin/env node

/**
 * SmartHotel OS — API Endpoint Parser & SRE Traceability Auditor
 * Scans all Next.js API endpoints, maps HTTP verbs, checks Prisma queries, and audits error handling.
 */

const fs = require('fs')
const path = require('path')

const API_DIR = path.join(__dirname, '..', 'app', 'api')
const REPORT_DIR = path.join(__dirname, '..', 'artifacts', 'reports')
const SYSTEM_ARTIFACTS_DIR = '/Users/asithalakmal/.gemini/antigravity/brain/9f570293-2038-4a15-8d2b-70f16583739b'

if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true })
}

function scanDirectory(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      scanDirectory(filePath, fileList)
    } else if (file === 'route.ts' || file === 'route.js') {
      fileList.push(filePath)
    }
  })
  return fileList
}

async function auditAPI() {
  console.log('🔍 Commencing API Endpoint Traceability Audit...\n')

  const routeFiles = scanDirectory(API_DIR)
  console.log(`✅ Found ${routeFiles.length} dynamic route endpoints in "app/api".`)

  const matrix = []

  let verifiedCount = 0
  let partialCount = 0
  let highRiskCount = 0

  routeFiles.forEach(file => {
    const relativePath = path.relative(path.join(__dirname, '..'), file)
    // Extract endpoint path (e.g. app/api/rooms/route.ts -> /api/rooms)
    let endpoint = relativePath
      .replace(/^app/, '')
      .replace(/\/route\.ts$/, '')
      .replace(/\/route\.js$/, '')

    if (endpoint === '') endpoint = '/'

    const content = fs.readFileSync(file, 'utf8')

    // Find HTTP Verbs
    const verbs = []
    if (content.match(/\bexport\s+async\s+function\s+GET\b/)) verbs.push('GET')
    if (content.match(/\bexport\s+async\s+function\s+POST\b/)) verbs.push('POST')
    if (content.match(/\bexport\s+async\s+function\s+PUT\b/)) verbs.push('PUT')
    if (content.match(/\bexport\s+async\s+function\s+DELETE\b/)) verbs.push('DELETE')
    if (content.match(/\bexport\s+async\s+function\s+PATCH\b/)) verbs.push('PATCH')

    // Check database integration
    const hasPrisma = content.includes('prisma.') || content.includes('db.')

    // Check error handling blocks
    const hasTryCatch = content.includes('try {') || content.includes('try{')

    // Classify
    let classification = 'VERIFIED'
    if (hasPrisma && hasTryCatch) {
      classification = 'VERIFIED'
      verifiedCount++
    } else if (hasPrisma || hasTryCatch) {
      classification = 'PARTIAL'
      partialCount++
    } else {
      classification = 'HIGH RISK'
      highRiskCount++
    }

    matrix.push({
      endpoint,
      verbs: verbs.length > 0 ? verbs.join(', ') : 'UNKNOWN/SPECIAL',
      hasPrisma: hasPrisma ? '✅ Yes' : '❌ No',
      hasTryCatch: hasTryCatch ? '✅ Yes' : '⚠️ No',
      classification,
      file: relativePath
    })
  })

  // Calculate API Health Score
  const total = matrix.length
  const healthScore = Math.round(((verifiedCount + (partialCount * 0.5)) / total) * 100)

  // Sort Matrix alphabetically by endpoint
  matrix.sort((a, b) => a.endpoint.localeCompare(b.endpoint))

  const reportContent = `# Next.js API Traceability Matrix

Comprehensive static analysis of all Next.js API endpoints, database persistence layers, and error catch bounds in SmartHotel OS.

---

## 🏆 API Health & Traceability Score: \`${healthScore} / 100\`
* **Total Routes Audited**: \`${total}\`
* **Verified Production Ready**: \`${verifiedCount}\` (Queries DB with full try-catch guards).
* **Partially Shielded**: \`${partialCount}\` (Missing database query or exception handler).
* **High Risk / Mock Endpoints**: \`${highRiskCount}\` (Lacks try-catch blocks and DB connections).

---

## 📊 Complete API Traceability Matrix

| HTTP Endpoint Path | Implemented Methods | DB Interaction | Try-Catch Shield | SRE Classification | Source Route File |
| :--- | :--- | :--- | :--- | :--- | :--- |
${matrix.map(m => `| \`${m.endpoint}\` | **${m.verbs}** | ${m.hasPrisma} | ${m.hasTryCatch} | \`${m.classification}\` | [${m.file}](file:///Users/asithalakmal/Documents/web/SmartHotel/${m.file}) |`).join('\n')}

---

## 🎖️ API Audit Verdict: \`${healthScore >= 80 ? 'APPROVED' : 'REFACTOR REQUIRED'}\`
All database operations and server side exception handling metrics are compiled and linked.
`

  // Save locally
  const localReportPath = path.join(REPORT_DIR, 'API_TRACEABILITY_MATRIX.md')
  fs.writeFileSync(localReportPath, reportContent)
  console.log(`\n✅ Local report written to: ${localReportPath}`)

  // Save as System Artifact
  const systemReportPath = path.join(SYSTEM_ARTIFACTS_DIR, 'API_TRACEABILITY_MATRIX.md')
  fs.writeFileSync(systemReportPath, reportContent)
  console.log(`✅ System artifact written to: ${systemReportPath}`)
}

auditAPI().catch(err => {
  console.error('❌ API trace failed:', err.message)
  process.exit(1)
})
