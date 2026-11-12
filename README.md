# ROSS AI

Informação jurídica, em linguagem simples. / Legal information, made clear.

Protótipo de interface, sem backend.

## Como rodar

`index.html` é o conteúdo da página sem o esqueleto HTML (ele é adicionado ao publicar como artifact no claude.ai).
Para abrir localmente, use `preview.html`, que embrulha o mesmo conteúdo, servido por um servidor estático:

```bash
python3 -m http.server 8765
```

Depois acesse http://localhost:8765/preview.html. Se alterar `index.html`, regenere o wrapper:

```bash
{ printf '%s\n' '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>'; cat index.html; printf '%s\n' '</body></html>'; } > preview.html
```

## Arquivos

- `index.html` — casca da página (barra, drawer, área principal, modais, toasts).
- `styles.css` — tokens de cor (claro e escuro), tipografia e componentes.
- `i18n.js` — textos da interface em pt-BR e en, páginas de Privacidade, Termos e Ajuda, países e regiões.
- `demo-data.js` — base de demonstração: registro de fontes FICTÍCIAS (com versões e fila de conferência) e respostas roteirizadas.
- `app.js` — estado, armazenamento local, telas, renderização das respostas e provedores.

## Provedores de resposta

`app.js` define `providers.demo` (roteirizado, fontes fictícias) e `providers.ai` (capacidade `sample` do visualizador do claude.ai,
sem fontes verificadas). Para conectar um backend real com busca em fontes jurídicas, crie um provedor com a mesma assinatura:

```js
respond({ text, attachments, conv, lang, onStep, signal }) → Promise<answer>
```

O objeto `answer` usa os campos lidos por `answerHTML`: `kind`, `summary`, `sourcesSay[]`, `depends[]`, `sources[]`,
`nextSteps[]`, `questions[]`, `document{}`, `limitNotice{}`, `warnings[]`, `mode`.

## Privacidade no protótipo

Conversas, nomes de anexos e preferências ficam no `localStorage` do navegador. Arquivos não são lidos nem enviados no modo de
demonstração. No Modo IA, imagens anexadas vão ao modelo pela conta da própria pessoa, apenas para gerar a resposta.
