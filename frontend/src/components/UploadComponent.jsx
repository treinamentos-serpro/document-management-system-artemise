import { useRef, useState } from 'react';

const ACCEPTED_FORMATS = '.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx';

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} bytes`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MiB`;
}

export default function UploadComponent({ onUpload, uploading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const inputRef = useRef(null);

  function selectFile(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFeedback({ type: '', message: '' });
  }

  async function submitUpload(event) {
    event.preventDefault();
    if (!selectedFile || uploading) {
      return;
    }

    setFeedback({ type: '', message: '' });
    try {
      await onUpload(selectedFile);
      setFeedback({ type: 'success', message: 'Documento enviado com sucesso.' });
      setSelectedFile(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  }

  return (
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="section-heading">
        <span className="section-index">01</span>
        <div>
          <h2 id="upload-title">Adicionar arquivo</h2>
          <p>Envie um documento para sua biblioteca.</p>
        </div>
      </div>

      <form onSubmit={submitUpload}>
        <label className={`file-picker${selectedFile ? ' has-file' : ''}`} htmlFor="document-file">
          <span className="upload-symbol" aria-hidden="true">↑</span>
          <span className="picker-title">
            {selectedFile ? selectedFile.name : 'Escolher um arquivo'}
          </span>
          <span className="picker-hint">
            {selectedFile ? formatFileSize(selectedFile.size) : 'PDF, TXT, DOC, XLS ou PPT'}
          </span>
          <input
            ref={inputRef}
            id="document-file"
            type="file"
            accept={ACCEPTED_FORMATS}
            onChange={selectFile}
          />
        </label>

        <p className="upload-limit">Tamanho máximo: 10 MiB</p>

        <button className="primary-button" type="submit" disabled={!selectedFile || uploading}>
          {uploading ? 'Enviando...' : 'Enviar documento'}
          {!uploading && <span aria-hidden="true">↗</span>}
        </button>
      </form>

      {feedback.message && (
        <p className={`form-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}