const path = require('node:path');
const documentsService = require('../services/documents.service');

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

async function upload(req, res, next) {
  if (!req.file) {
    return sendError(res, 400, 'FILE_REQUIRED', 'Envie um arquivo no campo "file".');
  }

  try {
    const document = await documentsService.createDocument(req.file);
    return res.status(201).json({ document });
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const documents = await documentsService.listDocuments();
    return res.status(200).json({ documents });
  } catch (error) {
    error.code = error.code || 'DOCUMENT_LIST_FAILED';
    next(error);
  }
}

function sanitizeDownloadName(originalName) {
  const baseName = path.basename(originalName.replace(/\\/g, '/'));
  return baseName.replace(/[\u0000-\u001f\u007f]/g, '_') || 'document';
}

async function download(req, res, next) {
  if (!uuidPattern.test(req.params.id)) {
    return sendError(res, 400, 'INVALID_DOCUMENT_ID', 'O identificador do documento é inválido.');
  }

  try {
    const file = await documentsService.getDocumentForDownload(req.params.id);
    res.download(file.filePath, sanitizeDownloadName(file.document.originalName), (error) => {
      if (error) {
        if (res.headersSent) {
          return res.destroy(error);
        }
        error.code = error.code === 'ENOENT' ? 'DOCUMENT_FILE_NOT_FOUND' : 'DOWNLOAD_FAILED';
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { upload, list, download };