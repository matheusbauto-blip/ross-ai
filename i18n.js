/* ROSS AI — textos da interface (pt-BR e en).
   Para adicionar um idioma, copie um bloco e traduza. A chave do idioma segue BCP 47. */
window.ROSS_I18N = {
  'pt-BR': {
    langName: 'Português (Brasil)',
    tagline: 'Informação jurídica, em linguagem simples.',
    taglineAlt: 'Legal information, made clear.',
    home: {
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
      oficialNotice: 'Fontes oficiais: {n} normas federais com texto do Planalto, capturado em {date}. A explicação em linguagem simples é gerada por IA; confira sempre os artigos citados.',
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
      oficialBanner: 'Baseado em trechos do texto oficial (Planalto), capturados em {date}. A explicação é gerada por IA e deve ser conferida nos artigos citados.'
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
      official: 'Texto oficial · Planalto',
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
      generic: 'Algo deu errado ao preparar a resposta. Tente novamente em instantes.',
      not_granted: 'O Modo IA não foi autorizado neste navegador. A resposta não foi gerada. Você pode permitir no menu de permissões do artifact ou desativar o Modo IA nas configurações.',
      rate_limited: 'O Modo IA atingiu o limite de uso por agora. Tente mais tarde ou use o modo de demonstração.',
      cancelled: 'Resposta cancelada.',
      invalid_json: 'O modelo respondeu em um formato inesperado. Tente novamente.',
      images_unavailable: 'Este ambiente não permite enviar imagens ao modelo. Cole o texto do trecho na mensagem.',
      image_rejected: 'Uma das imagens não foi aceita pelo modelo. Tente outro formato ou tamanho.',
      unavailable: 'O Modo IA não está disponível neste ambiente. A resposta foi gerada no modo de demonstração.',
      law_fetch: 'Não foi possível carregar o texto da norma. Verifique a conexão e tente novamente.',
      catalog_unavailable: 'A base de leis não está carregada neste ambiente.'
    },
    attachModal: {
      title: 'Antes de anexar',
      body: 'Documentos costumam conter dados pessoais, como nome, CPF, endereço e valores. Anexe apenas o que for necessário para a sua pergunta.',
      demoLine: 'Nesta versão de demonstração, o arquivo não é enviado a nenhum servidor nem lido pelo sistema. Apenas o nome, o tamanho e o tipo ficam no histórico local deste navegador.',
      aiLine: 'Quando a explicação por IA está ativa (dentro do claude.ai), imagens anexadas são enviadas ao modelo pela sua conta, apenas para gerar a resposta. Arquivos PDF não são lidos nesta versão.',
      cancel: 'Cancelar',
      confirm: 'Anexar',
      tooLarge: 'acima de 20 MB. Escolha um arquivo menor.',
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
      aiUnavailable: 'Indisponível neste ambiente. O Modo IA funciona quando o aplicativo é aberto dentro do claude.ai.',
      aiOn: 'Ativado',
      aiOff: 'Desativado',
      data: 'Seus dados',
      dataHelp: 'Conversas, nomes de anexos e avaliações ficam apenas neste navegador.',
      deleteAll: 'Apagar todas as conversas',
      deleteAllConfirm: 'Apagar todas as conversas e registros de anexos deste navegador? Isso não pode ser desfeito.',
      deleted: 'Todas as conversas foram apagadas.',
      about: 'Sobre',
      aboutText: 'ROSS AI, versão de demonstração 0.1. Fontes fictícias, sem conexão com bases jurídicas reais.',
      count: '{n} conversa(s) armazenada(s).',
      mode: 'Modo de resposta',
      modeHelp: 'Fontes oficiais usa o texto das normas capturado do Planalto e explica com IA. Demonstração usa fontes fictícias. IA sem fontes gera respostas gerais, marcadas como não verificadas.',
      modeOficial: 'Fontes oficiais',
      modeDemo: 'Demonstração',
      modeAI: 'IA sem fontes',
      oficialNote: 'Base com {n} normas federais, capturadas em {date}.',
      oficialNoAI: 'Neste ambiente a explicação por IA não está disponível; as respostas mostram os trechos oficiais encontrados.',
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
      types: { lei: 'Lei', portaria: 'Portaria', pagina: 'Página oficial', projeto: 'Projeto de lei', constituicao: 'Constituição', decreto: 'Decreto', 'decreto-lei': 'Decreto-Lei' },
      official: 'Fontes oficiais',
      officialIntro: 'Fonte do texto: {source}. Índice: {index}. {n} normas federais, capturadas em {date}. Cada norma guarda o hash do texto bruto, a data da captura e o histórico de versões.',
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
      empty: 'Não encontrei, nas normas da base, trechos que tratem diretamente disso. Prefiro dizer isso a arriscar uma resposta.',
      emptyQuestions: ['Sobre qual tema é a dúvida: consumo, trabalho, moradia, família, dados pessoais ou outro?', 'Há alguma lei, contrato ou documento específico envolvido?'],
      emptyStep: 'Reformule com mais detalhes ou cite a norma, se souber qual é.',
      noAI: 'Encontrei estes trechos nas fontes oficiais. A explicação em linguagem simples usa IA e só funciona com o ROSS AI aberto dentro do claude.ai; aqui mostro o texto oficial para você conferir.',
      noAIWarn: 'Trechos selecionados por busca de palavras no texto oficial. Leia o artigo completo no link antes de concluir.'
    },
    pages: {
      privacy: {
        title: 'Privacidade',
        updated: 'Atualizado em 12 de novembro de 2026. Versão de demonstração.',
        html: `
<h2>Em resumo</h2>
<p>O ROSS AI pede apenas o necessário para responder. Nesta versão de demonstração, tudo o que você escreve fica armazenado somente neste navegador. Nada é enviado a servidores do ROSS AI.</p>
<h2>O que fica armazenado</h2>
<ul>
<li>O texto das suas perguntas e das respostas.</li>
<li>O nome, o tamanho e o tipo dos arquivos anexados. O conteúdo dos arquivos não é armazenado.</li>
<li>Suas preferências: idioma, aparência, jurisdição e Modo IA.</li>
<li>Suas avaliações de respostas (útil ou não útil).</li>
</ul>
<p>Esses dados ficam no armazenamento local do navegador (localStorage). Eles não saem do seu dispositivo e não são lidos por outras pessoas que abrirem este aplicativo.</p>
<h2>Documentos anexados</h2>
<p>Antes de anexar, avisamos que documentos podem conter dados pessoais e você pode cancelar. No modo de demonstração, o arquivo não é lido nem enviado a lugar nenhum. Quando a explicação por IA está ativa (modos Fontes oficiais e IA, dentro do claude.ai), a pergunta, os trechos de lei selecionados e as imagens anexadas são enviados ao modelo pela sua própria conta, apenas para gerar a resposta, e não são publicados nem exibidos em páginas públicas.</p>
<h2>Como apagar</h2>
<ul>
<li>Cada conversa pode ser apagada no menu, na lista de conversas anteriores.</li>
<li>Em Configurações, é possível apagar todas as conversas de uma vez.</li>
<li>Limpar os dados de navegação do seu navegador também remove tudo.</li>
</ul>
<h2>O que não fazemos</h2>
<ul>
<li>Não vendemos nem compartilhamos dados.</li>
<li>Não exibimos documentos privados em páginas públicas.</li>
<li>Não usamos seus documentos para treinar modelos.</li>
<li>Não pedimos dados além dos necessários para responder.</li>
</ul>
<h2>Versão futura</h2>
<p>Quando o ROSS AI passar a guardar conversas em servidores, esta página será atualizada antes da mudança, explicando onde os dados ficam, por quanto tempo e como pedir a exclusão.</p>
<h2>Contato</h2>
<p>Dúvidas sobre privacidade: <span class="mono">privacidade@exemplo.invalid</span> (endereço fictício de demonstração).</p>`
      },
      terms: {
        title: 'Termos de uso',
        updated: 'Atualizado em 12 de novembro de 2026. Versão de demonstração.',
        html: `
<h2>O que é o ROSS AI</h2>
<p>O ROSS AI é uma ferramenta de informação e compreensão jurídica. Ele explica leis, contratos e documentos em linguagem simples, aponta as fontes consultadas e avisa quando a resposta depende de análise profissional.</p>
<p>O ROSS AI não é um escritório de advocacia, não presta consultoria jurídica e não cria relação entre advogado e cliente.</p>
<h2>O que o serviço não faz</h2>
<ul>
<li>Não garante resultados. Ninguém pode prometer que uma ação será ganha ou perdida.</li>
<li>Não afirma que uma cláusula é definitivamente válida ou inválida, nem que um processo certamente cabe.</li>
<li>Não substitui advogados, defensores públicos, sindicatos ou órgãos públicos.</li>
<li>Não impede processos nem cumpre prazos por você.</li>
</ul>
<h2>Fontes e versão de demonstração</h2>
<p>Cada resposta jurídica deve indicar as fontes consultadas, com jurisdição, data e situação (vigente, histórica, projeto de lei ou não confirmada). Nesta versão de demonstração, as fontes são fictícias e as respostas são identificadas como demonstração. Respostas do Modo IA são geradas sem consulta a fontes oficiais e vêm marcadas como não verificadas.</p>
<h2>Uso adequado</h2>
<ul>
<li>Confira as fontes antes de tomar decisões.</li>
<li>Em situações urgentes, procure atendimento profissional ou o órgão competente sem demora.</li>
<li>Anexe apenas documentos que você tem o direito de usar e evite dados de terceiros desnecessários.</li>
</ul>
<h2>Responsabilidade</h2>
<p>As respostas podem conter erros ou estar desatualizadas. As decisões tomadas com base nelas são de responsabilidade de quem as toma. Recomendamos buscar orientação profissional para avaliações personalizadas.</p>
<h2>Alterações</h2>
<p>Estes termos podem mudar. A data no topo indica a versão em vigor.</p>
<h2>Contato</h2>
<p><span class="mono">contato@exemplo.invalid</span> (endereço fictício de demonstração).</p>`
      },
      help: {
        title: 'Ajuda',
        updated: 'Guia rápido da versão de demonstração.',
        html: `
<h2>Como perguntar</h2>
<ul>
<li>Escreva com suas palavras. Não precisa usar termos técnicos.</li>
<li>Diga o país e, se souber, o estado. As regras mudam conforme o lugar e a data.</li>
<li>Se a dúvida for sobre um trecho, cole o texto ou anexe o documento.</li>
</ul>
<h2>Como anexar documentos</h2>
<p>Use o clipe no campo de mensagem para anexar PDFs ou imagens. Antes do envio, você verá um aviso sobre dados pessoais e poderá cancelar. O nome do arquivo aparece acima da mensagem e pode ser removido.</p>
<h2>Como ler a resposta</h2>
<ol>
<li><strong>Em resumo</strong>: a resposta direta.</li>
<li><strong>O que as fontes dizem</strong>: os trechos relevantes explicados.</li>
<li><strong>O que depende da situação</strong>: fatos ou documentos que podem mudar a resposta.</li>
<li><strong>Fontes consultadas</strong>: norma ou página, artigo e link, com a situação de cada texto.</li>
<li><strong>Próximos passos</strong>: opções informativas e neutras.</li>
</ol>
<h2>Os selos</h2>
<ul>
<li><strong>Vigente</strong>: texto em vigor na data da verificação.</li>
<li><strong>Texto histórico</strong>: redação anterior, que pode valer para fatos antigos.</li>
<li><strong>Projeto de lei</strong>: proposta sem efeito até ser aprovada.</li>
<li><strong>Não confirmada</strong>: informação sem fonte oficial conferida.</li>
<li><strong>Fontes oficiais</strong>: trechos do texto oficial do Planalto, com link para conferir.</li>
<li><strong>Demonstração</strong>: resposta com fontes fictícias.</li>
<li><strong>Modo IA</strong>: resposta gerada por IA sem fontes verificadas.</li>
</ul>
<h2>Limites</h2>
<p>O ROSS AI informa e ajuda a entender. Ele não avalia chances, não define estratégia e não substitui um profissional. Quando um pedido passa desse limite, a resposta explica o motivo e indica onde procurar ajuda.</p>
<h2>Cenários de demonstração</h2>
<p>Veja como o ROSS AI se comporta em cada situação. Cada botão abre uma nova conversa.</p>
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
<p><strong>As respostas são confiáveis?</strong> Nesta demonstração, não: as fontes são fictícias e servem para mostrar a experiência. Na versão conectada a fontes reais, cada resposta mostra links e referências para você conferir.</p>
<p><strong>Meus documentos ficam guardados?</strong> Não. Apenas o nome do arquivo fica no histórico local do navegador. Veja a página de Privacidade.</p>
<p><strong>Posso usar em outro idioma?</strong> Sim. Mude o idioma em Configurações.</p>`
      }
    }
  },

  'en': {
    langName: 'English',
    tagline: 'Legal information, made clear.',
    taglineAlt: 'Informação jurídica, em linguagem simples.',
    home: {
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
      oficialNotice: 'Official sources: {n} Brazilian federal laws with text from Planalto, captured on {date}. The plain-language explanation is generated by AI; always check the cited articles.',
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
      oficialBanner: 'Based on excerpts of the official text (Planalto), captured on {date}. The explanation is generated by AI and should be checked against the cited articles.'
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
      official: 'Official text · Planalto',
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
      generic: 'Something went wrong while preparing the answer. Try again in a moment.',
      not_granted: 'AI mode was not allowed in this browser, so no answer was generated. You can allow it in the artifact permissions menu or turn AI mode off in settings.',
      rate_limited: 'AI mode reached its usage limit for now. Try later or use the demonstration mode.',
      cancelled: 'Answer cancelled.',
      invalid_json: 'The model replied in an unexpected format. Try again.',
      images_unavailable: 'This environment cannot send images to the model. Paste the text of the excerpt instead.',
      image_rejected: 'One of the images was not accepted by the model. Try another format or size.',
      unavailable: 'AI mode is not available in this environment. The answer was generated in demonstration mode.',
      law_fetch: 'The law text could not be loaded. Check the connection and try again.',
      catalog_unavailable: 'The law base is not loaded in this environment.'
    },
    attachModal: {
      title: 'Before attaching',
      body: 'Documents often contain personal data such as names, ID numbers, addresses and amounts. Attach only what your question needs.',
      demoLine: 'In this demonstration version the file is not sent to any server and is not read by the system. Only its name, size and type stay in this browser’s local history.',
      aiLine: 'When the AI explanation is active (inside claude.ai), attached images are sent to the model through your account, only to generate the answer. PDF files are not read in this version.',
      cancel: 'Cancel',
      confirm: 'Attach',
      tooLarge: 'over 20 MB. Choose a smaller file.',
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
      aiUnavailable: 'Unavailable in this environment. AI mode works when the app is opened inside claude.ai.',
      aiOn: 'On',
      aiOff: 'Off',
      data: 'Your data',
      dataHelp: 'Conversations, attachment names and ratings stay in this browser only.',
      deleteAll: 'Delete all conversations',
      deleteAllConfirm: 'Delete all conversations and attachment records from this browser? This cannot be undone.',
      deleted: 'All conversations were deleted.',
      about: 'About',
      aboutText: 'ROSS AI, demonstration version 0.1. Fictional sources, no connection to real legal databases.',
      count: '{n} conversation(s) stored.',
      mode: 'Answer mode',
      modeHelp: 'Official sources uses the law text captured from Planalto and explains it with AI. Demonstration uses fictional sources. AI without sources gives general answers, marked as unverified.',
      modeOficial: 'Official sources',
      modeDemo: 'Demonstration',
      modeAI: 'AI without sources',
      oficialNote: 'Base with {n} federal laws, captured on {date}.',
      oficialNoAI: 'In this environment the AI explanation is unavailable; answers show the official excerpts found.',
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
      types: { lei: 'Law', portaria: 'Regulation', pagina: 'Official page', projeto: 'Bill', constituicao: 'Constitution', decreto: 'Decree', 'decreto-lei': 'Decree-Law' },
      official: 'Official sources',
      officialIntro: 'Text source: {source}. Index: {index}. {n} federal laws, captured on {date}. Each law keeps the raw text hash, the capture date and the version history.',
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
      empty: 'I did not find, in the laws of this base, excerpts that deal directly with this. I would rather say so than risk an answer.',
      emptyQuestions: ['What is the question about: consumer, work, housing, family, personal data or other?', 'Is there a specific law, contract or document involved?'],
      emptyStep: 'Rephrase with more detail or name the law, if you know which one.',
      noAI: 'I found these excerpts in the official sources. The plain-language explanation uses AI and only works with ROSS AI opened inside claude.ai; here I show the official text for you to check.',
      noAIWarn: 'Excerpts selected by word search in the official text. Read the full article at the link before concluding.'
    },
    pages: {
      privacy: {
        title: 'Privacy',
        updated: 'Updated 12 November 2026. Demonstration version.',
        html: `
<h2>In short</h2>
<p>ROSS AI asks only for what it needs to answer. In this demonstration version, everything you write is stored only in this browser. Nothing is sent to ROSS AI servers.</p>
<h2>What is stored</h2>
<ul>
<li>The text of your questions and the answers.</li>
<li>The name, size and type of attached files. File contents are not stored.</li>
<li>Your preferences: language, appearance, jurisdiction and AI mode.</li>
<li>Your ratings of answers (helpful or not helpful).</li>
</ul>
<p>This data lives in the browser’s local storage (localStorage). It does not leave your device and is not read by other people who open this app.</p>
<h2>Attached documents</h2>
<p>Before attaching, we warn that documents may contain personal data and you can cancel. In demonstration mode the file is neither read nor sent anywhere. When the AI explanation is active (Official sources and AI modes, inside claude.ai), the question, the selected law excerpts and attached images are sent to the model through your own account, only to generate the answer, and are never published or shown on public pages.</p>
<h2>How to delete</h2>
<ul>
<li>Each conversation can be deleted from the menu, in the list of previous conversations.</li>
<li>In Settings you can delete all conversations at once.</li>
<li>Clearing your browser’s site data also removes everything.</li>
</ul>
<h2>What we do not do</h2>
<ul>
<li>We do not sell or share data.</li>
<li>We do not show private documents on public pages.</li>
<li>We do not use your documents to train models.</li>
<li>We do not ask for data beyond what the answer needs.</li>
</ul>
<h2>Future version</h2>
<p>When ROSS AI starts keeping conversations on servers, this page will be updated before the change, explaining where data lives, for how long, and how to request deletion.</p>
<h2>Contact</h2>
<p>Privacy questions: <span class="mono">privacy@example.invalid</span> (fictional demonstration address).</p>`
      },
      terms: {
        title: 'Terms of use',
        updated: 'Updated 12 November 2026. Demonstration version.',
        html: `
<h2>What ROSS AI is</h2>
<p>ROSS AI is a tool for legal information and understanding. It explains laws, contracts and documents in plain words, points to the sources consulted and says when an answer depends on professional review.</p>
<p>ROSS AI is not a law firm, does not provide legal advice and does not create a lawyer-client relationship.</p>
<h2>What the service does not do</h2>
<ul>
<li>It does not guarantee outcomes. Nobody can promise a case will be won or lost.</li>
<li>It does not state that a clause is definitely valid or invalid, or that a lawsuit certainly applies.</li>
<li>It does not replace lawyers, public defenders, unions or public bodies.</li>
<li>It does not prevent lawsuits or meet deadlines for you.</li>
</ul>
<h2>Sources and demonstration version</h2>
<p>Each legal answer should indicate the sources consulted, with jurisdiction, date and status (in force, historical, bill or unconfirmed). In this demonstration version the sources are fictional and answers are labelled as demonstrations. AI mode answers are generated without consulting official sources and are marked as unverified.</p>
<h2>Proper use</h2>
<ul>
<li>Check the sources before making decisions.</li>
<li>In urgent situations, seek professional help or the competent authority without delay.</li>
<li>Attach only documents you have the right to use and avoid unnecessary third-party data.</li>
</ul>
<h2>Responsibility</h2>
<p>Answers may contain errors or be out of date. Decisions made on their basis are the responsibility of whoever makes them. We recommend professional guidance for personalised assessments.</p>
<h2>Changes</h2>
<p>These terms may change. The date at the top indicates the version in effect.</p>
<h2>Contact</h2>
<p><span class="mono">contact@example.invalid</span> (fictional demonstration address).</p>`
      },
      help: {
        title: 'Help',
        updated: 'Quick guide to the demonstration version.',
        html: `
<h2>How to ask</h2>
<ul>
<li>Write in your own words. No technical terms needed.</li>
<li>Say the country and, if you know it, the state. Rules change with place and date.</li>
<li>If the question is about an excerpt, paste the text or attach the document.</li>
</ul>
<h2>How to attach documents</h2>
<p>Use the paper clip in the message box to attach PDFs or images. Before sending, you see a notice about personal data and can cancel. The file name appears above the message and can be removed.</p>
<h2>How to read the answer</h2>
<ol>
<li><strong>In short</strong>: the direct answer.</li>
<li><strong>What the sources say</strong>: the relevant excerpts explained.</li>
<li><strong>What depends on the situation</strong>: facts or documents that may change the answer.</li>
<li><strong>Sources consulted</strong>: law or page, article and link, with each text’s status.</li>
<li><strong>Next steps</strong>: informative, neutral options.</li>
</ol>
<h2>The labels</h2>
<ul>
<li><strong>In force</strong>: text in effect on the verification date.</li>
<li><strong>Historical text</strong>: earlier wording, which may apply to older facts.</li>
<li><strong>Bill</strong>: a proposal with no effect until approved.</li>
<li><strong>Unconfirmed</strong>: information without a checked official source.</li>
<li><strong>Official sources</strong>: excerpts of the official Planalto text, with a link to check.</li>
<li><strong>Demonstration</strong>: answer with fictional sources.</li>
<li><strong>AI mode</strong>: answer generated by AI without verified sources.</li>
</ul>
<h2>Limits</h2>
<p>ROSS AI informs and helps you understand. It does not assess chances, define strategy or replace a professional. When a request crosses that line, the answer explains why and points to where to find help.</p>
<h2>Demonstration scenarios</h2>
<p>See how ROSS AI behaves in each situation. Each button opens a new conversation.</p>
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
<p><strong>Are the answers reliable?</strong> Not in this demonstration: the sources are fictional and exist to show the experience. In the version connected to real sources, every answer shows links and references for you to check.</p>
<p><strong>Are my documents kept?</strong> No. Only the file name stays in the browser’s local history. See the Privacy page.</p>
<p><strong>Can I use another language?</strong> Yes. Change the language in Settings.</p>`
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
