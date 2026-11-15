# Pacote para publicação posterior

As correções atuais podem ser preparadas sem publicar, alterar o banco ou atualizar o servidor:

```bash
node scripts/build-release.mjs
```

O resultado fica em `dist/`. A pasta contém apenas a página, os arquivos públicos, o catálogo de normas e o manifesto `release.json`. O identificador calculado a partir do conteúdo é aplicado à página e aos endereços dos arquivos para evitar cache de uma edição antiga.

## Como o site está publicado

Desde 15/11/2026 o GitHub Pages serve a branch `gh-pages`, que contém apenas o resultado de `build-release.mjs` (página, arquivos públicos, catálogo e `release.json`). A branch `main` guarda o código-fonte e não é mais servida diretamente.

Para publicar uma nova versão:

```bash
node scripts/build-release.mjs /tmp/ross-release
cd /tmp/ross-release
git init -b gh-pages && git add -A && git commit -m "Publicação do site"
git remote add origin https://github.com/matheusbauto-blip/ross-ai.git
git push --force origin gh-pages
```

O `--force` substitui a publicação anterior; o histórico do código continua na `main`. Depois do push, conferir `https://matheusbauto-blip.github.io/ross-ai/release.json`: o campo `version` deve ser o mesmo impresso pelo `build-release.mjs`.

## Publicar em outro local

1. Use o conteúdo da pasta `site/` do ZIP preparado ou o conteúdo de `dist/`.
2. Publique esses arquivos no local que serve o ROSS AI, preservando a estrutura da pasta `data/`.
3. Para o endereço atual, mantenha a publicação em `https://matheusbauto-blip.github.io/ross-ai/`. A API existente já atende a essa origem.
4. Abra uma conversa nova e confira a resposta inicial, o pedido “explique de maneira mais fácil” e a abertura das fontes recolhidas.

O pacote é estático e usa o servidor já configurado. Não contém chaves privadas, arquivos de clientes, código do backend ou dados do banco. Um endereço de hospedagem diferente precisa ser autorizado na configuração de origens da API antes do uso.

O arquivo `release.json` permite conferir a versão e a integridade dos arquivos publicados. A documentação sobre “Organizar meu caso” permanece no projeto; essa função ainda não faz parte do aplicativo.

## Validação

```bash
node --test --test-concurrency=1 tests/*.test.mjs
node qa/prepare-dom.mjs
node --test qa/ui.test.mjs
```

A preparação deste pacote não executa publicação e não altera o acesso ao GitHub.
