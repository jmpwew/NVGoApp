const { createClient } = require('@supabase/supabase-js');

// Uses the service_role key (server-side only, never expose to mobile app)
// so uploads bypass Row Level Security. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
// come from Render env vars.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Name of the storage bucket that holds all uploads (profile images,
// news images, report images/videos). Create this bucket once in the
// Supabase dashboard and mark it Public.
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'nvgo-uploads';

module.exports = { supabase, BUCKET_NAME };
