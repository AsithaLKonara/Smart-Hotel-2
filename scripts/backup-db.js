#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a manual backup of the MongoDB database
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DATABASE_URL = process.env.DATABASE_URL
const BACKUP_DIR = path.join(process.cwd(), 'backups')

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
const backupName = `backup-${timestamp}-${Date.now()}`
const backupPath = path.join(BACKUP_DIR, backupName)

console.log('🔄 Starting database backup...')
console.log(`📦 Backup name: ${backupName}`)

try {
  // Extract connection details from DATABASE_URL
  const url = new URL(DATABASE_URL)
  const database = url.pathname.split('/')[1] || 'smarthotel'
  
  // Use mongodump for backup
  console.log('📥 Exporting database...')
  execSync(
    `mongodump --uri="${DATABASE_URL}" --out="${backupPath}"`,
    { stdio: 'inherit' }
  )

  // Compress backup
  console.log('🗜️  Compressing backup...')
  execSync(
    `tar -czf "${backupPath}.tar.gz" -C "${BACKUP_DIR}" "${backupName}"`,
    { stdio: 'inherit' }
  )

  // Remove uncompressed directory
  execSync(`rm -rf "${backupPath}"`, { stdio: 'inherit' })

  const backupSize = fs.statSync(`${backupPath}.tar.gz`).size
  const backupSizeMB = (backupSize / 1024 / 1024).toFixed(2)

  console.log(`✅ Backup completed successfully`)
  console.log(`📁 Location: ${backupPath}.tar.gz`)
  console.log(`📊 Size: ${backupSizeMB} MB`)

  // Clean up old backups (keep last 7 days)
  console.log('🧹 Cleaning up old backups...')
  const files = fs.readdirSync(BACKUP_DIR)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

  files.forEach(file => {
    if (file.startsWith('backup-') && file.endsWith('.tar.gz')) {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)
      if (stats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath)
        console.log(`🗑️  Deleted old backup: ${file}`)
      }
    }
  })

  process.exit(0)
} catch (error) {
  console.error('❌ Backup failed:', error.message)
  process.exit(1)
}

