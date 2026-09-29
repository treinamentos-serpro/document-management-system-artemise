const crypto = require('node:crypto');
const { sanitizeDocumentName } = require('../utils/document-name');

function createDocumentRecord(file) {
  return {
    id: crypto.randomUUID(),
    originalName: sanitizeDocumentName(file.originalname),
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'default',
    fileName: file.filename,
    mimeType: file.mimetype,
  };
}

module.exports = { createDocumentRecord };
