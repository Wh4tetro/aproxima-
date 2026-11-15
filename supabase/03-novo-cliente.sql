-- ============================================================
-- ESTÚDIO APROXIMA · 03 · Cadastrar um cliente de verdade
--
-- 1. Crie o login do cliente em
--    Authentication → Users → Add user → Create new user
--    (e-mail do cliente + uma senha provisória; marque "Auto Confirm User")
-- 2. Troque os dois textos entre [colchetes] abaixo e clique em "Run".
-- ============================================================
insert into public.negocios (nome, dono_id)
select '[NOME DO ESTABELECIMENTO]', id
from auth.users
where lower(email) = lower('[E-MAIL DO CLIENTE]');

-- Conferência: deve aparecer o negócio que você acabou de criar
select n.nome, u.email, n.criado_em
from public.negocios n join auth.users u on u.id = n.dono_id
order by n.criado_em desc
limit 5;
