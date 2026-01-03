const streamifier = require('streamifier');
const cloudinary = require('cloudinary').v2;

// Upload a Buffer (from multer.memoryStorage) directly to Cloudinary via stream
function uploadBufferToCloudinary(buffer, folder = 'uploads') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image', quality: 'auto' }, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

module.exports = { uploadBufferToCloudinary };
