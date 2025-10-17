// Script to apply migration to Railway PostgreSQL
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('🚀 Starting migration process...\n');

  // Read migration SQL
  const migrationPath = path.join(__dirname, 'prisma/migrations/20251016000000_add_performance_indexes/migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('📄 Migration SQL loaded');
  console.log(`   Length: ${sql.length} characters`);
  console.log(`   Lines: ${sql.split('\n').length}\n`);

  // Create Prisma client
  const prisma = new PrismaClient();

  try {
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully\n');

    console.log('🔨 Executing migration...');
    const startTime = Date.now();

    // Execute the migration
    await prisma.$executeRawUnsafe(sql);

    const duration = Date.now() - startTime;
    console.log(`✅ Migration executed successfully in ${duration}ms\n`);

    // Verify indexes were created
    console.log('🔍 Verifying indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND (
        indexname LIKE '%events_userId%'
        OR indexname LIKE '%messages_userId%'
        OR indexname LIKE '%reminders_userId%'
        OR indexname LIKE '%alarms_userId%'
      )
      ORDER BY tablename, indexname;
    `;

    console.log(`✅ Found ${indexes.length} new indexes:`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.tablename}.${idx.indexname}`);
    });

    console.log('\n🎉 Migration completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

applyMigration()
  .then(() => {
    console.log('\n✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
