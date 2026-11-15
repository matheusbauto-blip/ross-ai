# Função “Organizar meu caso” — desenho funcional

## Decisão central

O ROSS AI continua sendo uma conversa jurídica. Organizar um caso é uma função opcional da conversa, assim como analisar um documento. A pessoa pode usar o aplicativo apenas para tirar uma dúvida.

Nesta etapa, o atendimento e a organização de casos ficam restritos ao Brasil. Estado e município, quando necessários, qualificam a consulta dentro do país. A expansão para legislação de outros países fica para uma etapa posterior.

Este documento define o comportamento e a experiência antes da implementação da função. Não altera o comportamento publicado nem implementa cadastro, armazenamento de casos ou processamento de documentos.

## Experiência inicial

A tela principal mantém o campo de conversa, o botão de anexar e as conversas anteriores. A pessoa escreve o que aconteceu ou faz sua pergunta. Não precisa escolher uma categoria jurídica, preencher uma ficha de caso ou conhecer termos técnicos.

O assistente responde primeiro à necessidade apresentada. Quando faltar uma informação essencial, faz uma pergunta curta relacionada ao relato. Informações já fornecidas na conversa ou nos documentos não são solicitadas novamente.

Exemplos de entradas igualmente válidas:

- “A loja pode fazer isso?” → esclarecer a dúvida e pedir o contexto que estiver faltando.
- “Explique esta cláusula” com um contrato → analisar o trecho solicitado.
- “Quero organizar os documentos para resolver esse problema” → iniciar a organização do caso.

## Como a função aparece

A função pode ser acionada por um pedido na conversa ou pela ação discreta “Organizar meu caso”. Essa ação fica nas opções da conversa; o assistente também pode oferecê-la quando houver vários materiais e uma necessidade clara de organização.

Uma oferta contextual deve explicar o benefício: “Posso reunir seu relato e os arquivos em um resumo organizado.” O cliente mantém a opção de continuar apenas conversando. A oferta não deve aparecer repetidamente após ser dispensada.

O envio de um arquivo, por si só, não inicia a montagem de um caso.

## Fluxo do cliente

| Situação | Comportamento |
| --- | --- |
| Faz uma pergunta | Recebe uma explicação direta, com fontes pertinentes quando disponíveis. |
| Pede uma explicação mais fácil | O assistente reformula a resposta anterior, mantendo o assunto, as fontes e as limitações. |
| Envia um documento com uma pergunta | O assistente analisa o pedido específico. |
| Envia um arquivo sem explicar o objetivo | O assistente identifica o material quando possível e pergunta o que a pessoa quer entender. |
| Pede para organizar o caso | O assistente aproveita o relato e os arquivos já enviados. |
| Complementa uma informação | O caso é atualizado, preservando a origem da informação. |
| Corrige uma data ou um valor | A informação anterior fica registrada como substituída, com indicação da correção. |
| Pergunta “e se...” | O assistente trata isso como hipótese; não incorpora a hipótese aos fatos relatados. |
| Muda de assunto | O assistente respeita o novo pedido. Se a mudança afetar a organização do caso, pergunta se deve abrir outra conversa. |

## Primeiros passos após a ativação

1. Mostrar uma síntese editável: “Entendi que aconteceu isto e que você quer resolver isto.”
2. Aproveitar os documentos existentes na conversa, mantendo a indicação de quais foram lidos e quais estão pendentes.
3. Perguntar apenas o que muda o entendimento ou a próxima ação, de preferência uma pergunta por vez.
4. Permitir continuar, corrigir uma informação ou acrescentar documentos a qualquer momento.

A ativação não abre um formulário longo. O assistente preenche a estrutura a partir da conversa e confirma informações quando houver ambiguidade ou divergência relevante.

## Perguntas que completam o caso

A IA conduz o esclarecimento do caso de forma progressiva. Cada resposta do cliente ou documento lido atualiza o entendimento antes da escolha da próxima pergunta. O objetivo é completar informações úteis, sem induzir respostas ou criar fatos favoráveis a uma conclusão.

Uma dúvida pontual recebe apenas os esclarecimentos necessários para responder. O acompanhamento contínuo das pendências pertence à função de caso, quando ativada. Fazer uma pergunta ou receber um arquivo não ativa essa função automaticamente.

O ciclo usa um único registro do caso:

1. Identificar o pedido atual e aproveitar os fatos, documentos e respostas já disponíveis.
2. Atualizar os fatos com sua origem; separar informações confirmadas, ausentes, corrigidas, divergentes e hipotéticas.
3. Verificar qual informação ausente pode mudar a explicação ou o próximo passo. Dar prioridade a sinais de urgência e ambiguidades que impeçam entender o relato.
4. Responder ao que já pode ser esclarecido e fazer, no máximo, uma pergunta principal por mensagem. Pedir um documento específico apenas quando sua leitura for necessária, explicando brevemente a finalidade.
5. Incorporar a resposta, encerrar a pendência correspondente e escolher a próxima pergunta somente se ainda houver uma lacuna relevante.

As perguntas são escolhidas pelo conteúdo do caso, sem um questionário fixo. Podem esclarecer o objetivo da pessoa, a sequência dos acontecimentos, datas, valores, quem participou, o que já foi tentado e quais materiais existem. Esses assuntos não são uma lista obrigatória a ser percorrida.

Regras de continuidade:

- Não repetir uma pergunta respondida no relato ou em um documento legível. Se a informação extraída for ambígua, confirmar apenas a dúvida específica, indicando o trecho de origem.
- Tratar uma resposta curta como possível resposta à pergunta pendente. Se o cliente trouxer vários detalhes de uma vez, aproveitar todos os que forem pertinentes.
- Se uma resposta contrariar outra informação, manter ambas com suas origens e pedir esclarecimento neutro. Uma correção explícita substitui a informação anterior, preservando o histórico.
- Se a pessoa não souber ou preferir não responder, registrar a limitação e continuar com o que for possível. Não insistir na mesma pergunta; mostrar quando a lacuna impede uma análise específica.
- Um pedido de explicação ou uma nova dúvida recebe atendimento antes da próxima pergunta. Uma mudança de assunto não é gravada como resposta à pendência anterior.
- Com informações suficientes para o objetivo atual, parar de perguntar e apresentar a síntese para revisão. Novos materiais podem reabrir pendências específicas; não reiniciam todo o atendimento.

Exemplo: a pessoa relata que comprou uma TV há duas semanas e surgiram pontos pretos. O sistema aproveita o tempo informado e pode perguntar: “Você já entrou em contato com a loja sobre o defeito?”. Se a resposta for “sim”, a próxima pergunta pode ser “Qual foi a resposta da loja?”. Se um comprovante ou mensagem já trouxer essa resposta, o sistema aproveita o material e segue para outra lacuna relevante. O exemplo não impõe uma sequência fixa a todo problema de consumo.

## Coerência do fluxo

A conversa, os documentos, as pendências e o cartão “Meu caso” usam o mesmo registro estruturado. A cada mensagem, o sistema identifica a intenção, propõe a atualização dos dados, valida a atualização e então prepara a resposta. O cartão é uma apresentação desse registro; não mantém uma segunda versão independente dos fatos.

A estrutura mantém a pergunta pendente e sua finalidade, para interpretar respostas curtas sem perder o contexto. Mensagens repetidas e novas tentativas de processamento não duplicam fatos ou pendências. Resultados de leitura de documentos que terminem depois de uma correção devem ser conciliados com a versão atual, preservando a correção e a origem dos dados.

O assistente propõe atualizações; a aplicação valida a conversa e o caso de destino, as referências aos documentos e a distinção entre fatos e hipóteses antes de aplicá-las. Dados de outro caso não entram apenas porque aparecem no histórico recente.

O andamento mostra pendências concretas, como “Falta confirmar a data”, sem percentuais de força do caso ou de chance de êxito. A interface continua centrada na conversa e no cartão recolhível.

## Apresentação dentro da conversa

O chat permanece como área principal. Quando a função estiver ativa, aparece um cartão “Meu caso” que pode ser expandido. No celular, ele ocupa uma área recolhível da própria conversa; em telas maiores, pode usar um painel lateral.

Quando recolhido, o cartão mostra:

- Um título curto e compreensível.
- O objetivo identificado.
- A situação atual e, quando necessário, uma próxima ação.

Quando expandido, apresenta quatro áreas:

| Área | Conteúdo |
| --- | --- |
| O que aconteceu | Resumo dos fatos e linha do tempo. |
| Documentos | Materiais enviados, descrição e situação da leitura. |
| O que falta | Perguntas e documentos realmente necessários para continuar. |
| Ver análise | Explicação, referências e versão organizada do caso. |

Artigos, trechos longos e referências ficam recolhidos por padrão. A pessoa pode abrir cada detalhe; clicar em uma citação revela a fonte correspondente.

As ações aparecem onde fazem sentido: “Adicionar arquivo”, “Corrigir informação”, “Gerar resumo” e, quando o recurso estiver disponível, “Preparar documento”. A tela não exibe botões que aparentem funcionar antes de suas capacidades estarem implementadas.

## Respostas fáceis de entender

O resumo inicial deve explicar a consequência prática para o relato em duas ou três frases, seguido do próximo passo sustentado pelas informações e pelas fontes. Termos técnicos são explicados em palavras comuns. Condições e limitações importantes continuam visíveis.

O detalhamento vem depois, sob demanda. O assistente preserva um pedido específico de formato, como “em uma frase”, “com um exemplo” ou “mais detalhado”.

No cadastro futuro, a preferência de comunicação poderá ser público geral ou profissional do Direito. Essa preferência muda a linguagem e o detalhamento; não concede acesso a casos de outras pessoas nem altera os critérios de fundamentação.

## Entendimento e continuidade

Antes de responder, o sistema recupera o assunto e o objetivo atuais, os fatos estruturados, as pendências, as fontes pertinentes e as mensagens recentes. O histórico inclui tanto as perguntas do cliente quanto as respostas anteriores.

O pedido da mensagem atual determina a ação:

- Esclarecer uma dúvida.
- Reformular uma resposta.
- Analisar um material específico.
- Organizar ou atualizar um caso.
- Corrigir uma informação.
- Preparar um documento solicitado.

Uma mensagem curta não é motivo para apagar o contexto. Quando houver duas interpretações que levem a ações diferentes, o assistente faz uma pergunta objetiva em vez de adivinhar.

Uma conversa tem, inicialmente, no máximo um caso organizado. Várias dúvidas podem permanecer apenas como conversa. Assuntos independentes não compartilham documentos e fatos automaticamente.

## Organização dos materiais

Cada arquivo tem um registro próprio, vinculado à conversa e, se ativado, ao caso. O registro guarda identificação, tipo, versão, origem do envio e situação do processamento.

Os arquivos originais ficam preservados. Texto extraído, transcrições e outras versões de leitura ficam separados. Uma informação extraída permite abrir o arquivo e localizar a página ou o trecho correspondente.

Novos envios são verificados para identificar duplicatas e versões. O cliente recebe uma pergunta quando o significado depender de distinguir, por exemplo, um rascunho de um contrato assinado.

O suporte inicial deve aproveitar os formatos existentes — PDF, JPG, PNG e WEBP. DOCX, áudios, vídeos e outros formatos exigem leitores e etapas próprios antes de serem oferecidos. Materiais incompatíveis, ilegíveis ou incompletos recebem uma indicação clara; não entram como se tivessem sido analisados.

Limites de quantidade e tamanho são apresentados no envio. O aplicativo informa quais arquivos foram aceitos e quais precisam de outra tentativa.

## Informações do caso

A estrutura mínima mantém separados:

| Informação | Conteúdo |
| --- | --- |
| Conversa | Mensagens e contexto do atendimento. |
| Caso | Título, objetivo, responsável e andamento. |
| Arquivo | Original e informações do processamento. |
| Fato | Informação relatada ou extraída, sua origem e seu estado de revisão. |
| Acontecimento | Data, descrição e referências aos materiais relacionados. |
| Pendência | Informação ou documento necessário e sua finalidade. |
| Análise | Resultado com referências e versão dos dados usados. |
| Documento gerado | Minuta ou resumo, com versão e estado de revisão. |

As informações podem estar identificadas como relato do cliente, extração de um documento, confirmação pelo cliente, hipótese ou divergência. Uma confirmação do cliente não equivale a uma conclusão jurídica sobre a veracidade de uma prova.

O texto de arquivos é tratado como conteúdo para leitura, sem alterar as instruções e os controles do assistente.

## Andamento e processamento

Os arquivos são processados por etapas, com progresso por material. A conversa continua disponível durante a leitura, com indicação do que já foi examinado e do que ainda não foi.

| Situação apresentada | Significado |
| --- | --- |
| Organizando informações | O relato e os materiais estão sendo estruturados. |
| Lendo documentos | Há arquivos em processamento; mostrar a quantidade concluída. |
| Preciso de uma informação | Há uma pendência específica que depende da pessoa. |
| Pronto para revisar | A organização e a análise disponíveis podem ser conferidas. |
| Atualizando | Um novo material ou uma correção pode alterar a análise. |
| Arquivado | O cliente encerrou a organização e pode consultar o histórico. |

Uma análise feita sem todos os materiais necessários é identificada como parcial. Uma falha em um arquivo não deve apagar o restante da conversa ou reiniciar o trabalho.

## Privacidade e persistência

Perguntas simples continuam disponíveis sem a obrigação de montar um caso. A futura necessidade de conta para salvar ou compartilhar deve aparecer no momento dessa ação, com explicação sobre o que será guardado.

Casos e arquivos persistidos são privados e possuem autorização de acesso própria. Compartilhar um caso apresenta o destinatário e o conteúdo a ser compartilhado antes da ação. O perfil de linguagem profissional, isoladamente, não é uma permissão de acesso.

Antes de habilitar o armazenamento de casos, será necessário implementar as contas, os controles de acesso, a política de retenção e exclusão e as informações correspondentes na interface de privacidade. O protótipo atual não deve anunciar salvamento remoto de casos enquanto esse recurso não existir.

O armazenamento dos arquivos é separado das informações estruturadas. As consultas jurídicas mantêm referências às fontes e às edições utilizadas; a função não depende de copiar todo o acervo de legislação para cada caso.

## Resultado da organização

O dossiê reúne objetivo, resumo, acontecimentos, materiais, informações pendentes e análise fundamentada. O cliente pode revisar e corrigir os dados. A análise mantém a versão dos materiais que a originou e mostra alterações relevantes após uma atualização.

Minutas são uma ação opcional dentro do mesmo contexto. Dados ausentes ficam indicados como pendentes. Compartilhamento e envio externo são ações próprias, com revisão do destino e do conteúdo.

## Critérios para a implementação

- Uma dúvida simples deve poder ser respondida sem ativar a função de caso.
- Um contrato enviado para uma pergunta pontual não deve iniciar um caso automaticamente.
- Pedir uma reformulação deve manter o assunto e as referências pertinentes.
- Ao ativar a função, o relato e os arquivos anteriores devem ser aproveitados.
- A IA deve fazer perguntas pertinentes às lacunas do caso, com no máximo uma pergunta principal por mensagem.
- Uma informação já disponível não deve ser pedida novamente, salvo uma ambiguidade específica.
- Respostas curtas devem considerar a pergunta pendente; detalhes adicionais devem atualizar todas as informações pertinentes.
- “Não sei” e “prefiro não responder” devem permitir continuar quando possível, preservando a limitação.
- Um pedido de explicação deve ser atendido sem avançar automaticamente o questionário.
- Com informações suficientes para o objetivo atual, a IA deve parar de perguntar e apresentar a síntese.
- A conversa e o cartão devem refletir o mesmo registro, sem duplicar fatos em novas tentativas.
- Uma leitura concluída após uma correção não deve sobrescrever silenciosamente a informação corrigida.
- Uma hipótese não deve ser gravada como um acontecimento real.
- Uma correção deve preservar o histórico e sua origem.
- Uma mudança de assunto não deve misturar arquivos de problemas diferentes.
- A interface deve indicar leituras pendentes e análises parciais.
- Uma informação extraída deve permitir localizar o material de origem.
- O cliente deve conseguir encerrar a organização e continuar apenas conversando.
- A apresentação deve funcionar no celular sem exigir navegação por várias telas.
- Salvar ou compartilhar deve depender de capacidades reais e de acesso autorizado.

## Sequência proposta

1. Validar este fluxo e o cartão recolhível dentro da conversa.
2. Definir a estrutura do caso e os controles de acesso para persistência.
3. Implementar entrada e processamento dos formatos suportados.
4. Integrar extração, continuidade, organização e análise com referências.
5. Acrescentar resumo exportável e revisão das alterações.
6. Expandir formatos, compartilhamento e minutas conforme as capacidades implementadas.
