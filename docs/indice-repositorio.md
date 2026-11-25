# Índice completo do repositório ctresb/leis

## O que é

Um índice estático de **todas as normas em Markdown** do [ctresb/leis](https://github.com/ctresb/leis) na edição fixa `c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6` — Constituição, leis federais, decretos, atos do Congresso, legislação estadual e distrital, municipal, órgãos reguladores, jurisprudência e tratados. Ele é publicado junto com o site, em `https://matheusbauto-blip.github.io/ross-ai/index/`, e não usa o banco do Supabase.

Cada entrada guarda somente a identificação da norma:

| Campo | Conteúdo |
| --- | --- |
| `p` | caminho do arquivo dentro da unidade |
| `h` | 16 primeiros caracteres do SHA-256 do arquivo |
| `t` | título |
| `e` | ementa (até 240 caracteres) |
| `k`, `n`, `d` | tipo, número e data |
| `r` | revogação indicada no cabeçalho |
| `x` | texto parcial, sem texto integral ou só com metadados |

O índice **não contém os textos**. O texto integral é lido sob demanda pela função `ross-ai` (`repository_read` com `path`, `ref` e `hash`): a cópia própria do banco é usada quando existe; sem ela, o arquivo é lido no GitHub, sempre na edição fixa, e só é aceito se o hash conferir. Nenhum texto lido por esse caminho é gravado no banco.

## Como o app usa

- **Pesquisa jurídica → Legislação:** a pesquisa consulta ao mesmo tempo o acervo do servidor (busca dentro dos artigos dos textos já importados) e o índice completo (título, ementa e número). Resultados do índice aparecem com o selo “Índice do repositório” e o botão “Ler texto do repositório”.
  - Sem filtros: leis federais (Constituição, leis ordinárias e complementares, decretos-lei, emendas, MPs e afins).
  - Esfera federal + “Incluir decretos…”: também decretos, decretos legislativos e resoluções federais.
  - Estado escolhido: acrescenta a legislação estadual desse estado. Município: exige o estado.
  - Órgãos reguladores: escolha o órgão (a lista vem do próprio índice).
- **Na conversa:** além das 66 normas distribuídas com o app e do acervo do servidor, a resposta procura no índice federal (e no do estado da conversa). Até três normas com boa correspondência têm o texto lido e os artigos pertinentes entram na seleção de fontes, com a procedência do repositório e a ressalva de vigência não verificada.

O índice é carregado por partes conforme a pesquisa; uma pessoa que só conversa sobre leis federais baixa apenas a parte federal.

## Limites

- A busca no índice é por **título, ementa e número**, não dentro dos artigos. A busca dentro dos artigos continua valendo para os textos importados no banco.
- Normas estaduais e municipais exigem o estado; não se carrega o país inteiro numa página.
- Textos marcados como parciais ou revogados aparecem na pesquisa, mas não são usados para fundamentar respostas.
- A edição é fixa: normas publicadas no repositório depois dela só entram ao gerar e publicar um novo índice.

## Gerar de novo

```bash
git clone --depth 1 --filter=blob:none --no-checkout https://github.com/ctresb/leis.git /tmp/leis
git -C /tmp/leis sparse-checkout init --cone
git -C /tmp/leis checkout -q HEAD
node scripts/build-index.mjs --source-dir /tmp/leis --out-dir .law-index
```

O clone parcial baixa os textos unidade por unidade (sparse-checkout); o índice é retomável — unidades já geradas são puladas. Para uma edição nova do repositório, atualize `DEFAULT_REF` em `supabase/functions/ross-ai/corpus-document.mjs` (a função só aceita leituras nas edições de `INDEX_REFS`) e publique a função antes do índice.

A pasta `.law-index/` fica fora do Git. Para publicar, copie seu conteúdo para `index/` na branch `gh-pages` (ver `docs/publicacao.md`).

## Testes

- `tests/build-index.test.mjs` — campos, exclusão de pastas de trabalho, ementa truncada, retomada e recusa de edição diferente.
- `tests/law-index.test.mjs` — ordenação (número exato, todos os termos, parciais rebaixados) e escolha das partes por esfera, estado e órgão.
- `tests/repository-library.test.mjs` e `tests/process-route.test.mjs` — leitura por caminho na edição fixa, conferência de hash, recusa de caminhos e edições inválidos (400/409).
- `qa/ui.test.mjs` — pesquisa combinada, leitura de um texto do índice, resposta citando uma norma encontrada só no índice e índice lento que não atrasa a resposta (prazo de 12 s).
