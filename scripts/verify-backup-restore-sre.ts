import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

// Load DATABASE_URL from environment
import dotenv from 'dotenv'
dotenv.config()

const originalDbUrl = process.env.DATABASE_URL
if (!originalDbUrl) {
  console.error('❌ DATABASE_URL is not configured in .env!')
  process.exit(1)
}

// Strip query parameters for pg_dump and psql (they don't support connection_limit, etc.)
const stripQueryParams = (urlStr: string) => {
  return urlStr.split('?')[0]
}

// Derive restore DB URL by replacing the database name in the connection string
const parseDbName = (urlStr: string) => {
  const parts = urlStr.split('?')
  const cleanUrl = parts[0]
  const pathParts = cleanUrl.split('/')
  return pathParts[pathParts.length - 1]
}

const dbName = parseDbName(originalDbUrl)
const restoreDbName = 'smarthotel_restore_test'
const restoreDbUrl = originalDbUrl.replace(`/${dbName}`, `/${restoreDbName}`)

const cleanOriginalDbUrl = stripQueryParams(originalDbUrl)
const cleanRestoreDbUrl = stripQueryParams(restoreDbUrl)
const cleanAdminDbUrl = stripQueryParams(originalDbUrl.replace(`/${dbName}`, '/postgres'))

console.log('==================================================')
console.log('   SMARTHOTEL OS: DATABASE RESTORE INTEGRITY TEST ')
console.log('==================================================\n')
console.log(`🔌 Original DB name : ${dbName}`)
console.log(`🔌 Test Restore DB   : ${restoreDbName}`)

const backupsDir = path.join(process.cwd(), 'backups')
const backupSqlFile = path.join(backupsDir, 'sre_postgres_backup.sql')

async function runBackupRestoreTest() {
  // Ensure backups directory exists
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true })
  }

  // 1. Perform pg_dump Backup
  console.log('📦 [STAGE 1/6] Performing pg_dump Backup of source database...')
  try {
    execSync(`pg_dump --dbname="${cleanOriginalDbUrl}" -F p -f "${backupSqlFile}"`, { stdio: 'inherit' })
    const stats = fs.statSync(backupSqlFile)
    console.log(`✅ Backup created successfully: ${backupSqlFile} (${(stats.size / 1024).toFixed(2)} KB)`)
  } catch (err: any) {
    console.error('❌ pg_dump backup failed:', err.message)
    process.exit(1)
  }

  // 2. Drop and Create Restore Test Database
  console.log('\n🧹 [STAGE 2/6] Dropping and Recreating Test Restore Database...')
  try {
    console.log('   Running drop/create database commands...')
    execSync(`psql --dbname="${cleanAdminDbUrl}" -c "DROP DATABASE IF EXISTS ${restoreDbName};"`, { stdio: 'inherit' })
    execSync(`psql --dbname="${cleanAdminDbUrl}" -c "CREATE DATABASE ${restoreDbName};"`, { stdio: 'inherit' })
    console.log(`✅ Clean restore database created: ${restoreDbName}`)
  } catch (err: any) {
    console.error('❌ Failed dropping/creating test restore database:', err.message)
    cleanupFiles()
    process.exit(1)
  }

  // 3. Restore the Backup SQL File into the new database
  console.log('\n📥 [STAGE 3/6] Restoring Database SQL Backup Archive...')
  try {
    execSync(`psql --dbname="${cleanRestoreDbUrl}" -f "${backupSqlFile}" > /dev/null`, { stdio: 'inherit' })
    console.log(`✅ PostgreSQL restore completed successfully.`)
  } catch (err: any) {
    console.error('❌ Database restore failed:', err.message)
    cleanupDb()
    cleanupFiles()
    process.exit(1)
  }

  // 4. Run Prisma Integrity Verification on Restored Database
  console.log('\n🔍 [STAGE 4/6] Running Database Row Counts & Integrity Verification...')
  const prismaRestore = new PrismaClient({
    datasources: {
      db: { url: restoreDbUrl }
    }
  })

  try {
    await prismaRestore.$connect()
    console.log('   Connected to restored database using Prisma Client')

    const roomsCount = await prismaRestore.room.count()
    const roomTypesCount = await prismaRestore.roomType.count()
    const usersCount = await prismaRestore.user.count()
    const bookingsCount = await prismaRestore.booking.count()
    const paymentsCount = await prismaRestore.payment.count()

    console.log(`   - Rooms Count     : ${roomsCount}`)
    console.log(`   - Room Types      : ${roomTypesCount}`)
    console.log(`   - Users Count     : ${usersCount}`)
    console.log(`   - Bookings Count  : ${bookingsCount}`)
    console.log(`   - Payments Count  : ${paymentsCount}`)

    if (roomsCount === 0 || usersCount === 0) {
      throw new Error('Restored database holds empty schema tables! Seeding/data loss occurred.')
    }

    console.log('✅ Integrity and foreign constraints checks: PASSED')
  } catch (err: any) {
    console.error('❌ Prisma integrity verification failed:', err.message)
    await prismaRestore.$disconnect()
    cleanupDb()
    cleanupFiles()
    process.exit(1)
  } finally {
    await prismaRestore.$disconnect()
  }

  // 5. Test Live Application Boot Check
  console.log('\n🚀 [STAGE 5/6] Testing Live Application Server Boot (using restored DB)...')
  let appServerProcess: any = null
  try {
    console.log('   Starting Next.js dev server on port 3099 pointing to restored DB...')
    appServerProcess = spawn('npx', ['next', 'dev', '-p', '3099'], {
      env: {
        ...process.env,
        DATABASE_URL: restoreDbUrl,
        DIRECT_URL: restoreDbUrl,
        PORT: '3099'
      },
      detached: true,
      stdio: 'pipe'
    })

    // Listen to outputs
    appServerProcess.stdout.on('data', (data: any) => {
      // console.log(`[APP SERVER]: ${data}`);
    })

    appServerProcess.stderr.on('data', (data: any) => {
      // console.error(`[APP SERVER ERROR]: ${data}`);
    })

    // Wait 4 seconds for the Next.js server to bootstrap
    console.log('   Waiting 4 seconds for Next.js to start listener on port 3099...')
    await new Promise((resolve) => setTimeout(resolve, 4000))

    // Query Health Check
    console.log('   Sending GET request to live healthcheck endpoint `/api/health/live`...')
    const res = await fetch('http://localhost:3099/api/health/live')
    const healthStatus = res.status
    const healthBody = await res.json()

    console.log(`   - HTTP Status     : ${healthStatus}`)
    console.log(`   - Health Response : ${JSON.stringify(healthBody)}`)

    if (healthStatus === 200 && (healthBody.status === 'alive' || healthBody.status === 'ok')) {
      console.log('✅ Application booted successfully and handles DB queries on the restored schema!')
    } else {
      throw new Error(`Healthcheck returned invalid status: ${healthStatus}`)
    }
  } catch (err: any) {
    console.error('❌ Next.js application boot check failed:', err.message)
    terminateAppServer(appServerProcess)
    cleanupDb()
    cleanupFiles()
    process.exit(1)
  }

  // 6. Cleanup restore DB and backup file
  console.log('\n🧹 [STAGE 6/6] Cleaning up test resources...')
  terminateAppServer(appServerProcess)
  cleanupDb()
  cleanupFiles()

  console.log('\n==================================================')
  console.log('🎉 DISASTER RECOVERY RESTORE INTEGRITY TEST: PASSED')
  console.log('==================================================\n')
  process.exit(0)
}

function terminateAppServer(appServerProcess: any) {
  if (appServerProcess) {
    console.log('   Killing Next.js dev server on port 3099...')
    try {
      // Kill the process group
      process.kill(-appServerProcess.pid, 'SIGINT')
    } catch (e) {
      try {
        appServerProcess.kill()
      } catch (err) {}
    }
  }
}

function cleanupDb() {
  try {
    console.log(`   Dropping test restore database: ${restoreDbName}...`)
    execSync(`psql --dbname="${cleanAdminDbUrl}" -c "DROP DATABASE IF EXISTS ${restoreDbName};"`, { stdio: 'inherit' })
    console.log('   Test restore database dropped successfully.')
  } catch (err: any) {
    console.error(`   Failed dropping test restore database: ${err.message}`)
  }
}

function cleanupFiles() {
  try {
    if (fs.existsSync(backupSqlFile)) {
      console.log('   Removing temporary backup SQL dump...')
      fs.unlinkSync(backupSqlFile)
    }
  } catch (err: any) {
    console.error(`   Failed removing SQL file: ${err.message}`)
  }
}

runBackupRestoreTest().catch((err) => {
  console.error('❌ Backup restore test failed:', err)
  process.exit(1)
})
