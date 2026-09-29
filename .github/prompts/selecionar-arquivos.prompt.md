---
description: Localiza arquivos do workspace por extensão ou tipo.
name: selecionar-arquivos
argument-hint: extensão ou tipo e, opcionalmente, diretório (ex. jsx em frontend/src)
agent: agent
---

# Selecionar arquivos por tipo

Localize no workspace os arquivos do tipo `${input:tipo:extensão ou tipo}`.
Se informado, limite a busca ao diretório `${input:diretorio:diretório opcional}`.

Requisitos:

- Retorne os caminhos relativos agrupados por diretório.
- Se o tipo for ambíguo, explicite quais extensões foram consideradas.
- Exclua diretórios de dependências e artefatos gerados, como `node_modules`, `dist` e `coverage`.
- Se não houver correspondências, informe isso claramente.
- Apenas liste arquivos; não os edite.