const API_PREFIX = '/api';

async function ensureSuccess(response) {
  if (response.ok) {
    return;
  }

  let message = 'Não foi possível concluir a solicitação.';
  try {
    const payload = await response.json();
    message = payload.error?.message || message;
  } catch {
    // Keep a generic message when the server response is not JSON.
  }

  throw new Error(message);
}

export async function listDocuments() {
  const response = await fetch(`${API_PREFIX}/documents`);
  await ensureSuccess(response);
  const payload = await response.json();
  return payload.documents;
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_PREFIX}/upload`, {
    method: 'POST',
    body: formData,
  });
  await ensureSuccess(response);
  const payload = await response.json();
  return payload.document;
}

export async function downloadDocument(document) {
  const response = await fetch(
    `${API_PREFIX}/documents/${encodeURIComponent(document.id)}/download`,
  );
  await ensureSuccess(response);

  const objectUrl = URL.createObjectURL(await response.blob());
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName;
  link.hidden = true;
  window.document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}