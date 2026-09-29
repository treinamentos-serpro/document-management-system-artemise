# Especificação - Document Management System

## 1. Objetivo

Oferecer uma aplicação web para enviar, listar e baixar documentos armazenados localmente, com metadados simples e sem dependência de serviços externos.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição HTTP.
- Listagem dos documentos disponíveis na instância em execução.
- Download de um documento pelo identificador.
- Registro de metadados do documento e de um campo `owner` reservado à gestão simples nesta fase.
- Interface web para upload, listagem e download.
- Armazenamento dos arquivos no filesystem local da aplicação, em `backend/storage`, com Multer `diskStorage`.

### Fora do escopo

- Autenticação, cadastro de usuários, autorização e isolamento de dados por usuário.
- Persistência durável dos metadados entre reinicializações do processo.
- Armazenamento externo, em nuvem ou por serviço de terceiros.
- Versionamento, edição, exclusão e compartilhamento de documentos.
- Antivírus, análise profunda do conteúdo e garantia de que um arquivo é seguro apenas por sua extensão ou MIME type.
- Paginação da listagem nesta fase inicial.

> **Limitação de ownership:** sem autenticação, todos os documentos da instância são acessíveis por qualquer cliente que consiga chamar a API. O campo `owner` terá o valor fixo `default`; ele não identifica nem autentica uma pessoa e não deve ser tratado como controle de acesso.

## 3. Requisitos funcionais

| ID | Requisito | Critério de aceite |
| --- | --- | --- |
| RF-01 | O sistema deve aceitar um arquivo em `multipart/form-data`, no campo `file`. | Uma requisição válida cria um documento e retorna seus metadados com status `201`. |
| RF-02 | O sistema deve rejeitar upload sem arquivo, tipo não permitido ou arquivo acima do limite configurado. | Cada caso retorna erro estruturado e não deixa um arquivo parcial registrado como documento. |
| RF-03 | O sistema deve atribuir um identificador único e metadados ao documento enviado. | A resposta contém `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-04 | O sistema deve gravar o conteúdo enviado em `backend/storage` usando Multer com `diskStorage`. | O conteúdo fica no filesystem local e o nome físico não é derivado diretamente do nome original. |
| RF-05 | O sistema deve listar os metadados de todos os documentos conhecidos pela instância em execução. | A resposta contém uma lista ordenada de forma decrescente por `uploadedAt`; em empate, a ordenação por `id` é determinística. |
| RF-06 | O sistema deve permitir baixar um documento pelo identificador. | Um ID existente retorna o conteúdo binário e um `Content-Disposition` com o nome original tratado com segurança. |
| RF-07 | O sistema deve informar quando um ID não está registrado ou quando o arquivo correspondente não existe no disco. | A API retorna `404` com código de erro adequado, sem expor caminhos locais. |
| RF-08 | O sistema deve tratar falhas de gravação ou registro dos metadados sem deixar estado parcialmente válido. | Em falha após a gravação, deve tentar remover o arquivo criado; a resposta não deve indicar sucesso. |
| RF-09 | A interface deve oferecer os fluxos de upload, listagem e download e apresentar mensagens compreensíveis para sucesso e falha. | Os fluxos usam a API e refletem seus estados sem depender de persistência no navegador. |
| RF-10 | O sistema deve manter `owner` como `default` em todos os documentos desta fase. | O valor é atribuído pelo servidor, não aceito como identidade confiável enviada pelo cliente. |

## 4. Requisitos não funcionais

| ID | Requisito | Critério / observação |
| --- | --- | --- |
| RNF-01 | O armazenamento dos arquivos deve ser estritamente local. | Usar `backend/storage` e Multer `diskStorage`; não integrar provedores externos. |
| RNF-02 | Os metadados devem permanecer em memória nesta fase. | Uma reinicialização limpa os metadados; arquivos que permanecerem no disco podem ficar órfãos e não aparecem na listagem. |
| RNF-03 | A configuração operacional deve usar variáveis de ambiente quando aplicável. | `PORT` controla a porta; `MAX_FILE_SIZE_BYTES` configura o limite, com padrão de `10485760` bytes (10 MiB). |
| RNF-04 | O upload deve aplicar um limite de tamanho e uma allowlist de formatos documentais. | O limite padrão é 10 MiB; a validação considera extensão e MIME type e não confia exclusivamente em nenhum dos dois. |
| RNF-05 | Nomes e caminhos de arquivo devem ser tratados com segurança. | Gerar um nome físico independente do nome original; normalizar o nome enviado no `Content-Disposition`; não revelar caminhos internos nas respostas. |
| RNF-06 | A API deve manter respostas de erro consistentes. | Usar JSON no formato `{ "error": { "code": "...", "message": "..." } }` para erros HTTP. |
| RNF-07 | A implementação deve seguir a Clean Architecture simples do projeto. | Dependências fluem de `routes` para `controllers`, `services` e `repositories`; camadas internas não conhecem Express nem outras camadas externas. |
| RNF-08 | A interface deve comunicar-se com a API pelo proxy existente. | O frontend chama caminhos com prefixo `/api`; o proxy Vite remove esse prefixo ao encaminhar ao backend. Os caminhos do backend não incluem `/api`. |
| RNF-09 | A validação de formato não deve ser apresentada como análise de segurança do conteúdo. | Antivírus e inspeção profunda ficam fora do escopo; extensão e MIME podem ser falsificados. |

### Formatos aceitos inicialmente

A allowlist inicial deve incluir PDF, texto simples e formatos Office comuns: `.pdf`, `.txt`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt` e `.pptx`. A validação deve rejeitar tipos não aceitos com `415`; não se deve confiar somente na extensão ou no MIME enviado pelo cliente. A verificação nesta fase não substitui uma análise completa do conteúdo.

## 5. Modelo de dados (metadados do documento)

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único UUID v4, gerado pelo servidor. |
| `originalName` | string | Nome original informado para o arquivo, preservado como metadado e sanitizado ao compor cabeçalhos HTTP. |
| `size` | number | Tamanho do arquivo em bytes, como inteiro não negativo. |
| `uploadedAt` | string | Data e hora UTC da recepção bem-sucedida, em ISO 8601. |
| `owner` | string | Valor fixo `default` nesta fase, sem representar identidade autenticada. |

O nome físico do arquivo armazenado é interno e independente de `originalName`; ele não faz parte do contrato público dos metadados. Metadados ficam em memória e são mantidos apenas durante a vida do processo. Não há banco de dados nesta fase.

## 6. Contratos de API

Os caminhos abaixo são paths do backend. A API não adiciona `/api`; em desenvolvimento, o frontend usa o proxy Vite, que recebe chamadas `/api/...` e remove o prefixo antes do encaminhamento.

Erros seguem o formato:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

A propriedade `message` deve ser apropriada para exibição ao usuário. Detalhes internos, stack traces e caminhos do filesystem não devem ser retornados.

### `POST /upload`

- **Finalidade:** receber e registrar um documento.
- **Content-Type:** `multipart/form-data`.
- **Entrada:** exatamente um arquivo no campo `file`. Campos de formulário adicionais não definem `owner`.
- **Limite:** `MAX_FILE_SIZE_BYTES`, padrão `10485760` bytes. O limite é aplicado durante o recebimento do arquivo.
- **Formatos aceitos:** conforme allowlist da seção 4.
- **Sucesso:** `201 Created`, `Content-Type: application/json`.

```json
{
  "document": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalName": "relatorio.pdf",
    "size": 24576,
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": "default"
  }
}
```

- **Erros:**
  - `400 Bad Request`, `FILE_REQUIRED`: nenhum arquivo foi enviado ou a requisição está malformada.
  - `413 Payload Too Large`, `FILE_TOO_LARGE`: o arquivo excede o limite configurado.
  - `415 Unsupported Media Type`, `FILE_TYPE_NOT_ALLOWED`: tipo ou extensão não permitido.
  - `500 Internal Server Error`, `UPLOAD_FAILED`: falha inesperada no recebimento, gravação ou registro. Não incluir detalhes internos.

### `GET /documents`

- **Finalidade:** listar os documentos registrados na memória do processo atual.
- **Entrada:** nenhuma.
- **Sucesso:** `200 OK`, `Content-Type: application/json`; ordenar por `uploadedAt` decrescente e desempatar por `id`.

```json
{
  "documents": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "default"
    }
  ]
}
```

- **Lista vazia:** retornar `200 OK` com `{"documents": []}`.
- **Erros:** `500 Internal Server Error`, `DOCUMENT_LIST_FAILED`, se não for possível obter a lista.
- **Limites:** sem paginação nesta fase. Após reinicialização, a lista começa vazia, mesmo que ainda existam arquivos no diretório local.

### `GET /documents/:id/download`

- **Finalidade:** baixar o conteúdo binário de um documento registrado.
- **Entrada:** `id` UUID do documento no path.
- **Sucesso:** `200 OK`, conteúdo binário; definir `Content-Disposition: attachment` com o `originalName` sanitizado. Definir um `Content-Type` coerente com o tipo aceito, usando `application/octet-stream` quando não for possível determiná-lo com segurança.
- **Erros:**
  - `400 Bad Request`, `INVALID_DOCUMENT_ID`: o formato do identificador é inválido.
  - `404 Not Found`, `DOCUMENT_NOT_FOUND`: não há metadados registrados para o ID.
  - `404 Not Found`, `DOCUMENT_FILE_NOT_FOUND`: há metadados, mas o arquivo não está disponível no disco.
  - `500 Internal Server Error`, `DOWNLOAD_FAILED`: falha inesperada ao ler ou transmitir o arquivo.

O download e a listagem são globais nesta fase sem autenticação. O identificador não funciona como mecanismo de autorização.

## 7. Decisões arquiteturais

- **Backend:** Node.js e Express em CommonJS, organizado nas camadas `routes/`, `controllers/`, `services/` e `repositories/`.
- **Dependências:** fluxo `routes -> controllers -> services -> repositories`. Rotas registram endpoints e middleware; controllers adaptam HTTP; services concentram regras de negócio; repositories isolam acesso aos metadados e aos arquivos locais. Camadas internas não dependem de Express.
- **Upload:** Multer com `diskStorage` grava em `backend/storage`. O middleware limita o tamanho e fornece os dados do arquivo ao fluxo da aplicação. O nome físico é gerado pelo servidor e não incorpora path fornecido pelo cliente.
- **Persistência:** metadados guardados em memória; conteúdo guardado no filesystem local. Falha ao registrar metadados após gravar o conteúdo exige tentativa de remover o arquivo recém-criado. A reinicialização não reconcilia arquivos órfãos.
- **Frontend:** React com componentes funcionais e Hooks; Vite; chamadas via `fetch` usando `/api` e o proxy existente. Os paths públicos do backend permanecem sem esse prefixo.
- **Configuração:** `PORT` e `MAX_FILE_SIZE_BYTES` são configuráveis por ambiente; o diretório de storage permanece `backend/storage` conforme a restrição do projeto.
- **Estado atual:** o seed existente implementa somente `GET /health`; os endpoints, regras e interface descritos nesta especificação são requisitos futuros, não funcionalidades já entregues.

## 8. Plano de execução

1. **Fechar os contratos e critérios:** revisar requisitos, formatos aceitos, limite configurável, respostas HTTP, erros e limitações de ownership antes da implementação.
2. **Entregar a API e o fluxo local de documentos:** implementar upload com Multer `diskStorage`, validações, metadados em memória, listagem ordenada e download por ID, mantendo as responsabilidades nas camadas definidas.
3. **Integrar a experiência web:** conectar upload, listagem e download à API pelo proxy `/api`, com estados de carregamento, sucesso, lista vazia e erro.
4. **Validar o comportamento ponta a ponta:** cobrir casos de sucesso e falha, limite e tipo de arquivo, IDs inexistentes, arquivo ausente, reinicialização e apresentação segura dos nomes. Confirmar explicitamente as limitações de autenticação e persistência desta fase.

Este plano descreve etapas futuras do produto; não solicita nem inclui alterações de arquivos de backend ou frontend como parte da produção desta especificação.
