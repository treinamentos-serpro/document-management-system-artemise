const fs = require('node:fs/promises');
const path = require('node:path');

const storageDirectory = path.resolve(__dirname, '../../storage');
const documents = new Map();

function getStoragePath(fileName) {
  const safeFileName = path.basename(fileName);
  return path.join(storageDirectory, safeFileName);
}

async function create(record) {
  documents.set(record.id, { ...record });
}

async function findAll() {
  return Array.from(documents.values(), (record) => ({ ...record }));
}

async function findById(id) {
  const record = documents.get(id);
  return record ? { ...record } : null;
}

async function findFileById(id) {
  const record = documents.get(id);
  if (!record) {
    return null;
  }

  const filePath = getStoragePath(record.fileName);
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const missingFileError = new Error('Arquivo do documento não encontrado.');
      missingFileError.code = 'DOCUMENT_FILE_NOT_FOUND';
      throw missingFileError;
    }
    throw error;
  }

  return { record: { ...record }, filePath };
}

async function deleteStoredFile(fileName) {
  try {
    await fs.unlink(getStoragePath(fileName));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function removeById(id) {
  const record = documents.get(id);
  if (!record) {
    return false;
  }

  documents.delete(id);
  await deleteStoredFile(record.fileName);
  return true;
}

module.exports = { create, findAll, findById, findFileById, deleteStoredFile, removeById };