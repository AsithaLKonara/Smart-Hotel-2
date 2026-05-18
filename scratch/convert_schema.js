const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

console.log('🔄 Converting Prisma schema from MongoDB to PostgreSQL...');

// 1. Update datasource
schema = schema.replace(/provider = "mongodb"/, 'provider = "postgresql"');

// 2. Remove MongoDB specific annotations and convert ObjectIDs to UUID strings
// Regex to find: @id @default(auto()) @map("_id") @db.ObjectId
// Replace with: @id @default(uuid())
schema = schema.replace(/@id @default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, '@id @default(uuid())');

// 3. Remove @db.ObjectId from relation fields
schema = schema.replace(/@db\.ObjectId/g, '');

// 4. Convert BigInt to Int (PostgreSQL handles Int/BigInt differently, but for simplicity let's stick to Int if values are small, or keep BigInt)
// MongoDB BigInt is often used for inventory. Let's keep BigInt for now as PG supports it.

// 5. Check for Json fields (MongoDB Mixed vs PG JsonB)
// Prisma uses Json for both, so no change needed.

fs.writeFileSync(schemaPath, schema);
console.log('✅ Schema conversion complete.');
