import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import { protect } from '../middleware/authMiddleware.js';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const router = express.Router();

// Supported image extensions and mimetypes (strictly no SVG)
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'];

// Prohibited executable extensions and mimetypes
const EXECUTABLE_EXTS = [
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.bin', '.com', '.vbs', '.ps1',
  '.dll', '.scr', '.pif', '.wsf', '.jar', '.cpl', '.gadget'
];
const EXECUTABLE_MIMES = [
  'application/x-msdownload',
  'application/x-executable',
  'application/x-msdos-program',
  'application/x-sh',
  'application/x-bat',
  'application/x-dos-program',
];

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum overall (Multer level)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();

    // Explicitly reject executable files
    if (EXECUTABLE_EXTS.includes(ext) || EXECUTABLE_MIMES.includes(mime)) {
      return cb(new Error('Executable files are strictly prohibited.'));
    }

    // Explicitly reject SVG
    if (ext === '.svg' || mime === 'image/svg+xml') {
      return cb(new Error('SVG uploads are not permitted. Supported formats: JPG, JPEG, PNG, WEBP.'));
    }

    const requestedType = (req.query.type || req.body?.type || '').toLowerCase();

    // Check if resume or PDF
    if (requestedType === 'resume' || ext === '.pdf' || mime === 'application/pdf') {
      if (ext !== '.pdf' || mime !== 'application/pdf') {
        return cb(new Error('Resume must be a valid PDF document (.pdf).'));
      }
      return cb(null, true);
    }

    // Check image types
    if (ALLOWED_IMAGE_EXTS.includes(ext) && ALLOWED_IMAGE_MIMES.includes(mime)) {
      return cb(null, true);
    }

    return cb(new Error('Invalid file type. Supported formats: JPG, JPEG, PNG, WEBP for images, and PDF for resumes.'));
  },
});

// Helper for Cloudinary streaming upload
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

// Middleware wrapper for Multer error handling
const handleMulterUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size limit exceeded. Maximum size is 5MB for images and 10MB for PDF resumes.',
        });
      }
      return res.status(400).json({
        success: false,
        message: `Upload error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    next();
  });
};

router.post('/', protect, handleMulterUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select a file to upload.',
      });
    }

    const file = req.file;
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';
    const rawType = req.query.type || req.body?.type || (isPdf ? 'resume' : 'general');
    const type = ['avatar', 'project', 'certification', 'resume'].includes(rawType) ? rawType : 'general';

    // File size constraints:
    // Images: max 5 MB
    // Resume: max 10 MB
    if (isPdf) {
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Resume PDF exceeds maximum allowed size of 10 MB.',
        });
      }
    } else {
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({
          success: false,
          message: 'Image exceeds maximum allowed size of 5 MB.',
        });
      }
    }

    // Persistent storage: Cloudinary
    if (isCloudinaryConfigured()) {
      const folder = `portfolio/${type === 'avatar' ? 'avatars' : type === 'project' ? 'projects' : type === 'certification' ? 'certifications' : type === 'resume' ? 'resumes' : 'general'}`;
      const cleanBaseName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicId = isPdf
        ? `${Date.now()}-${cleanBaseName}.pdf`
        : `${Date.now()}-${cleanBaseName}`;

      const options = {
        folder,
        public_id: publicId,
        resource_type: isPdf ? 'raw' : 'image',
      };

      const result = await uploadToCloudinary(file.buffer, options);

      return res.status(200).json({
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        storage: 'cloudinary',
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      });
    }

    // Development fallback: local disk storage under server/uploads/
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const cleanName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const localFilename = `${type}-${cleanName}-${uniqueSuffix}${ext}`;
    const destinationPath = path.join(uploadsDir, localFilename);

    await fs.promises.writeFile(destinationPath, file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    const localUrl = `${protocol}://${host}/uploads/${localFilename}`;

    return res.status(200).json({
      success: true,
      url: localUrl,
      filename: localFilename,
      storage: 'local',
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'File upload failed.',
    });
  }
});

export default router;
