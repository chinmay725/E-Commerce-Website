const Database = require('better-sqlite3');
const path = require('path');

const dbDir = path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'shopkart.db');

const db = new Database(dbPath);

console.log('Removing unseeded categories...');

// Categories to keep (these are seeded)
const keepCategories = ['electronics', 'fashion', 'home-kitchen', 'sports', 'books'];

// Delete categories that are not in the keep list
const deleteStmt = db.prepare('DELETE FROM categories WHERE slug NOT IN (' + keepCategories.map(() => '?').join(',') + ')');
const result = deleteStmt.run(...keepCategories);

console.log(`✅ Deleted ${result.changes} unseeded categories`);

// Verify remaining categories
const remaining = db.prepare('SELECT slug, name FROM categories ORDER BY sort_order').all();
console.log('\nRemaining categories:');
remaining.forEach(cat => console.log(`  - ${cat.name} (${cat.slug})`));

db.close();
