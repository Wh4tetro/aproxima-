/* ============================================================
   ÁREA DO CLIENTE · tela de login
   Envia e-mail e senha DIRETO para o Supabase (conexão segura).
   O Estúdio Aproxima nunca vê nem guarda a senha do cliente.
   ============================================================ */
(function () {
  const form = document.getElementById("login");
  const status = document.getElementById("status");
  const botao = form.querySelector('button[type="submit"]');

  function avisar(texto, erro) {
    status.textContent = texto;
    status.classList.toggle("erro", !!erro);
    status.hidden = false;
  }

  // MODO DEMONSTRAÇÃO: enquanto o Supabase não estiver configurado,
  // o botão abre o painel de exemplo (dados fictícios). Nada é enviado
  // nem guardado: e-mail e senha são opcionais e a senha é apagada.
  if (!supabaseCliente) {
    avisar("Modo demonstração: entre para ver o painel de exemplo da Lanchonete Exemplo (empresa e números fictícios). Não precisa de senha.");
    botao.textContent = "Entrar na demonstração";
    document.querySelector(".auth-demo").hidden = true; // o botão principal já leva ao exemplo
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.senha.value = "";
      location.href = "exemplo.html";
    });
    document.getElementById("esqueci").addEventListener("click", function (e) {
      e.preventDefault();
      avisar("Na demonstração não há senha: é só clicar em “Entrar na demonstração”.");
    });
    return;
  }

  // Já está logado? Vai direto para o painel.
  supabaseCliente.auth.getSession().then(function (r) {
    if (r.data && r.data.session) location.replace("painel.html");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = form.email.value.trim();
    const senha = form.senha.value;
    if (!email || !senha) {
      avisar("Preencha o e-mail e a senha.", true);
      return;
    }
    botao.disabled = true;
    botao.textContent = "Entrando…";
    const { error } = await supabaseCliente.auth.signInWithPassword({ email: email, password: senha });
    if (error) {
      form.senha.value = "";
      botao.disabled = false;
      botao.textContent = "Entrar";
      const msg = /invalid login/i.test(error.message)
        ? "E-mail ou senha incorretos."
        : "Não foi possível entrar agora. Tente de novo em instantes.";
      avisar(msg, true);
      return;
    }
    location.replace("painel.html");
  });

  document.getElementById("esqueci").addEventListener("click", function (e) {
    e.preventDefault();
    avisar("Para redefinir sua senha, fale com o Estúdio Aproxima pelo WhatsApp.");
  });
})();
