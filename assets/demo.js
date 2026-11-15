/* ============================================================
   DEMONSTRAÇÃO · simulação da aproximação do celular

   O site que aparece dentro do celular é um site à parte: a pasta
   "lanchonete-exemplo". Este arquivo só cuida da cena: o celular
   vai até a plaquinha, a plaquinha reage e o site abre.
   Nada é enviado para lugar nenhum.
   ============================================================ */
(function () {
  const $ = function (id) { return document.getElementById(id); };
  const botao = $("demo-tap");
  const plaquinha = $("demo-plaque");
  const titulo = $("plaque-title");
  const celular = $("mock");
  const espera = $("mock-idle");   // tela de bloqueio do celular
  const aviso = $("mock-banner");  // aviso "Plaquinha NFC detectada"
  const site = $("mock-site");     // o site da lanchonete
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pausa = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
  let rodando = false;

  // Relógio da tela de bloqueio
  const agora = new Date();
  $("mock-clock").textContent = String(agora.getHours()).padStart(2, "0") + ":" + String(agora.getMinutes()).padStart(2, "0");

  // Conta a aproximação, só neste navegador, para o painel de exemplo
  function registrar(campo) {
    try {
      const d = JSON.parse(localStorage.getItem("aproxima-demo") || "{}");
      d[campo] = (d[campo] || 0) + 1;
      localStorage.setItem("aproxima-demo", JSON.stringify(d));
    } catch (e) { /* sem armazenamento: a demonstração segue normal */ }
  }

  // A plaquinha "lê" o celular: acende em verde e o celular mostra o aviso
  function plaquinhaReage(lendo) {
    plaquinha.classList.toggle("lendo", lendo);
    titulo.textContent = lendo ? "Conectado!" : "Aproxime o celular.";
    aviso.classList.toggle("on", lendo);
  }

  async function simular() {
    if (rodando) return;
    rodando = true;
    botao.disabled = true;

    // Se o site já estava aberto, o celular volta para a tela de bloqueio
    espera.classList.remove("off");
    site.inert = true;
    registrar("aproximacoes");

    // Para onde o celular precisa ir para encostar na plaquinha.
    // No computador os dois ficam lado a lado; no celular, um acima do outro.
    const p = plaquinha.getBoundingClientRect();
    const c = celular.getBoundingClientRect();
    const empilhado = c.top > p.bottom - 20;
    const dx = empilhado ? (p.left + p.width / 2) - (c.left + c.width / 2) : (p.right - p.width * 0.32) - c.left;
    const dy = empilhado ? (p.bottom - p.height * 0.3) - c.top : (p.top + p.height / 2) - (c.top + c.height / 2);

    if (semMovimento || !celular.animate) {
      plaquinhaReage(true);
      await pausa(700);
    } else {
      const encostado = "translate(" + dx + "px," + dy + "px) rotate(" + (empilhado ? -3 : -7) + "deg) scale(.94)";
      const curva = "cubic-bezier(.3,0,.2,1)";
      // 1. o celular vai até a plaquinha e fica encostado
      const ida = celular.animate([{ transform: "none" }, { transform: encostado }], { duration: 750, easing: curva, fill: "forwards" });
      await Promise.race([ida.finished, pausa(1300)]); // se a animação não rodar (aba em segundo plano), segue mesmo assim
      // 2. só agora, no toque, a plaquinha reage e o celular mostra o aviso
      plaquinhaReage(true);
      await pausa(900);
      // 3. o celular volta para o lugar
      const volta = celular.animate([{ transform: encostado }, { transform: "none" }], { duration: 650, easing: curva, fill: "forwards" });
      await Promise.race([volta.finished, pausa(1200)]);
      ida.cancel();
      volta.cancel();
    }

    // O site abre
    plaquinha.classList.remove("lendo");
    titulo.textContent = "Aproxime o celular.";
    espera.classList.add("off");
    site.inert = false;
    await pausa(1100);
    aviso.classList.remove("on");

    botao.textContent = "Simular de novo";
    botao.disabled = false;
    rodando = false;
    // No celular, leva a tela até o aparelho para a pessoa ver o site aberto
    if (empilhado) celular.scrollIntoView({ behavior: semMovimento ? "auto" : "smooth", block: "center" });
  }

  botao.addEventListener("click", simular);
})();
