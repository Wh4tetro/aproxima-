/* ============================================================
   CONFIGURAÇÃO DO SUPABASE (Área do cliente)

   Onde achar: Supabase → seu projeto → botão "Connect" (no topo)
   ou Project Settings → API Keys.

   ✅ PODE ficar aqui (é pública):
      - a URL do projeto            (https://xxxx.supabase.co)
      - a chave "publishable"       (começa com sb_publishable_...)
        ou, em projetos antigos, a chave "anon".
      Ela só deixa o site PEDIR dados; quem decide o que cada um vê
      são as regras de segurança (RLS) que estão dentro do banco.

   ⛔ NUNCA coloque aqui (nem em nenhum arquivo do site):
      - a chave "secret"            (começa com sb_secret_...)
      - a chave "service_role" (projetos antigos)
      - a senha do banco de dados
      Essas passam por cima do RLS e dão acesso total a todos os clientes.
      Tudo o que está nesta pasta fica visível para qualquer pessoa
      quando o site for publicado.
   ============================================================ */
const SUPABASE_CONFIG = {
  url: "",            // ex.: "https://abcdefghijk.supabase.co"
  chavePublica: ""    // ex.: "sb_publishable_..."
};

/* Cria a conexão (só se a configuração estiver preenchida) e
   recusa, por segurança, qualquer chave secreta colada aqui. */
const supabaseCliente = (function () {
  const url = SUPABASE_CONFIG.url.trim();
  const chave = SUPABASE_CONFIG.chavePublica.trim();
  if (!url || !chave) return null;
  function ehSecreta(k) {
    if (/^sb_secret_/.test(k)) return true;
    try { // chaves antigas (JWT): olha se dentro está escrito "service_role"
      return /service_role/.test(atob((k.split(".")[1] || "").replace(/-/g, "+").replace(/_/g, "/")));
    } catch (e) { return false; }
  }
  if (ehSecreta(chave)) {
    console.error("Chave SECRETA detectada em supabase-config.js. Remova agora e use a chave publishable.");
    return null;
  }
  if (!window.supabase) {
    console.error("A biblioteca do Supabase não carregou (sem internet?).");
    return null;
  }
  return window.supabase.createClient(url, chave);
})();
