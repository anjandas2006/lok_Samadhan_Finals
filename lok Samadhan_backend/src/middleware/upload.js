const multer = require('multer');

// Store files in memory buffer for immediate processing with Gemini Vision
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB limit
  },
  fileFilter: (req, file, cb) => {
    // In web browsers and mobile clients, images might be sent as image/*,
    // application/octet-stream, or inferred from filename extension.
    // Allow into memory buffer; validateImageBuffer will check magic bytes safely.
    cb(null, true);
  }
});

module.exports = upload;
