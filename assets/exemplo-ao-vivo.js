/* ============================================================
   PAINEL DE EXEMPLO · "Sua demonstração, neste aparelho"
   Mostra o que a pessoa fez na página Demonstração (aproximar,
   escolher itens, pedir). Os números ficam guardados só neste
   navegador; nada é enviado para lugar nenhum.
   ============================================================ */
(function () {
  const cartao = document.getElementById("ao-vivo");
  if (!cartao) return;
  let d = {};
  try { d = JSON.parse(localStorage.getItem("aproxima-demo") || "{}"); } catch (e) { d = {}; }
  // Escreve o número e o texto no singular ou no plural
  function mostrar(id, n, um, varios) {
    document.getElementById(id).textContent = n;
    document.getElementById(id + "-txt").textContent = n === 1 ? um : varios;
  }
  mostrar("live-nfc", d.aproximacoes || 0, "aproximação", "aproximações");
  mostrar("live-itens", d.itens || 0, "item escolhido", "itens escolhidos");
  mostrar("live-pedidos", d.pedidos || 0, "pedido no WhatsApp", "pedidos no WhatsApp");
  cartao.hidden = false;
})();
