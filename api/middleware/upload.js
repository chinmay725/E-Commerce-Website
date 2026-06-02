const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const path       = require('path');
const fs         = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Local temp storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB per file, max 10
});

// Upload to Cloudinary & return URL
const uploadToCloud = async (filePath, folder = 'shopkart/products') => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });
  fs.unlinkSync(filePath); // Remove temp file
  return result.secure_url;
};

// Express middleware: upload files then attach URLs to req.uploadedUrls
const handleProductImages = async (req, res, next) => {
  try {
    if (!req.files?.length) return next();
    const urls = await Promise.all(req.files.map(f => uploadToCloud(f.path)));
    req.uploadedUrls = urls;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { upload, uploadToCloud, handleProductImages };
