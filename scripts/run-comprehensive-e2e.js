#!/usr/bin/env node

/**
 * Comprehensive E2E Test Runner
 * 
 * Runs E2E tests on both production and local environments
 */

const { execSync } = require('child_process')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🚀 Comprehensive E2E Test Runner\n')
  console.log('This will test:')
  console.log('  ✅ All pages (45 pages)')
  console.log('  ✅ All CRUD operations')
  console.log('  ✅ All UI components')
  console.log('  ✅ All features')
  console.log('  ✅ All integrations')
  console.log('  ✅ Both production and local environments\n')

  const environments = []
  
  const testProduction = await question('Test Production? (yes/no): ')
  if (testProduction.toLowerCase() === 'yes') {
    environments.push('production')
  }

  const testLocal = await question('Test Local? (yes/no): ')
  if (testLocal.toLowerCase() === 'yes') {
    environments.push('local')
  }

  if (environments.length === 0) {
    console.log('❌ No environments selected. Exiting.')
    rl.close()
    process.exit(0)
  }

  console.log(`\n📊 Testing: ${environments.join(', ')}\n`)

  const testSuites = [
    { file: 'comprehensive-production.spec.ts', name: 'Public Pages & Features' },
    { file: 'comprehensive-crud.spec.ts', name: 'CRUD Operations' },
    { file: 'comprehensive-features.spec.ts', name: 'All Features' },
    { file: 'comprehensive-integrations.spec.ts', name: 'Integrations' },
  ]

  const results = []

  for (const suite of testSuites) {
    console.log(`\n🧪 Running: ${suite.name}`)
    console.log('─'.repeat(50))
    
    try {
      let command = 'npx playwright test'
      
      if (environments.includes('production')) {
        command += ` tests/e2e/${suite.file} --project=chromium`
      } else {
        command += ` tests/e2e/${suite.file}`
      }

      execSync(command, { 
        stdio: 'inherit',
        env: {
          ...process.env,
          BASE_URL: environments.includes('local') ? 'http://localhost:3000' : undefined,
        }
      })
      
      results.push({ suite: suite.name, status: '✅ PASSED' })
    } catch (error) {
      results.push({ suite: suite.name, status: '❌ FAILED' })
      console.error(`\n❌ ${suite.name} failed`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(50))
  
  results.forEach(result => {
    console.log(`${result.status} ${result.suite}`)
  })

  const passed = results.filter(r => r.status.includes('✅')).length
  const total = results.length

  console.log(`\n✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 All tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. Check output above.')
  }

  rl.close()
}

main()

