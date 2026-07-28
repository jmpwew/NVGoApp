const { randomUUID } = require('crypto');
const { supabase, BUCKET_NAME } = require('../config/supabase');

// Uploads a single multer memory-storage file (req.file) to Supabase Storage
// and returns its public URL. `folder` groups files in the bucket, e.g.
// 'profile-images', 'news-images', 'report-images', 'report-videos'.
async function uploadToSupabase(file, folder) {
  if (!file) return null;

  const safeName = `${Date.now()}-${randomUUID()}${getExtension(file.originalname)}`;
  const destination = `${folder}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(destination, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(destination);

  return data.publicUrl;
}

// Convenience for multer .fields() arrays (e.g. req.files.images, req.files.videos)
async function uploadManyToSupabase(files, folder) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map(file => uploadToSupabase(file, folder)));
}

function getExtension(originalname) {
  const idx = originalname.lastIndexOf('.');
  return idx === -1 ? '' : originalname.slice(idx);
}

module.exports = { uploadToSupabase, uploadManyToSupabase };
