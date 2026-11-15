/* ROSS AI — base de demonstração.
   TUDO AQUI É FICTÍCIO. Nenhuma norma, artigo, portaria, projeto de lei ou link corresponde a um texto real.
   Esta base existe para demonstrar a experiência enquanto o produto não está conectado a fontes jurídicas reais. */
window.ROSS_DEMO = {
  /* Registro de fontes: origem, jurisdição, data, situação, link oficial, última verificação e histórico de versões. */
  sources: [
    {
      id: 'SRC-001',
      type: 'lei',
      name: { 'pt-BR': 'Lei Fictícia nº 0.001/2024 – Contratos de prestação de serviços continuados', en: 'Fictional Law No. 0.001/2024 – Continuing service contracts' },
      jurisdiction: { 'pt-BR': 'Brasil · Federal (exemplo)', en: 'Brazil · Federal (example)' },
      published: '2024-03-15',
      status: 'vigente',
      index: { 'pt-BR': 'Repositório de exemplo "LexÍndice"', en: 'Example repository "LexIndex"' },
      url: 'https://exemplo.invalid/leis/0001-2024',
      verifiedAt: '2026-11-05',
      currentVersion: 'v2',
      versions: [
        { id: 'v1', date: '2024-03-15', note: { 'pt-BR': 'Texto original. Art. 12 permitia multa fixa por cancelamento antecipado.', en: 'Original text. Art. 12 allowed a fixed early-termination penalty.' } },
        { id: 'v2', date: '2025-07-01', note: { 'pt-BR': 'Nova redação do art. 12: multa proporcional ao período restante.', en: 'New wording of art. 12: penalty proportional to the remaining period.' } }
      ]
    },
    {
      id: 'SRC-002',
      type: 'lei',
      name: { 'pt-BR': 'Lei Fictícia nº 0.002/2019 – Compras a distância e direito de arrependimento', en: 'Fictional Law No. 0.002/2019 – Distance purchases and right of withdrawal' },
      jurisdiction: { 'pt-BR': 'Brasil · Federal (exemplo)', en: 'Brazil · Federal (example)' },
      published: '2019-09-02',
      status: 'vigente',
      index: { 'pt-BR': 'Repositório de exemplo "LexÍndice"', en: 'Example repository "LexIndex"' },
      url: 'https://exemplo.invalid/leis/0002-2019',
      verifiedAt: '2026-11-05',
      currentVersion: 'v1',
      versions: [
        { id: 'v1', date: '2019-09-02', note: { 'pt-BR': 'Texto original.', en: 'Original text.' } }
      ]
    },
    {
      id: 'SRC-003',
      type: 'portaria',
      name: { 'pt-BR': 'Portaria Fictícia nº 0.003/2023 – Registro e tratamento de reclamações de consumo', en: 'Fictional Regulation No. 0.003/2023 – Recording and handling of consumer complaints' },
      jurisdiction: { 'pt-BR': 'Brasil · Federal (exemplo)', en: 'Brazil · Federal (example)' },
      published: '2023-05-10',
      status: 'vigente',
      index: { 'pt-BR': 'Diário oficial de exemplo', en: 'Example official gazette' },
      url: 'https://exemplo.invalid/portarias/0003-2023',
      verifiedAt: '2026-10-28',
      currentVersion: 'v1',
      versions: [
        { id: 'v1', date: '2023-05-10', note: { 'pt-BR': 'Texto original.', en: 'Original text.' } }
      ],
      change: {
        detectedAt: '2026-11-10',
        summary: { 'pt-BR': 'Nova redação do art. 4º encontrada na fonte oficial (prazo de resposta ao consumidor).', en: 'New wording of art. 4 found at the official source (response deadline to the consumer).' },
        before: { 'pt-BR': 'Art. 4º O fornecedor responderá à reclamação registrada em até 10 (dez) dias.', en: 'Art. 4. The supplier shall respond to the recorded complaint within 10 (ten) days.' },
        after: { 'pt-BR': 'Art. 4º O fornecedor responderá à reclamação registrada em até 7 (sete) dias úteis.', en: 'Art. 4. The supplier shall respond to the recorded complaint within 7 (seven) business days.' }
      }
    },
    {
      id: 'SRC-004',
      type: 'pagina',
      name: { 'pt-BR': 'Página oficial fictícia – Rede de atendimento jurídico gratuito', en: 'Fictional official page – Free legal assistance network' },
      jurisdiction: { 'pt-BR': 'Brasil · Nacional (exemplo)', en: 'Brazil · National (example)' },
      published: '2026-01-20',
      status: 'pagina',
      index: { 'pt-BR': 'Portal de serviços de exemplo', en: 'Example services portal' },
      url: 'https://exemplo.invalid/atendimento/rede-gratuita',
      verifiedAt: '2026-11-01',
      currentVersion: 'v1',
      versions: [
        { id: 'v1', date: '2026-01-20', note: { 'pt-BR': 'Captura da página em 20/01/2026.', en: 'Page captured on 20 Jan 2026.' } }
      ]
    },
    {
      id: 'SRC-005',
      type: 'projeto',
      name: { 'pt-BR': 'Projeto de Lei Fictício nº 0.005/2026 – Amplia o prazo de arrependimento', en: 'Fictional Bill No. 0.005/2026 – Extends the withdrawal period' },
      jurisdiction: { 'pt-BR': 'Brasil · Federal (exemplo)', en: 'Brazil · Federal (example)' },
      published: '2026-04-08',
      status: 'projeto',
      index: { 'pt-BR': 'Portal legislativo de exemplo', en: 'Example legislative portal' },
      url: 'https://exemplo.invalid/projetos/0005-2026',
      verifiedAt: '2026-11-05',
      currentVersion: 'v1',
      versions: [
        { id: 'v1', date: '2026-04-08', note: { 'pt-BR': 'Texto apresentado. Em tramitação, sem efeito.', en: 'Text as introduced. Pending, no effect.' } }
      ]
    }
  ],

  /* Respostas roteirizadas. Campos opcionais são renderizados só quando existem. */
  answers: {
    'pt-BR': {
      clarify_clause: {
        kind: 'clarify',
        summary: 'Posso explicar, sim. Para isso, preciso ver o texto da cláusula.',
        questions: [
          'Qual é o trecho? Você pode colar o texto da cláusula na mensagem.',
          'Ou anexar o contrato em PDF ou imagem.',
          'Se quiser só ver como a explicação fica, use o exemplo abaixo.'
        ],
        quickReplies: [
          { label: 'Ver exemplo com cláusula fictícia', send: 'Pode explicar esta cláusula do meu contrato? "Cláusula 9ª – Em caso de cancelamento antecipado pelo CONTRATANTE, será devida multa equivalente a 3 (três) mensalidades, independentemente do tempo restante de contrato." (exemplo fictício)' },
          { label: 'Anexar o contrato', action: 'attach' }
        ]
      },
      answer_clause: {
        kind: 'answer',
        summary: 'Essa cláusula fixa uma multa de três mensalidades para quem cancela antes do fim do contrato, sem levar em conta quanto tempo ainda falta. Na lei fictícia usada nesta demonstração, a multa por cancelamento antecipado precisa ser proporcional ao período que resta. Por isso o valor cobrado pode ser questionado, mas a conclusão depende do contrato inteiro e dos fatos.',
        sourcesSay: [
          { title: 'Multa proporcional ao tempo restante', text: 'O art. 12 da Lei Fictícia nº 0.001/2024, na redação atual, diz que a multa por cancelamento antecipado deve ser calculada de forma proporcional ao período que falta para o fim do contrato.', ref: 1 },
          { title: 'Informação clara sobre a multa', text: 'O art. 7º da mesma lei exige que o valor e a forma de cálculo da multa estejam escritos de modo claro e destacado no contrato.', ref: 1 },
          { title: 'O que mudou', text: 'A redação original, de 2024, permitia multa fixa. Desde julho de 2025 vale a regra da proporcionalidade. Se o contrato foi assinado antes disso, a análise pode mudar.', ref: 2 }
        ],
        depends: [
          'A data de assinatura do contrato, que define qual versão da lei se aplica.',
          'Se há outras cláusulas sobre cancelamento, descontos concedidos ou prazo mínimo de permanência.',
          'Se o cancelamento foi motivado por falha do prestador, o que pode mudar a cobrança.',
          'Se a multa foi informada de forma clara no momento da contratação.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12 e art. 7º', status: 'vigente' },
          { id: 'SRC-001', version: 'v1', article: 'Art. 12 (redação original)', status: 'historico' }
        ],
        nextSteps: [
          'Reúna o contrato completo, a data de assinatura e os comprovantes de pagamento.',
          'Peça ao prestador, por escrito, a memória de cálculo da multa.',
          'Se quiser uma avaliação do seu caso, um órgão de defesa do consumidor ou um advogado podem analisar o contrato inteiro.'
        ],
        warnings: ['Esta explicação trata de uma cláusula isolada. Outras partes do contrato podem mudar a leitura.']
      },
      clarify_law: {
        kind: 'clarify',
        summary: 'Claro. Qual lei você quer entender?',
        questions: [
          'Informe o nome ou o número da norma, ou cole o trecho que você recebeu.',
          'Se souber, diga de qual país ou estado ela é.'
        ],
        quickReplies: [
          { label: 'Ver exemplo: lei fictícia sobre compras a distância', send: 'O que a Lei Fictícia nº 0.002/2019 sobre compras a distância diz em palavras simples?' }
        ]
      },
      answer_law: {
        kind: 'answer',
        summary: 'Em palavras simples: quem compra fora da loja física, como pela internet ou por telefone, pode desistir da compra em até 7 dias depois de receber o produto, sem precisar explicar o motivo, e recebe o valor de volta. É o que diz a lei fictícia usada nesta demonstração.',
        sourcesSay: [
          { title: 'Prazo para desistir', text: 'O art. 3º da Lei Fictícia nº 0.002/2019 dá 7 dias, contados do recebimento do produto ou da contratação do serviço, para a pessoa desistir de uma compra feita a distância.', ref: 1 },
          { title: 'Devolução do valor', text: 'O art. 4º diz que todos os valores pagos, incluindo o frete, devem ser devolvidos de imediato e com correção.', ref: 1 },
          { title: 'Proposta de mudança', text: 'Existe um projeto de lei fictício, o PL nº 0.005/2026, que propõe ampliar o prazo para 14 dias. Ele ainda não foi aprovado e não tem efeito.', ref: 2 }
        ],
        depends: [
          'Como a compra foi feita. Em loja física, as regras são diferentes.',
          'A data de recebimento, que define o início do prazo.',
          'Se o produto foi feito sob medida ou é de uso pessoal, situações que a lei fictícia trata de forma distinta.'
        ],
        sources: [
          { id: 'SRC-002', version: 'v1', article: 'Art. 3º e art. 4º', status: 'vigente' },
          { id: 'SRC-005', version: 'v1', article: 'Art. 1º (proposta)', status: 'projeto' }
        ],
        nextSteps: [
          'Guarde o comprovante de entrega para contar o prazo.',
          'Comunique a desistência por escrito e guarde o protocolo.',
          'Se a loja não devolver o valor, um órgão de defesa do consumidor pode registrar a reclamação.'
        ]
      },
      clarify_gather: {
        kind: 'clarify',
        summary: 'Posso montar uma lista. Primeiro preciso entender a situação.',
        questions: [
          'Sobre o que é: compra, trabalho, aluguel, serviço ou outra coisa?',
          'O que já aconteceu até agora e o que você quer resolver?'
        ],
        quickReplies: [
          { label: 'Ver exemplo: produto com defeito que a loja não troca', send: 'Quais informações preciso reunir sobre um produto com defeito que a loja se recusa a trocar?' }
        ]
      },
      answer_gather: {
        kind: 'answer',
        summary: 'Para tratar de um produto com defeito, o mais importante é provar o que você comprou, quando comprou, qual é o defeito e que você já pediu a solução. A lista abaixo segue a portaria fictícia desta demonstração sobre registro de reclamações.',
        sourcesSay: [
          { title: 'O que a reclamação precisa conter', text: 'O art. 2º da Portaria Fictícia nº 0.003/2023 lista o conteúdo mínimo de uma reclamação: identificação do fornecedor, descrição do produto, data da compra, descrição do problema e pedido feito.', ref: 1 },
          { title: 'Prazo de resposta', text: 'O art. 4º prevê que o fornecedor responda à reclamação registrada em até 10 dias. Há uma alteração detectada nesse artigo aguardando conferência na nossa base, por isso o prazo pode ter mudado.', ref: 1 }
        ],
        checklist: [
          'Nota fiscal ou comprovante de pagamento.',
          'Fotos ou vídeos do defeito.',
          'Protocolos de atendimento, e-mails e mensagens trocadas com a loja.',
          'Datas: compra, entrega, primeiro contato e respostas recebidas.',
          'Termo de garantia ou anúncio do produto, se houver.'
        ],
        depends: [
          'Se o defeito apareceu dentro do prazo de garantia.',
          'Se o produto foi usado de forma diferente da indicada.',
          'Se a loja já ofereceu alguma solução e qual foi.'
        ],
        sources: [
          { id: 'SRC-003', version: 'v1', article: 'Art. 2º e art. 4º', status: 'vigente' }
        ],
        nextSteps: [
          'Organize os documentos em ordem de data.',
          'Registre a reclamação por escrito e guarde o protocolo.',
          'Se não houver resposta, um órgão de defesa do consumidor pode orientar os próximos passos.'
        ],
        warnings: ['Há uma atualização detectada na fonte sobre prazos, ainda não conferida. O prazo citado pode ter mudado.']
      },
      clarify_help: {
        kind: 'clarify',
        summary: 'Existem serviços gratuitos e pagos. Para indicar os mais adequados, preciso saber um pouco mais.',
        questions: [
          'Qual é o tipo de problema: consumo, trabalho, família, moradia ou outro?',
          'Em qual cidade ou estado você está?'
        ],
        quickReplies: [
          { label: 'Ver exemplo: verbas rescisórias não pagas', send: 'Onde posso procurar ajuda para receber verbas rescisórias que não foram pagas?' }
        ]
      },
      answer_help: {
        kind: 'answer',
        summary: 'Para verbas rescisórias não pagas, os caminhos mais comuns são o sindicato da categoria, a Defensoria Pública ou um advogado trabalhista, e a Justiça do Trabalho. Em muitos lugares há atendimento gratuito para quem não pode pagar.',
        sourcesSay: [
          { title: 'Rede de atendimento gratuito', text: 'A página oficial fictícia usada nesta demonstração lista serviços de atendimento jurídico gratuito por tipo de problema e região, incluindo Defensoria Pública, núcleos de prática jurídica de faculdades e postos de atendimento ao trabalhador.', ref: 1 }
        ],
        options: [
          { title: 'Sindicato da categoria', text: 'Pode orientar, intermediar a cobrança e, em alguns casos, acompanhar a homologação.' },
          { title: 'Defensoria Pública', text: 'Atendimento gratuito para quem cumpre os critérios de renda. Verifique o critério na sua região.' },
          { title: 'Advogado trabalhista', text: 'Avalia o caso, os valores e os prazos. Os honorários variam.' },
          { title: 'Justiça do Trabalho', text: 'Onde a ação é proposta. Existem prazos para entrar com a ação, por isso vale agir sem demora.' }
        ],
        depends: [
          'Sua renda, que define o acesso à Defensoria Pública.',
          'A data da demissão, por causa dos prazos para agir.',
          'Se já existe algum acordo assinado.'
        ],
        sources: [
          { id: 'SRC-004', version: 'v1', article: 'Seção "Trabalho"', status: 'pagina' }
        ],
        nextSteps: [
          'Reúna carteira de trabalho, contrato, holerites e o termo de rescisão, se houver.',
          'Anote a data da demissão e os valores que você acredita ter direito.',
          'Procure um dos serviços acima sem demora, por causa dos prazos.'
        ],
        limitNotice: { text: 'Não posso dizer se você tem direito a receber nem quanto. Isso depende da análise dos documentos por um profissional.' }
      },
      document_ok: {
        kind: 'document',
        document: {
          notes: [
            'Documento de 6 páginas, legível. Exemplo fictício: contrato de prestação de serviços.',
            'Nesta demonstração, o conteúdo real do arquivo não é lido. Os trechos abaixo são fictícios e mostram como a análise é apresentada.'
          ],
          excerpts: [
            { ref: 'Cláusula 9ª, página 3', quote: 'Em caso de cancelamento antecipado pelo CONTRATANTE, será devida multa equivalente a 3 (três) mensalidades.', inDocument: 'O contrato fixa a multa em três mensalidades, sem relação com o tempo que falta para terminar.', inLaw: 'A lei fictícia desta demonstração exige multa proporcional ao período restante (art. 12).' },
            { ref: 'Cláusula 14, página 5', quote: 'O presente contrato renova-se automaticamente por períodos iguais, salvo aviso prévio de 60 (sessenta) dias.', inDocument: 'Há renovação automática. Para evitar a renovação, é preciso avisar com 60 dias de antecedência.', inLaw: 'A lei fictícia exige que a renovação automática apareça em destaque e permite cancelamento com aviso de 30 dias (art. 15).' }
          ],
          warnings: ['A página 6 (assinaturas) não tem data legível. A data de assinatura importa para saber qual versão da lei se aplica.']
        },
        summary: 'Encontrei dois pontos que merecem atenção: a multa por cancelamento antecipado e a renovação automática. Nos dois casos, o que está escrito no contrato é mais rígido do que a lei fictícia desta demonstração prevê.',
        depends: [
          'A data de assinatura, para saber qual versão da lei vale.',
          'Se houve negociação ou descontos que justifiquem as condições.',
          'As demais cláusulas, que podem suavizar ou reforçar essas duas.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12 e art. 15', status: 'vigente' }
        ],
        nextSteps: [
          'Confirme a data de assinatura em uma via datada ou em e-mails da época.',
          'Peça ao prestador a memória de cálculo da multa e a confirmação do prazo de aviso.',
          'Para uma avaliação do contrato inteiro, procure um órgão de defesa do consumidor ou um advogado.'
        ],
        warnings: ['Uma cláusula isolada não define o resultado de todo o caso. O contrato completo e os fatos importam.']
      },
      document_illegible: {
        kind: 'document',
        document: {
          notes: ['Não consegui ler o conteúdo com segurança. A imagem está com baixa resolução ou cortada.'],
          excerpts: [],
          warnings: ['Texto ilegível em mais da metade da página. Não vou arriscar uma explicação a partir de um trecho que não consigo ler.']
        },
        summary: 'Não consegui ler este documento com segurança, então não tenho como explicar o que ele diz.',
        nextSteps: [
          'Tente uma foto com mais luz, sem sombras e com a página inteira enquadrada.',
          'Se tiver o arquivo original em PDF, prefira anexá-lo.',
          'Você também pode digitar ou colar o trecho que quer entender.'
        ]
      },
      document_incomplete: {
        kind: 'document',
        document: {
          notes: ['O arquivo tem 1 página e parece ser parte de um documento maior: a numeração indica "página 3 de 8".'],
          excerpts: [
            { ref: 'Cláusula 9ª, página 3', quote: 'Em caso de cancelamento antecipado pelo CONTRATANTE, será devida multa equivalente a 3 (três) mensalidades.', inDocument: 'A página visível fixa a multa em três mensalidades.', inLaw: 'A lei fictícia desta demonstração exige multa proporcional ao período restante (art. 12).' }
          ],
          warnings: ['Sem as demais páginas, não dá para saber se outras cláusulas alteram o que esta diz, nem a data de assinatura.']
        },
        summary: 'Consigo explicar o trecho visível, mas o documento está incompleto. A leitura pode mudar com as outras páginas.',
        depends: [
          'O conteúdo das páginas que faltam, em especial as cláusulas de cancelamento e as assinaturas.',
          'A data de assinatura do contrato.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12', status: 'vigente' }
        ],
        nextSteps: [
          'Anexe o documento completo, de preferência em PDF.',
          'Se não tiver o restante, peça uma via completa a quem forneceu o contrato.'
        ]
      },
      urgent: {
        kind: 'urgent',
        summary: 'Pela sua descrição, esta situação pode exigir atendimento imediato. Procure sem demora um dos serviços abaixo. Se houver risco à sua segurança, ligue para o serviço de emergência da sua região.',
        options: [
          { title: 'Defensoria Pública ou advogado', text: 'Para medidas com prazo curto, como despejo, prisão, bloqueio de contas ou notificações com data marcada.' },
          { title: 'Órgão de segurança ou emergência', text: 'Em situações de violência, ameaça ou risco imediato.' },
          { title: 'Plantão judiciário', text: 'Muitos tribunais mantêm plantão para casos urgentes fora do horário comum.' }
        ],
        nextSteps: [
          'Anote datas, horários e nomes das pessoas envolvidas.',
          'Guarde documentos, mensagens e notificações recebidas.',
          'Depois do atendimento, posso ajudar a entender os documentos envolvidos.'
        ],
        limitNotice: { text: 'Em situações urgentes, uma ferramenta de informação não substitui o atendimento profissional ou o órgão competente.' }
      },
      limit: {
        kind: 'limit',
        summary: 'Não posso dizer se você vai ganhar ou perder, nem se uma cláusula é definitivamente válida ou inválida. Isso depende de provas, da leitura completa dos documentos e da interpretação de quem analisar o caso.',
        canDo: [
          'Explicar o que a lei diz sobre o tema, com as fontes.',
          'Listar o que costuma ser levado em conta nesse tipo de situação.',
          'Indicar onde buscar uma avaliação do seu caso.'
        ],
        limitNotice: {
          text: 'Para uma avaliação personalizada ou uma estratégia, procure:',
          referrals: [
            'Um advogado ou a Defensoria Pública, para avaliar o caso e os caminhos possíveis.',
            'O sindicato da categoria, se o tema for trabalhista.',
            'Um órgão de defesa do consumidor, se o tema for de consumo.'
          ]
        },
        nextSteps: ['Se quiser, me conte o tema e eu explico as regras gerais com as fontes.']
      },
      nosources: {
        kind: 'nosources',
        summary: 'Não encontrei, na base desta demonstração, fontes adequadas para responder com segurança. Prefiro dizer isso a dar uma resposta incerta.',
        questions: [
          'Sobre qual tema é a dúvida: consumo, trabalho, moradia, família ou empresa?',
          'Em qual país e estado a situação acontece?',
          'Há algum documento ou trecho que você possa colar aqui?'
        ],
        warnings: ['A base de demonstração cobre apenas quatro temas fictícios: multa em contratos de serviço, compras a distância, reclamações de consumo e rede de atendimento gratuito.'],
        nextSteps: ['Experimente um dos exemplos da tela inicial.']
      },
      nosources_jurisdiction: {
        kind: 'nosources',
        summary: 'Nesta demonstração, a base de fontes cobre apenas o exemplo do Brasil. Ainda não tenho fontes para {country}, por isso não vou arriscar uma resposta.',
        nextSteps: [
          'Mude a jurisdição para Brasil para ver a demonstração.',
          'A base de fontes foi desenhada para receber outras jurisdições, cada uma com suas normas, datas e links oficiais.'
        ]
      },
      systemHint: {
        tooShort: 'Pode me contar um pouco mais? Com uma ou duas frases sobre a situação, consigo procurar as fontes certas.'
      }
    },

    'en': {
      clarify_clause: {
        kind: 'clarify',
        summary: 'Yes, I can. To do that, I need to see the text of the clause.',
        questions: [
          'Which excerpt is it? You can paste the clause text in the message.',
          'Or attach the contract as a PDF or image.',
          'If you just want to see how the explanation looks, use the example below.'
        ],
        quickReplies: [
          { label: 'See an example with a fictional clause', send: 'Can you explain this clause in my contract? "Clause 9 – In case of early cancellation by the CLIENT, a penalty equal to 3 (three) monthly fees shall be due, regardless of the remaining contract term." (fictional example)' },
          { label: 'Attach the contract', action: 'attach' }
        ]
      },
      answer_clause: {
        kind: 'answer',
        summary: 'This clause sets a penalty of three monthly fees for anyone who cancels before the end of the contract, regardless of how much time is left. Under the fictional law used in this demonstration, an early-cancellation penalty must be proportional to the remaining period. So the amount charged can be questioned, but the conclusion depends on the whole contract and the facts.',
        sourcesSay: [
          { title: 'Penalty proportional to the remaining time', text: 'Art. 12 of Fictional Law No. 0.001/2024, in its current wording, says the early-cancellation penalty must be calculated in proportion to the period left until the end of the contract.', ref: 1 },
          { title: 'Clear information about the penalty', text: 'Art. 7 of the same law requires the amount and the calculation method of the penalty to be written clearly and prominently in the contract.', ref: 1 },
          { title: 'What changed', text: 'The original 2024 wording allowed a fixed penalty. Since July 2025 the proportionality rule applies. If the contract was signed before that, the analysis may change.', ref: 2 }
        ],
        depends: [
          'The signing date of the contract, which defines which version of the law applies.',
          'Whether other clauses deal with cancellation, discounts granted or a minimum term.',
          'Whether the cancellation was caused by a failure of the provider, which may change the charge.',
          'Whether the penalty was clearly disclosed at the time of contracting.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12 and art. 7', status: 'vigente' },
          { id: 'SRC-001', version: 'v1', article: 'Art. 12 (original wording)', status: 'historico' }
        ],
        nextSteps: [
          'Gather the full contract, the signing date and proof of payments.',
          'Ask the provider, in writing, for the penalty calculation.',
          'If you want an assessment of your case, a consumer protection agency or a lawyer can review the whole contract.'
        ],
        warnings: ['This explanation covers one isolated clause. Other parts of the contract may change the reading.']
      },
      clarify_law: {
        kind: 'clarify',
        summary: 'Sure. Which law do you want to understand?',
        questions: [
          'Give the name or number of the law, or paste the excerpt you received.',
          'If you know, say which country or state it belongs to.'
        ],
        quickReplies: [
          { label: 'See an example: fictional law on distance purchases', send: 'What does Fictional Law No. 0.002/2019 on distance purchases say in plain words?' }
        ]
      },
      answer_law: {
        kind: 'answer',
        summary: 'In plain words: anyone who buys outside a physical store, such as online or by phone, can withdraw from the purchase within 7 days of receiving the product, without giving a reason, and gets the money back. That is what the fictional law used in this demonstration says.',
        sourcesSay: [
          { title: 'Time to withdraw', text: 'Art. 3 of Fictional Law No. 0.002/2019 gives 7 days, counted from receipt of the product or signing of the service, to withdraw from a distance purchase.', ref: 1 },
          { title: 'Refund', text: 'Art. 4 says all amounts paid, including shipping, must be refunded immediately and adjusted.', ref: 1 },
          { title: 'Proposed change', text: 'There is a fictional bill, No. 0.005/2026, proposing to extend the period to 14 days. It has not been approved and has no effect.', ref: 2 }
        ],
        depends: [
          'How the purchase was made. In a physical store the rules are different.',
          'The date of receipt, which starts the clock.',
          'Whether the product was custom-made or is for personal use, situations the fictional law treats differently.'
        ],
        sources: [
          { id: 'SRC-002', version: 'v1', article: 'Art. 3 and art. 4', status: 'vigente' },
          { id: 'SRC-005', version: 'v1', article: 'Art. 1 (proposal)', status: 'projeto' }
        ],
        nextSteps: [
          'Keep the delivery receipt to count the period.',
          'Communicate the withdrawal in writing and keep the protocol number.',
          'If the store does not refund, a consumer protection agency can record the complaint.'
        ]
      },
      clarify_gather: {
        kind: 'clarify',
        summary: 'I can put together a list. First I need to understand the situation.',
        questions: [
          'What is it about: a purchase, work, rent, a service or something else?',
          'What has happened so far and what do you want to resolve?'
        ],
        quickReplies: [
          { label: 'See an example: defective product the store will not exchange', send: 'What information do I need to gather about a defective product that the store refuses to exchange?' }
        ]
      },
      answer_gather: {
        kind: 'answer',
        summary: 'For a defective product, the most important thing is to prove what you bought, when, what the defect is and that you already asked for a solution. The list below follows the fictional regulation in this demonstration on recording complaints.',
        sourcesSay: [
          { title: 'What a complaint must contain', text: 'Art. 2 of Fictional Regulation No. 0.003/2023 lists the minimum content of a complaint: supplier identification, product description, purchase date, description of the problem and the request made.', ref: 1 },
          { title: 'Response deadline', text: 'Art. 4 provides that the supplier responds to a recorded complaint within 10 days. A change to that article was detected and is awaiting review in our registry, so the deadline may have changed.', ref: 1 }
        ],
        checklist: [
          'Invoice or proof of payment.',
          'Photos or videos of the defect.',
          'Service protocols, emails and messages exchanged with the store.',
          'Dates: purchase, delivery, first contact and replies received.',
          'Warranty terms or the product listing, if any.'
        ],
        depends: [
          'Whether the defect appeared within the warranty period.',
          'Whether the product was used differently from the instructions.',
          'Whether the store already offered a solution and what it was.'
        ],
        sources: [
          { id: 'SRC-003', version: 'v1', article: 'Art. 2 and art. 4', status: 'vigente' }
        ],
        nextSteps: [
          'Organise the documents in date order.',
          'Record the complaint in writing and keep the protocol number.',
          'If there is no reply, a consumer protection agency can advise on next steps.'
        ],
        warnings: ['An update about deadlines was detected at the source and has not been reviewed yet. The deadline quoted may have changed.']
      },
      clarify_help: {
        kind: 'clarify',
        summary: 'There are free and paid services. To point to the most suitable ones, I need to know a little more.',
        questions: [
          'What kind of problem is it: consumer, work, family, housing or other?',
          'Which city or state are you in?'
        ],
        quickReplies: [
          { label: 'See an example: unpaid severance', send: 'Where can I look for help to receive severance pay that was not paid?' }
        ]
      },
      answer_help: {
        kind: 'answer',
        summary: 'For unpaid severance, the most common routes are the trade union, a public defender or an employment lawyer, and the labour courts. In many places there is free assistance for people who cannot pay.',
        sourcesSay: [
          { title: 'Free assistance network', text: 'The fictional official page used in this demonstration lists free legal assistance services by type of problem and region, including public defenders, university legal clinics and worker assistance desks.', ref: 1 }
        ],
        options: [
          { title: 'Trade union', text: 'Can advise, mediate the claim and, in some cases, follow the settlement process.' },
          { title: 'Public defender', text: 'Free assistance for people who meet the income criteria. Check the criteria in your region.' },
          { title: 'Employment lawyer', text: 'Assesses the case, the amounts and the deadlines. Fees vary.' },
          { title: 'Labour court', text: 'Where the claim is filed. There are deadlines to file, so it is worth acting without delay.' }
        ],
        depends: [
          'Your income, which defines access to a public defender.',
          'The dismissal date, because of the deadlines to act.',
          'Whether an agreement has already been signed.'
        ],
        sources: [
          { id: 'SRC-004', version: 'v1', article: 'Section "Work"', status: 'pagina' }
        ],
        nextSteps: [
          'Gather your employment record, contract, pay slips and the termination form, if any.',
          'Note the dismissal date and the amounts you believe you are owed.',
          'Contact one of the services above without delay, because of the deadlines.'
        ],
        limitNotice: { text: 'I cannot say whether you are entitled to receive anything or how much. That depends on a professional reviewing the documents.' }
      },
      document_ok: {
        kind: 'document',
        document: {
          notes: [
            '6-page document, readable. Fictional example: service agreement.',
            'In this demonstration the actual file content is not read. The excerpts below are fictional and show how the analysis is presented.'
          ],
          excerpts: [
            { ref: 'Clause 9, page 3', quote: 'In case of early cancellation by the CLIENT, a penalty equal to 3 (three) monthly fees shall be due.', inDocument: 'The contract sets the penalty at three monthly fees, unrelated to the time left.', inLaw: 'The fictional law in this demonstration requires a penalty proportional to the remaining period (art. 12).' },
            { ref: 'Clause 14, page 5', quote: 'This agreement renews automatically for equal periods, unless notice is given 60 (sixty) days in advance.', inDocument: 'There is automatic renewal. To avoid it, notice must be given 60 days in advance.', inLaw: 'The fictional law requires automatic renewal to be highlighted and allows cancellation with 30 days’ notice (art. 15).' }
          ],
          warnings: ['Page 6 (signatures) has no readable date. The signing date matters to know which version of the law applies.']
        },
        summary: 'I found two points that deserve attention: the early-cancellation penalty and the automatic renewal. In both, what the contract says is stricter than what the fictional law in this demonstration provides.',
        depends: [
          'The signing date, to know which version of the law applies.',
          'Whether there was negotiation or discounts that justify the terms.',
          'The remaining clauses, which may soften or reinforce these two.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12 and art. 15', status: 'vigente' }
        ],
        nextSteps: [
          'Confirm the signing date on a dated copy or in emails from the time.',
          'Ask the provider for the penalty calculation and confirmation of the notice period.',
          'For an assessment of the whole contract, contact a consumer protection agency or a lawyer.'
        ],
        warnings: ['One isolated clause does not define the outcome of the whole case. The full contract and the facts matter.']
      },
      document_illegible: {
        kind: 'document',
        document: {
          notes: ['I could not read the content reliably. The image has low resolution or is cropped.'],
          excerpts: [],
          warnings: ['Text is illegible on more than half of the page. I will not risk an explanation based on an excerpt I cannot read.']
        },
        summary: 'I could not read this document reliably, so I cannot explain what it says.',
        nextSteps: [
          'Try a photo with more light, no shadows and the whole page in frame.',
          'If you have the original PDF, attach that instead.',
          'You can also type or paste the excerpt you want to understand.'
        ]
      },
      document_incomplete: {
        kind: 'document',
        document: {
          notes: ['The file has 1 page and seems to be part of a larger document: the numbering reads "page 3 of 8".'],
          excerpts: [
            { ref: 'Clause 9, page 3', quote: 'In case of early cancellation by the CLIENT, a penalty equal to 3 (three) monthly fees shall be due.', inDocument: 'The visible page sets the penalty at three monthly fees.', inLaw: 'The fictional law in this demonstration requires a penalty proportional to the remaining period (art. 12).' }
          ],
          warnings: ['Without the other pages, there is no way to know whether other clauses change this one, or the signing date.']
        },
        summary: 'I can explain the visible excerpt, but the document is incomplete. The reading may change with the other pages.',
        depends: [
          'The content of the missing pages, especially cancellation clauses and signatures.',
          'The signing date of the contract.'
        ],
        sources: [
          { id: 'SRC-001', version: 'v2', article: 'Art. 12', status: 'vigente' }
        ],
        nextSteps: [
          'Attach the complete document, preferably as a PDF.',
          'If you do not have the rest, ask whoever provided the contract for a complete copy.'
        ]
      },
      urgent: {
        kind: 'urgent',
        summary: 'From your description, this situation may need immediate attention. Contact one of the services below without delay. If your safety is at risk, call the emergency service in your region.',
        options: [
          { title: 'Public defender or lawyer', text: 'For short-deadline measures such as eviction, arrest, account freezes or notices with a set date.' },
          { title: 'Police or emergency services', text: 'In situations of violence, threat or immediate risk.' },
          { title: 'Court duty service', text: 'Many courts keep a duty service for urgent cases outside normal hours.' }
        ],
        nextSteps: [
          'Note dates, times and the names of the people involved.',
          'Keep documents, messages and notices received.',
          'After you get help, I can assist in understanding the documents involved.'
        ],
        limitNotice: { text: 'In urgent situations, an information tool does not replace professional help or the competent authority.' }
      },
      limit: {
        kind: 'limit',
        summary: 'I cannot say whether you will win or lose, or whether a clause is definitely valid or invalid. That depends on evidence, a full reading of the documents and the interpretation of whoever reviews the case.',
        canDo: [
          'Explain what the law says on the topic, with sources.',
          'List what is usually taken into account in this kind of situation.',
          'Point to where you can get an assessment of your case.'
        ],
        limitNotice: {
          text: 'For a personalised assessment or a strategy, contact:',
          referrals: [
            'A lawyer or a public defender, to assess the case and the possible routes.',
            'The trade union, if the matter is about work.',
            'A consumer protection agency, if the matter is about consumer rights.'
          ]
        },
        nextSteps: ['If you like, tell me the topic and I will explain the general rules with sources.']
      },
      nosources: {
        kind: 'nosources',
        summary: 'I did not find suitable sources in this demonstration registry to answer safely. I would rather say so than give an uncertain answer.',
        questions: [
          'What is the question about: consumer, work, housing, family or business?',
          'In which country and state does the situation take place?',
          'Is there a document or excerpt you can paste here?'
        ],
        warnings: ['The demonstration registry covers only four fictional topics: penalties in service contracts, distance purchases, consumer complaints and the free assistance network.'],
        nextSteps: ['Try one of the examples on the home screen.']
      },
      nosources_jurisdiction: {
        kind: 'nosources',
        summary: 'In this demonstration, the source registry covers only the Brazil example. I do not have sources for {country} yet, so I will not risk an answer.',
        nextSteps: [
          'Switch the jurisdiction to Brazil to see the demonstration.',
          'The registry was designed to take other jurisdictions, each with its own laws, dates and official links.'
        ]
      },
      systemHint: {
        tooShort: 'Could you tell me a bit more? With one or two sentences about the situation, I can look for the right sources.'
      }
    }
  }
};
