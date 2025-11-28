import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables (SUPABASE_URL, SUPABASE_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
supabase.from('vendors').select('count').limit(1)
  .then(() => {
    console.log('✅ Supabase database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Supabase database connection failed:', error.message);
    // Don't exit on connection test failure - let the app continue
    // The actual queries will handle errors appropriately
  });

export default supabase;

