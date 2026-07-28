const { randomUUID } = require('crypto');
const bucket = require('../config/firebase');

// Uploads a single multer memory-storage file (req.file) to Firebase Storage
// and returns its public URL. `folder` groups files in the bucket, e.g.
// 'profile-images', 'news-images', 'report-images', 'report-videos'.
async function uploadToFirebase(file, folder) {
  if (!file) return null;

  const safeName = `${Date.now()}-${randomUUID()}${getExtension(file.originalname)}`;
  const destination = `${folder}/${safeName}`;

  const blob = bucket.file(destination);

  await new Promise((resolve, reject) => {
    const stream = blob.createWriteStream({
      metadata: { contentType: file.mimetype },
    });
    stream.on('error', reject);
    stream.on('finish', resolve);
    stream.end(file.buffer);
  });

  await blob.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

// Convenience for multer .fields() arrays (e.g. req.files.images, req.files.videos)
async function uploadManyToFirebase(files, folder) {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map(file => uploadToFirebase(file, folder)));
}

function getExtension(originalname) {
  const idx = originalname.lastIndexOf('.');
  return idx === -1 ? '' : originalname.slice(idx);
}

module.exports = { uploadToFirebase, uploadManyToFirebase };
