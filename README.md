# ROSS AI

Informação jurídica, em linguagem simples. / Legal information, made clear.

Aplicativo web estático: interface de conversa, base de legislação federal brasileira capturada da fonte oficial (Planalto) e explicação em linguagem simples por IA (Claude, pela capacidade `sample` do visualizador de artifacts do claude.ai).

## Como rodar

`index.html` é o conteúdo da página sem o esqueleto HTML (ele é adicionado ao publicar como artifact no claude.ai).
Para abrir localmente, use `preview.html`, que embrulha o mesmo conteúdo, servido por um servidor estático:

```bash
python3 -m http.server 8765
```

Depois acesse http://localhost:8765/preview.html. Se alterar `index.html`, regenere o wrapper:

```bash
{ printf '%s\n' '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'; cat index.html; printf '%s\n' '</body></html>'; } > preview.html
```

## Modos de resposta

- **Fontes oficiais** (padrão): seleciona normas no catálogo, busca artigos vigentes no texto capturado do Planalto e pede ao Claude uma explicação restrita a esses trechos. Cada fonte citada mostra artigo, situação, link oficial, data da captura e versão. Sem a IA (fora do claude.ai), a resposta mostra os próprios trechos oficiais.
- **Demonstração**: respostas roteirizadas com fontes fictícias.
- **IA sem fontes**: resposta geral do modelo, marcada como não verificada.

## Base de legislação

`data/catalog.json` lista as normas; `data/laws/<id>.json` traz cada norma por artigo (`id`, `label`, `heading`, `text`, `status` vigente/revogado/vetado, `nota` de alteração), com `sha256` do HTML bruto, `retrievedAt`, URN LexML e histórico de versões.

Fontes dos textos, ambas oficiais e indexadas pelo LexML:

- **Planalto, Portal da Legislação** (texto compilado): usado para as dez primeiras normas (Constituição, Código Civil, CDC, CLT, Lei do Inquilinato, LGPD, Juizados Especiais, Marco Civil, Decreto 7.962 e Lei Maria da Penha).
- **Câmara dos Deputados, Legislação Informatizada** (texto atualizado): usado para as demais normas, porque o Planalto recusa conexões de clientes automatizados. O endereço de cada texto é resolvido pela página LexML da norma (`--source camara`).

Cada registro guarda de qual fonte o texto foi capturado (`source`, `textUrl`); o link oficial exibido nas respostas continua apontando para o Planalto, com âncora no artigo.

A base cobre penal e processo penal, processo civil, trânsito, tributário e empresas, família e pessoas, trabalho e previdência, saúde, educação, ambiente, imóveis e eleitoral. Para acrescentar uma norma, adicione a entrada (número, data, URL do Planalto, URN LexML e palavras-chave) em `scripts/laws.config.json` e rode a ingestão. Normas cuja "norma atualizada" não existe na Câmara ficam fora da base até o Planalto responder (o script relata cada caso).

```bash
node scripts/ingest-laws.mjs                 # baixa do Planalto, converte e grava a base
node scripts/ingest-laws.mjs --source camara # usa o texto atualizado da Câmara (via LexML)
node scripts/ingest-laws.mjs --check    # detecta mudanças na fonte oficial → data/pending.json (fila de conferência)
node scripts/ingest-laws.mjs --approve  # aplica as mudanças conferidas e registra nova versão
```

A fila de conferência aparece na página **Base de fontes** do app. A busca é local (palavras-chave com peso por raridade, apenas artigos vigentes); a IA recebe só os trechos selecionados e é instruída a não citar nada fora deles.

## Arquivos

- `index.html` — casca da página (barra, drawer, área principal, modais, toasts).
- `styles.css` — tokens de cor (claro e escuro), tipografia e componentes.
- `i18n.js` — textos da interface em pt-BR e en, páginas de Privacidade, Termos e Ajuda, países e regiões.
- `demo-data.js` — base de demonstração: registro de fontes FICTÍCIAS (com versões e fila de conferência) e respostas roteirizadas.
- `app.js` — estado, armazenamento local, telas, renderização das respostas e provedores (`demo`, `oficial`, `ai`).
- `scripts/ingest-laws.mjs` e `scripts/laws.config.json` — ingestão e verificação da legislação.
- `data/` — catálogo, normas por artigo e fila de conferência.

## Provedores de resposta

`app.js` define `providers.oficial` (busca local + Claude), `providers.demo` (roteirizado, fontes fictícias) e `providers.ai` (Claude sem fontes). Para trocar a busca local por um backend (por exemplo, busca semântica em servidor), crie um provedor com a mesma assinatura:

```js
respond({ text, attachments, conv, lang, onStep, signal }) → Promise<answer>
```

O objeto `answer` usa os campos lidos por `answerHTML`: `kind`, `summary`, `sourcesSay[]`, `depends[]`, `sources[]`,
`nextSteps[]`, `questions[]`, `document{}`, `limitNotice{}`, `warnings[]`, `mode`.

## Privacidade no protótipo

Conversas, nomes de anexos e preferências ficam no `localStorage` do navegador. Arquivos não são lidos nem enviados no modo de
demonstração. No Modo IA, imagens anexadas vão ao modelo pela conta da própria pessoa, apenas para gerar a resposta.
