# ROSS AI

Informação jurídica, em linguagem simples. / Legal information, made clear.

Aplicativo web estático: interface de conversa, base de legislação federal brasileira capturada da fonte oficial e explicação em linguagem simples por IA (Google Gemini no site; capacidade `sample` no visualizador de artifacts do claude.ai).

## Como rodar

Site publicado: https://matheusbauto-blip.github.io/ross-ai/ (GitHub Pages). O fluxo `.github/workflows/pages.yml` publica a cada push na `main`: copia só os arquivos do site e carimba o commit nos endereços dos arquivos (`app.js?v=abc1234`, também nas buscas de dados), para que cada atualização chegue sem cache antigo. Localmente o carimbo fica como `__ROSS_VERSION__`, sem efeito.

Localmente, sirva a pasta com um servidor estático e abra `index.html`:

```bash
python3 -m http.server 8765
```

`index.html` é o documento completo (site); `artifact.html` é o mesmo conteúdo sem o esqueleto HTML, usado para publicar como artifact no claude.ai. Os dois carregam os mesmos arquivos.

## Backend (API própria)

A explicação em linguagem simples usa o Google Gemini no site, pela função `supabase/functions/ross-ai/index.ts` (Supabase Edge Function), cujo endereço está em `config.js`. A função recebe a pergunta e os trechos de lei já selecionados pelo app, chama o Gemini (`gemini-3.5-flash` para a resposta, `gemini-3.1-flash-lite` para preparar a busca), valida a saída estruturada e devolve o JSON que a interface renderiza. Ela também aceita imagens e PDFs anexados. Dentro do claude.ai, permanece a capacidade `sample` da conta de quem abre o artifact.

Proteções: só aceita chamadas das origens listadas, limita pedidos por IP e por dia (tabela `ross_ai_usage`, migração em `supabase/migrations/`) e não guarda perguntas nem documentos.

Configure `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`) em Supabase → Edge Functions → Secrets. Alternativamente, guarde a chave no Vault com o nome `ross_ai_google_api_key` e aplique `supabase/schema/google-key.sql`: a função de leitura usa os privilégios de quem chama e permite execução somente a `service_role`. As variáveis de ambiente têm prioridade. Nunca coloque a chave em `config.js`, no Git ou no navegador. Variáveis opcionais: `ROSS_ALLOWED_ORIGINS`, `ROSS_ANSWER_MODEL`, `ROSS_HELPER_MODEL`, `ROSS_IP_DAILY_LIMIT`, `ROSS_GLOBAL_DAILY_LIMIT`, `ROSS_SALT`. Ao implantar, inclua também o módulo `gemini.mjs`.

## Modos de resposta

- **Fontes oficiais** (padrão): seleciona normas no catálogo, busca artigos no texto oficial capturado e pede à IA uma explicação restrita a esses trechos. Cada fonte citada mostra artigo, situação, link oficial, data da captura e versão. Sem a IA configurada, a resposta mostra os próprios trechos oficiais.
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

Na busca do site, os IDs de normas sugeridos pelo modelo são preservados junto às correspondências de palavras inteiras. Os artigos usam a mesma normalização em pergunta e texto; siglas não correspondem a fragmentos de palavras. A leitura também recupera caracteres UTF-8 decodificados incorretamente em algumas capturas.

Antes da explicação, uma segunda chamada ao modelo rápido seleciona os trechos relevantes dentre candidatos de cada norma. Só IDs presentes nessa lista são aceitos. Uma seleção vazia pede mais contexto, e uma falha nessa verificação suspende a conclusão gerada por IA. Não encontrar trechos não é apresentado como inexistência de legislação aplicável.

`node --test tests/*.test.mjs` verifica recuperação de artigos em cenários das 66 normas do catálogo, colisão traseira sem expansão por IA, colisões de palavras e siglas, referências inexistentes, texto corrompido, busca no repositório e integração com o provedor. Esses testes verificam o mecanismo de busca; não garantem a correção jurídica de toda resposta possível.

Para os testes de interação das telas, execute `node qa/prepare-dom.mjs` e `node --test qa/ui.test.mjs`. A preparação baixa uma versão fixa do ambiente DOM e confere sua integridade. Esses testes percorrem as telas em português e inglês, envio e reenvio, anexos, recuperação do histórico e busca/leitura no repositório; não substituem uma revisão visual em navegador.

Os anexos têm limite de quatro arquivos e 20 MB no total por mensagem. Se um envio falhar, o arquivo permanece apenas em memória para uma nova tentativa; após recarregar o app, é necessário anexá-lo novamente. Respostas interrompidas passam a mostrar a opção de nova tentativa ao restaurar o histórico.

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

`app.js` define `providers.oficial` (busca + IA), `providers.demo` (roteirizado, fontes fictícias) e `providers.ai` (IA sem fontes). Para trocar a busca local por um backend (por exemplo, busca semântica em servidor), crie um provedor com a mesma assinatura:

```js
respond({ text, attachments, conv, lang, onStep, signal }) → Promise<answer>
```

O objeto `answer` usa os campos lidos por `answerHTML`: `kind`, `summary`, `sourcesSay[]`, `depends[]`, `sources[]`,
`nextSteps[]`, `questions[]`, `document{}`, `limitNotice{}`, `warnings[]`, `mode`.

## Privacidade no protótipo

Conversas, nomes de anexos e preferências ficam no `localStorage` do navegador. Arquivos não são lidos nem enviados no modo de
demonstração. Nos modos com IA no site, perguntas, trechos selecionados e anexos passam pelo servidor e são enviados ao Google Gemini para gerar a resposta. O servidor não persiste perguntas nem anexos.
