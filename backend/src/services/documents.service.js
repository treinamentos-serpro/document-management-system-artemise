const crypto = require('node:crypto');
const path = require('node:path');
const documentsRepository = require('../repositories/documents.repository');

function createError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function toPublicDocument(record) {
  return {
    id: record.id,
    originalName: record.originalName,
    size: record.size,
    uploadedAt: record.uploadedAt,
    owner: record.owner,
  };
}

async function createDocument(file) {
  const originalName = path.basename(file.originalname.replace(/\\/g, '/'))
    .replace(/[\u0000-\u001f\u007f]/g, '_') || 'document';
  const record = {
    id: crypto.randomUUID(),
    originalName,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner: 'default',
    fileName: file.filename,
    mimeType: file.mimetype,
  };

  try {
    await documentsRepository.create(record);
  } catch (error) {
    try {
      await documentsRepository.deleteStoredFile(file.filename);
    } catch {
      // Keep the original persistence error.
    }
    throw createError('UPLOAD_FAILED');
  }

  return toPublicDocument(record);
}

async function listDocuments() {
  const records = await documentsRepository.findAll();
  return records
    .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
      || left.id.localeCompare(right.id))
    .map(toPublicDocument);
}

async function getDocumentForDownload(id) {
  const file = await documentsRepository.findFileById(id);
  if (!file) {
    throw createError('DOCUMENT_NOT_FOUND');
  }

  return {
    document: toPublicDocument(file.record),
    filePath: file.filePath,
  };
}

module.exports = { createDocument, listDocuments, getDocumentForDownload };