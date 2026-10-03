const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AppError = require('../utils/appError');

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const collegeId = req.collegeId || (req.user && req.user.collegeId) || 'common';
    const uploadDir = path.resolve(process.cwd(), 'uploads', 'receipts', String(collegeId));

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `receipt-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file format. Only JPEG, PNG, and PDF files are allowed', 400), false);
  }
};

const uploadReceipt = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter
});

module.exports = {
  uploadReceipt
};
