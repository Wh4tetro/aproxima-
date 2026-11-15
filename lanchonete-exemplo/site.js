/* ============================================================
   LANCHONETE EXEMPLO · site de demonstração (empresa fictícia)
   Tudo acontece só no navegador: nada é enviado para lugar nenhum.
   Para mudar itens e preços do exemplo, edite a lista abaixo.
   ============================================================ */
const CARDAPIO = {
  "Lanches": [
    { nome: "X-Burger", desc: "Pão, carne 150 g e queijo", preco: 24.9, arte: "burger" },
    { nome: "X-Salada", desc: "Alface, tomate e maionese da casa", preco: 27.9, arte: "burger" },
    { nome: "X-Bacon", desc: "Bacon crocante e cheddar", preco: 31.9, arte: "burger" }
  ],
  "Porções": [
    { nome: "Batata frita", desc: "Porção média, sequinha", preco: 18.0, arte: "fritas" },
    { nome: "Onion rings", desc: "Anéis de cebola empanados", preco: 22.0, arte: "aneis" }
  ],
  "Bebidas": [
    { nome: "Refrigerante lata", desc: "350 ml, bem gelado", preco: 6.5, arte: "refri" },
    { nome: "Suco natural", desc: "Laranja ou limão, 400 ml", preco: 9.0, arte: "suco" }
  ]
};

(function () {
  const $ = function (id) { return document.getElementById(id); };
  const real = function (v) { return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  const SVG = "http://www.w3.org/2000/svg";
  const sacola = {}; // nome do item -> quantidade
  let categoria = Object.keys(CARDAPIO)[0];

  // Número da mesa: vem do endereço (ex.: ?mesa=07), como viria da plaquinha
  const mesaPedida = (new URLSearchParams(location.search).get("mesa") || "04").replace(/\D/g, "").slice(0, 3);
  const MESA = mesaPedida || "04";
  $("mesa").textContent = MESA;

  // Conta o que a pessoa fez, só neste navegador, para o painel de exemplo
  // do Estúdio Aproxima mostrar "sua demonstração". Nada sai do aparelho.
  function registrar(campo) {
    try {
      const d = JSON.parse(localStorage.getItem("aproxima-demo") || "{}");
      d[campo] = (d[campo] || 0) + 1;
      localStorage.setItem("aproxima-demo", JSON.stringify(d));
    } catch (e) { /* sem armazenamento: o site segue funcionando */ }
  }

  function todosItens() { return Object.values(CARDAPIO).flat(); }

  function desenho(nome) {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(SVG, "use");
    use.setAttribute("href", "#i-" + nome);
    svg.appendChild(use);
    return svg;
  }

  function desenharAbas() {
    const abas = $("abas");
    abas.replaceChildren();
    Object.keys(CARDAPIO).forEach(function (cat) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = cat;
      b.setAttribute("aria-pressed", String(cat === categoria));
      b.addEventListener("click", function () { categoria = cat; desenharAbas(); desenharItens(); });
      abas.appendChild(b);
    });
  }

  function desenharItens() {
    const lista = $("itens");
    lista.replaceChildren();
    CARDAPIO[categoria].forEach(function (item) {
      const li = document.createElement("li");
      li.className = "item";

      const arte = document.createElement("span");
      arte.className = "item-arte";
      arte.appendChild(desenho(item.arte));

      const texto = document.createElement("div");
      const nome = document.createElement("span");
      nome.className = "item-nome";
      nome.textContent = item.nome;
      const desc = document.createElement("span");
      desc.className = "item-desc";
      desc.textContent = item.desc;
      const preco = document.createElement("span");
      preco.className = "preco";
      preco.textContent = real(item.preco);
      texto.append(nome, desc, preco);

      // − quantidade +
      const passos = document.createElement("div");
      passos.className = "passos";
      const menos = document.createElement("button");
      menos.type = "button";
      menos.className = "menos";
      menos.textContent = "−";
      menos.setAttribute("aria-label", "Tirar um " + item.nome);
      const qtd = document.createElement("output");
      const mais = document.createElement("button");
      mais.type = "button";
      mais.textContent = "+";
      mais.setAttribute("aria-label", "Adicionar " + item.nome);
      const atualizar = function () {
        const n = sacola[item.nome] || 0;
        qtd.textContent = n || "";
        menos.hidden = n === 0;
        qtd.hidden = n === 0;
      };
      mais.addEventListener("click", function () { adicionar(item.nome); atualizar(); });
      menos.addEventListener("click", function () {
        sacola[item.nome] = Math.max(0, (sacola[item.nome] || 0) - 1);
        atualizar();
        atualizarSacola();
      });
      atualizar();
      passos.append(menos, qtd, mais);

      li.append(arte, texto, passos);
      lista.appendChild(li);
    });
  }

  function adicionar(nome) {
    sacola[nome] = (sacola[nome] || 0) + 1;
    registrar("itens");
    atualizarSacola();
  }

  function atualizarSacola() {
    let n = 0, soma = 0;
    todosItens().forEach(function (item) {
      const q = sacola[item.nome] || 0;
      n += q;
      soma += q * item.preco;
    });
    $("sacola-resumo").textContent = n + (n === 1 ? " item · " : " itens · ") + real(soma);
    $("sacola").hidden = n === 0;
    return soma;
  }

  // Destaque da capa: adiciona o X-Bacon
  $("add-destaque").addEventListener("click", function () {
    adicionar("X-Bacon");
    desenharItens();
    this.textContent = "Adicionado ✓";
    const botao = this;
    setTimeout(function () { botao.textContent = "Adicionar"; }, 1400);
  });

  // Mostra como a mensagem chegaria no WhatsApp
  function abrirConversa(aberta) {
    $("conversa").classList.toggle("aberta", aberta);
    $("conversa").inert = !aberta;
  }
  $("pedir").addEventListener("click", function () {
    const linhas = ["Olá! Pedido da mesa " + MESA + ":"];
    todosItens().forEach(function (item) {
      const q = sacola[item.nome];
      if (q) linhas.push("• " + q + "× " + item.nome + " — " + real(q * item.preco));
    });
    linhas.push("Total: " + real(atualizarSacola()));
    $("balao").textContent = linhas.join("\n");
    registrar("pedidos");
    abrirConversa(true);
    $("conversa-voltar").focus();
  });
  ["conversa-voltar", "conversa-fechar"].forEach(function (id) {
    $(id).addEventListener("click", function () { abrirConversa(false); $("pedir").focus(); });
  });

  // Rolagem suave até uma seção (sem mexer na página de fora, quando
  // este site está dentro do celular da demonstração)
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-rolar]").forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const alvo = $(link.dataset.rolar);
      const topo = alvo.getBoundingClientRect().top + window.scrollY - 30;
      window.scrollTo({ top: Math.max(0, topo), behavior: semMovimento ? "auto" : "smooth" });
    });
  });

  desenharAbas();
  desenharItens();
})();
