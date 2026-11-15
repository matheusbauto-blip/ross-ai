/* ROSS AI — configuração do site publicado.
   apiUrl: endereço da função de backend (Supabase Edge Function) que chama o Google Gemini.
   Dentro do claude.ai a explicação por IA usa a conta de quem abre o artifact; fora dele, usa esta API. */
window.ROSS_CONFIG = {
  apiUrl: 'https://aksilqskpplfwmcrapcu.supabase.co/functions/v1/ross-ai'
};
