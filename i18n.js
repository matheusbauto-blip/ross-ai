/* ROSS AI — textos da interface (pt-BR e en).
   Para adicionar um idioma, copie um bloco e traduza. A chave do idioma segue BCP 47. */
window.ROSS_I18N = {
  'pt-BR': {
    processes: {
      title: 'Acompanhar processo', intro: 'Consulte pelo número do processo e acompanhe as publicações oficiais disponíveis.',
      unknownSource: 'Fonte não informada', publications: 'Publicações do DJEN', availableAt: 'Disponibilizado em',
      publicationCoverage: 'Consulta gratuita ao Diário de Justiça Eletrônico Nacional (DJEN/CNJ). Esta tela acompanha publicações oficiais e não representa todo o histórico de movimentações do processo.',
      publicationCourt: 'Órgão da publicação mais recente nesta página', lastPublication: 'Disponibilização mais recente nesta página',
      publicationFreshness: 'As datas são de disponibilização no DJEN. Consultas repetidas podem reutilizar dados obtidos há até 5 minutos; a data de consulta ao serviço é preservada.',
      emptyPublications: 'Nenhuma publicação do DJEN foi retornada nesta consulta. Isso não significa que o processo não exista. Você pode acompanhar o número para verificar futuras publicações.',
      morePublications: 'Ver publicações anteriores', limitedResults: 'A fonte limita esta pesquisa a 10.000 registros. O resultado não deve ser considerado um histórico completo do processo.',
      cancelledPublication: 'Publicação informada como cancelada. Confira a atualização na fonte.', excerptNotice: 'Trecho abreviado. Abra a fonte para ler a publicação completa.',
      newPublications: 'Há {n} publicação(ões) novas ou alteradas em relação à última consulta.',
      number: 'Número do processo', hint: 'Informe os 20 dígitos ou cole o número completo, com pontos e traço.',
      cpfTitle: 'Buscar por CPF no portal oficial',
      cpfIntro: 'Encontre o número do processo gratuitamente no Jus.br, portal do Poder Judiciário. A pesquisa por CPF acontece lá; depois, volte para acompanhar as publicações no ROSS.',
      cpfStepLogin: 'Abra o Jus.br e entre com sua conta gov.br nível ouro.',
      cpfStepSearch: 'Escolha “Consultar processos”, selecione “CPF da Parte”, informe o CPF e clique em “Buscar”.',
      cpfStepReturn: 'Copie o número de 20 dígitos do processo encontrado e cole no campo acima. Consulte e escolha “Acompanhar neste navegador”.',
      cpfOpen: 'Abrir Jus.br (nova aba)', cpfReturn: 'Já tenho o número',
      cpfPrivacy: 'Informe CPF, senha e códigos de acesso somente no portal oficial. Este atalho não envia esses dados ao ROSS nem importa resultados automaticamente.',
      cpfCoverage: 'A consulta depende dos sistemas integrados e das permissões do seu acesso. Um resultado vazio não confirma que não existem processos.',
      cpfRedirect: 'Para pesquisar por CPF, use “Buscar por CPF no portal oficial”. Neste campo, cole o número do processo encontrado no Jus.br.',
      search: 'Consultar processo', loading: 'Consultando…', invalid: 'Confira o número do processo. Ele deve ter 20 dígitos e dígitos verificadores válidos.',
      notConfigured: 'A consulta de processos ainda não foi ativada no ROSS. Nenhum resultado foi obtido. Tente novamente após a ativação do serviço.',
      unavailable: 'Não foi possível consultar o processo agora. Tente novamente em instantes.',
      notFound: 'O processo não foi encontrado nesta consulta. Confira o número. Isso não significa que o processo não exista.',
      restricted: 'Não é possível mostrar este processo nesta consulta pública. Verifique o acesso no tribunal.',
      rateLimited: 'O limite de consultas foi atingido por agora. Tente novamente mais tarde.',
      source: 'Dados fornecidos por', consultedAt: 'Consulta ao serviço', verifiedAt: 'Última verificação informada pela fonte',
      parties: 'Partes informadas', court: 'Unidade de origem', className: 'Classe', subject: 'Assunto', lastMovement: 'Última movimentação informada',
      unknownDate: 'Data não informada', tribunalUnknown: 'Tribunal não informado',
      freshness: 'Os dados refletem a edição disponível no serviço e podem ter atraso em relação ao tribunal. Uma consulta ao serviço não equivale a uma nova verificação no tribunal.',
      follow: 'Acompanhar neste navegador', unfollow: 'Parar acompanhamento', refresh: 'Consultar novamente', openSource: 'Abrir fonte',
      history: 'Movimentações', movementsUnavailable: 'Os dados do processo foram encontrados, mas as movimentações não puderam ser carregadas. Tente consultar novamente.',
      emptyMovements: 'Nenhuma movimentação foi retornada nesta consulta.', more: 'Ver movimentações anteriores',
      savedTitle: 'Processos acompanhados', emptySaved: 'Você ainda não adicionou processos ao acompanhamento.',
      localNotice: 'Os números acompanhados ficam neste navegador. A ficha aberta é verificada a cada 15 minutos enquanto esta tela estiver visível. Não há avisos com o app fechado nesta etapa.',
      remove: 'Remover acompanhamento', limit: 'Você pode acompanhar até 20 processos neste navegador.',
      storageError: 'Não foi possível salvar os acompanhamentos neste navegador. Eles continuam disponíveis nesta sessão, mas podem se perder ao fechar a página.',
      newMovements: 'Encontradas {n} movimentação(ões) que não apareciam na última consulta.'
    },
    corpus: {
      title: 'Pesquisa jurídica', homeHint: 'Pesquise leis, decisões e notícias em espaços separados.',
      kind: 'O que deseja pesquisar?', laws: 'Legislação', precedents: 'Precedentes do STJ', news: 'Notícias do STJ',
      statusTitle: 'Situação do acervo', refreshStatus: 'Atualizar contagem', stale: 'Última cópia disponível; fonte temporariamente indisponível',
      separateNotice: 'Notícias e precedentes têm contextos próprios e não são leis. Confira a situação e a publicação na fonte oficial.',
      noThesis: 'Tese não informada nesta base. Confira a situação e os documentos na fonte.', truncated: 'Trecho abreviado. Leia a íntegra na fonte.',
      readRepository: 'Ler texto do repositório', hideText: 'Ocultar texto',
      intro: 'Consulte o acervo de leis brasileiras, os precedentes e as notícias oficiais disponíveis. Escolha o tipo de conteúdo antes de buscar.',
      count: '{n} textos importados · {catalog} arquivos no catálogo ampliado', loadingCount: 'Consultando o acervo…',
      coverage: 'Importação em andamento. O acervo ainda não contém toda a legislação brasileira. A data de captura não confirma a vigência atual.',
      query: 'Assunto, nome ou número da norma', placeholder: 'Ex.: licitações, Código Civil ou 14.133',
      search: 'Pesquisar', searching: 'Buscando…', scope: 'Esfera', all: 'Todas as esferas',
      federal: 'Federal', estadual: 'Estadual / DF', municipal: 'Municipal', state: 'Estado', allStates: 'Todos os estados',
      city: 'Município', cityPlaceholder: 'Ex.: Uberlândia',
      filterHint: 'O estado e o município também incluem normas federais aplicáveis. Use termos específicos; a pesquisa procura palavras nos textos.',
      openSource: 'Abrir fonte', openSnapshot: 'Ver edição importada', readExcerpt: 'Ler trecho encontrado',
      currency: 'Vigência não verificada', imported: 'Texto importado', importedBadge: 'Acervo importado · ctresb/leis', partial: 'Publicação parcial / pendente',
      repealed: 'Revogação ou veto indicado no texto', previous: 'Anteriores', next: 'Próximos resultados',
      empty: 'Nenhum trecho encontrado no acervo já importado. Tente menos palavras, o número da norma ou outros filtros.',
      unavailable: 'A busca não está disponível agora. Tente novamente em instantes.', rateLimit: 'Você atingiu o limite de consultas por agora. Tente mais tarde.',
      answerNotice: 'Esta resposta inclui trechos importados do ctresb/leis. Confira a edição, a data de captura e a fonte indicadas em cada referência. A vigência atual desses textos não foi verificada.',
      noAI: 'Encontrei estes trechos. A explicação por IA ainda não está disponível; você pode consultar o texto e abrir a fonte de cada resultado.',
      regulador: 'Órgãos reguladores', organ: 'Órgão', chooseOrgan: 'Escolha o órgão', federalActs: 'Incluir decretos, medidas provisórias e resoluções federais',
      indexBadge: 'Índice do repositório', indexLoading: 'Carregando o índice completo do repositório…', indexUnavailable: 'O índice completo do repositório não está disponível agora; a pesquisa usa só o acervo já importado.',
      indexReady: 'Índice completo: {n} textos do ctresb/leis (edição {ref}), pesquisáveis por título, ementa e número; o texto integral é lido sob demanda.',
      indexNeedsFilter: 'Para pesquisar normas estaduais ou municipais no índice completo, escolha o estado; para órgãos reguladores, escolha o órgão.',
      noSummary: 'Sem ementa registrada; abra o texto para ler.', textOfNorm: 'Texto da norma', editionUnknown: 'Edição não informada'
    },
    langName: 'Português (Brasil)',
    tagline: 'Informação jurídica, em linguagem simples.',
    taglineAlt: 'Legal information, made clear.',
    home: {
      catalogLoading: 'Carregando a base de leis…',
      headline: 'Entenda informações jurídicas com mais clareza.',
      placeholder: 'O que você gostaria de entender?',
      examples: [
        { label: 'Pode explicar esta cláusula do meu contrato?', intent: 'clause' },
        { label: 'O que esta lei diz em palavras simples?', intent: 'law' },
        { label: 'Quais informações preciso reunir sobre esta situação?', intent: 'gather' },
        { label: 'Onde posso procurar ajuda para este problema?', intent: 'help' }
      ],
      examplesLabel: 'Exemplos para começar',
      footnote: 'O ROSS AI é uma ferramenta de informação e compreensão jurídica. Não substitui a análise de um profissional.',
      demoNotice: 'Versão de demonstração: as respostas usam fontes fictícias e ainda não estão conectadas a bases jurídicas reais.',
      oficialNotice: 'Fontes oficiais: {n} normas federais com texto oficial (Planalto e Câmara dos Deputados), capturado em {date}. A explicação em linguagem simples é gerada por IA; confira sempre os artigos citados.',
      oficialNoAI: 'Neste ambiente a explicação por IA não está disponível: as respostas mostram os trechos oficiais encontrados.',
      aiNotice: 'Modo IA sem fontes verificadas: as respostas são gerais e marcadas como não confirmadas.'
    },
    composer: {
      attach: 'Anexar documento',
      attachAnother: 'Anexar outro documento',
      send: 'Enviar',
      stop: 'Parar',
      remove: 'Remover anexo',
      country: 'País',
      region: 'Estado ou região',
      regionAll: 'Todo o país',
      hint: 'Enter envia. Shift+Enter quebra a linha.',
      disclaimer: 'O ROSS AI oferece informação jurídica geral e não substitui um profissional.'
    },
    nav: {
      menu: 'Abrir menu',
      close: 'Fechar',
      newChat: 'Nova conversa',
      history: 'Conversas anteriores',
      empty: 'Nenhuma conversa ainda.',
      sources: 'Base de fontes',
      settings: 'Configurações',
      privacy: 'Privacidade',
      terms: 'Termos de uso',
      help: 'Ajuda',
      delete: 'Apagar conversa',
      demoTag: 'Versão de demonstração',
      back: 'Voltar',
      home: 'Início'
    },
    chat: {
      you: 'Você',
      assistant: 'ROSS AI',
      copy: 'Copiar resposta',
      copied: 'Resposta copiada.',
      copyFailed: 'Não foi possível copiar. Selecione o texto manualmente.',
      helpful: 'Útil',
      notHelpful: 'Não foi útil',
      thanks: 'Obrigado pelo retorno.',
      retry: 'Tentar novamente',
      modeDemo: 'Demonstração',
      modeAI: 'Modo IA · não verificado',
      untitled: 'Nova conversa',
      attachments: 'Anexos',
      confirmDelete: 'Apagar esta conversa e os anexos dela? Isso não pode ser desfeito.',
      yesDelete: 'Apagar',
      cancel: 'Cancelar',
      deleted: 'Conversa apagada.',
      jurisdiction: 'Jurisdição',
      jurisdictionChanged: 'Jurisdição alterada para {j}.',
      change: 'Alterar',
      apply: 'Aplicar',
      typing: 'Preparando resposta',
      aiBanner: 'Modo IA experimental: resposta gerada sem consulta a fontes oficiais. Nomes de normas e artigos não foram verificados.',
      demoBanner: 'Demonstração com fontes fictícias. Nenhuma norma citada aqui é real.',
      modeOficial: 'Fontes oficiais',
      oficialBanner: 'Baseado em trechos do texto oficial (Planalto ou Câmara dos Deputados), capturados em {date}. A explicação é gerada por IA e deve ser conferida nos artigos citados.'
    },
    letter: {
      cta: 'Montar carta de reclamação',
      ctaHint: 'Um modelo de carta para enviar à empresa, com base nos artigos desta resposta.',
      title: 'Carta de reclamação',
      loading: 'Escrevendo a carta…',
      notice: 'Modelo escrito por IA a partir dos artigos citados nesta resposta. Complete os campos entre colchetes, revise o texto e guarde uma cópia do que enviar. O que você digitar aqui fica só neste navegador. Não substitui a orientação de um advogado ou da Defensoria Pública.',
      to: 'Para',
      subject: 'Assunto',
      fill: 'Complete antes de enviar:',
      filled: 'Todos os campos entre colchetes foram preenchidos. Revise o texto antes de enviar.',
      bodyLabel: 'Texto da carta (você pode editar)',
      copy: 'Copiar carta',
      copied: 'Carta copiada.',
      download: 'Baixar (.txt)',
      fileName: 'carta-reclamacao',
      regenerate: 'Escrever de novo',
      basedOn: 'Fundamentos usados:',
      short: 'Versão curta para o Procon ou o consumidor.gov.br',
      shortCopy: 'Copiar versão curta',
      shortCopied: 'Versão curta copiada.',
      notes: 'Como enviar',
      unsuitable: 'Uma carta de reclamação não parece o melhor caminho para esta situação.',
      error: 'Não foi possível escrever a carta agora. Tente novamente em instantes.',
      retry: 'Tentar de novo'
    },
    sections: {
      summary: 'Em resumo',
      sourcesSay: 'O que as fontes dizem',
      depends: 'O que depende da situação',
      sources: 'Fontes consultadas',
      sourcesAI: 'Fontes mencionadas (não verificadas)',
      next: 'Próximos passos',
      questions: 'Para responder melhor, preciso saber',
      checklist: 'O que reunir',
      options: 'Onde procurar',
      inDocument: 'No documento',
      inLaw: 'Na legislação citada',
      document: 'Sobre o documento',
      limit: 'Onde este serviço para',
      urgent: 'Situação que pode ser urgente',
      canDo: 'O que posso fazer',
      attention: 'Atenção',
      noSources: 'Nenhuma fonte consultada nesta resposta.'
    },
    status: {
      vigente: 'Vigente',
      historico: 'Texto histórico',
      projeto: 'Projeto de lei',
      nao_confirmada: 'Não confirmada',
      pagina: 'Página oficial',
      unverified: 'Não verificada',
      revogado: 'Revogado',
      vetado: 'Vetado'
    },
    source: {
      article: 'Artigo ou seção',
      version: 'Versão',
      verified: 'Verificado em',
      link: 'Link oficial',
      fictional: 'fictícia',
      jurisdiction: 'Jurisdição',
      published: 'Publicação',
      index: 'Índice usado na busca',
      noLink: 'Sem link verificado',
      official: 'Texto oficial',
      planalto: 'Texto compilado · Planalto',
      camara: 'Texto atualizado · Câmara dos Deputados',
      textFrom: 'Texto capturado de',
      captured: 'Capturado em',
      open: 'Abrir no Planalto',
      excerpt: 'Ver trecho consultado',
      note: 'Nota'
    },
    loading: {
      demo: ['Buscando fontes no índice', 'Confirmando texto na fonte oficial', 'Escrevendo em linguagem simples'],
      ai: ['Preparando sua pergunta', 'Consultando o modelo', 'Organizando a resposta'],
      oficial: ['Selecionando normas no catálogo', 'Buscando artigos no texto oficial', 'Escrevendo em linguagem simples']
    },
    errors: {
      title: 'Não foi possível concluir a resposta',
      interrupted: 'A resposta foi interrompida. Tente novamente para continuar.',
      attachment_missing: 'Anexe novamente o arquivo para reenviar esta pergunta. O conteúdo não é guardado no histórico.',
      generic: 'Algo deu errado ao preparar a resposta. Tente novamente em instantes.',
      not_granted: 'O Modo IA não foi autorizado neste navegador. A resposta não foi gerada. Você pode permitir no menu de permissões do artifact ou desativar o Modo IA nas configurações.',
      rate_limited: 'O Modo IA atingiu o limite de uso por agora. Tente mais tarde ou use o modo de demonstração.',
      cancelled: 'Resposta interrompida a seu pedido. Um pedido já enviado ao servidor pode ter sido processado e contado no limite de uso mesmo assim.',
      timeout: 'A resposta demorou mais do que o esperado e a espera foi encerrada. Tente novamente; se continuar, faça uma pergunta mais específica.',
      invalid_json: 'O modelo respondeu em um formato inesperado. Tente novamente.',
      images_unavailable: 'Este ambiente não permite enviar imagens ao modelo. Cole o texto do trecho na mensagem.',
      image_rejected: 'Uma das imagens não foi aceita pelo modelo. Tente outro formato ou tamanho.',
      unavailable: 'O Modo IA não está disponível neste ambiente. Nenhuma resposta foi gerada. Tente novamente ou escolha outro modo em Configurações.',
      quota_unavailable: 'Não foi possível verificar o limite de uso agora, e por segurança a pergunta não foi enviada à IA. Tente novamente em instantes.',
      worker_recycling: 'O servidor estava sendo reiniciado e a pergunta não foi processada. Tente novamente em alguns segundos.',
      law_fetch: 'Não foi possível carregar o texto da norma. Verifique a conexão e tente novamente.',
      api_not_configured: 'O servidor de IA ainda não tem a chave da API configurada. A resposta não foi gerada.',
      api_error: 'O servidor de IA não respondeu. Tente novamente em instantes.',
      refusal: 'O modelo não pôde responder a este pedido. Reformule a pergunta ou procure um profissional.',
      truncated: 'A resposta ficou longa demais e foi interrompida. Tente uma pergunta mais específica.',
      catalog_unavailable: 'Não foi possível carregar a base de leis. Verifique a conexão e tente novamente.'
    },
    attachModal: {
      title: 'Antes de anexar',
      body: 'Documentos costumam conter dados pessoais, como nome, CPF, endereço e valores. Anexe apenas o que for necessário para a sua pergunta.',
      demoLine: 'Nesta versão de demonstração, o arquivo não é enviado a nenhum servidor nem lido pelo sistema. Apenas o nome, o tamanho e o tipo ficam no histórico local deste navegador.',
      aiLine: 'Com IA ativa no site, a pergunta e os anexos (imagens e PDFs) são enviados pelo servidor ao Google Gemini para gerar a resposta. No claude.ai, a explicação usa sua conta.',
      apiLine: 'Imagens e PDFs anexados são enviados ao servidor do ROSS AI e ao modelo de IA apenas para gerar a resposta. Não são armazenados.',
      cancel: 'Cancelar',
      confirm: 'Anexar',
      tooLarge: 'acima de 20 MB. Escolha um arquivo menor.',
      tooMany: 'limite de 4 arquivos por mensagem.',
      totalTooLarge: 'os anexos juntos ultrapassam 20 MB. Envie menos arquivos ou reduza o tamanho.',
      badType: 'formato não aceito. Envie PDF, JPG, PNG ou WEBP.',
      skipped: 'Arquivos não anexados:'
    },
    settings: {
      title: 'Configurações',
      language: 'Idioma das respostas e da interface',
      theme: 'Aparência',
      themeSystem: 'Seguir o sistema',
      themeLight: 'Claro',
      themeDark: 'Escuro',
      jurisdiction: 'Jurisdição padrão',
      jurisdictionHelp: 'Usada em novas conversas. Você pode mudar a qualquer momento.',
      ai: 'Modo IA (experimental)',
      aiHelp: 'Gera respostas gerais com um modelo de IA, pela sua conta, sem consultar fontes oficiais. As respostas vêm marcadas como não verificadas. Desativado, o ROSS AI usa o modo de demonstração com fontes fictícias.',
      aiUnavailable: 'Indisponível neste ambiente: nem o claude.ai nem o servidor do ROSS AI estão acessíveis.',
      aiOn: 'Ativado',
      aiOff: 'Desativado',
      data: 'Seus dados',
      dataHelp: 'Conversas, nomes de anexos, avaliações e números de processos acompanhados ficam neste navegador. Os acompanhamentos podem ser removidos na tela de processos.',
      deleteAll: 'Apagar todas as conversas',
      deleteAllConfirm: 'Apagar todas as conversas e registros de anexos deste navegador? Isso não pode ser desfeito.',
      deleted: 'Todas as conversas foram apagadas.',
      about: 'Sobre',
      aboutText: 'ROSS AI, versão inicial. Explica a legislação federal brasileira com trechos de fontes oficiais (Planalto e Câmara dos Deputados) e um acervo importado identificado como não verificado. Ferramenta de informação, sem substituir um profissional.',
      aboutVersion: 'Versão publicada: {version}. Se esta tela mostrar uma versão antiga após uma atualização, recarregue a página.',
      aboutDev: 'Versão de desenvolvimento (sem identificador de publicação).',
      count: '{n} conversa(s) armazenada(s).',
      mode: 'Modo de resposta',
      modeHelp: 'Fontes oficiais usa o texto das normas capturado do Planalto e explica com IA. Demonstração usa fontes fictícias. IA sem fontes gera respostas gerais, marcadas como não verificadas.',
      modeOficial: 'Fontes oficiais',
      modeDemo: 'Demonstração',
      modeAI: 'IA sem fontes',
      oficialNote: 'Base com {n} normas federais, capturadas em {date}.',
      oficialNoAI: 'Neste ambiente a explicação por IA não está disponível; as respostas mostram os trechos oficiais encontrados.',
      viaClaude: 'Explicação por IA pela sua conta do claude.ai.',
      viaApi: 'Explicação por IA pelo servidor do ROSS AI (API própria).',
      oficialUnavailable: 'A base de leis não foi carregada neste ambiente. Enquanto isso, as respostas usam o modo de demonstração.',
      demoNote: 'Respostas roteirizadas com fontes fictícias, para demonstrar a experiência.'
    },
    sourcesPage: {
      title: 'Base de fontes',
      intro: 'Cada texto jurídico usado nas respostas tem origem, jurisdição, data, situação, link oficial e data da última verificação. Processos automáticos comparam a fonte oficial com a versão guardada e sinalizam mudanças para conferência antes de atualizar a base.',
      banner: 'Base de demonstração com fontes fictícias. Nenhum texto aqui corresponde a uma norma real.',
      queue: 'Alterações detectadas aguardando conferência',
      queueEmpty: 'Nenhuma alteração pendente.',
      detected: 'Alteração detectada em',
      before: 'Versão guardada',
      after: 'Texto encontrado na fonte oficial',
      approve: 'Aprovar e criar nova versão',
      keep: 'Manter versão atual',
      approved: 'Atualização aprovada. Nova versão registrada.',
      kept: 'Alteração marcada para revisão posterior. A versão atual foi mantida.',
      versions: 'Histórico de versões',
      current: 'atual',
      usedIn: 'Usada nas respostas de demonstração',
      howTitle: 'Como a base é mantida',
      how: [
        'Repositórios funcionam como índice para encontrar o texto. O conteúdo e a versão são confirmados na fonte oficial.',
        'Cada registro guarda país ou estado e a data da norma, para distinguir legislação vigente, texto histórico, projeto de lei e informação não confirmada.',
        'Rotinas automáticas revisitam a fonte oficial e comparam o texto. Diferenças entram nesta fila e só substituem a versão em uso depois de conferidas.',
        'O histórico de versões permite saber qual texto sustentou cada resposta.'
      ],
      fields: {
        type: 'Tipo', jurisdiction: 'Jurisdição', published: 'Publicação', status: 'Situação',
        index: 'Índice', link: 'Link oficial', verified: 'Última verificação', version: 'Versão em uso'
      },
      types: { lei: 'Lei', portaria: 'Portaria', pagina: 'Página oficial', projeto: 'Projeto de lei', constituicao: 'Constituição', decreto: 'Decreto', 'decreto-lei': 'Decreto-Lei', 'lei-complementar': 'Lei Complementar' },
      filter: 'Filtrar normas',
      filterPlaceholder: 'Filtrar por nome, número ou tema',
      filterCount: '{n} norma(s) encontrada(s).',
      official: 'Fontes oficiais',
      officialIntro: 'Textos capturados de fontes oficiais: o Portal da Legislação do Planalto (texto compilado) e a Legislação Informatizada da Câmara dos Deputados (texto atualizado), com o LexML como índice. {n} normas federais, capturadas em {date}. Cada norma guarda o hash do texto bruto, a data da captura, a fonte do texto e o histórico de versões.',
      officialUnavailable: 'A base de leis não foi carregada neste ambiente.',
      demoSection: 'Fontes de demonstração (fictícias)',
      articles: 'Artigos',
      inForce: 'vigentes',
      repealed: 'revogados ou vetados',
      hash: 'Hash do texto bruto',
      lexml: 'URN LexML',
      checkCmd: 'Para verificar atualizações: node scripts/ingest-laws.mjs --check',
      approveCmd: 'Depois de conferir, aplique com: node scripts/ingest-laws.mjs --approve'
    },
    oficial: {
      jurisdiction: 'A base de fontes oficiais cobre, por enquanto, apenas a legislação federal do Brasil. Ainda não tenho fontes para {country}, por isso não vou arriscar uma resposta.',
      jurisdictionStep: 'Mude a jurisdição para Brasil ou aguarde a inclusão de outras jurisdições na base.',
      docDefaultQuery: 'contrato cláusula multa rescisão cancelamento prazo',
      empty: 'Não consegui confirmar trechos suficientes para responder com segurança nesta busca. Isso não significa que não exista uma regra aplicável.',
      relevanceUnavailable: 'Não consegui concluir a verificação de relevância das fontes. Abaixo estão apenas trechos encontrados por palavras, para conferência; não foi gerada uma conclusão jurídica.',
      modelUnavailable: 'A explicação por IA não está disponível neste momento: o serviço do modelo está instável. Abaixo estão os trechos de lei mais relacionados, encontrados por busca de palavras. Envie a pergunta de novo em alguns minutos para receber a explicação.',
      rephraseMissing: 'Posso explicar de um jeito mais simples. Primeiro, preciso saber qual é a sua dúvida ou qual resposta você quer que eu reformule.',
      rephraseQuestion: 'Qual assunto ou resposta você gostaria que eu explicasse de outra maneira?',
      emptyQuestions: ['Sobre qual tema é a dúvida: consumo, trabalho, moradia, família, dados pessoais ou outro?', 'Há alguma lei, contrato ou documento específico envolvido?'],
      emptyStep: 'Reformule com mais detalhes ou cite a norma, se souber qual é.',
      noAI: 'Encontrei estes trechos nas fontes oficiais. A explicação por IA não está disponível agora; mostro o texto oficial para você conferir.',
      noAIWarn: 'Trechos selecionados por busca de palavras no texto oficial. Leia o artigo completo no link antes de concluir.',
      droppedClaims: 'Removi {n} afirmação(ões) da explicação porque citavam trechos que não foram consultados.',
      unlinked: 'A explicação não indicou em quais trechos se baseia. Trate-a como não confirmada e confira o texto da lei antes de concluir.',
      documentNoLaw: 'Li o documento, mas não encontrei na base trechos de lei que fundamentem uma conclusão jurídica. A explicação abaixo trata do que está escrito no documento; nenhuma norma citada foi verificada.',
      documentUnread: 'O documento não pôde ser analisado agora porque a explicação por IA está indisponível. Tente novamente mais tarde ou cole o trecho que quer entender.',
      documentDefaultQuestion: 'Explique o que este documento diz e o que é importante observar.',
      historyFiles: 'arquivos anexados',
      historyDocument: 'Documento analisado nesta resposta',
      historyReattach: 'O arquivo original não foi reenviado. Se a pergunta depender de partes do documento que não aparecem acima, peça que a pessoa anexe o arquivo novamente.',
      partialCoverage: 'Não consegui carregar o texto de: {laws}. A resposta usa apenas as normas que carregaram, por isso a cobertura pode estar incompleta. Tente novamente mais tarde para incluir essas normas.',
      relevanceFallback: 'A verificação automática de relevância não estava disponível; os trechos foram escolhidos por busca de palavras. Confira se eles tratam mesmo do seu caso.',
      fallbackModel: 'Esta explicação foi gerada por um modelo alternativo, mais simples, porque o principal estava indisponível. Confira com atenção os artigos citados.'
    },
    storage: {
      title: 'O histórico não está sendo salvo neste navegador',
      failed: 'As conversas continuam na tela, mas não foi possível gravá-las no armazenamento local. Ao fechar ou recarregar a página, elas podem se perder. Exporte o histórico para guardar uma cópia.',
      quota: 'O armazenamento local deste navegador está cheio. As conversas continuam na tela, mas não foi possível gravá-las. Exporte o histórico e apague conversas antigas para liberar espaço.',
      failedToast: 'Não foi possível salvar o histórico neste navegador.',
      quotaToast: 'Armazenamento cheio: o histórico não foi salvo.',
      export: 'Exportar histórico',
      retry: 'Tentar salvar de novo',
      exported: 'Histórico exportado como arquivo de texto.',
      copied: 'Histórico copiado para a área de transferência.',
      exportTitle: 'Histórico de conversas'
    },
    pages: {
      privacy: {
        title: 'Privacidade',
        updated: 'Atualizado em 15 de novembro de 2026.',
        html: `
<h2>Em resumo</h2>
<p>O ROSS AI pede apenas o necessário para responder. O histórico das conversas fica neste navegador. Para gerar as explicações, a pergunta, trechos recentes da conversa, os trechos de lei selecionados e os anexos passam pelo servidor do ROSS AI e são enviados ao Google Gemini. O servidor não guarda perguntas nem anexos.</p>
<h2>O que fica neste navegador</h2>
<ul>
<li>O texto das suas perguntas e das respostas.</li>
<li>O nome, o tamanho e o tipo dos arquivos anexados. O conteúdo dos arquivos não é guardado; para perguntar de novo sobre um arquivo, pode ser preciso anexá-lo outra vez.</li>
<li>Suas preferências: idioma, aparência, estado e modo de resposta.</li>
<li>Suas avaliações de respostas (útil ou não útil), que não são enviadas a ninguém.</li>
</ul>
<p>Esses dados ficam no armazenamento local do navegador (localStorage) e não são lidos por outras pessoas que usam o ROSS AI em outros aparelhos.</p>
<h2>O que passa pelo servidor</h2>
<ul>
<li><strong>Explicações por IA</strong>: a pergunta, até seis mensagens anteriores resumidas, os trechos de lei escolhidos e os anexos (imagens e PDFs) são enviados ao Google Gemini apenas para gerar a resposta.</li>
<li><strong>Busca de leis</strong>: os termos da pesquisa são usados para consultar a base de leis do ROSS AI. Essa busca não usa o modelo de IA.</li>
<li><strong>Controle de uso</strong>: para limitar abusos, o servidor conta pedidos por dia usando um código derivado do endereço de rede (hash), sem guardar o endereço em si.</li>
<li><strong>Acompanhar processo</strong>: os números consultados vão ao servidor e daí ao CNJ/DJEN. Os números acompanhados, a data da consulta e identificadores das publicações ficam neste navegador. A consulta não usa o modelo de IA, e os resultados podem ficar em cache no servidor por até cinco minutos.</li>
</ul>
<p>Dentro do claude.ai, a explicação por IA usa a conta de quem abre o aplicativo, e não o servidor do ROSS AI.</p>
<h2>Documentos anexados</h2>
<p>Antes de anexar, o aplicativo avisa que documentos podem conter dados pessoais, e você pode cancelar. Anexe apenas o necessário para a pergunta e evite dados de terceiros que não sejam importantes.</p>
<h2>Como apagar</h2>
<ul>
<li>Cada conversa pode ser apagada no menu, na lista de conversas anteriores.</li>
<li>Em Configurações, é possível apagar todas as conversas de uma vez.</li>
<li>Em “Acompanhar processo”, remova um número para excluir seu registro.</li>
<li>Limpar os dados de navegação do navegador também remove tudo.</li>
</ul>
<h2>O que não fazemos</h2>
<ul>
<li>Não vendemos dados.</li>
<li>Não exibimos documentos privados em páginas públicas.</li>
<li>Não pedimos dados além dos necessários para responder.</li>
</ul>
<p>O Google trata os dados enviados ao Gemini conforme as condições do serviço contratado pelo responsável pelo ROSS AI.</p>
<h2>Contato</h2>
<p>Para dúvidas sobre o serviço, abra um chamado em <a href="https://github.com/matheusbauto-blip/ross-ai/issues" target="_blank" rel="noopener">https://github.com/matheusbauto-blip/ross-ai/issues</a>. O chamado é público: não inclua dados pessoais, números de processo ou documentos.</p>`
      },
      terms: {
        title: 'Termos de uso',
        updated: 'Atualizado em 15 de novembro de 2026.',
        html: `
<h2>O que é o ROSS AI</h2>
<p>O ROSS AI é uma ferramenta de informação e compreensão jurídica sobre o Direito brasileiro. Ele explica leis, contratos e documentos em linguagem simples, mostra os trechos de lei consultados e avisa quando a resposta depende de análise profissional.</p>
<p>O ROSS AI não é um escritório de advocacia, não presta consultoria jurídica e não cria relação entre advogado e cliente.</p>
<h2>De onde vêm as respostas</h2>
<ul>
<li><strong>Fontes oficiais</strong>: trechos da legislação federal capturados do Portal da Legislação do Planalto e da Legislação Informatizada da Câmara dos Deputados, com data de captura e link para conferir.</li>
<li><strong>Acervo importado</strong>: textos de um repositório comunitário, marcados como “vigência não verificada”.</li>
<li><strong>Explicação por IA</strong>: o Google Gemini (ou o Claude, dentro do claude.ai) escreve a explicação a partir desses trechos. A IA pode errar; afirmações que citam trechos não consultados são removidas, mas isso não garante a correção de toda resposta.</li>
<li><strong>IA sem fontes</strong> e <strong>Demonstração</strong>: modos opcionais nas Configurações. O primeiro gera respostas gerais não verificadas; o segundo usa exemplos fictícios.</li>
</ul>
<p>A cobertura ainda é parcial: legislação federal selecionada, parte da estadual e nenhuma municipal. A data de captura não confirma, sozinha, que uma norma continua em vigor.</p>
<h2>O que o serviço não faz</h2>
<ul>
<li>Não garante resultados. Ninguém pode prometer que uma ação será ganha ou perdida.</li>
<li>Não afirma que uma cláusula é definitivamente válida ou inválida, nem que um processo certamente cabe.</li>
<li>Não substitui advogados, defensores públicos, sindicatos ou órgãos públicos.</li>
<li>Não impede processos nem cumpre prazos por você. A consulta de processos mostra publicações do DJEN, que não equivalem ao histórico completo do processo.</li>
</ul>
<h2>Uso adequado</h2>
<ul>
<li>Confira as fontes antes de tomar decisões.</li>
<li>Em situações urgentes, procure atendimento profissional ou o órgão competente sem demora.</li>
<li>Anexe apenas documentos que você tem o direito de usar e evite dados de terceiros desnecessários.</li>
<li>Há limite diário de perguntas por aparelho para manter o serviço disponível.</li>
</ul>
<h2>Responsabilidade</h2>
<p>As respostas podem conter erros ou estar desatualizadas. As decisões tomadas com base nelas são de responsabilidade de quem as toma. Recomendamos buscar orientação profissional para avaliações personalizadas.</p>
<h2>Alterações</h2>
<p>Estes termos podem mudar. A data no topo indica a versão em vigor.</p>
<h2>Contato</h2>
<p>Abra um chamado em <a href="https://github.com/matheusbauto-blip/ross-ai/issues" target="_blank" rel="noopener">https://github.com/matheusbauto-blip/ross-ai/issues</a>. O chamado é público: não inclua dados pessoais ou documentos.</p>`
      },
      help: {
        title: 'Ajuda',
        updated: 'Guia rápido do ROSS AI.',
        html: `
<h2>Como perguntar</h2>
<ul>
<li>Escreva com suas palavras. Não precisa usar termos técnicos.</li>
<li>O ROSS AI atende ao Direito brasileiro. Se a situação depender de um estado, escolha-o no campo abaixo da mensagem.</li>
<li>Se a dúvida for sobre um trecho, cole o texto ou anexe o documento.</li>
<li>Para uma explicação mais simples da resposta anterior, peça “explique de forma mais fácil”.</li>
</ul>
<h2>Como anexar documentos</h2>
<p>Use o clipe no campo de mensagem para anexar PDFs ou imagens (até 4 arquivos e 20 MB por mensagem). Antes do envio, você verá um aviso sobre dados pessoais e poderá cancelar. Mesmo quando a busca não encontra lei aplicável, o documento é lido e a resposta deixa claro que não houve fundamentação legal verificada. O arquivo não fica guardado: para novas perguntas sobre partes que não apareceram na resposta, anexe-o de novo.</p>
<h2>Como ler a resposta</h2>
<ol>
<li><strong>Em resumo</strong>: a resposta direta.</li>
<li><strong>O que as fontes dizem</strong>: os trechos relevantes explicados, cada um ligado a uma fonte.</li>
<li><strong>O que depende da situação</strong>: fatos ou documentos que podem mudar a resposta.</li>
<li><strong>Fontes consultadas</strong>: norma, artigo, link e data da captura. Clique no título para abrir a lista.</li>
<li><strong>Próximos passos</strong>: opções informativas e neutras.</li>
</ol>
<h2>Os selos</h2>
<ul>
<li><strong>Fontes oficiais</strong>: explicação baseada em trechos do Planalto ou da Câmara dos Deputados, com link para conferir.</li>
<li><strong>Vigente / Revogado / Vetado</strong>: situação do artigo no texto capturado.</li>
<li><strong>Acervo importado</strong>: texto de repositório comunitário, com vigência não verificada.</li>
<li><strong>Modo IA</strong>: resposta gerada por IA sem fontes verificadas.</li>
<li><strong>Demonstração</strong>: resposta com fontes fictícias, usada só quando escolhida.</li>
</ul>
<h2>Outras telas</h2>
<ul>
<li><strong>Pesquisar legislação</strong>: busca direta na base, por assunto, número, estado ou município.</li>
<li><strong>Acompanhar processo</strong>: consulta gratuita de publicações do DJEN pelo número do processo.</li>
<li><strong>Base de fontes</strong>: lista das normas, datas de captura e versões.</li>
</ul>
<h2>Limites</h2>
<p>O ROSS AI informa e ajuda a entender. Ele não avalia chances, não define estratégia e não substitui um profissional. Quando um pedido passa desse limite, a resposta explica o motivo e indica onde procurar ajuda.</p>
<h2>Exemplos fictícios</h2>
<p>Estes botões abrem conversas no modo de demonstração, com fontes fictícias, para mostrar como o ROSS AI reage a cada situação.</p>
<div class="scenario-grid">
<button type="button" class="btn btn-secondary" data-scenario="doc_ok">Documento legível</button>
<button type="button" class="btn btn-secondary" data-scenario="doc_illegible">Documento ilegível</button>
<button type="button" class="btn btn-secondary" data-scenario="doc_incomplete">Documento incompleto</button>
<button type="button" class="btn btn-secondary" data-scenario="urgent">Situação urgente</button>
<button type="button" class="btn btn-secondary" data-scenario="limit">Pedido de conclusão definitiva</button>
<button type="button" class="btn btn-secondary" data-scenario="nosources">Sem fontes adequadas</button>
<button type="button" class="btn btn-secondary" data-scenario="error">Erro ao responder</button>
</div>
<h2>Perguntas frequentes</h2>
<p><strong>As respostas são confiáveis?</strong> Elas se baseiam em trechos de fontes oficiais e mostram de onde vieram, mas a explicação é escrita por IA e pode errar. Confira os artigos citados antes de decidir.</p>
<p><strong>Meus documentos ficam guardados?</strong> Não. Eles são enviados para gerar a resposta e não ficam no servidor. No navegador fica apenas o nome do arquivo. Veja a página de Privacidade.</p>
<p><strong>Posso usar em outro idioma?</strong> Sim, a interface e as respostas podem ser em inglês. Mude o idioma em Configurações. A legislação continua sendo a brasileira.</p>`
      }
    }
  },

  'en': {
    processes: {
      title: 'Track a proceeding', intro: 'Use the proceeding number to find and track available official publications.',
      unknownSource: 'Source not provided', publications: 'DJEN publications', availableAt: 'Made available on',
      publicationCoverage: 'Free lookup of the National Electronic Justice Gazette (DJEN/CNJ). This screen tracks official publications, which do not represent the complete proceeding event history.',
      publicationCourt: 'Court unit in the latest publication on this page', lastPublication: 'Latest availability date on this page',
      publicationFreshness: 'Dates refer to availability in DJEN. Repeated lookups may reuse data retrieved up to 5 minutes earlier; the original service query date is preserved.',
      emptyPublications: 'This lookup returned no DJEN publications. This does not establish that the proceeding does not exist. You can track the number to check for future publications.',
      morePublications: 'View earlier publications', limitedResults: 'The source limits this search to 10,000 records. These results should not be considered a complete proceeding history.',
      cancelledPublication: 'The source marks this publication as cancelled. Check the source for updates.', excerptNotice: 'Shortened excerpt. Open the source to read the complete publication.',
      newPublications: '{n} new or changed publication(s) since the previous lookup.',
      number: 'Proceeding number', hint: 'Enter 20 digits or paste the full number, including punctuation.',
      cpfTitle: 'Search by CPF on the official portal',
      cpfIntro: 'Find the proceeding number for free on Jus.br, the Brazilian Judiciary portal. CPF searches take place there; return to ROSS to track publications afterwards.',
      cpfStepLogin: 'Open Jus.br and sign in with your gold-level gov.br account.',
      cpfStepSearch: 'Choose “Consultar processos”, select “CPF da Parte”, enter the CPF and click “Buscar”.',
      cpfStepReturn: 'Copy the 20-digit proceeding number and paste it in the field above. Look it up and choose “Track in this browser”.',
      cpfOpen: 'Open Jus.br (new tab)', cpfReturn: 'I have the number',
      cpfPrivacy: 'Enter your CPF, password and access codes only on the official portal. This shortcut does not send them to ROSS or import results automatically.',
      cpfCoverage: 'Results depend on connected systems and your access permissions. An empty result does not establish that no proceedings exist.',
      cpfRedirect: 'To search by CPF, use “Search by CPF on the official portal”. Paste the proceeding number found on Jus.br in this field.',
      search: 'Look up proceeding', loading: 'Looking up…', invalid: 'Check the proceeding number. It must contain 20 digits with valid check digits.',
      notConfigured: 'Proceeding lookup has not been activated in ROSS yet. No result was obtained. Try again after the service is activated.',
      unavailable: 'The proceeding could not be retrieved right now. Please try again shortly.',
      notFound: 'No proceeding was found in this lookup. Check the number. This does not establish that the proceeding does not exist.',
      restricted: 'This proceeding cannot be displayed in a public lookup. Check access with the court.',
      rateLimited: 'The lookup limit has been reached. Please try again later.',
      source: 'Data provided by', consultedAt: 'Service queried', verifiedAt: 'Last verification reported by source',
      parties: 'Reported parties', court: 'Originating court unit', className: 'Class', subject: 'Subject', lastMovement: 'Last reported event',
      unknownDate: 'Date not provided', tribunalUnknown: 'Court not provided',
      freshness: 'The service provides its available edition, which may lag behind the court. A service lookup does not mean the court was checked again.',
      follow: 'Track in this browser', unfollow: 'Stop tracking', refresh: 'Look up again', openSource: 'Open source',
      history: 'Events', movementsUnavailable: 'The proceeding was found, but its events could not be retrieved. Please try again.',
      emptyMovements: 'No events were returned by this lookup.', more: 'View earlier events',
      savedTitle: 'Tracked proceedings', emptySaved: 'You have not added any proceedings to track yet.',
      localNotice: 'Tracked numbers stay in this browser. The open proceeding is checked every 15 minutes while this screen is visible. This version does not send alerts when the app is closed.',
      remove: 'Remove tracking', limit: 'You can track up to 20 proceedings in this browser.',
      storageError: 'Tracking could not be saved in this browser. It remains available for this session but may be lost when you close the page.',
      newMovements: '{n} event(s) were found that did not appear in the previous lookup.'
    },
    corpus: {
      title: 'Legal research', homeHint: 'Search laws, precedents and news in separate collections.',
      kind: 'What would you like to search?', laws: 'Legislation', precedents: 'STJ precedents', news: 'STJ news',
      statusTitle: 'Library status', refreshStatus: 'Refresh counts', stale: 'Last available copy; source temporarily unavailable',
      separateNotice: 'News and precedents have their own context and are not legislation. Check the status and publication in the official source.',
      noThesis: 'No thesis was provided in this dataset. Check the status and documents at the source.', truncated: 'Abridged excerpt. Read the full text at the source.',
      readRepository: 'Read text from repository', hideText: 'Hide text',
      intro: 'Search the Brazilian legislation library, precedents and official news. Choose the content type before searching.',
      count: '{n} imported texts · {catalog} files in the expanded catalog', loadingCount: 'Checking the corpus…',
      coverage: 'Import in progress. The corpus does not contain all Brazilian legislation. Capture dates do not establish current legal validity.',
      query: 'Topic, name or number', placeholder: 'E.g. licitações, Código Civil or 14.133',
      search: 'Search', searching: 'Searching…', scope: 'Jurisdiction', all: 'All jurisdictions',
      federal: 'Federal', estadual: 'State / Federal District', municipal: 'Municipal', state: 'State', allStates: 'All states',
      city: 'Municipality', cityPlaceholder: 'E.g. Uberlândia',
      filterHint: 'State and city filters also include applicable federal texts. Use specific terms; search matches words in the texts.',
      openSource: 'Open source', openSnapshot: 'View imported edition', readExcerpt: 'Read matching excerpt',
      currency: 'Current legal validity not verified', imported: 'Imported text', importedBadge: 'Imported corpus · ctresb/leis', partial: 'Partial / pending publication',
      repealed: 'Repeal or veto indicated in the text', previous: 'Previous', next: 'Next results',
      empty: 'No matching passage in the imported corpus. Try fewer words, a law number or other filters.',
      unavailable: 'Search is unavailable right now. Please try again shortly.', rateLimit: 'The search limit has been reached. Please try again later.',
      answerNotice: 'This answer includes excerpts imported from ctresb/leis. Check the edition, capture date and source of each reference. Their current legal validity has not been verified.',
      noAI: 'I found these excerpts. The AI explanation is not yet available; you can read the text and open each source.',
      regulador: 'Regulatory agencies', organ: 'Agency', chooseOrgan: 'Choose the agency', federalActs: 'Include federal decrees, provisional measures and resolutions',
      indexBadge: 'Repository index', indexLoading: 'Loading the full repository index…', indexUnavailable: 'The full repository index is unavailable right now; search uses only the imported corpus.',
      indexReady: 'Full index: {n} texts from ctresb/leis (edition {ref}), searchable by title, summary and number; the full text is read on demand.',
      indexNeedsFilter: 'To search state or municipal laws in the full index, choose the state; for regulatory agencies, choose the agency.',
      noSummary: 'No summary recorded; open the text to read it.', textOfNorm: 'Text of the law', editionUnknown: 'Edition not stated'
    },
    langName: 'English',
    tagline: 'Legal information, made clear.',
    taglineAlt: 'Informação jurídica, em linguagem simples.',
    home: {
      catalogLoading: 'Loading the law base…',
      headline: 'Understand legal information with more clarity.',
      placeholder: 'What would you like to understand?',
      examples: [
        { label: 'Can you explain this clause in my contract?', intent: 'clause' },
        { label: 'What does this law say in plain words?', intent: 'law' },
        { label: 'What information do I need to gather about this situation?', intent: 'gather' },
        { label: 'Where can I look for help with this problem?', intent: 'help' }
      ],
      examplesLabel: 'Examples to start with',
      footnote: 'ROSS AI is a tool for legal information and understanding. It does not replace a professional review.',
      demoNotice: 'Demonstration version: answers use fictional sources and are not yet connected to real legal databases.',
      oficialNotice: 'Official sources: {n} Brazilian federal laws with official text (Planalto and the Chamber of Deputies), captured on {date}. The plain-language explanation is generated by AI; always check the cited articles.',
      oficialNoAI: 'In this environment the AI explanation is unavailable: answers show the official excerpts found.',
      aiNotice: 'AI mode without verified sources: answers are general and marked as unconfirmed.'
    },
    composer: {
      attach: 'Attach document',
      attachAnother: 'Attach another document',
      send: 'Send',
      stop: 'Stop',
      remove: 'Remove attachment',
      country: 'Country',
      region: 'State or region',
      regionAll: 'Whole country',
      hint: 'Enter sends. Shift+Enter adds a line.',
      disclaimer: 'ROSS AI offers general legal information and does not replace a professional.'
    },
    nav: {
      menu: 'Open menu',
      close: 'Close',
      newChat: 'New conversation',
      history: 'Previous conversations',
      empty: 'No conversations yet.',
      sources: 'Source registry',
      settings: 'Settings',
      privacy: 'Privacy',
      terms: 'Terms of use',
      help: 'Help',
      delete: 'Delete conversation',
      demoTag: 'Demonstration version',
      back: 'Back',
      home: 'Home'
    },
    chat: {
      you: 'You',
      assistant: 'ROSS AI',
      copy: 'Copy answer',
      copied: 'Answer copied.',
      copyFailed: 'Could not copy. Select the text manually.',
      helpful: 'Helpful',
      notHelpful: 'Not helpful',
      thanks: 'Thanks for the feedback.',
      retry: 'Try again',
      modeDemo: 'Demonstration',
      modeAI: 'AI mode · unverified',
      untitled: 'New conversation',
      attachments: 'Attachments',
      confirmDelete: 'Delete this conversation and its attachments? This cannot be undone.',
      yesDelete: 'Delete',
      cancel: 'Cancel',
      deleted: 'Conversation deleted.',
      jurisdiction: 'Jurisdiction',
      jurisdictionChanged: 'Jurisdiction changed to {j}.',
      change: 'Change',
      apply: 'Apply',
      typing: 'Preparing answer',
      aiBanner: 'Experimental AI mode: answer generated without consulting official sources. Law names and articles were not verified.',
      demoBanner: 'Demonstration with fictional sources. No law cited here is real.',
      modeOficial: 'Official sources',
      oficialBanner: 'Based on excerpts of the official text (Planalto or the Chamber of Deputies), captured on {date}. The explanation is generated by AI and should be checked against the cited articles.'
    },
    letter: {
      cta: 'Draft a complaint letter',
      ctaHint: 'A model letter to send to the company, based on the articles in this answer.',
      title: 'Complaint letter',
      loading: 'Writing the letter…',
      notice: 'Model written by AI from the articles cited in this answer. Fill in the fields in square brackets, review the text and keep a copy of what you send. What you type here stays in this browser only. It does not replace advice from a lawyer or the Public Defender.',
      to: 'To',
      subject: 'Subject',
      fill: 'Fill in before sending:',
      filled: 'All fields in square brackets have been filled in. Review the text before sending.',
      bodyLabel: 'Letter text (you can edit it)',
      copy: 'Copy letter',
      copied: 'Letter copied.',
      download: 'Download (.txt)',
      fileName: 'complaint-letter',
      regenerate: 'Write again',
      basedOn: 'Legal grounds used:',
      short: 'Short version for Procon or consumidor.gov.br',
      shortCopy: 'Copy short version',
      shortCopied: 'Short version copied.',
      notes: 'How to send it',
      unsuitable: 'A complaint letter does not seem the best step for this situation.',
      error: 'The letter could not be written right now. Try again shortly.',
      retry: 'Try again'
    },
    sections: {
      summary: 'In short',
      sourcesSay: 'What the sources say',
      depends: 'What depends on the situation',
      sources: 'Sources consulted',
      sourcesAI: 'Sources mentioned (unverified)',
      next: 'Next steps',
      questions: 'To answer better, I need to know',
      checklist: 'What to gather',
      options: 'Where to look',
      inDocument: 'In the document',
      inLaw: 'In the cited legislation',
      document: 'About the document',
      limit: 'Where this service stops',
      urgent: 'This may be urgent',
      canDo: 'What I can do',
      attention: 'Note',
      noSources: 'No sources were consulted for this answer.'
    },
    status: {
      vigente: 'In force',
      historico: 'Historical text',
      projeto: 'Bill',
      nao_confirmada: 'Unconfirmed',
      pagina: 'Official page',
      unverified: 'Unverified',
      revogado: 'Repealed',
      vetado: 'Vetoed'
    },
    source: {
      article: 'Article or section',
      version: 'Version',
      verified: 'Verified on',
      link: 'Official link',
      fictional: 'fictional',
      jurisdiction: 'Jurisdiction',
      published: 'Published',
      index: 'Index used in search',
      noLink: 'No verified link',
      official: 'Official text',
      planalto: 'Compiled text · Planalto',
      camara: 'Updated text · Chamber of Deputies',
      textFrom: 'Text captured from',
      captured: 'Captured on',
      open: 'Open at Planalto',
      excerpt: 'See the excerpt consulted',
      note: 'Note'
    },
    loading: {
      demo: ['Searching the source index', 'Confirming text at the official source', 'Writing in plain words'],
      ai: ['Preparing your question', 'Consulting the model', 'Organizing the answer'],
      oficial: ['Selecting laws in the catalog', 'Searching articles in the official text', 'Writing in plain words']
    },
    errors: {
      title: 'The answer could not be completed',
      interrupted: 'The response was interrupted. Try again to continue.',
      attachment_missing: 'Attach the file again to retry this question. File contents are not saved in the history.',
      generic: 'Something went wrong while preparing the answer. Try again in a moment.',
      not_granted: 'AI mode was not allowed in this browser, so no answer was generated. You can allow it in the artifact permissions menu or turn AI mode off in settings.',
      rate_limited: 'AI mode reached its usage limit for now. Try later or use the demonstration mode.',
      cancelled: 'Answer stopped at your request. A request already sent to the server may still have been processed and counted against the usage limit.',
      timeout: 'The answer took longer than expected and the wait was ended. Try again; if it keeps happening, ask a more specific question.',
      invalid_json: 'The model replied in an unexpected format. Try again.',
      images_unavailable: 'This environment cannot send images to the model. Paste the text of the excerpt instead.',
      image_rejected: 'One of the images was not accepted by the model. Try another format or size.',
      unavailable: 'AI mode is not available in this environment. No answer was generated. Try again or choose another mode in Settings.',
      quota_unavailable: 'The usage limit could not be checked right now, so for safety the question was not sent to the AI. Try again shortly.',
      worker_recycling: 'The server was restarting and the question was not processed. Try again in a few seconds.',
      law_fetch: 'The law text could not be loaded. Check the connection and try again.',
      api_not_configured: 'The AI server does not have its API key configured yet. No answer was generated.',
      api_error: 'The AI server did not respond. Try again in a moment.',
      refusal: 'The model could not answer this request. Rephrase the question or seek a professional.',
      truncated: 'The answer became too long and was cut off. Try a more specific question.',
      catalog_unavailable: 'The law base could not be loaded. Check your connection and try again.'
    },
    attachModal: {
      title: 'Before attaching',
      body: 'Documents often contain personal data such as names, ID numbers, addresses and amounts. Attach only what your question needs.',
      demoLine: 'In this demonstration version the file is not sent to any server and is not read by the system. Only its name, size and type stay in this browser’s local history.',
      aiLine: 'With AI active on the website, your question and attachments (images and PDFs) are sent through the server to Google Gemini to generate the answer. Inside claude.ai, the explanation uses your account.',
      apiLine: 'Attached images and PDFs are sent to the ROSS AI server and to the AI model only to generate the answer. They are not stored.',
      cancel: 'Cancel',
      confirm: 'Attach',
      tooLarge: 'over 20 MB. Choose a smaller file.',
      tooMany: 'maximum of 4 files per message.',
      totalTooLarge: 'the attachments exceed 20 MB combined. Send fewer files or reduce their size.',
      badType: 'format not accepted. Send PDF, JPG, PNG or WEBP.',
      skipped: 'Files not attached:'
    },
    settings: {
      title: 'Settings',
      language: 'Language of answers and interface',
      theme: 'Appearance',
      themeSystem: 'Follow system',
      themeLight: 'Light',
      themeDark: 'Dark',
      jurisdiction: 'Default jurisdiction',
      jurisdictionHelp: 'Used in new conversations. You can change it at any time.',
      ai: 'AI mode (experimental)',
      aiHelp: 'Generates general answers with an AI model, through your account, without consulting official sources. Answers are marked as unverified. When off, ROSS AI uses the demonstration mode with fictional sources.',
      aiUnavailable: 'Unavailable in this environment: neither claude.ai nor the ROSS AI server is reachable.',
      aiOn: 'On',
      aiOff: 'Off',
      data: 'Your data',
      dataHelp: 'Conversations, attachment names, ratings and tracked proceeding numbers stay in this browser. Remove tracking from the proceedings screen.',
      deleteAll: 'Delete all conversations',
      deleteAllConfirm: 'Delete all conversations and attachment records from this browser? This cannot be undone.',
      deleted: 'All conversations were deleted.',
      about: 'About',
      aboutText: 'ROSS AI, initial version. Explains Brazilian federal legislation with excerpts from official sources (Planalto and the Chamber of Deputies) and an imported corpus marked as unverified. An information tool that does not replace a professional.',
      aboutVersion: 'Published version: {version}. If this screen shows an old version after an update, reload the page.',
      aboutDev: 'Development version (no release identifier).',
      count: '{n} conversation(s) stored.',
      mode: 'Answer mode',
      modeHelp: 'Official sources uses the law text captured from Planalto and explains it with AI. Demonstration uses fictional sources. AI without sources gives general answers, marked as unverified.',
      modeOficial: 'Official sources',
      modeDemo: 'Demonstration',
      modeAI: 'AI without sources',
      oficialNote: 'Base with {n} federal laws, captured on {date}.',
      oficialNoAI: 'In this environment the AI explanation is unavailable; answers show the official excerpts found.',
      viaClaude: 'AI explanation through your claude.ai account.',
      viaApi: 'AI explanation through the ROSS AI server (own API).',
      oficialUnavailable: 'The law base was not loaded in this environment. Meanwhile, answers use the demonstration mode.',
      demoNote: 'Scripted answers with fictional sources, to show the experience.'
    },
    sourcesPage: {
      title: 'Source registry',
      intro: 'Every legal text used in answers records its origin, jurisdiction, date, status, official link and last verification date. Automated jobs compare the official source with the stored version and flag changes for review before the base is updated.',
      banner: 'Demonstration registry with fictional sources. No text here corresponds to a real law.',
      queue: 'Detected changes awaiting review',
      queueEmpty: 'No pending changes.',
      detected: 'Change detected on',
      before: 'Stored version',
      after: 'Text found at the official source',
      approve: 'Approve and create new version',
      keep: 'Keep current version',
      approved: 'Update approved. New version recorded.',
      kept: 'Change marked for later review. The current version was kept.',
      versions: 'Version history',
      current: 'current',
      usedIn: 'Used in demonstration answers',
      howTitle: 'How the registry is maintained',
      how: [
        'Repositories work as an index to find the text. Content and version are confirmed at the official source.',
        'Each record keeps country or state and the date of the text, to tell legislation in force from historical text, bills and unconfirmed information.',
        'Automated routines revisit the official source and compare the text. Differences enter this queue and only replace the version in use after review.',
        'Version history makes it possible to know which text supported each answer.'
      ],
      fields: {
        type: 'Type', jurisdiction: 'Jurisdiction', published: 'Published', status: 'Status',
        index: 'Index', link: 'Official link', verified: 'Last verified', version: 'Version in use'
      },
      types: { lei: 'Law', portaria: 'Regulation', pagina: 'Official page', projeto: 'Bill', constituicao: 'Constitution', decreto: 'Decree', 'decreto-lei': 'Decree-Law', 'lei-complementar': 'Supplementary Law' },
      filter: 'Filter laws',
      filterPlaceholder: 'Filter by name, number or topic',
      filterCount: '{n} law(s) found.',
      official: 'Official sources',
      officialIntro: 'Texts captured from official sources: the Planalto legislation portal (compiled text) and the Chamber of Deputies\u2019 legislation database (updated text), with LexML as the index. {n} federal laws, captured on {date}. Each law keeps the raw text hash, the capture date, the text source and the version history.',
      officialUnavailable: 'The law base was not loaded in this environment.',
      demoSection: 'Demonstration sources (fictional)',
      articles: 'Articles',
      inForce: 'in force',
      repealed: 'repealed or vetoed',
      hash: 'Raw text hash',
      lexml: 'LexML URN',
      checkCmd: 'To check for updates: node scripts/ingest-laws.mjs --check',
      approveCmd: 'After review, apply with: node scripts/ingest-laws.mjs --approve'
    },
    oficial: {
      jurisdiction: 'The official source base covers, for now, only Brazilian federal legislation. I do not have sources for {country} yet, so I will not risk an answer.',
      jurisdictionStep: 'Switch the jurisdiction to Brazil or wait for other jurisdictions to be added to the base.',
      docDefaultQuery: 'contrato cláusula multa rescisão cancelamento prazo',
      empty: 'I could not confirm enough relevant excerpts to answer safely in this search. This does not mean that no applicable rule exists.',
      relevanceUnavailable: 'I could not complete the source relevance check. The passages below were found by keyword matching and are provided only for review; no legal conclusion was generated.',
      modelUnavailable: 'The AI explanation is not available right now: the model service is unstable. Below are the most related law excerpts, found by keyword search. Send the question again in a few minutes to get the explanation.',
      rephraseMissing: 'I can explain it more simply. First, I need to know your question or which answer you want me to rephrase.',
      rephraseQuestion: 'Which topic or answer would you like me to explain differently?',
      emptyQuestions: ['What is the question about: consumer, work, housing, family, personal data or other?', 'Is there a specific law, contract or document involved?'],
      emptyStep: 'Rephrase with more detail or name the law, if you know which one.',
      noAI: 'I found these excerpts in the official sources. The AI explanation is currently unavailable; here is the official text for you to check.',
      noAIWarn: 'Excerpts selected by word search in the official text. Read the full article at the link before concluding.',
      droppedClaims: 'I removed {n} statement(s) from the explanation because they cited excerpts that were not consulted.',
      unlinked: 'The explanation did not indicate which excerpts it relies on. Treat it as unconfirmed and check the law text before concluding.',
      documentNoLaw: 'I read the document, but found no law excerpts in the base to support a legal conclusion. The explanation below covers what the document says; no law it mentions was verified.',
      documentUnread: 'The document could not be analysed now because the AI explanation is unavailable. Try again later or paste the excerpt you want to understand.',
      documentDefaultQuestion: 'Explain what this document says and what is important to note.',
      historyFiles: 'attached files',
      historyDocument: 'Document analysed in this answer',
      historyReattach: 'The original file was not sent again. If the question depends on parts of the document not shown above, ask the person to attach the file again.',
      partialCoverage: 'I could not load the text of: {laws}. The answer uses only the laws that loaded, so coverage may be incomplete. Try again later to include those laws.',
      relevanceFallback: 'The automatic relevance check was unavailable; the excerpts were chosen by keyword search. Check that they really cover your case.',
      fallbackModel: 'This explanation was generated by a simpler fallback model because the main one was unavailable. Check the cited articles carefully.'
    },
    storage: {
      title: 'History is not being saved in this browser',
      failed: 'Conversations remain on screen, but they could not be written to local storage. Closing or reloading the page may lose them. Export the history to keep a copy.',
      quota: 'This browser\'s local storage is full. Conversations remain on screen, but they could not be saved. Export the history and delete old conversations to free up space.',
      failedToast: 'History could not be saved in this browser.',
      quotaToast: 'Storage full: history was not saved.',
      export: 'Export history',
      retry: 'Try saving again',
      exported: 'History exported as a text file.',
      copied: 'History copied to the clipboard.',
      exportTitle: 'Conversation history'
    },
    pages: {
      privacy: {
        title: 'Privacy',
        updated: 'Updated 15 November 2026.',
        html: `
<h2>In short</h2>
<p>ROSS AI asks only for what it needs to answer. Your conversation history stays in this browser. To generate explanations, your question, recent parts of the conversation, the selected law excerpts and attachments pass through the ROSS AI server and are sent to Google Gemini. The server does not keep questions or attachments.</p>
<h2>What stays in this browser</h2>
<ul>
<li>The text of your questions and the answers.</li>
<li>The name, size and type of attached files. File contents are not kept; to ask again about a file you may need to attach it again.</li>
<li>Your preferences: language, appearance, state and answer mode.</li>
<li>Your ratings of answers (helpful or not helpful), which are not sent to anyone.</li>
</ul>
<p>This data lives in the browser’s local storage (localStorage) and is not read by other people using ROSS AI on other devices.</p>
<h2>What passes through the server</h2>
<ul>
<li><strong>AI explanations</strong>: the question, up to six earlier messages in summary form, the chosen law excerpts and attachments (images and PDFs) are sent to Google Gemini only to generate the answer.</li>
<li><strong>Law search</strong>: search terms are used to query the ROSS AI law base. This search does not use the AI model.</li>
<li><strong>Usage control</strong>: to limit abuse, the server counts daily requests using a code derived from the network address (a hash), without storing the address itself.</li>
<li><strong>Track a proceeding</strong>: looked-up numbers go to the server and then to CNJ/DJEN. Tracked numbers, lookup dates and publication identifiers stay in this browser. Lookups do not use the AI model, and results may be cached on the server for up to five minutes.</li>
</ul>
<p>Inside claude.ai, the AI explanation uses the account of the person opening the app instead of the ROSS AI server.</p>
<h2>Attached documents</h2>
<p>Before attaching, the app warns that documents may contain personal data, and you can cancel. Attach only what the question needs and avoid unnecessary third-party data.</p>
<h2>How to delete</h2>
<ul>
<li>Each conversation can be deleted from the menu, in the list of previous conversations.</li>
<li>In Settings you can delete all conversations at once.</li>
<li>In “Track a proceeding”, remove a number to delete its record.</li>
<li>Clearing your browser’s site data also removes everything.</li>
</ul>
<h2>What we do not do</h2>
<ul>
<li>We do not sell data.</li>
<li>We do not show private documents on public pages.</li>
<li>We do not ask for data beyond what the answer needs.</li>
</ul>
<p>Google processes data sent to Gemini under the terms of the service contracted by the person responsible for ROSS AI.</p>
<h2>Contact</h2>
<p>For questions about the service, open an issue at <a href="https://github.com/matheusbauto-blip/ross-ai/issues" target="_blank" rel="noopener">https://github.com/matheusbauto-blip/ross-ai/issues</a>. Issues are public: do not include personal data, proceeding numbers or documents.</p>`
      },
      terms: {
        title: 'Terms of use',
        updated: 'Updated 15 November 2026.',
        html: `
<h2>What ROSS AI is</h2>
<p>ROSS AI is a tool for legal information and understanding about Brazilian law. It explains laws, contracts and documents in plain words, shows the law excerpts consulted and says when an answer depends on professional review.</p>
<p>ROSS AI is not a law firm, does not provide legal advice and does not create a lawyer-client relationship.</p>
<h2>Where answers come from</h2>
<ul>
<li><strong>Official sources</strong>: federal law excerpts captured from the Planalto legislation portal and the Chamber of Deputies’ legislation database, with capture date and a link to check.</li>
<li><strong>Imported corpus</strong>: texts from a community repository, marked “current validity not verified”.</li>
<li><strong>AI explanation</strong>: Google Gemini (or Claude, inside claude.ai) writes the explanation from those excerpts. AI can make mistakes; statements citing excerpts that were not consulted are removed, but that does not guarantee every answer is correct.</li>
<li><strong>AI without sources</strong> and <strong>Demonstration</strong>: optional modes in Settings. The first gives general unverified answers; the second uses fictional examples.</li>
</ul>
<p>Coverage is still partial: selected federal legislation, part of state legislation and no municipal legislation. A capture date alone does not confirm that a law is still in force.</p>
<h2>What the service does not do</h2>
<ul>
<li>It does not guarantee outcomes. Nobody can promise a case will be won or lost.</li>
<li>It does not state that a clause is definitely valid or invalid, or that a lawsuit certainly applies.</li>
<li>It does not replace lawyers, public defenders, unions or public bodies.</li>
<li>It does not prevent lawsuits or meet deadlines for you. Proceeding lookup shows DJEN publications, which are not the complete proceeding history.</li>
</ul>
<h2>Proper use</h2>
<ul>
<li>Check the sources before making decisions.</li>
<li>In urgent situations, seek professional help or the competent authority without delay.</li>
<li>Attach only documents you have the right to use and avoid unnecessary third-party data.</li>
<li>There is a daily limit of questions per device to keep the service available.</li>
</ul>
<h2>Responsibility</h2>
<p>Answers may contain errors or be out of date. Decisions made on their basis are the responsibility of whoever makes them. We recommend professional guidance for personalised assessments.</p>
<h2>Changes</h2>
<p>These terms may change. The date at the top indicates the version in effect.</p>
<h2>Contact</h2>
<p>Open an issue at <a href="https://github.com/matheusbauto-blip/ross-ai/issues" target="_blank" rel="noopener">https://github.com/matheusbauto-blip/ross-ai/issues</a>. Issues are public: do not include personal data or documents.</p>`
      },
      help: {
        title: 'Help',
        updated: 'Quick guide to ROSS AI.',
        html: `
<h2>How to ask</h2>
<ul>
<li>Write in your own words. No technical terms needed.</li>
<li>ROSS AI covers Brazilian law. If the situation depends on a state, choose it below the message box.</li>
<li>If the question is about an excerpt, paste the text or attach the document.</li>
<li>For a simpler version of the previous answer, ask “explain it more simply”.</li>
</ul>
<h2>How to attach documents</h2>
<p>Use the paper clip in the message box to attach PDFs or images (up to 4 files and 20 MB per message). Before sending, you see a notice about personal data and can cancel. Even when the search finds no applicable law, the document is read and the answer makes clear that no legal basis was verified. The file is not kept: for new questions about parts that did not appear in the answer, attach it again.</p>
<h2>How to read the answer</h2>
<ol>
<li><strong>In short</strong>: the direct answer.</li>
<li><strong>What the sources say</strong>: the relevant excerpts explained, each linked to a source.</li>
<li><strong>What depends on the situation</strong>: facts or documents that may change the answer.</li>
<li><strong>Sources consulted</strong>: law, article, link and capture date. Click the title to open the list.</li>
<li><strong>Next steps</strong>: informative, neutral options.</li>
</ol>
<h2>The labels</h2>
<ul>
<li><strong>Official sources</strong>: explanation based on excerpts from Planalto or the Chamber of Deputies, with a link to check.</li>
<li><strong>In force / Repealed / Vetoed</strong>: status of the article in the captured text.</li>
<li><strong>Imported corpus</strong>: community repository text, current validity not verified.</li>
<li><strong>AI mode</strong>: answer generated by AI without verified sources.</li>
<li><strong>Demonstration</strong>: answer with fictional sources, used only when chosen.</li>
</ul>
<h2>Other screens</h2>
<ul>
<li><strong>Search legislation</strong>: direct search in the base by topic, number, state or municipality.</li>
<li><strong>Track a proceeding</strong>: free lookup of DJEN publications by proceeding number.</li>
<li><strong>Source registry</strong>: list of laws, capture dates and versions.</li>
</ul>
<h2>Limits</h2>
<p>ROSS AI informs and helps you understand. It does not assess chances, define strategy or replace a professional. When a request crosses that line, the answer explains why and points to where to find help.</p>
<h2>Fictional examples</h2>
<p>These buttons open conversations in demonstration mode, with fictional sources, to show how ROSS AI reacts to each situation.</p>
<div class="scenario-grid">
<button type="button" class="btn btn-secondary" data-scenario="doc_ok">Readable document</button>
<button type="button" class="btn btn-secondary" data-scenario="doc_illegible">Illegible document</button>
<button type="button" class="btn btn-secondary" data-scenario="doc_incomplete">Incomplete document</button>
<button type="button" class="btn btn-secondary" data-scenario="urgent">Urgent situation</button>
<button type="button" class="btn btn-secondary" data-scenario="limit">Request for a definitive conclusion</button>
<button type="button" class="btn btn-secondary" data-scenario="nosources">No suitable sources</button>
<button type="button" class="btn btn-secondary" data-scenario="error">Error while answering</button>
</div>
<h2>Frequently asked questions</h2>
<p><strong>Are the answers reliable?</strong> They are based on excerpts from official sources and show where they came from, but the explanation is written by AI and can be wrong. Check the cited articles before deciding.</p>
<p><strong>Are my documents kept?</strong> No. They are sent to generate the answer and are not kept on the server. Only the file name stays in the browser. See the Privacy page.</p>
<p><strong>Can I use another language?</strong> Yes, the interface and answers can be in English. Change the language in Settings. The law covered remains Brazilian.</p>`
      }
    }
  }
};

/* Países e regiões. Nomes por idioma; listas de regiões apenas onde fazem diferença para a resposta. */
window.ROSS_GEO = {
  countries: [
    { code: 'BR', name: { 'pt-BR': 'Brasil', en: 'Brazil' }, regions: 'BR' },
    { code: 'PT', name: { 'pt-BR': 'Portugal', en: 'Portugal' } },
    { code: 'US', name: { 'pt-BR': 'Estados Unidos', en: 'United States' }, regions: 'US' },
    { code: 'AR', name: { 'pt-BR': 'Argentina', en: 'Argentina' } },
    { code: 'MX', name: { 'pt-BR': 'México', en: 'Mexico' } },
    { code: 'ES', name: { 'pt-BR': 'Espanha', en: 'Spain' } },
    { code: 'GB', name: { 'pt-BR': 'Reino Unido', en: 'United Kingdom' } },
    { code: 'OTHER', name: { 'pt-BR': 'Outro país', en: 'Other country' } }
  ],
  regions: {
    BR: [
      ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
      ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
      ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
      ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
      ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
      ['SE', 'Sergipe'], ['TO', 'Tocantins']
    ],
    US: [
      ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'],
      ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'],
      ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
      ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'],
      ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'],
      ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
      ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
      ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'],
      ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
      ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming']
    ]
  }
};
