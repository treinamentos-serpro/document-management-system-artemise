const path = require('node:path');

function sanitizeDocumentName(fileName) {
  const normalizedName = String(fileName || '').replace(/\\/g, '/');
  const baseName = path.basename(normalizedName);
  return baseName.replace(/[\u0000-\u001f\u007f]/g, '_') || 'document';
}

module.exports = { sanitizeDocumentName };
