#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Paths
const DATABASE_PATH = path.join(__dirname, 'data', 'images.db');
const SCHEMA_PATH = path.join(__dirname, 'database-schema.sql');

console.log('🔄 Applying database schema updates...');

// Check if database exists
if (!fs.existsSync(DATABASE_PATH)) {
  console.log('❌ Database not found. Please run the image service first to create the database.');
  process.exit(1);
}

// Check if schema file exists
if (!fs.existsSync(SCHEMA_PATH)) {
  console.log('❌ Schema file not found.');
  process.exit(1);
}

// Read schema
let schema;
try {
  schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  console.log('📖 Schema file loaded');
} catch (error) {
  console.error('❌ Error reading schema file:', error.message);
  process.exit(1);
}

// Apply schema
const db = new sqlite3.Database(DATABASE_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('🔌 Connected to database');
});

db.exec(schema, (err) => {
  if (err) {
    console.error('❌ Error applying schema:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Schema applied successfully!');
  console.log('🏷️  Tag tables created:');
  console.log('   - tags (id, name, color, createdAt, usageCount)');
  console.log('   - image_tags (image_uuid, tag_id, createdAt)');
  console.log('   - Indexes and triggers added');
  
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('❌ Error checking tables:', err.message);
    } else {
      console.log('📋 Available tables:', tables.map(t => t.name).join(', '));
    }
    
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('🔌 Database connection closed');
        console.log('🎉 Ready to use tagging system!');
      }
    });
  });
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Schema application interrupted');
  db.close();
  process.exit(1);
}); 