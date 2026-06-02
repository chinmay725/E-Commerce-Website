const Database = require('better-sqlite3');
const path = require('path');

const dbDir = path.join(__dirname, '../db');
const dbPath = path.join(dbDir, 'shopkart.db');

const db = new Database(dbPath);

console.log('Deleting old products and images...');

db.exec('DELETE FROM product_images');
db.exec('DELETE FROM products');

console.log('✅ Old products deleted');

db.close();
