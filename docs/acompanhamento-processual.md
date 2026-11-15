# Acompanhar processo — implementação inicial

O acesso fica no menu dos três traços, em “Acompanhar processo”, e também em `#processos`. A função fica separada da conversa e do planejamento de “Meu caso”.

## Estado da ativação em 15/11/2026

O servidor Supabase `ross-ai` foi atualizado para a **versão 6**, com a operação `process_lookup` ativa. A interface continua preparada para publicação posterior.

Verificação real do servidor após a atualização:

- Número CNJ inválido: HTTP 400, `process_invalid_number`.
- Consulta com número CNJ válido: HTTP 503, `process_not_configured`.
- Estatísticas do acervo: HTTP 200, 235 documentos.

O resultado confirma que o código está ativo e que falta configurar a credencial do fornecedor. Não confirma uma consulta real ao Escavador. Não foi criada ou contratada uma conta no serviço processual.

A etapa externa necessária é obter um token da conta do Escavador e cadastrá-lo diretamente em [Edge Function Secrets do ROSS](https://supabase.com/dashboard/project/aksilqskpplfwmcrapcu/functions/secrets), com o nome `ESCAVADOR_API_TOKEN`. O valor deve ser o token da conta, sem o prefixo `Bearer`. O código adiciona esse prefixo ao enviar a requisição. Não é necessário colocar o segredo no site nem reenviá-lo pela conversa.

Após salvar o segredo, a função consegue lê-lo sem nova implantação. Ainda é necessário verificar uma consulta autorizada com o fornecedor e sua cobertura, custo e atualização.

## Comportamento implementado

- Validação do número CNJ com 20 dígitos e algoritmo Módulo 97 Base 10. A verificação matemática não confirma a existência do processo.
- Consulta de capa e movimentações por número, com tratamento de não encontrado, sigilo, credencial ausente, limite, indisponibilidade e resposta parcial.
- Ficha com partes informadas, tribunal, unidade, classe e assunto quando fornecidos pela fonte. Sem inferir vitória, fase ou situação jurídica a partir de um campo predito.
- Movimentações com texto original, data e fonte; paginação por cursor e remoção de duplicatas.
- Até 20 acompanhamentos locais. Persistem apenas número, sigla do tribunal, data de consulta e identificadores de eventos. Partes e textos de movimentações permanecem somente em memória.
- Consulta automática da ficha acompanhada que estiver aberta, a cada 15 minutos e com a tela visível. Novos identificadores são comparados com a consulta anterior e o resultado aparece na tela.
- Cancelamento ao sair da tela e descarte de respostas atrasadas. Uma consulta de outro número não conserva a ficha do número anterior.
- Nenhum processo é criado no cadastro de casos e nenhuma consulta processual é enviada ao modelo de IA.

Esta implementação não oferece avisos com o navegador fechado, sincronização entre dispositivos ou captura direta em tempo real no tribunal. Não anuncia esses comportamentos na interface. Também não ativa monitoramentos cobrados pelo provedor.

## Integração real

O adaptador inicial é Escavador Business API v2, com os endpoints documentados:

- `GET /api/v2/processos/numero_cnj/{numero}`
- `GET /api/v2/processos/numero_cnj/{numero}/movimentacoes`

Para ativar:

1. Obter uma conta e um token válidos no Escavador, com acesso às consultas de capa e de movimentações. Conferir o contrato, a cobertura e os custos antes de habilitar uso por clientes.
2. Cadastrar `ESCAVADOR_API_TOKEN` nos segredos da função Supabase `ross-ai`. Manter o segredo fora do código e do pacote público.
3. Preparar a função com `index.ts`, `gemini.mjs`, `repository-excerpts.mjs` e `process-provider.mjs`. A nova operação POST é `process_lookup` com `number` e, opcionalmente, `page`.
4. Para o projeto atual, o código do servidor já foi ativado na versão 6. Uma nova implantação só é necessária para alterar o código ou usar outro projeto. A interface preparada continua utilizando a URL de API existente.
5. Testar um processo público autorizado, conferir o número e as datas com a fonte e verificar consulta, paginação, remoção e indisponibilidade.

Sem o segredo, o servidor devolve `process_not_configured`. Uma função antiga sem a nova operação também não atende a consulta. O frontend apresenta indisponibilidade; não interpreta isso como processo inexistente nem gera movimentações fictícias.

O controle de uso existente é exigido para esta operação. Se não puder ser verificado, a consulta ao provedor não é enviada. Endereços de paginação retornados pelo provedor nunca são usados como destinos arbitrários: somente tokens da origem e rota esperadas são aceitos.

## Fonte e atualização

Os dados consultados são os indexados no Escavador, e podem ter atraso em relação ao tribunal. Reconsultar a API não solicita, por si só, uma nova captura no tribunal. A tela mostra separadamente a consulta ao serviço e a última verificação informada pelo provedor. Campos ausentes permanecem sem informação.

Fontes consultadas em 15/11/2026:

- [Consulta de processos — Escavador](https://api.escavador.com/v2/docs/consulta-de-processos)
- [Autenticação e integração — Escavador](https://api.escavador.com/v2/docs/)
- [Numeração única — CNJ](https://www.cnj.jus.br/programas-e-acoes/numeracao-unica/perguntas-frequentes/)

## Evolução posterior

Alertas com o app fechado exigem armazenamento privado vinculado à conta, controle de acesso por cliente, contratação/configuração de monitoramento, recebimento autenticado de callbacks e entrega de notificações. A disponibilidade dessa etapa deve ser identificada separadamente da consulta local. O vínculo com “Meu caso” será opcional quando essa função existir.

Os testes de implementação usam respostas simuladas. As verificações reais do servidor estão registradas no início deste documento. Não foi possível validar uma consulta ao fornecedor sem sua credencial. Não houve contratação do serviço nem publicação da nova interface.
