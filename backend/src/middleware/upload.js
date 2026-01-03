const multer = require('multer');
const path = require('path');

// Use memory storage so we can stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpg|jpeg|png)$/i;
  const mimeAllowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedExt.test(path.extname(file.originalname)) || !mimeAllowed.includes(file.mimetype)) {
    return cb(new Error('Only image files (jpg, jpeg, png) are allowed'), false);
  }
  cb(null, true);
};

const limits = {
  fileSize: 6 * 1024 * 1024 // 6 MB per file
};

const upload = multer({ storage, fileFilter, limits });

module.exports = upload;
