const documentsRepository = require('../repositories/documents.repository');
const { createDocumentRecord } = require('./documents.factory');
const { toPublicDocument } = require('./documents.presenter');

function createError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

async function createDocument(file) {
  const record = createDocumentRecord(file);

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