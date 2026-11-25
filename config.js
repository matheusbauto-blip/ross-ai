/* ROSS AI — configuração do site publicado.
   apiUrl: endereço da função de backend (Supabase Edge Function) que chama o Google Gemini.
   Dentro do claude.ai a explicação por IA usa a conta de quem abre o artifact; fora dele, usa esta API. */
window.ROSS_CONFIG = {
  apiUrl: 'https://aksilqskpplfwmcrapcu.supabase.co/functions/v1/ross-ai',
  /* Índice estático de todo o repositório ctresb/leis (edição fixa), publicado junto com o site:
     títulos, ementas e identificação de cada texto; o texto integral é lido sob demanda com conferência de hash. */
  indexUrl: 'https://matheusbauto-blip.github.io/ross-ai/index/'
};
