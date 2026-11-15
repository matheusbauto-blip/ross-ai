# Acompanhar processo — consulta gratuita do DJEN

O acesso fica no menu dos três traços, em “Acompanhar processo”, e em `#processos`. A função fica separada das conversas e do planejamento de “Meu caso”.

## Funcionamento atual

A fonte padrão é a API pública oficial do Diário de Justiça Eletrônico Nacional, mantida pelo CNJ. A integração consulta publicações diretamente, sem contratar o Escavador, sem chave de API e sem chamadas ao Gemini.

O usuário informa o número CNJ de 20 dígitos, com ou sem pontuação. Para quem só tem o CPF, a tela oferece um caminho guiado pelo portal oficial Jus.br, descrito abaixo. A verificação do dígito pelo algoritmo Módulo 97 confirma a integridade da numeração, não a existência do processo.

A tela mostra as publicações retornadas, suas datas de disponibilização, órgão, classe quando informada, texto e link da fonte. Publicação cancelada recebe indicação própria. Um texto abreviado mostra um aviso e mantém o acesso à fonte. As datas não são convertidas automaticamente em prazos jurídicos.

A cobertura é identificada como publicações do DJEN, e não como histórico completo de movimentações ou autos. Uma consulta sem publicações não declara que o processo inexiste. O número pode ser acompanhado para consultas futuras mesmo com resultado vazio.

Até 20 números podem ser acompanhados neste navegador. Persistem somente número, fonte, sigla do tribunal, data da consulta e identificadores de publicações. Partes e textos não são salvos em um cadastro de clientes. A ficha acompanhada que estiver aberta é consultada novamente a cada 15 minutos enquanto a tela estiver visível. Mudanças de fonte ou tentativas repetidas não misturam os contextos. Cancelamentos contam como alterações da publicação.

A etapa atual não oferece avisos com o navegador fechado, sincronização entre dispositivos, busca automática por CPF dentro do ROSS ou acesso a processos sigilosos. “Meu caso” permanece uma função planejada e opcional.

## Localizar pelo CPF no Jus.br

A opção recolhível “Buscar por CPF no portal oficial” abre `https://www.jus.br/` em uma nova aba. O usuário:

1. Entra no portal com sua conta gov.br nível ouro.
2. Abre “Consultar processos”, escolhe “CPF da Parte” e faz a pesquisa.
3. Copia o número CNJ encontrado, volta ao ROSS e consulta as publicações disponíveis. O botão “Já tenho o número” fecha as instruções e coloca o foco no campo correto.

Trata-se de uma consulta externa feita pelo usuário, sem contratação de API pelo ROSS. CPF, senha e códigos não são solicitados pelo atalho nem enviados à API do ROSS. Se forem digitados 11 dígitos no campo de número do processo, o app limpa esse campo e abre as instruções, sem fazer requisição. Uma resposta de consulta anterior não substitui essa orientação.

O manual oficial do Jus.br documenta tanto o acesso do cidadão quanto o filtro de CPF. A abrangência depende dos sistemas conectados e das permissões de acesso; um resultado vazio não constitui certidão negativa. Em 15/11/2026 foram conferidos o manual e o acesso público, que respondeu HTTP 200 e conduziu ao SSO oficial com opção gov.br. Não foi realizada uma busca autenticada usando CPF de cliente.

Essa opção não equivale a uma API nacional gratuita de CPF para aplicativos privados. A documentação do CNJ prevê solicitação e aprovação de credenciais pelo GeCli para APIs do catálogo; autorização, campos disponíveis e condições comerciais precisam ser confirmados para cada serviço antes de uma integração automática. Não são reutilizados tokens de sessão dos usuários para consultas no servidor.

## Servidor e validação real

O servidor Supabase `ross-ai` está ativo na versão 9 (publicada em 15/11/2026, com o controle de uso obrigatório para `prepare` e `answer` e leitura do corpo com limite de bytes). A operação POST `process_lookup` usa DJEN por padrão.

Em 15/11/2026, uma consulta real ao servidor retornou HTTP 200, fonte `CNJ · DJEN`, cobertura `publications` e três publicações correspondentes ao número pesquisado. Os links de certidão e o texto legível também foram conferidos no adaptador real. A validação não dependeu de token do Escavador.

A suíte completa passou com **158 testes**, incluindo validação CNJ, fonte correta, prevenção de mistura de processos, resultado vazio, cancelamento, paginação, cache, limites de uso, entrada pelo menu, isolamento da conversa e orientação de CPF sem envio à API.

O frontend com os avisos e ajustes finais está no pacote atualizado. Preparar o pacote não publica a nova interface.

## Integração e limites

A consulta faz apenas GET ao endpoint público de produção:

`https://comunicaapi.pje.jus.br/api/v1/comunicacao`

Parâmetros: `numeroProcesso`, `pagina` e `itensPorPagina`. Não são utilizados os endpoints de login, inclusão ou cancelamento, exclusivos dos tribunais.

O servidor aceita apenas números válidos e paginação limitada; não recebe um endereço arbitrário para buscar. Publicações retornadas com outro número são rejeitadas. Conteúdo HTML é convertido em texto e escapado na interface.

Há cache de até cinco minutos, compartilhamento de pedidos simultâneos iguais, limite local de chamadas e pausa após HTTP 429. Não há troca de IP ou origem para contornar os controles. O horário original da consulta é preservado no cache. A fonte limita a busca a 10.000 registros; essa limitação é indicada na tela quando aplicável.

O controle de uso do ROSS continua sendo exigido. Uma falha na fonte ou nesse controle é apresentada como indisponibilidade; não gera publicações fictícias nem muda silenciosamente para uma integração paga.

Ao preparar uma nova implantação, incluir `index.ts`, `gemini.mjs`, `repository-excerpts.mjs`, `process-provider.mjs` e `djen-provider.mjs`.

## Integração paga opcional

O adaptador Escavador foi preservado para uma eventual contratação. Só é selecionado quando o operador define `ROSS_PROCESS_SOURCE=escavador` e cadastra `ESCAVADOR_API_TOKEN` no servidor. Ele permanece sujeito às permissões, cobertura e custos da conta. Sem essa seleção, a consulta usa DJEN e não lê dados pelo Escavador.

A API pública DataJud não foi ativada: possui condições próprias de uso, distintas das do DJEN. Não se presume que uma interface pública permita qualquer uso comercial.

## Referências

- [Documentação oficial da API do DJEN](https://comunicaapi.pje.jus.br/swagger/index.html)
- [Especificação OpenAPI oficial](https://comunicaapi.pje.jus.br/swagger/djen.yml)
- [Comunicações processuais — CNJ](https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/comunicacoes-processuais/)
- [Consulta pública do DJEN](https://comunica.pje.jus.br/)
- [Manual oficial do Jus.br — acesso e consulta por CPF](https://docs.pdpj.jus.br/assets/files/Manual_Jusbr-1f633a7a5628a18da9aef7066e3b6dd3.pdf)
- [Perguntas frequentes do Jus.br — conta gov.br nível ouro](https://www.cnj.jus.br/tecnologia-da-informacao-e-comunicacao/justica-4-0/jus-br/perguntas-frequentes/)
- [Tutoriais do CNJ — consulta processual unificada por CPF](https://www.cnj.jus.br/videos-tutoriais-ensinam-a-utilizar-o-portal-jus-br/)
- [GeCli — solicitação de acesso a APIs do CNJ](https://docs.pdpj.jus.br/servicos-negociais/GeCli/)
