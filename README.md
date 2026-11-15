# ROSS AI

Informação jurídica, em linguagem simples. / Legal information, made clear.

Aplicativo web estático: interface de conversa, base de legislação federal brasileira capturada da fonte oficial e explicação em linguagem simples por IA (Google Gemini no site; capacidade `sample` no visualizador de artifacts do claude.ai).

O atendimento desta etapa está limitado ao Brasil, com seleção de estado e Distrito Federal. Preferências antigas de outros países não são usadas em novas conversas; o histórico anterior conserva sua identificação. A abrangência do acervo continua parcial.

## Como rodar

Site publicado: https://matheusbauto-blip.github.io/ross-ai/ (GitHub Pages). Para deixar uma edição pronta sem publicar, execute `node scripts/build-release.mjs`: `dist/` recebe apenas os arquivos públicos, com identificador de versão nos endereços para evitar cache antigo. As instruções de publicação posterior estão em `docs/publicacao.md`. Localmente o carimbo fica como `__ROSS_VERSION__`, sem efeito.

Localmente, sirva a pasta com um servidor estático e abra `index.html`:

```bash
python3 -m http.server 8765
```

`index.html` é o documento completo (site); `artifact.html` é o mesmo conteúdo sem o esqueleto HTML, usado para publicar como artifact no claude.ai. Os dois carregam os mesmos arquivos.

## Backend (API própria)

A explicação em linguagem simples usa o Google Gemini no site, pela função `supabase/functions/ross-ai/index.ts` (Supabase Edge Function), cujo endereço está em `config.js`. A função recebe a pergunta e os trechos de lei já selecionados pelo app, chama o Gemini (`gemini-3.5-flash` para a resposta, `gemini-3.1-flash-lite` para preparar a busca), valida a saída estruturada e devolve o JSON que a interface renderiza. Ela também aceita imagens e PDFs anexados. Dentro do claude.ai, permanece a capacidade `sample` da conta de quem abre o artifact.

Proteções: só aceita chamadas das origens listadas, limita pedidos por IP e por dia (tabela `ross_ai_usage`, migração em `supabase/migrations/`) e não guarda perguntas nem documentos.

Configure `GEMINI_API_KEY` (ou `GOOGLE_API_KEY`) em Supabase → Edge Functions → Secrets. Alternativamente, guarde a chave no Vault com o nome `ross_ai_google_api_key` e aplique `supabase/schema/google-key.sql`: a função de leitura usa os privilégios de quem chama e permite execução somente a `service_role`. As variáveis de ambiente têm prioridade. Nunca coloque a chave em `config.js`, no Git ou no navegador. Variáveis opcionais: `ROSS_ALLOWED_ORIGINS`, `ROSS_ANSWER_MODEL`, `ROSS_HELPER_MODEL`, `ROSS_IP_DAILY_LIMIT`, `ROSS_GLOBAL_DAILY_LIMIT`, `ROSS_SALT`. Ao implantar, inclua também o módulo `gemini.mjs`.

## Acompanhamento processual

O menu lateral inclui “Acompanhar processo”. A consulta padrão é gratuita e usa diretamente a API pública do DJEN/CNJ, sem conta ou token do Escavador. A busca interna é pelo número CNJ de 20 dígitos, com ou sem pontuação. Para localizar pelo CPF, a opção “Buscar por CPF no portal oficial” orienta o acesso ao Jus.br com a própria conta gov.br nível ouro; depois, o usuário cola o número encontrado no ROSS. Esse caminho abre o portal oficial e não importa resultados automaticamente.

A tela apresenta as publicações oficiais retornadas, datas de disponibilização, identificação da fonte e links para conferir os textos. Essa cobertura não equivale a todas as movimentações do processo. Resultado vazio não comprova inexistência do processo. Publicações canceladas e trechos abreviados têm indicação própria.

É possível acompanhar até 20 números neste navegador. A ficha aberta é consultada a cada 15 minutos enquanto a tela estiver visível, com cache de até cinco minutos e respeito aos limites da fonte. Não há avisos com o app fechado ou sincronização entre dispositivos nesta etapa. As consultas ficam separadas do histórico das conversas e não são enviadas ao Gemini.

O servidor está na versão 8 (controle de uso obrigatório para as chamadas ao modelo). Foi validada uma consulta real com HTTP 200 e três publicações do DJEN, sem chave de API. A documentação está em `docs/acompanhamento-processual.md`.

O adaptador Escavador permanece opcional, habilitado somente por `ROSS_PROCESS_SOURCE=escavador` e pelo segredo `ESCAVADOR_API_TOKEN`, com as condições da conta contratada. Ele não é usado na configuração gratuita padrão. Não há mudança automática para serviços pagos quando uma fonte falha.

## Modos de resposta

A redação atual é voltada ao público geral: o resumo aplica a regra ao relato, explica termos técnicos em palavras comuns e preserva as condições e limites das fontes. Pedidos como "explique de maneira mais fácil" usam o assunto e as referências da conversa anterior.

Rascunhos ficam separados por conversa durante a sessão. Cada resposta usa o estado e o histórico disponíveis no momento daquele pedido; uma nova tentativa de mensagem antiga não recebe mensagens posteriores. Uma alteração de estado na interface se aplica aos pedidos seguintes e não muda a consulta já em andamento.

Para o cadastro futuro, está previsto um perfil de comunicação para público geral ou profissionais do Direito. O público geral mantém a linguagem simples; o perfil profissional pode receber terminologia jurídica e maior detalhamento. A implementação das contas e dessa escolha fica para uma etapa posterior; os critérios de fundamentação nas fontes continuam iguais para ambos.

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
