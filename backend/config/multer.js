const multer = require('multer');
const path = require('path');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB (covers short video clips)
  fileFilter: (req, file, cb) => {
    if (
      file.fieldname === 'images' &&
      !file.mimetype.startsWith('image/')
    ) {
      return cb(new Error('Only image files are allowed for photos'));
    }
    if (
      file.fieldname === 'videos' &&
      !file.mimetype.startsWith('video/')
    ) {
      return cb(new Error('Only video files are allowed for videos'));
    }
    cb(null, true);
  }
});
module.exports = upload;