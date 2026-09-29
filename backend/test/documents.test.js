const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

process.env.MAX_FILE_SIZE_BYTES = '128';

const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');
const storageDirectory = path.resolve(__dirname, '../storage');
const uploadedIds = new Set();
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
  await Promise.all(Array.from(uploadedIds, (id) => documentsRepository.removeById(id)));
});

function createUploadForm(name, content, type) {
  const form = new FormData();
  form.append('file', new Blob([content], { type }), name);
  return form;
}

test('upload, listagem e download de documentos', async () => {
  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('report.pdf', 'document content', 'application/pdf'),
  });

  assert.equal(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  uploadedIds.add(document.id);
  assert.match(document.id, /^[0-9a-f-]{36}$/i);
  assert.equal(document.originalName, 'report.pdf');
  assert.equal(document.size, 16);
  assert.equal(document.owner, 'default');
  assert.ok(Number.isFinite(Date.parse(document.uploadedAt)));

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.equal(listResponse.status, 200);
  const listedDocuments = (await listResponse.json()).documents;
  assert.ok(listedDocuments.some((item) => item.id === document.id));

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
  assert.equal(await downloadResponse.text(), 'document content');
});

test('upload sem arquivo retorna erro estruturado', async () => {
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST' });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
});

test('campo multipart diferente de file retorna erro estruturado', async () => {
  const form = new FormData();
  form.append('document', new Blob(['content'], { type: 'application/pdf' }), 'report.pdf');
  const response = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });

  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, 'FILE_REQUIRED');
});

test('tipo não permitido retorna 415', async () => {
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('malware.exe', 'not allowed', 'application/octet-stream'),
  });
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error.code, 'FILE_TYPE_NOT_ALLOWED');
});

test('arquivo acima do limite retorna 413 sem deixar arquivo parcial', async () => {
  const filesBefore = await fs.readdir(storageDirectory);
  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: createUploadForm('large.pdf', Buffer.alloc(129), 'application/pdf'),
  });

  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
  assert.deepEqual(await fs.readdir(storageDirectory), filesBefore);
});

test('IDs inválidos e inexistentes retornam erros estruturados', async () => {
  const invalidResponse = await fetch(`${baseUrl}/documents/not-a-uuid/download`);
  assert.equal(invalidResponse.status, 400);
  assert.equal((await invalidResponse.json()).error.code, 'INVALID_DOCUMENT_ID');

  const missingResponse = await fetch(
    `${baseUrl}/documents/00000000-0000-4000-8000-000000000000/download`,
  );
  assert.equal(missingResponse.status, 404);
  assert.equal((await missingResponse.json()).error.code, 'DOCUMENT_NOT_FOUND');
});