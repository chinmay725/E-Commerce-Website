const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'shopkart.db');
const schemaPath = path.join(dbDir, 'schema.sqlite.sql');

// Create database directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database
const db = new Database(dbPath);

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8');
const statements = schema.split(';').filter(s => s.trim());

statements.forEach(statement => {
  try {
    if (statement.trim()) {
      db.exec(statement);
      console.log('✅ Executed statement');
    }
  } catch (err) {
    console.error('❌ Error executing statement:', err.message);
    console.log('Statement:', statement.substring(0, 100) + '...');
  }
});

console.log('✅ Database initialized successfully');
db.close();
