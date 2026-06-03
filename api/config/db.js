// config/db.js
// Supabase migration shim — exports supabaseAdmin so legacy imports don't break.
// All controllers have been migrated to use supabase/supabaseAdmin directly.
const { supabase, supabaseAdmin } = require('./supabase');

console.log('✅ Supabase client initialized');

module.exports = { supabase, supabaseAdmin };
