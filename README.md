# ROSS AI

Informação jurídica, em linguagem simples. / Legal information, made clear.

Aplicativo web estático: interface de conversa, base de legislação federal brasileira capturada da fonte oficial (Planalto) e explicação em linguagem simples por IA (Claude, pela capacidade `sample` do visualizador de artifacts do claude.ai).

## Como rodar

Site publicado: https://matheusbauto-blip.github.io/ross-ai/ (GitHub Pages, a partir da branch `main`).

Localmente, sirva a pasta com um servidor estático e abra `index.html`:

```bash
python3 -m http.server 8765
```

`index.html` é o documento completo (site); `artifact.html` é o mesmo conteúdo sem o esqueleto HTML, usado para publicar como artifact no claude.ai. Os dois carregam os mesmos arquivos.

## Backend (API própria)

A explicação em linguagem simples usa o Claude. Dentro do claude.ai, pela capacidade `sample` (conta de quem abre o artifact). No site, pela função `supabase/functions/ross-ai/index.ts` (Supabase Edge Function), cujo endereço está em `config.js`. A função recebe a pergunta e os trechos de lei já selecionados pelo app, chama a API do Claude (`claude-opus-5-5` para a resposta, `claude-haiku-5-5` para preparar a busca) com saída estruturada e devolve o JSON que a interface renderiza. Ela também aceita imagens e PDFs anexados.

Proteções: só aceita chamadas das origens listadas, limita pedidos por IP e por dia (tabela `ross_ai_usage`, migração em `supabase/migrations/`) e não guarda perguntas nem documentos.

Para publicar ou atualizar a função é preciso o segredo `ANTHROPIC_API_KEY` no projeto Supabase (Edge Functions → Secrets). Variáveis opcionais: `ROSS_ALLOWED_ORIGINS`, `ROSS_ANSWER_MODEL`, `ROSS_HELPER_MODEL`, `ROSS_IP_DAILY_LIMIT`, `ROSS_GLOBAL_DAILY_LIMIT`, `ROSS_SALT`.

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

- `index.html` — documento completo do site; `artifact.html` — mesmo conteúdo para o artifact; `config.js` — endereço da API.
- `styles.css` — tokens de cor (claro e escuro), tipografia e componentes.
- `i18n.js` — textos da interface em pt-BR e en, páginas de Privacidade, Termos e Ajuda, países e regiões.
- `demo-data.js` — base de demonstração: registro de fontes FICTÍCIAS (com versões e fila de conferência) e respostas roteirizadas.
- `app.js` — estado, armazenamento local, telas, renderização das respostas e provedores (`demo`, `oficial`, `ai`).
- `scripts/ingest-laws.mjs` e `scripts/laws.config.json` — ingestão e verificação da legislação.
- `data/` — catálogo, normas por artigo e fila de conferência.
- `supabase/` — função de backend e migração da tabela de uso.

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
