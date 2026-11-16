# Acervo brasileiro: fontes gratuitas e acesso verificado

Pesquisa realizada em 16/11/2026. O objetivo é ampliar a biblioteca consultável do ROSS além das 66 normas locais e dos 235 registros do repositório atualmente indexados. Este documento registra a pesquisa e as medições; não representa uma importação ou integração já ativada.

## Custo e escolha das fontes

O LexML não é um serviço comercial de assinatura: sua documentação estabelece consulta e referência gratuitas. Ele reúne metadados e links para o inteiro teor em instituições federais, estaduais, distritais e municipais. Um resultado de catálogo não substitui a leitura do artigo nem confirma, por si, a redação aplicável.

Também há fontes públicas e repositórios abertos que podem ser usados para formar um acervo próprio. O acesso gratuito às fontes não elimina custos de armazenamento, processamento, manutenção e geração de respostas por IA. Nenhuma API paga foi contratada nesta pesquisa.

| Fonte | Utilidade | Resultado da verificação |
| --- | --- | --- |
| `ctresb/leis` | Textos em Markdown, com identificação e procedência; abrange diferentes esferas e categorias | Um texto real foi recuperado no GitHub com HTTP 200, a partir de commit fixo. É a fonte mais prática entre as testadas para copiar textos e criar um índice próprio. Possui lacunas, textos históricos e pendências de conversão. |
| API de legislação do Senado | Identificar normas federais por tipo, número e ano; obter ementa, identificação e relações com outras normas | Rotas atuais retornaram HTTP 200 e JSON. O endpoint antigo inicialmente testado retornou 404; a rota correta foi localizada no Swagger oficial. Os dados obtidos são identificação/metadados, não uma transcrição completa presumida dos artigos. |
| LexML | Pesquisa ampla e descoberta de fontes oficiais em diferentes esferas | A consulta SRU testada retornou HTML de verificação de segurança, embora o status fosse 200. Não foi tratada como resultado de pesquisa, e o desafio não foi contornado. |
| Vade Mecum do Senado | Compilação oficial para complementar uma coleção dos principais códigos e estatutos | A Biblioteca Digital oferece PDF e EPUB, edição atualizada até julho de 2026. Não contém todas as leis brasileiras nem substitui as atualizações posteriores. |
| Planalto e Câmara | Conferir publicações e redações na fonte responsável | O texto atualizado da Câmara testado retornou 403 neste ambiente. O novo domínio do Portal da Legislação não foi alcançado no teste; isso não estabelece indisponibilidade geral para usuários. |
| `Evaldoes/legislacao-br` | Organização por artigo e metadados úteis para processamento | O README consultado lista cinco normas disponíveis e outras planejadas, sem legislação estadual ou municipal. É uma referência de estrutura, não uma alternativa suficiente para a ampliação nacional. |

## Testes reproduzíveis

Requisições públicas GET, sem autenticação, compra de créditos, alteração de origem ou tentativa de contornar bloqueios:

- Documentação do Senado: `https://legis.senado.leg.br/dadosabertos/api-docs/swagger-ui/index.html`.
- Especificação atual: `https://legis.senado.leg.br/dadosabertos/v3/api-docs` — HTTP 200.
- Pesquisa: `https://legis.senado.leg.br/dadosabertos/legislacao/lista?tipo=LCP&numero=142&ano=2013&v=3` — HTTP 200, JSON identificando a Lei Complementar 142/2013.
- Detalhes: `https://legis.senado.leg.br/dadosabertos/legislacao/LEI/14133/2021?v=3` — HTTP 200, JSON com identificação, ementa, publicações e relações.
- Texto no acervo: `https://raw.githubusercontent.com/ctresb/leis/c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6/federal/leis-complementares/2013/lcp-142-2013-05-08.md` — HTTP 200, Markdown com frontmatter e texto.
- LexML: `https://www.lexml.gov.br/busca/SRU?operation=searchRetrieve&version=1.1&query=%22seguro+rural%22&maximumRecords=3` — HTTP 200, porém página de segurança em HTML, sem registros SRU válidos.

A API de Dados Abertos da Câmara também respondeu. Seu catálogo consultado não expõe uma rota dedicada de legislação por tipo/número/ano. Serviços de proposições não devem ser tratados automaticamente como uma biblioteca de leis aprovadas.

## Medição do texto disponível

Foi medida a cópia esparsa já existente do commit `c9f21b4ab11aa0d7ca6fe861d75028e94219c2d6`, sem baixar o restante do repositório:

| Conteúdo medido | Resultado |
| --- | ---: |
| Arquivos Markdown disponíveis na pasta federal | 29.615 |
| Texto sem compressão | 176.243.408 bytes, aproximadamente 176 MB |
| Soma dos arquivos comprimidos individualmente com gzip, nível 6 | 58.873.827 bytes, aproximadamente 59 MB |

Essa medição não inclui histórico do Git, PDFs originais, outras esferas, índices de busca ou cópias de segurança. Arquivos não equivalem necessariamente a normas vigentes e únicas. Não é uma estimativa do tamanho de toda a legislação brasileira e não significa que esses textos já estejam conectados ao ROSS.

O relatório `PROGRESSO.md` consultado no repositório informa 1.201.847 documentos, em relatório gerado em 28/10/2026, e reconhece pendências e cobertura incompleta. A quantidade do relatório não foi apresentada como um total de todas as leis existentes no Brasil.

## Caminho de implementação

1. Manter uma versão própria dos textos abertos e um manifesto com identidade, fonte, esfera, localidade, versão, data de captura e hash. Conservar os textos por blocos comprimidos, sem colocar todo o acervo no carregamento inicial do aplicativo.
2. Criar um índice pesquisável de títulos, ementas e artigos. A recuperação precisa considerar assunto, número, ano, estado/município e o contexto da conversa. Um catálogo de nomes não basta para explicar direitos a partir do texto.
3. Ler os artigos candidatos e entregar à IA apenas os trechos pertinentes, com referência rastreável. Distinguir normas, proposições, jurisprudência, redações históricas, atos revogados e textos parciais.
4. Usar a API atual do Senado e fontes responsáveis para identificação e conferência. Usar o LexML como complemento de descoberta quando o serviço devolver registros válidos; uma falha externa não deve apagar a biblioteca própria.
5. Acrescentar as demais esferas por lotes, com indicadores reais de cobertura. Reavaliar atualizações e manter as versões anteriores identificadas. A integração continua limitada ao Brasil nesta etapa.

## Referências

- [LexML: apresentação e princípio de gratuidade](https://projeto.lexml.gov.br/documentacao/Apresentacao.pdf/at_download/file).
- [LexML: descrição dos metadados e da pesquisa](https://projeto.lexml.gov.br/documentacao/faq).
- [Senado: catálogo de serviços de legislação](https://www12.senado.leg.br/dados-abertos/legislativo/legislacao).
- [Repositório ctresb/leis](https://github.com/ctresb/leis) e [relatório de progresso](https://github.com/ctresb/leis/blob/main/PROGRESSO.md).
- [Vade Mecum do Senado, quarta edição de 2026](https://www2.senado.leg.br/bdsf/handle/id/961972).
- [Câmara: gratuidade dos dados abertos](https://dadosabertos.camara.leg.br/faq/faq-home.html).
- [Planalto: acesso e reprodução do conteúdo](https://www4.planalto.gov.br/legislacao/servicos/pesquisa-de-legislacao).
- [Repositório Evaldoes/legislacao-br](https://github.com/Evaldoes/legislacao-br).
