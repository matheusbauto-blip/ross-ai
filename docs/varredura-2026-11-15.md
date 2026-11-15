# Varredura do ROSS AI — 15 de novembro de 2026

## Escopo e resultado

Revisão da versão preparada no projeto, incluindo conversa, rascunhos, novas tentativas, anexos, busca, citações, cópia de respostas, persistência local, limites do servidor e acesso ao banco. O atendimento desta etapa fica limitado ao Brasil; a expansão internacional permanece futura.

A suíte existente passou com 109 testes. Foram reproduzidos dez cenários adicionais de falha em ambientes isolados, com respostas e indisponibilidades simuladas. Três problemas de contexto foram corrigidos, junto com a restrição da interface ao Brasil. Seis testes de interação foram acrescentados, totalizando 115 testes.

Os demais achados abaixo continuam pendentes. Esta revisão não implementou “Meu caso”, não publicou o site e não alterou a função hospedada ou o banco.

## Corrigido nesta revisão

| Problema | Mudança | Validação |
| --- | --- | --- |
| Rascunho de um assunto aparecia em outra conversa. | Rascunhos separados por conversa e pela tela inicial, durante a sessão. Um rascunho enviado é consumido; excluir a conversa remove seu rascunho. | Alternar entre duas conversas e início preserva cada texto no lugar correto. |
| Reenviar uma pergunta antiga incluía mensagens posteriores de outro assunto. | O provedor recebe apenas as mensagens anteriores à resposta que está sendo gerada ou repetida. | Uma tentativa sobre compra não recebe o assunto de aluguel introduzido depois. |
| Mudar a jurisdição durante a busca alterava a resposta em andamento. | Cada resposta guarda o país e estado do pedido original e utiliza uma cópia do contexto da consulta. | Alterar Minas Gerais para São Paulo durante o processamento não altera o pedido original nem sua nova tentativa. |
| A interface oferecia países ainda não atendidos. | País fixado em Brasil nas novas conversas, mantendo os 26 estados e o Distrito Federal. Preferências antigas de outro país são removidas dos padrões; o histórico antigo mantém sua identificação. O pedido enviado à IA explicita o escopo brasileiro. | Controles de país, criação de conversa e recuperação de preferências testados. |

Essas mudanças estão em `app.js`, `styles.css` e `qa/ui.test.mjs`. A documentação de uso e o planejamento da função de caso foram atualizados.

## Pendências prioritárias — corrigidas em 15/11/2026 (sessão posterior)

| Achado | Correção aplicada | Validação |
| --- | --- | --- |
| Citação inválida continuava visível. | `normalizeOfficial` descarta afirmações cuja referência não corresponde a um trecho consultado e não acrescenta fontes automaticamente; a resposta avisa quantas afirmações foram removidas ou que a explicação não indicou seus trechos. Respostas `nosources` preservam a explicação e as perguntas específicas do modelo. | `qa/ui.test.mjs`: “claims citing excerpts that were never consulted…” e “a nosources answer keeps…”. |
| Arquivo podia ficar sem análise. | Sem trecho de lei, um anexo é lido pelo modelo (`documentWithoutLaw`) e a resposta avisa que não houve fundamentação legal verificada; sem IA, informa que o documento não pôde ser analisado. | Caminho coberto pelos testes de anexos existentes; sem simulação do modelo real. |
| Falha na base ativava demonstração. | `activeProvider` respeita o modo escolhido; `ensureCatalog` espera o carregamento, tenta de novo e devolve erro recuperável. A demonstração só é usada quando escolhida. | `qa/ui.test.mjs`: “official mode never falls back to the demonstration…”. |
| Limite de uso liberava chamadas em caso de falha. | Na função, `prepare` e `answer` exigem o controle de uso (`strict`); falha devolve 503 `quota_unavailable` sem chamar o modelo. Busca e estatísticas do acervo continuam sem bloqueio. | `tests/process-route.test.mjs`: “a quota outage blocks paid model calls…”. |
| Continuidade incompleta dos documentos. | `historyForModel` inclui nomes de arquivos, trechos citados e observações do documento analisado, com aviso de que o original não foi reenviado. | `qa/ui.test.mjs`: “document excerpts from a previous answer travel…”. |
| Textos de produção contraditórios. | Ajuda, Termos, Privacidade e Sobre reescritos para o comportamento real (fontes oficiais, Gemini no site, acervo importado, DJEN, limites de uso); contatos fictícios substituídos pelos chamados públicos do repositório. | Páginas renderizam nos dois idiomas (teste existente); revisão jurídica dos textos ainda recomendada. |

## Outras falhas — corrigidas em 15/11/2026 (sessão posterior)

| Achado | Correção aplicada | Validação |
| --- | --- | --- |
| Uma lei indisponível derrubava toda a recuperação. | O carregamento usa `Promise.allSettled`: as normas que carregaram seguem para a busca de artigos e a resposta recebe o aviso `oficial.partialCoverage` com o nome das que faltaram. Se nenhuma carregar, o erro `law_fetch` é recuperável, com nova tentativa. | `qa/ui.test.mjs`: “one law that fails to load does not sink the retrieval…” e “when every selected law fails to load…”. |
| Cópia perdia o aviso sobre repositório. | `answerToText` usa o mesmo aviso do acervo importado exibido na tela (`corpus.answerNotice`) e, para cada fonte importada, registra edição, vigência não verificada, fonte oficial quando houver e o endereço da edição importada. | `qa/ui.test.mjs`: “the copied text carries the imported-corpus provenance…”. |
| Falha de salvamento não era informada. | `save` registra a falha (distinguindo armazenamento cheio), avisa uma vez e mostra um aviso persistente na conversa e na tela inicial, com “Exportar histórico” (arquivo de texto ou área de transferência) e “Tentar salvar de novo”. A conversa continua em memória. | `qa/ui.test.mjs`: “a storage failure is reported…” e “exporting the history…”. |
| Resposta em processamento não podia ser interrompida. | Botão “Parar” no compositor (no lugar de “Enviar” enquanto há resposta em andamento) e no cartão de carregamento; prazo de espera de 3 minutos no cliente com mensagem própria (`errors.timeout`). O texto de cancelamento avisa que um pedido já enviado pode ter sido processado e contado. | `qa/ui.test.mjs`: “a running answer can be stopped…” e “a client-side deadline ends an endless wait…”. |
| Proteção do corpo dependia de `Content-Length`. | A função lê o corpo com limite de bytes (`readBounded`) antes de interpretar o JSON; ultrapassar o limite devolve 413 `too_large` sem consultar cota nem modelo. O limite pode ser ajustado por `ROSS_MAX_BODY_BYTES`. | `tests/process-route.test.mjs`: “an oversized body without Content-Length is refused…”. Em teste real contra a função publicada (versão 9), um envio de 30 MB em chunks foi encerrado pelo gateway com HTTP 502 após cerca de 40 s, sem interpretar o corpo nem consultar cota ou modelo; o 413 é observado no handler isolado. |

## Ajuste de recuperação após caso real — 15/11/2026

Pergunta real: “comprei um celular faz 2 semanas e ele deu problrma na bateria”. A resposta publicada foi “sem fontes”, embora o Código de Defesa do Consumidor (arts. 18 e 26) esteja no catálogo. Reprodução local: a busca por palavras encontrava os arts. 18 e 26, mas o catálogo enviado à seleção de relevância mostrava só um fragmento de 155 caracteres com palavras coincidentes (ex.: “§ 2° Obstam a decadência…”), e a seleção escolheu os arts. 12 e 14 (fato do produto); o modelo de resposta, sem os prazos, declarou que os trechos não tratavam de defeitos.

| Mudança | Validação |
| --- | --- |
| O catálogo de relevância mostra o início de cada artigo (o que ele regula) e, após “…”, o trecho mais próximo da pergunta, em até 380 caracteres; a função aceita nomes de até 400 caracteres (versão 10). | `tests/legal-search.test.mjs`: “the relevance catalog shows what each article regulates…”. |
| A intenção “produto com defeito” reconhece “deu problema”, “está com problema”, “estragou”, “não carrega” (com tolerância a erro de digitação em “problema”) e produtos comuns (celular, notebook, geladeira…) além de “comprei/loja/produto”. “Problema da dívida” não é defeito. | “a phone that developed a battery problem retrieves the CDC defect and deadline rules even without AI terms”. |
| Com intenção reconhecida, os artigos que a regulam acompanham a seleção automática (até dois, além dos escolhidos); a resposta cita só o que usar. | “a recognised intent keeps its governing articles in the selection…”. |
| “celular” deixa de ser sinônimo de “telefone” (que puxava venda por telefone) e passa a “produto, aparelho”. | Reprodução local da pergunta. |
| Sem fontes, as perguntas genéricas (“sobre qual tema é a dúvida…”) só aparecem quando o modelo não deu explicação própria. | `qa/ui.test.mjs`: “generic clarification questions appear only when…”. |

A pergunta não foi reenviada ao modelo real durante a correção; a validação é por reprodução local da busca e pelos testes.

## Pendências prioritárias (registro original)

| Prioridade | Achado e evidência | Correção indicada |
| --- | --- | --- |
| Alta | **Citação inválida pode continuar visível.** Ao fornecer uma saída simulada com `ref: 999999`, `normalizeOfficial` conserva a afirmação com referência nula e acrescenta automaticamente uma fonte real disponível. Isso não prova que o modelo produzirá essa saída; prova que a validação permite apresentá-la. | Rejeitar referências inexistentes antes da renderização e da atribuição de fontes. Uma fonte acrescentada automaticamente não deve conferir aparência de fundamentação à afirmação. Validar também a correspondência entre afirmação e trecho. |
| Alta | **Arquivo pode não ser analisado.** Com um JPG e “Pode analisar isso?”, uma busca sem resultados encerra em `nosources` antes de ler ou enviar o arquivo ao modelo. A simulação registrou apenas `search` e `prepare`; a leitura do arquivo e `answer` não ocorreram. | Identificar o material e a intenção antes de depender da busca jurídica. Se faltar fonte legal, distinguir a leitura do documento da conclusão jurídica e explicar a limitação. |
| Alta | **Falha na base ativa demonstração.** `activeProvider` devolve o provedor fictício quando o catálogo não está disponível, mesmo com o modo oficial selecionado. Isso também pode ocorrer enquanto o catálogo carrega. | Manter o modo escolhido, mostrar carregamento ou indisponibilidade e permitir nova tentativa. Reservar demonstração à escolha explícita. |
| Alta | **Limite de uso libera chamadas em caso de falha.** Na função do servidor, `checkQuota` devolve `allowed: true` quando o banco de cotas retorna erro. A falha foi simulada, sem provocar indisponibilidade real. | Suspender chamadas pagas à IA quando o controle de uso não puder ser verificado, com erro recuperável e monitoramento. Distinguir o comportamento das operações de leitura que não chamam o modelo. |
| Alta | **Continuidade incompleta dos documentos.** Após uma resposta bem-sucedida, o histórico conserva metadados do arquivo, e `historyForModel` envia apenas o texto do cliente e o resumo do assistente. Trechos, notas e conteúdo original não acompanham a pergunta seguinte. | Manter contexto documental estruturado por conversa, com origem e trecho, antes de oferecer organização completa de casos. Informar quando o original precisar ser reenviado. |
| Alta | **Textos de produção contraditórios.** Ajuda, termos, privacidade e “Sobre” ainda contêm descrições da demonstração e contatos `exemplo.invalid`, apesar do uso de fontes oficiais e do envio ao Google. | Atualizar a descrição ao comportamento real e obter os contatos reais do responsável. Conferir as afirmações sobre tratamento dos dados com a configuração efetivamente utilizada. |

## Outras falhas confirmadas (registro original)

| Prioridade | Achado e evidência | Correção indicada |
| --- | --- | --- |
| Média | **Uma lei indisponível derruba toda a recuperação.** `Promise.all(laws.map(loadLaw))` rejeita quando um JSON falha. Na simulação, o Código Civil carregou, mas uma falha no CTB impediu a etapa de resposta. | Tratar falhas por norma, aproveitar somente os trechos disponíveis que realmente respondam à pergunta e sinalizar a cobertura parcial. |
| Média | **Cópia perde o aviso sobre repositório.** A tela distingue o acervo importado, mas `answerToText` usa o aviso de Planalto/Câmara mesmo quando `corpus: true`. | Preservar na cópia a mesma procedência, edição e ressalva de vigência mostradas na tela. |
| Média | **Perguntas específicas são descartadas.** `normalizeOfficial` troca a saída `nosources` por `emptyOfficial`, descartando a explicação e as perguntas específicas que o modelo havia retornado. | Preservar esclarecimentos pertinentes e validados, sem reiniciar o atendimento com perguntas genéricas. |
| Média | **Falha de salvamento não é informada.** Uma exceção simulada de armazenamento é ignorada por `save`; o cliente não recebe indicação de que o histórico não foi persistido. | Informar o problema sem apagar a conversa em memória e oferecer uma forma de recuperar ou exportar o conteúdo. |
| Média | **Resposta em processamento não pode ser interrompida pela interface.** Há um controlador de cancelamento, mas não existe botão que o acione. | Expor “Parar” e estabelecer prazo de espera no cliente. Não prometer cancelamento da cobrança do provedor após o pedido já enviado. |
| Média | **Proteção do corpo depende de `Content-Length`.** Em execução isolada do handler, um JSON acima de 28 MiB sem esse cabeçalho foi interpretado e retornou `unknown_op`, em vez de rejeição por tamanho. Não foi enviado corpo grande ao serviço de produção; o perímetro da hospedagem pode impor limites adicionais. | Limitar os bytes efetivamente lidos antes de interpretar o JSON e validar tamanho total e formatos no servidor. |

## Melhorias de arquitetura e qualidade

- Antes de implementar “Meu caso”, usar uma única estrutura para fatos, documentos, correções, hipóteses e pendências. O desenho detalhado está em `funcao-organizar-caso.md`.
- A memória enviada ao modelo usa seis mensagens recentes e resumos de respostas. Isso não substitui a estrutura de um caso longo. Preservar dados essenciais fora dessa janela e manter sua origem.
- A seleção de relevância recebe descrições curtas dos artigos e aceita até três candidatos. Os testes atuais verificam recuperação e IDs, não a exatidão jurídica de todas as respostas. Acrescentar avaliações completas com condições, exceções, perguntas sucessivas e respostas insuficientes.
- Contar a experiência de uso por consulta do cliente: uma pergunta comum faz duas preparações e uma chamada de resposta, além da pesquisa. O limite técnico por chamada não equivale ao número de perguntas disponíveis; chamadas de busca também entram no total diário agregado do SQL atual.
- As avaliações “útil/não útil” permanecem locais. Para acompanhar qualidade, definir coleta mínima e transparente de motivo do erro, latência e categoria, com proteção dos documentos e dados pessoais.
- Revisar atualização de legislação e avisos de cobertura. Uma captura recente não confirma, sozinha, toda a vigência ou a aplicabilidade de uma norma.

## Banco e abrangência verificados

Consulta somente de leitura ao projeto utilizado pelo app:

- Acervo importado: **235 documentos**, sendo **205 federais**, **30 estaduais** e **nenhum municipal**. A base se identifica como incompleta.
- Catálogo local: **66 normas** capturadas de fontes oficiais, separado do acervo importado.
- RLS habilitado nas três tabelas usadas pelo app nesta revisão.
- Acesso direto de leitura de documentos e trechos negado a `anon`; execução das funções de busca e de contagem de uso negada a `anon`; execução da contagem de uso também negada a `authenticated`.
- Os verificadores do banco retornaram avisos informativos, sem alertas altos. O aviso de [RLS habilitado sem políticas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) não foi tratado como motivo para abrir tabelas privadas: o acesso atual passa pelo servidor.

Isso não equivale a auditoria integral de segurança ou garantia da correção jurídica de toda resposta.

## Validação e limites

Comando da suíte completa:

```sh
ROSS_DOM_MODULE=/tmp/ross-qa-dom/linkedom-worker.mjs node --test --test-concurrency=1 tests/*.test.mjs qa/ui.test.mjs
```

Após as correções de 15/11/2026, a suíte completa passou com **162 testes** (118 unitários e 44 de interface).

Foram verificadas também a sintaxe dos arquivos JavaScript e a consistência das alterações. As reproduções adicionais usaram um DOM simulado; as duas falhas do handler usaram banco e provedor substituídos por simuladores. Não foram enviados documentos privados ou pedidos de teste ao modelo real durante a varredura.

Permanecem necessárias a revisão visual em navegador real, especialmente no celular, a validação jurídica dos cenários completos e a conferência da versão efetivamente publicada após uma futura publicação.
