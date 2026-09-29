const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

const router = express.Router();
const storageDirectory = path.resolve(__dirname, '../../storage');
fs.mkdirSync(storageDirectory, { recursive: true });

const configuredMaxFileSize = Number(process.env.MAX_FILE_SIZE_BYTES);
const maxFileSize = Number.isSafeInteger(configuredMaxFileSize) && configuredMaxFileSize > 0
  ? configuredMaxFileSize
  : 10 * 1024 * 1024;

const allowedTypes = new Map([
  ['.pdf', ['application/pdf']],
  ['.txt', ['text/plain']],
  ['.doc', ['application/msword', 'application/x-msword']],
  ['.docx', ['application/vnd.openxmlformats-officedocument.wordprocessingml.document']],
  ['.xls', ['application/vnd.ms-excel', 'application/xls']],
  ['.xlsx', ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']],
  ['.ppt', ['application/vnd.ms-powerpoint', 'application/mspowerpoint']],
  ['.pptx', ['application/vnd.openxmlformats-officedocument.presentationml.presentation']],
]);

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, storageDirectory),
    filename: (req, file, callback) => {
      callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const mimeTypes = allowedTypes.get(extension);

    if (!mimeTypes || !mimeTypes.includes(file.mimetype.toLowerCase())) {
      const error = new Error('Tipo de arquivo não permitido.');
      error.code = 'FILE_TYPE_NOT_ALLOWED';
      return callback(error);
    }

    callback(null, true);
  },
});

function receiveUpload(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error && !(error instanceof multer.MulterError) && error.code !== 'FILE_TYPE_NOT_ALLOWED') {
      error.code = 'UPLOAD_FAILED';
    }
    next(error);
  });
}

router.post('/upload', receiveUpload, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

module.exports = router;