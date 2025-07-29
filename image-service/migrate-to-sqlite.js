#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Paths
const METADATA_JSON_PATH = path.join(__dirname, 'data', 'metadata.json');
const DATABASE_PATH = path.join(__dirname, 'data', 'images.db');

console.log('🔄 Starting migration from JSON to SQLite...');

// Create data directory if it doesn't exist
const dataDir = path.dirname(DATABASE_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('📁 Created data directory');
}

// Check if JSON file exists
if (!fs.existsSync(METADATA_JSON_PATH)) {
  console.log('⚠️  No metadata.json file found. Nothing to migrate.');
  console.log('✅ Migration completed (no data to migrate)');
  process.exit(0);
}

// Read JSON data
let jsonData;
try {
  const rawData = fs.readFileSync(METADATA_JSON_PATH, 'utf-8');
  jsonData = JSON.parse(rawData);
  console.log(`📖 Found ${jsonData.length} records in metadata.json`);
} catch (error) {
  console.error('❌ Error reading metadata.json:', error.message);
  process.exit(1);
}

// Check if database already exists
const dbExists = fs.existsSync(DATABASE_PATH);
if (dbExists) {
  console.log('⚠️  SQLite database already exists!');
  console.log('🔍 Checking if it contains data...');
}

// Initialize SQLite database
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('🔌 Connected to SQLite database');
});

// Create table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS images (
    uuid TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    hash TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    uploaderId TEXT NOT NULL,
    uploaderName TEXT NOT NULL
  )
`, (err) => {
  if (err) {
    console.error('❌ Error creating table:', err.message);
    process.exit(1);
  }
  console.log('📋 Images table ready');

  // Check if database already has data
  db.get('SELECT COUNT(*) as count FROM images', (err, row) => {
    if (err) {
      console.error('❌ Error checking existing data:', err.message);
      process.exit(1);
    }

    const existingCount = row.count;
    console.log(`🗃️  Database currently has ${existingCount} records`);

    if (existingCount > 0) {
      console.log('⚠️  Database already contains data!');
      console.log('Choose an option:');
      console.log('  1. Skip migration (recommended if already migrated)');
      console.log('  2. Add new records only (skip duplicates by UUID)');
      console.log('  3. Clear database and re-migrate all data');
      
      // For automation, we'll choose option 2 (add new records only)
      console.log('🤖 Auto-selecting option 2: Add new records only');
      migrateData(false);
    } else {
      console.log('✨ Database is empty, proceeding with migration...');
      migrateData(true);
    }
  });
});

function migrateData(clearFirst = false) {
  const insertPromises = [];

  if (clearFirst) {
    console.log('🗑️  Clearing existing data...');
    db.run('DELETE FROM images');
  }

  console.log('📦 Starting data migration...');
  
  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // Prepare insert statement
  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO images (uuid, filename, hash, createdAt, uploaderId, uploaderName) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert each record
  jsonData.forEach((record, index) => {
    insertStmt.run([
      record.uuid,
      record.filename,
      record.hash,
      record.createdAt,
      record.uploaderId,
      record.uploaderName
    ], function(err) {
      if (err) {
        console.error(`❌ Error inserting record ${index + 1}:`, err.message);
        errors++;
      } else if (this.changes > 0) {
        inserted++;
      } else {
        skipped++;
      }

      // Check if this is the last record
      if (index === jsonData.length - 1) {
        insertStmt.finalize((err) => {
          if (err) {
            console.error('❌ Error finalizing statement:', err.message);
          }
          
          // Final summary
          console.log('\n📊 Migration Summary:');
          console.log(`   ✅ Inserted: ${inserted} records`);
          console.log(`   ⏭️  Skipped:  ${skipped} records (duplicates)`);
          console.log(`   ❌ Errors:   ${errors} records`);
          
          if (errors === 0) {
            console.log('\n🎉 Migration completed successfully!');
            
            // Backup the JSON file
            const backupPath = METADATA_JSON_PATH + '.backup';
            fs.copyFileSync(METADATA_JSON_PATH, backupPath);
            console.log(`💾 JSON backup created: ${backupPath}`);
            console.log('💡 You can safely delete the backup file once you verify the migration worked correctly.');
          } else {
            console.log('\n⚠️  Migration completed with errors. Please check the logs above.');
          }

          // Close database connection
          db.close((err) => {
            if (err) {
              console.error('❌ Error closing database:', err.message);
            } else {
              console.log('🔌 Database connection closed');
            }
            process.exit(errors === 0 ? 0 : 1);
          });
        });
      }
    });
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Migration interrupted');
  db.close();
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught exception:', err);
  db.close();
  process.exit(1);
}); 