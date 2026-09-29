import DownloadButton from './DownloadButton.jsx';

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(name) {
  return name.split('.').pop()?.slice(0, 4).toUpperCase() || 'FILE';
}

export default function DocumentList({ documents, loading, error, onRetry }) {
  return (
    <section className="documents-section" aria-labelledby="documents-title">
      <div className="list-heading">
        <div className="section-heading">
          <span className="section-index">02</span>
          <div>
            <h2 id="documents-title">Biblioteca</h2>
            <p>Seus arquivos disponíveis para acesso.</p>
          </div>
        </div>
        <span className="list-total">{documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}</span>
      </div>

      {loading ? (
        <div className="list-message" role="status">Carregando documentos...</div>
      ) : error ? (
        <div className="list-message error-state" role="alert">
          <p>{error}</p>
          <button className="text-button" type="button" onClick={onRetry}>Tentar novamente</button>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <span className="empty-mark" aria-hidden="true">0</span>
          <div>
            <h3>Nenhum documento por aqui</h3>
            <p>Os arquivos enviados aparecerão nesta lista.</p>
          </div>
        </div>
      ) : (
        <ul className="document-list">
          {documents.map((document) => (
            <li className="document-row" key={document.id}>
              <span className="file-type" aria-label={`Arquivo ${getExtension(document.originalName)}`}>
                {getExtension(document.originalName)}
              </span>
              <div className="document-details">
                <h3 title={document.originalName}>{document.originalName}</h3>
                <p>{formatFileSize(document.size)} <span aria-hidden="true">·</span> {formatDate(document.uploadedAt)}</p>
              </div>
              <DownloadButton document={document} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}