const { test } = require('node:test');
const assert = require('node:assert/strict');

const { sanitizeDocumentName } = require('../src/utils/document-name');
const { createDocumentRecord } = require('../src/services/documents.factory');
const { toPublicDocument } = require('../src/services/documents.presenter');

test('sanitiza nomes de documentos de forma consistente', () => {
  assert.equal(sanitizeDocumentName('../relatorio.pdf'), 'relatorio.pdf');
  assert.equal(sanitizeDocumentName('..\\relatorio.pdf'), 'relatorio.pdf');
  assert.equal(sanitizeDocumentName('relatorio\u0000.pdf'), 'relatorio_.pdf');
  assert.equal(sanitizeDocumentName(''), 'document');
});

test('a fábrica cria o registro completo sem expor metadados internos', () => {
  const record = createDocumentRecord({
    originalname: '../relatorio.pdf',
    filename: 'stored-file.pdf',
    size: 42,
    mimetype: 'application/pdf',
  });

  assert.match(record.id, /^[0-9a-f-]{36}$/i);
  assert.equal(record.originalName, 'relatorio.pdf');
  assert.equal(record.fileName, 'stored-file.pdf');
  assert.equal(record.mimeType, 'application/pdf');
  assert.equal(record.owner, 'default');
  assert.ok(Number.isFinite(Date.parse(record.uploadedAt)));
});

test('o presenter retorna somente os dados públicos do documento', () => {
  assert.deepEqual(toPublicDocument({
    id: 'id',
    originalName: 'report.pdf',
    size: 42,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    owner: 'default',
    fileName: 'stored-file.pdf',
    mimeType: 'application/pdf',
  }), {
    id: 'id',
    originalName: 'report.pdf',
    size: 42,
    uploadedAt: '2026-01-01T00:00:00.000Z',
    owner: 'default',
  });
});
