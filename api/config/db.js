const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname, '../../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'shopkart.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Convert MySQL syntax to SQLite
const convertQuery = (sql) => {
  // Replace MySQL-specific functions with SQLite equivalents
  let converted = sql
    .replace(/DATE_SUB\(NOW\(\), INTERVAL (\d+) MINUTE\)/g, "datetime('now', '-$1 minutes')")
    .replace(/NOW\(\)/g, "datetime('now')")
    .replace(/CURDATE\(\)/g, "date('now')")
    .replace(/UNIX_TIMESTAMP\(([^)]+)\)/g, "strftime('%s', $1)")
    .replace(/FROM_UNIXTIME\(([^)]+)\)/g, "datetime($1, 'unixepoch')")
    .replace(/AUTO_INCREMENT/g, "AUTOINCREMENT")
    .replace(/TINYINT\(1\)/g, "INTEGER")
    .replace(/ENUM\([^)]+\)/g, "TEXT")
    .replace(/DOUBLE\((\d+),(\d+)\)/g, "REAL")
    .replace(/DECIMAL\((\d+),(\d+)\)/g, "REAL")
    .replace(/VARCHAR\((\d+)\)/g, "TEXT")
    .replace(/CHAR\((\d+)\)/g, "TEXT")
    .replace(/TEXT\((\d+)\)/g, "TEXT")
    .replace(/DATETIME/g, "TEXT")
    .replace(/TIMESTAMP/g, "TEXT")
    .replace(/ENGINE=InnoDB/g, "")
    .replace(/CHARSET=utf8mb4/g, "")
    .replace(/COLLATE=utf8mb4_unicode_ci/g, "");
  
  return converted;
};

// Create a pool-like interface that mimics mysql2/promise
const pool = {
  execute: async (sql, params = []) => {
    try {
      const convertedSql = convertQuery(sql);
      const stmt = db.prepare(convertedSql);
      const result = stmt.all(...params);
      
      // Return in mysql2 format: [rows, fields]
      return [result, undefined];
    } catch (err) {
      console.error('SQL Error:', err.message);
      console.error('Original SQL:', sql);
      console.error('Converted SQL:', convertQuery(sql));
      throw err;
    }
  },
  
  query: async (sql, params = []) => {
    return pool.execute(sql, params);
  },
  
  getConnection: async () => {
    return {
      execute: async (sql, params = []) => pool.execute(sql, params),
      query: async (sql, params = []) => pool.query(sql, params),
      release: () => {},
      beginTransaction: () => {},
      commit: () => {},
      rollback: () => {}
    };
  },
  
  end: async () => {
    db.close();
  }
};

// Test connectivity
try {
  pool.execute('SELECT 1').then(() => {
    console.log('✅ SQLite connected successfully');
  }).catch((err) => {
    console.error('❌ SQLite connection failed:', err.message);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ SQLite connection failed:', err.message);
  process.exit(1);
}

module.exports = pool;
