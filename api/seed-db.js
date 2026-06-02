const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'shopkart.db');
const seedPath = path.join(dbDir, 'seed-data.sql');

const db = new Database(dbPath);

// Read seed data SQL
const seedSQL = fs.readFileSync(seedPath, 'utf8');

// Split into individual statements by semicolon, handling multi-line statements
const statements = [];
let currentStatement = '';
let inComment = false;
let inString = false;

for (let i = 0; i < seedSQL.length; i++) {
  const char = seedSQL[i];
  const nextChar = seedSQL[i + 1];

  // Handle comments
  if (char === '-' && nextChar === '-' && !inString) {
    inComment = true;
    i++;
    continue;
  }
  if (inComment && (char === '\n' || char === '\r')) {
    inComment = false;
    continue;
  }
  if (inComment) continue;

  // Handle string literals
  if (char === "'" && !inString) {
    inString = true;
    currentStatement += char;
    continue;
  }
  if (char === "'" && inString) {
    inString = false;
    currentStatement += char;
    continue;
  }
  if (inString) {
    currentStatement += char;
    continue;
  }

  // Handle statement terminator
  if (char === ';' && !inString) {
    currentStatement = currentStatement.trim();
    if (currentStatement.length > 0) {
      statements.push(currentStatement);
    }
    currentStatement = '';
    continue;
  }

  currentStatement += char;
}

// Add any remaining statement
currentStatement = currentStatement.trim();
if (currentStatement.length > 0) {
  statements.push(currentStatement);
}

console.log(`Executing ${statements.length} seed statements...`);

let successCount = 0;
let errorCount = 0;

statements.forEach((statement, index) => {
  try {
    db.exec(statement);
    console.log(`✅ Statement ${index + 1} executed`);
    successCount++;
  } catch (error) {
    console.log(`❌ Error executing statement ${index + 1}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n✅ Seed data completed: ${successCount} successful, ${errorCount} errors`);

db.close();
