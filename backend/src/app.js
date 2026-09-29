const express = require('express');
const documentsRouter = require('./routes/documents.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(documentsRouter);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let status = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Ocorreu um erro interno.';

  if (error.name === 'MulterError' && error.code === 'LIMIT_FILE_SIZE') {
    status = 413;
    code = 'FILE_TOO_LARGE';
    message = 'O arquivo excede o limite permitido.';
  } else if (error.name === 'MulterError' && error.code === 'LIMIT_UNEXPECTED_FILE') {
    status = 400;
    code = 'FILE_REQUIRED';
    message = 'Envie um arquivo no campo "file".';
  } else if (error.name === 'MulterError') {
    status = 400;
    code = 'INVALID_UPLOAD_FIELD';
    message = 'A requisição de upload é inválida.';
  } else if (error.code === 'FILE_TYPE_NOT_ALLOWED') {
    status = 415;
    code = error.code;
    message = 'O tipo de arquivo não é permitido.';
  } else if (error.code === 'INVALID_DOCUMENT_ID') {
    status = 400;
    code = error.code;
    message = 'O identificador do documento é inválido.';
  } else if (error.code === 'DOCUMENT_NOT_FOUND') {
    status = 404;
    code = error.code;
    message = 'Documento não encontrado.';
  } else if (error.code === 'DOCUMENT_FILE_NOT_FOUND') {
    status = 404;
    code = error.code;
    message = 'O arquivo do documento não está disponível.';
  } else if (error.code === 'UPLOAD_FAILED') {
    code = error.code;
    message = 'Não foi possível enviar o documento.';
  } else if (error.code === 'DOWNLOAD_FAILED') {
    code = error.code;
    message = 'Não foi possível baixar o documento.';
  } else if (error.code === 'DOCUMENT_LIST_FAILED') {
    code = error.code;
    message = 'Não foi possível listar os documentos.';
  }

  res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
