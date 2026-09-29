import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments, uploadDocument } from './services/documentsApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadDocuments() {
      setLoading(true);
      setListError('');

      try {
        const result = await listDocuments();
        if (isCurrent) {
          setDocuments(result);
        }
      } catch (error) {
        if (isCurrent) {
          setListError(error.message);
        }
      } finally {
        if (isCurrent) {
          setLoading(false);
        }
      }
    }

    loadDocuments();
    return () => {
      isCurrent = false;
    };
  }, [reloadKey]);

  async function handleUpload(file) {
    setUploading(true);
    try {
      const document = await uploadDocument(file);
      setDocuments((currentDocuments) => [
        document,
        ...currentDocuments.filter((item) => item.id !== document.id),
      ].sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt)
        || left.id.localeCompare(right.id)));
      return document;
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="DMS, início">
          <span className="brand-mark" aria-hidden="true">D</span>
          <span>ARQUIVO<span className="brand-light"> / DMS</span></span>
        </a>
        <div className="storage-indicator">
          <span className="status-dot" />
          Armazenamento local
        </div>
      </header>

      <div className="content-wrap">
        <section className="page-intro" aria-labelledby="page-title">
          <p className="eyebrow">ESPAÇO DE DOCUMENTOS</p>
          <div className="intro-row">
            <div>
              <h1 id="page-title">Seus documentos<span>.</span></h1>
              <p className="intro-copy">Envie, organize e acesse seus arquivos em um só lugar.</p>
            </div>
            <div className="document-count" aria-live="polite">
              <strong>{loading ? '...' : String(documents.length).padStart(2, '0')}</strong>
              <span>arquivos</span>
            </div>
          </div>
        </section>

        <div className="workspace-grid">
          <UploadComponent onUpload={handleUpload} uploading={uploading} />
          <DocumentList
            documents={documents}
            loading={loading}
            error={listError}
            onRetry={() => setReloadKey((current) => current + 1)}
          />
        </div>

        <footer className="page-footer">
          <span>DOCUMENT MANAGEMENT SYSTEM</span>
          <span>Arquivos armazenados nesta aplicação</span>
        </footer>
      </div>
    </main>
  );
}