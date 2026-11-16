# Operação do acervo brasileiro

## Estado da entrega

O backend recebeu a busca ampliada. A interface está preparada para publicação posterior. Não foi publicado um novo site no GitHub Pages. Não existe conta nem painel administrativo autenticado nesta etapa. A operação de importação é exclusivamente técnica e exige uma autorização temporária, com prazo e quantidade de chamadas limitados; usuários comuns não podem importar ou alterar o acervo.

O catálogo ampliado registra 1.218.984 arquivos candidatos em 12.801 diretórios da edição `c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6` do ctresb/leis. A contagem mostrada pelo backend é a conferida no manifesto dessa edição, exibida apenas quando todos os seus diretórios estão presentes. Não equivale a uma contagem de leis vigentes. Há 15.252 textos integrais no banco, inclusive textos parciais e históricos. A pesquisa para explicações exclui documentos marcados como parciais, revogados ou decisões e exige município para normas municipais.

O arquivo separado `ROSS_AI_Acervo_Brasileiro.zip` contém 29.614 textos locais, metadados, catálogo e manifesto de integridade. Foram conferidos contra ele os hashes de todos os 15.252 snapshots que estavam no banco no momento do backup. Os dois arquivos grandes excluídos do importador são relacionados no manifesto. O Código Civil continua disponível no conjunto de referência distribuído com o app. O ZIP não é uma certificação de vigência nem contém todas as normas de todos os municípios.

## Consulta

A conversa continua sendo a entrada principal: a preparação identifica termos e referências, inclusive normas fora do conjunto de 66, e a busca localiza artigos reais. Metadados do Senado são pistas de identificação e não sustentam sozinhos uma explicação de artigos. A cópia própria é preferida a uma nova leitura no GitHub. Leituras externas verificam edição fixa e hash antes de aceitar o conteúdo. Não são enviados ao GitHub a pergunta, anexos ou histórico.

Na pesquisa, o cliente escolhe Legislação, Precedentes do STJ ou Notícias do STJ. Notícia apresenta manchete e link oficial, sem copiar a matéria. Precedentes apresentam o tema, a tese disponível e a situação informada pelo tribunal; não se presume que todo registro esteja julgado, publicado ou seja vinculante. Os filtros territoriais se aplicam à legislação.

## Retomada controlada da carga

1. Confirmar margem de armazenamento e gravação normal no banco antes de qualquer retomada. O banco administrativo entrou em somente leitura; não iniciar outra carga enquanto isso persistir.
2. Preservar `manifest.json`, os lotes gerados e `import-checkpoint.json` em `.corpus-library`. O checkpoint não contém credenciais. Uma repetição é idempotente, mas pode consumir operações e armazenamento temporário.
3. Usar o checkout fixado e o importador `scripts/build-library.mjs`; ele não executa código do repositório de origem nem baixa blobs ausentes. O arquivo de backup pode ser preparado novamente por `scripts/archive-library.py`.
4. Emitir uma nova autorização de operador com segredo aleatório; armazenar somente o hash e passar o valor temporariamente ao importador. Nunca usar a chave de serviço no navegador, no pacote público ou no checkpoint.
5. `scripts/sync-library.mjs` envia até 20 documentos por chamada, aguarda entre lotes e limita a execução padrão a 50 chamadas. Retoma pelo checkpoint. Interrompe imediatamente quando o backend informa banco somente leitura ou capacidade insuficiente.
6. Conferir contagens e amostras reais antes de avançar outro lote; revogar a autorização ao encerrar, ou aguardar sua expiração. Não agendar carga recorrente enquanto não houver monitoramento de capacidade.

## Pendência que exige decisão

A revisão automática rejeitou a proposta de remover trechos duplicados do índice com uma transação de manutenção que permitiria gravação temporária. Essa proposta não foi executada. A tentativa alternativa de CHECKPOINT foi recusada por falta de privilégio. O backup foi posteriormente validado, mas a exclusão não foi repetida.

Para liberar armazenamento sem remover fontes, a proposta é manter os snapshots integrais, substituir o índice de trechos duplicados por um índice compacto e extrair os artigos no momento da consulta. Isso exige preparar e verificar a nova consulta antes da troca, limitar a manutenção aos registros importados nesta carga, testar restauração a partir do backup e conferir a redução real de espaço. Não há script de exclusão automática no pacote entregue. A manutenção aguarda aprovação específica. Tabelas de outros aplicativos devem ser preservadas.

O cache persistente de notícias e precedentes também aguarda a liberação de gravação para criação de sua tabela. Até lá os conectores usam cache temporário em memória e podem reler as fontes após reinício. Não foi contratado nenhum serviço pago.

## Verificação

`node --test --test-concurrency=1 tests/*.test.mjs qa/ui.test.mjs` — 188 testes passaram. Se necessário, prepare o ambiente de DOM com `node qa/prepare-dom.mjs`.

Foram verificadas no backend ativo: contagem do acervo, busca temática, leitura de artigos da LCP 142/2013 fora do conjunto inicial, preparação e explicação por IA com citações válidas, notícias oficiais e recusa de importação sem autorização. Uma análise jurídica abrangente, a cobertura de cada estado e município e a atualização automática de vigência continuam sendo trabalhos próprios.

Os arquivos da entrega estão na pasta local `entrega/`, ignorada pelo Git. A tentativa de atualizar os arquivos disponíveis para download na conversa falhou na transferência; não houve finalização das substituições. A versão anterior do arquivo de publicação permanece disponível na conversa e não contém esta atualização.
