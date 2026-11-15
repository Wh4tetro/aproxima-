/* ============================================================
   DADOS REAIS · lidos do Supabase para o cliente logado

   Faz a mesma coisa que painel-dados-exemplo.js, mas buscando os
   números de verdade. O banco só devolve os dados do negócio de
   quem está logado (regras de RLS em supabase/01-estrutura.sql).
   ============================================================ */
const DADOS_PAINEL = (function () {
  const cache = {}; // guarda o resultado de cada período para não buscar de novo

  function paraData(texto) { // "2026-11-15" → data local (sem pular de dia pelo fuso)
    const p = texto.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function converter(bruto, n) {
    const todos = (bruto.dias || []).map(function (d) {
      return { data: paraData(d.dia), visitas: d.visitas, nfc: d.nfc, whatsapp: d.whatsapp };
    });
    const atual = todos.slice(-n), anterior = todos.slice(0, -n);
    const soma = function (lista, campo) { return lista.reduce(function (t, d) { return t + d[campo]; }, 0); };
    // Horários: mostra só da primeira à última hora com movimento
    let horas = (bruto.horas || []).filter(function (h) { return h.visitas > 0; });
    if (horas.length) {
      const ini = horas[0].hora, fim = horas[horas.length - 1].hora;
      horas = bruto.horas.filter(function (h) { return h.hora >= ini && h.hora <= fim; });
    }
    return {
      dias: atual,
      visitas: soma(atual, "visitas"),
      visitasAntes: soma(anterior, "visitas"),
      nfc: soma(atual, "nfc"),
      whatsapp: soma(atual, "whatsapp"),
      whatsappAntes: soma(anterior, "whatsapp"),
      itens: bruto.itens || [],
      horas: horas
    };
  }

  return {
    negocio: "",
    exemplo: false,

    // Confere o login. Sem login, volta para a tela de entrar.
    iniciar: async function () {
      if (!supabaseCliente) throw new Error("config");
      const { data } = await supabaseCliente.auth.getSession();
      if (!data.session) {
        location.replace("entrar.html");
        return new Promise(function () {}); // para tudo enquanto troca de página
      }
      const r = await supabaseCliente.from("negocios").select("nome").limit(1);
      if (r.error) throw r.error;
      if (!r.data.length) throw new Error("sem-negocio");
      this.negocio = r.data[0].nome;
    },

    periodo: async function (n) {
      if (!cache[n]) {
        const { data, error } = await supabaseCliente.rpc("resumo_painel", { p_dias: n });
        if (error) throw error;
        cache[n] = converter(data, n);
      }
      return cache[n];
    },

    sair: async function () {
      await supabaseCliente.auth.signOut();
      location.replace("entrar.html");
    }
  };
})();
