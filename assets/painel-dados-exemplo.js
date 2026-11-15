/* ============================================================
   DADOS FICTÍCIOS · Lanchonete Exemplo (para demonstração)

   Este arquivo INVENTA os números do painel. Ele usa um sorteio
   com "semente fixa": os números parecem reais, mas são sempre
   os mesmos a cada vez que a página abre (bom para apresentações).

   Na Etapa 3, este arquivo será trocado pela leitura dos dados
   reais no Supabase. O desenho do painel (painel.js) continua igual.
   ============================================================ */
const DADOS_PAINEL = (function () {
  // Sorteio com semente fixa
  let semente = 20261115;
  function sorteio() {
    semente = (semente * 16807) % 2147483647;
    return semente / 2147483647;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Visitas típicas por dia da semana (domingo, segunda ... sábado)
  const BASE_DIA = [74, 36, 41, 44, 56, 92, 101];

  // 60 dias: os 30 do período + 30 anteriores, para comparar
  const dias = [];
  for (let i = 59; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const crescimento = 1 + (59 - i) * 0.006; // leve alta ao longo do tempo
    const visitas = Math.round(BASE_DIA[d.getDay()] * crescimento * (0.93 + sorteio() * 0.14));
    dias.push({
      data: d,
      visitas: visitas,
      nfc: Math.round(visitas * (0.31 + sorteio() * 0.08)),
      whatsapp: Math.round(visitas * (0.16 + sorteio() * 0.05))
    });
  }

  // Quanto cada item do cardápio é aberto, em relação às visitas
  const ITENS = [
    ["X-Bacon", 0.43], ["X-Salada", 0.36], ["Batata frita", 0.31],
    ["X-Burger", 0.27], ["Onion rings", 0.16], ["Suco natural", 0.11]
  ];

  // Peso de cada hora do dia (das 10h às 23h): almoço e noite
  const HORAS = { 10: 2, 11: 6, 12: 12, 13: 13, 14: 8, 15: 4, 16: 3, 17: 4, 18: 7, 19: 11, 20: 14, 21: 12, 22: 7, 23: 3 };

  return {
    negocio: "Lanchonete Exemplo",
    exemplo: true,
    // Devolve tudo que o painel precisa para um período (7 ou 30 dias)
    periodo: function (n) {
      const atual = dias.slice(-n);
      const anterior = dias.slice(-2 * n, -n);
      const soma = function (lista, campo) { return lista.reduce(function (t, d) { return t + d[campo]; }, 0); };
      const visitas = soma(atual, "visitas");
      const pesoTotal = Object.values(HORAS).reduce(function (a, b) { return a + b; }, 0);
      return {
        dias: atual,
        visitas: visitas,
        visitasAntes: soma(anterior, "visitas"),
        nfc: soma(atual, "nfc"),
        whatsapp: soma(atual, "whatsapp"),
        whatsappAntes: soma(anterior, "whatsapp"),
        itens: ITENS.map(function (it) { return { nome: it[0], vistas: Math.round(visitas * it[1]) }; }),
        horas: Object.keys(HORAS).map(function (h) {
          return { hora: Number(h), visitas: Math.round(visitas * HORAS[h] / pesoTotal) };
        })
      };
    }
  };
})();
