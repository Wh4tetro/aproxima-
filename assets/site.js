/* ============================================================
   ESTÚDIO APROXIMA · script compartilhado por todas as páginas

   SEUS DADOS DE CONTATO
   Preencha entre as aspas e salve. Todas as páginas se atualizam.
   Enquanto um campo estiver vazio, o site mostra um marcador
   visível, como [NÚMERO DO WHATSAPP], para você lembrar.
   ============================================================ */
const CONTATO = {
  whatsapp: "5538999151465",          // só números: 55 + DDD + número
  instagram: "@Wh4tetro",             // o @ do Instagram
  regiao: "São Francisco e região"    // cidade ou região atendida
};
const MENSAGEM = "Olá! Vi o site do Estúdio Aproxima e quero saber mais.";

(function () {
  document.documentElement.classList.add("js");
  const $ = function (sel) { return document.querySelector(sel); };
  const $$ = function (sel) { return document.querySelectorAll(sel); };

  // ---------- Ano no rodapé ----------
  $$("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // ---------- Contato ----------
  // Troca um marcador [ASSIM] pelo dado real (texto ou link).
  function preencher(campo, texto, link) {
    $$('[data-campo="' + campo + '"]').forEach(function (el) {
      el.classList.remove("ph");
      if (link) {
        const a = document.createElement("a");
        a.href = link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = texto;
        el.replaceChildren(a);
      } else {
        el.textContent = texto;
      }
    });
  }

  const numero = CONTATO.whatsapp.replace(/\D/g, "");
  if (numero) {
    const link = "https://wa.me/" + numero + "?text=" + encodeURIComponent(MENSAGEM);
    // Todos os botões "Chamar no WhatsApp" passam a abrir a conversa.
    $$("[data-wa]").forEach(function (a) {
      a.href = link;
      a.target = "_blank";
      a.rel = "noopener";
    });
    const m = numero.match(/^(\d{2})(\d{2})(\d{4,5})(\d{4})$/);
    preencher("whatsapp", m ? "+" + m[1] + " (" + m[2] + ") " + m[3] + "-" + m[4] : "+" + numero, link);
  }
  // Sem número, os botões levam ao contato no rodapé, onde aparece o marcador.

  const insta = CONTATO.instagram.trim().replace(/^@/, "");
  if (insta) preencher("instagram", "@" + insta, "https://instagram.com/" + encodeURIComponent(insta));

  if (CONTATO.regiao.trim()) preencher("regiao", CONTATO.regiao.trim());

  // ---------- Menu recolhido no celular ----------
  const menuBtn = $("#menu-btn");
  const menu = $("#menu");
  if (menuBtn && menu) {
    const setMenu = function (open) {
      menu.hidden = !open;
      menuBtn.setAttribute("aria-expanded", String(open));
      menuBtn.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
      // trava a rolagem da página enquanto o menu ocupa a tela
      document.documentElement.classList.toggle("menu-aberto", open);
    };
    // Se a janela crescer para o tamanho de computador, fecha o menu do celular
    window.matchMedia("(min-width: 834px)").addEventListener("change", function (e) {
      if (e.matches) setMenu(false);
    });
    menuBtn.addEventListener("click", function () { setMenu(menu.hidden); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener("click", function (e) {
      if (!menu.hidden && !e.target.closest(".nav")) setMenu(false);
    });
  }

  // ---------- Entrada suave dos blocos ----------
  const blocos = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    blocos.forEach(function (el, i) {
      el.style.transitionDelay = (i % 3) * 70 + "ms";
      io.observe(el);
    });
  } else {
    blocos.forEach(function (el) { el.classList.add("in"); });
  }

  // Quem pediu "menos movimento" no sistema vê tudo parado
  const parado = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // ---------- Fundo: degradê em movimento ----------
  // As luzes são desenhadas numa tela bem pequena (160×100 pontos) que o
  // navegador estica até cobrir a janela. Esticada, ela fica suave como um
  // degradê, e desenhar tão pouco não pesa nem em celular simples.
  const tela = $(".bg canvas");
  if (tela && tela.getContext) {
    const ctx = tela.getContext("2d");
    const L = tela.width, A = tela.height;
    // Cada luz: cor, força, tamanho, onde fica, quanto passeia e em quantos
    // segundos completa uma volta. Cada uma fica num canto, para nunca
    // se somarem todas no mesmo ponto (o texto continua legível).
    const LUZES = [
      { cor: "124,58,237", forca: 0.52, raio: 0.62, x: 0.16, y: 0.10, dx: 0.14, dy: 0.12, volta: 34, fase: 0 },
      { cor: "109,40,217", forca: 0.44, raio: 0.52, x: 0.88, y: 0.08, dx: 0.12, dy: 0.14, volta: 41, fase: 2 },
      { cor: "25,201,138", forca: 0.22, raio: 0.55, x: 0.86, y: 0.90, dx: 0.16, dy: 0.12, volta: 47, fase: 4 },
      { cor: "124,58,237", forca: 0.30, raio: 0.50, x: 0.10, y: 0.92, dx: 0.12, dy: 0.10, volta: 53, fase: 1 }
    ];
    // segundos = tempo; rolagem = 0 no topo da página, 1 no fim
    const desenharFundo = function (segundos, rolagem) {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "#140A2E";
      ctx.fillRect(0, 0, L, A);
      LUZES.forEach(function (z) {
        const angulo = (segundos / z.volta) * Math.PI * 2 + z.fase + rolagem * 1.5;
        const x = (z.x + z.dx * Math.sin(angulo)) * L;
        const y = (z.y + z.dy * Math.cos(angulo * 0.8)) * A;
        const g = ctx.createRadialGradient(x, y, 0, x, y, z.raio * L);
        g.addColorStop(0, "rgba(" + z.cor + "," + z.forca + ")");
        g.addColorStop(0.5, "rgba(" + z.cor + "," + (z.forca * 0.42).toFixed(3) + ")");
        g.addColorStop(1, "rgba(" + z.cor + ",0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, L, A);
      });
    };
    tela.desenharFundo = desenharFundo; // usado nos testes de legibilidade
    const rolagemAtual = function () {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      return max > 0 ? window.scrollY / max : 0;
    };
    if (parado) {
      desenharFundo(0, 0);
    } else {
      let ultimo = -1000;
      const quadro = function (ms) {
        if (ms - ultimo > 40) { // ~25 desenhos por segundo já bastam para um movimento lento
          ultimo = ms;
          desenharFundo(ms / 1000, rolagemAtual());
        }
        requestAnimationFrame(quadro);
      };
      requestAnimationFrame(quadro);
    }
  }

  // ---------- Reflexo de luz que acompanha o mouse nos blocos de vidro ----------
  if (temMouse) {
    document.addEventListener("pointermove", function (e) {
      const bloco = e.target.closest ? e.target.closest(".tile, .card, .stage, .auth-card") : null;
      if (!bloco) return;
      const r = bloco.getBoundingClientRect();
      bloco.style.setProperty("--mx", (e.clientX - r.left) + "px");
      bloco.style.setProperty("--my", (e.clientY - r.top) + "px");
    }, { passive: true });
  }

  // ---------- Profundidade na abertura: plaquinha e celular em camadas ----------
  // Ao mover o mouse, o celular (mais perto) desloca mais que a plaquinha (mais longe).
  const cena = $(".tap");
  if (cena && temMouse && !parado) {
    window.addEventListener("pointermove", function (e) {
      cena.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3));
      cena.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3));
    }, { passive: true });
  }
})();
