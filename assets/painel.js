/* ============================================================
   PAINEL DO CLIENTE · desenha os números e gráficos
   Lê os dados de DADOS_PAINEL (hoje: dados fictícios de exemplo;
   na Etapa 3: dados reais do Supabase) e monta a página.
   Os gráficos são feitos à mão em SVG/HTML: nenhuma biblioteca
   externa, nada para pagar, funciona até sem internet.
   ============================================================ */
(function () {
  // As cores dos gráficos ficam no estilo.css (variáveis --chart-...)
  const estilo = getComputedStyle(document.documentElement);
  const cor = function (nome, reserva) { return estilo.getPropertyValue(nome).trim() || reserva; };
  const COR_DESTAQUE = cor("--chart-accent", "#2EE6A0");   // verde da marca: o dado principal
  const COR_APAGADA = cor("--chart-muted", "#7A6BB8");     // lilás apagado: o resto (contraste conferido)
  const COR_SUPERFICIE = cor("--chart-surface", "#1E1340");
  const COR_GRADE = cor("--chart-grid", "rgba(255,255,255,.10)");
  const COR_MIRA = cor("--chart-cross", "rgba(255,255,255,.45)");
  const SVG = "http://www.w3.org/2000/svg";

  const $ = function (id) { return document.getElementById(id); };
  const num = function (n) { return n.toLocaleString("pt-BR"); };
  const diaCurto = function (d) { return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }); };
  const diaLongo = function (d) { return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" }); };
  function el(tag, attrs, pai) {
    const e = document.createElementNS(SVG, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (pai) pai.appendChild(e);
    return e;
  }

  // ---------- Dica flutuante (tooltip) ----------
  const tip = $("tip");
  function mostrarDica(valor, rotulo, x, y) {
    tip.replaceChildren();
    const b = document.createElement("b");
    b.textContent = valor;
    const s = document.createElement("span");
    s.textContent = rotulo;
    tip.append(b, s);
    tip.hidden = false;
    const w = tip.offsetWidth;
    tip.style.left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8) + "px";
    tip.style.top = Math.max(8, y - tip.offsetHeight - 12) + "px";
  }
  function esconderDica() { tip.hidden = true; }

  // ---------- Variação contra o período anterior ----------
  function variacao(alvo, atual, antes, nomePeriodo) {
    alvo.replaceChildren();
    if (!antes) return;
    const p = Math.round(((atual - antes) / antes) * 100);
    if (p === 0) {
      alvo.className = "kpi-delta";
      alvo.textContent = "Igual à " + nomePeriodo + " anterior";
      if (nomePeriodo === "mês") alvo.textContent = "Igual ao mês anterior";
      return;
    }
    const sobe = p > 0;
    alvo.className = "kpi-delta " + (sobe ? "up" : "down");
    const seta = document.createElement("span");
    seta.setAttribute("aria-hidden", "true");
    seta.textContent = sobe ? "▲ " : "▼ ";
    alvo.append(seta, (sobe ? "+" : "−") + Math.abs(p) + "% vs. " + nomePeriodo + " anterior");
  }

  // ---------- Minigráfico (sparkline) ----------
  function sparkline(svg, valores) {
    svg.replaceChildren();
    const w = 120, h = 32, max = Math.max.apply(null, valores), min = Math.min.apply(null, valores);
    if (valores.length < 2) return;
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    const x = function (i) { return 4 + (i / (valores.length - 1)) * (w - 8); };
    const y = function (v) { return h - 4 - ((v - min) / (max - min || 1)) * (h - 8); };
    el("polyline", { points: valores.map(function (v, i) { return x(i) + "," + y(v); }).join(" "), fill: "none", stroke: COR_APAGADA, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    const u = valores.length - 1;
    el("circle", { cx: x(u), cy: y(valores[u]), r: 4, fill: COR_DESTAQUE, stroke: COR_SUPERFICIE, "stroke-width": 2 }, svg);
  }

  // ---------- Gráfico de linha: visitas por dia ----------
  function graficoVisitas(dias) {
    const caixa = $("chart-visitas");
    caixa.replaceChildren();
    const W = caixa.clientWidth || 600, H = 240;
    const m = { t: 16, r: 44, b: 28, l: 40 };
    const valores = dias.map(function (d) { return d.visitas; });
    const maior = Math.max(1, Math.max.apply(null, valores));
    // Escala com números "redondos" no eixo (ex.: 0, 25, 50, 75, 100)
    const bruto = Math.max(maior / 4, 1);
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const passoY = [1, 2, 2.5, 5, 10].map(function (f) { return f * mag; }).find(function (s) { return s >= bruto; });
    const teto = Math.ceil(maior / passoY) * passoY;
    const linhas = Math.round(teto / passoY);
    const x = function (i) { return m.l + (i / (dias.length - 1)) * (W - m.l - m.r); };
    const y = function (v) { return m.t + (1 - v / teto) * (H - m.t - m.b); };

    const svg = el("svg", { width: W, height: H, viewBox: "0 0 " + W + " " + H, role: "img", tabindex: 0,
      "aria-label": "Gráfico de visitas por dia. Use as setas do teclado para percorrer os dias." }, caixa);

    // Linhas de grade e números do eixo (recessivos)
    for (let i = 0; i <= linhas; i++) {
      const v = passoY * i, yy = Math.round(y(v)) + 0.5;
      el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, stroke: COR_GRADE, "stroke-width": 1 }, svg);
      el("text", { x: m.l - 8, y: yy + 4, "text-anchor": "end", class: "axis" }, svg).textContent = num(v);
    }
    // Datas no eixo de baixo (poucas, para não poluir)
    const passo = dias.length > 10 ? 7 : 1;
    dias.forEach(function (d, i) {
      if ((dias.length - 1 - i) % passo === 0) {
        el("text", { x: x(i), y: H - 8, "text-anchor": "middle", class: "axis" }, svg).textContent = passo === 1 ? d.data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "") : diaCurto(d.data);
      }
    });

    // Área suave + linha de 2px
    const pts = valores.map(function (v, i) { return x(i) + "," + y(v); });
    el("polygon", { points: x(0) + "," + y(0) + " " + pts.join(" ") + " " + x(dias.length - 1) + "," + y(0), fill: COR_DESTAQUE, "fill-opacity": 0.1 }, svg);
    el("polyline", { points: pts.join(" "), fill: "none", stroke: COR_DESTAQUE, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);

    // Ponto e valor só no último dia (rótulo seletivo)
    const u = dias.length - 1;
    el("circle", { cx: x(u), cy: y(valores[u]), r: 4, fill: COR_DESTAQUE, stroke: COR_SUPERFICIE, "stroke-width": 2 }, svg);
    el("text", { x: x(u) + 8, y: y(valores[u]) + 4, class: "end-label" }, svg).textContent = num(valores[u]);

    // Mira (crosshair) que acompanha o mouse e encaixa no dia mais próximo
    const mira = el("line", { y1: m.t, y2: H - m.b, stroke: COR_MIRA, "stroke-width": 1, visibility: "hidden" }, svg);
    const pontoMira = el("circle", { r: 5, fill: COR_DESTAQUE, stroke: COR_SUPERFICIE, "stroke-width": 2, visibility: "hidden" }, svg);
    let atual = -1;
    function marcar(i) {
      atual = Math.max(0, Math.min(u, i));
      const d = dias[atual];
      mira.setAttribute("x1", x(atual)); mira.setAttribute("x2", x(atual));
      pontoMira.setAttribute("cx", x(atual)); pontoMira.setAttribute("cy", y(d.visitas));
      mira.setAttribute("visibility", "visible"); pontoMira.setAttribute("visibility", "visible");
      const r = svg.getBoundingClientRect();
      mostrarDica(num(d.visitas) + " visitas", diaLongo(d.data) + " · " + num(d.nfc) + " pela plaquinha", r.left + x(atual), r.top + y(d.visitas));
    }
    function limpar() {
      mira.setAttribute("visibility", "hidden"); pontoMira.setAttribute("visibility", "hidden");
      esconderDica();
    }
    svg.addEventListener("pointermove", function (e) {
      const r = svg.getBoundingClientRect();
      marcar(Math.round(((e.clientX - r.left - m.l) / (W - m.l - m.r)) * u));
    });
    svg.addEventListener("pointerleave", limpar);
    svg.addEventListener("blur", limpar);
    svg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        marcar(atual < 0 ? u : atual + (e.key === "ArrowRight" ? 1 : -1));
      }
    });
  }

  function vazio(alvo, texto) {
    const p = document.createElement(alvo.tagName === "OL" ? "li" : "p");
    p.className = "vazio";
    p.textContent = texto;
    alvo.appendChild(p);
  }

  // ---------- Barras: itens mais vistos (do maior para o menor) ----------
  function graficoItens(itens) {
    const lista = $("chart-itens");
    lista.replaceChildren();
    const ordenados = itens.slice().sort(function (a, b) { return b.vistas - a.vistas; });
    if (!ordenados.length) { vazio(lista, "Nenhum item do cardápio foi aberto neste período."); return; }
    const max = ordenados[0].vistas;
    ordenados.forEach(function (it) {
      const li = document.createElement("li");
      const nome = document.createElement("span");
      nome.className = "rank-name";
      nome.textContent = it.nome;
      const trilho = document.createElement("span");
      trilho.className = "rank-track";
      const barra = document.createElement("span");
      barra.className = "rank-bar";
      barra.style.width = (it.vistas / max) * 100 + "%";
      trilho.appendChild(barra);
      const valor = document.createElement("span");
      valor.className = "rank-value";
      valor.textContent = num(it.vistas);
      li.append(nome, trilho, valor);
      lista.appendChild(li);
    });
  }

  // ---------- Colunas: horários de maior movimento ----------
  function graficoHoras(horas) {
    const caixa = $("chart-horas");
    caixa.replaceChildren();
    if (!horas.length) { vazio(caixa, "Ainda não há visitas neste período."); return; }
    const max = Math.max.apply(null, horas.map(function (h) { return h.visitas; }));
    const top3 = horas.slice().sort(function (a, b) { return b.visitas - a.visitas; }).slice(0, 3).map(function (h) { return h.hora; });
    horas.forEach(function (h) {
      const col = document.createElement("div");
      col.className = "col";
      col.tabIndex = 0;
      col.setAttribute("aria-label", h.hora + "h: " + num(h.visitas) + " visitas");
      const barra = document.createElement("span");
      barra.className = "col-bar" + (top3.indexOf(h.hora) >= 0 ? " hot" : "");
      barra.style.height = Math.max(2, (h.visitas / max) * 100) + "%";
      if (h.visitas === max) {
        const v = document.createElement("b");
        v.className = "col-value";
        v.textContent = num(h.visitas);
        barra.appendChild(v);
      }
      const rot = document.createElement("span");
      rot.className = "col-label";
      rot.textContent = h.hora % 2 === 0 ? h.hora + "h" : "";
      col.append(barra, rot);
      const mostrar = function () {
        const r = barra.getBoundingClientRect();
        mostrarDica(num(h.visitas) + " visitas", "das " + h.hora + "h às " + (h.hora + 1) + "h", r.left + r.width / 2, r.top);
      };
      col.addEventListener("pointerenter", mostrar);
      col.addEventListener("focus", mostrar);
      col.addEventListener("pointerleave", esconderDica);
      col.addEventListener("blur", esconderDica);
      caixa.appendChild(col);
    });
  }

  // ---------- Tabelas (o mesmo dado, sem depender de gráfico) ----------
  function tabelas(p) {
    const tv = $("tabela-visitas");
    tv.replaceChildren();
    p.dias.slice().reverse().forEach(function (d) {
      const tr = document.createElement("tr");
      [diaLongo(d.data), num(d.visitas), num(d.nfc), num(d.whatsapp)].forEach(function (t) {
        const td = document.createElement("td"); td.textContent = t; tr.appendChild(td);
      });
      tv.appendChild(tr);
    });
    const th = $("tabela-horas");
    th.replaceChildren();
    p.horas.forEach(function (h) {
      const tr = document.createElement("tr");
      [h.hora + "h – " + (h.hora + 1) + "h", num(h.visitas)].forEach(function (t) {
        const td = document.createElement("td"); td.textContent = t; tr.appendChild(td);
      });
      th.appendChild(tr);
    });
  }

  // ---------- Monta a página para o período escolhido ----------
  let periodo = 7;
  let ultimo = null; // últimos dados desenhados (para redesenhar ao mudar a largura)
  async function desenhar() {
    const main = $("conteudo");
    main.classList.add("carregando"); // mantém o painel na tela, só mais apagado
    let p;
    try {
      p = await DADOS_PAINEL.periodo(periodo);
    } catch (erro) {
      mostrarErro(erro);
      return;
    } finally {
      main.classList.remove("carregando");
    }
    ultimo = p;
    const nomePeriodo = periodo === 7 ? "semana" : "mês";
    const inicio = p.dias[0].data, fim = p.dias[p.dias.length - 1].data;
    $("periodo-texto").textContent = DADOS_PAINEL.negocio + " · " + (periodo === 7 ? "últimos 7 dias" : "últimos 30 dias") + " · " + diaCurto(inicio) + " a " + diaCurto(fim);

    $("kpi-visitas-label").textContent = periodo === 7 ? "Visitas na semana" : "Visitas no mês";
    $("kpi-visitas").textContent = num(p.visitas);
    variacao($("kpi-visitas-delta"), p.visitas, p.visitasAntes, nomePeriodo);
    sparkline($("spark-visitas"), p.dias.map(function (d) { return d.visitas; }));

    const parte = p.visitas ? Math.round((p.nfc / p.visitas) * 100) : 0;
    $("kpi-nfc").textContent = num(p.nfc);
    $("meter-nfc-fill").style.width = parte + "%";
    $("meter-nfc").setAttribute("aria-label", parte + "% das visitas vieram da plaquinha");
    $("kpi-nfc-note").textContent = parte + "% das visitas vieram da plaquinha";

    $("kpi-whats").textContent = num(p.whatsapp);
    variacao($("kpi-whats-delta"), p.whatsapp, p.whatsappAntes, nomePeriodo);
    $("kpi-whats-note").textContent = p.whatsapp
      ? "1 em cada " + Math.round(p.visitas / p.whatsapp) + " visitantes chamou no WhatsApp"
      : "Nenhum clique no período";

    graficoVisitas(p.dias);
    graficoItens(p.itens);
    graficoHoras(p.horas);
    tabelas(p);
  }

  document.querySelectorAll("[data-periodo]").forEach(function (b) {
    b.addEventListener("click", function () {
      periodo = Number(b.dataset.periodo);
      document.querySelectorAll("[data-periodo]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      desenhar();
    });
  });

  // Redesenha o gráfico de linha quando a largura da tela muda
  let espera;
  window.addEventListener("resize", function () {
    clearTimeout(espera);
    espera = setTimeout(function () { if (ultimo) graficoVisitas(ultimo.dias); }, 150);
  });

  // ---------- Mensagens de erro em português ----------
  function mostrarErro(erro) {
    const msg = erro && erro.message === "config"
      ? "O login ainda não foi configurado (veja assets/supabase-config.js)."
      : erro && erro.message === "sem-negocio"
        ? "Sua conta ainda não está ligada a um estabelecimento. Fale com o Estúdio Aproxima."
        : "Não foi possível carregar seus dados agora. Confira a internet e recarregue a página.";
    const aviso = $("aviso-erro");
    aviso.textContent = msg;
    aviso.hidden = false;
    if (erro && erro.message !== "config" && erro.message !== "sem-negocio") console.error(erro);
  }

  // Botão Sair: nos dados reais encerra a sessão; no exemplo só volta
  const sair = $("sair");
  if (sair && DADOS_PAINEL.sair) {
    sair.addEventListener("click", function (e) { e.preventDefault(); DADOS_PAINEL.sair(); });
  }

  (async function () {
    try {
      if (DADOS_PAINEL.iniciar) await DADOS_PAINEL.iniciar();
    } catch (erro) {
      mostrarErro(erro);
      return;
    }
    $("nome-negocio").textContent = DADOS_PAINEL.negocio;
    document.title = "Painel · " + DADOS_PAINEL.negocio + " · Estúdio Aproxima";
    $("conteudo").hidden = false;
    desenhar();
  })();
})();
