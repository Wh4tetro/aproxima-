-- ============================================================
-- ESTÚDIO APROXIMA · 02 · Duas contas fictícias para TESTE
--
-- Antes de rodar: crie as duas contas em
--   Authentication → Users → Add user → Create new user
--     teste.a@example.com   (marque "Auto Confirm User")
--     teste.b@example.com   (marque "Auto Confirm User")
-- (example.com é um domínio reservado para exemplos: não pertence a ninguém.)
--
-- Este arquivo cria um negócio para cada conta e inventa eventos dos
-- últimos 60 dias, com volumes BEM diferentes, para ficar fácil ver
-- se cada conta enxerga só os próprios números:
--   Cliente Teste A → lanchonete, muito movimento (~60 visitas/dia)
--   Cliente Teste B → pizzaria, pouco movimento  (~12 visitas/dia)
--
-- Para apagar tudo depois: rode 99-apagar-teste.sql
-- ============================================================

drop table if exists contas_teste;
create temp table contas_teste (email text, nome text, volume int, itens text[]);
insert into contas_teste values
  ('teste.a@example.com', 'Cliente Teste A', 60, array['X-Bacon', 'X-Salada', 'Batata frita', 'X-Burger', 'Suco natural']),
  ('teste.b@example.com', 'Cliente Teste B', 12, array['Pizza margherita', 'Pizza calabresa', 'Refrigerante 2 L']);

-- 1. Um negócio para cada conta
insert into public.negocios (nome, dono_id)
select c.nome, u.id
from contas_teste c
join auth.users u on lower(u.email) = c.email
on conflict (dono_id) do nothing;

-- 2. Apaga eventos de teste antigos (para poder rodar de novo)
delete from public.eventos
where negocio_id in (select id from public.negocios where nome like 'Cliente Teste %');

-- 3. Visitas: horários entre 10h e 23h (horário de Brasília); origem sorteada entre direto, NFC e QR
insert into public.eventos (negocio_id, tipo, origem, criado_em)
select n.id,
       'visita',
       (array['direto', 'nfc', 'qr'])[1 + floor(random() * 3)::int],
       ((current_date - d) + make_interval(hours => 10 + floor(random() * 14)::int,
                                          mins  => floor(random() * 60)::int))
         at time zone 'America/Sao_Paulo'
from contas_teste c
join auth.users u on lower(u.email) = c.email
join public.negocios n on n.dono_id = u.id
cross join generate_series(0, 59) as d
-- quantas visitas no dia: mais no fim de semana, com variação aleatória
cross join lateral generate_series(1, round(
  c.volume
  * (case extract(dow from current_date - d) when 5 then 1.3 when 6 then 1.4 when 0 then 1.2 else 0.8 end)
  * (0.8 + random() * 0.4) + 0 * d)::int) as v;

-- 4. Cliques no WhatsApp (~18% das visitas) e itens vistos (~1,5 por visita)
insert into public.eventos (negocio_id, tipo, origem, criado_em)
select e.negocio_id, 'whatsapp', e.origem, e.criado_em + interval '2 minutes'
from public.eventos e
join public.negocios n on n.id = e.negocio_id and n.nome like 'Cliente Teste %'
where e.tipo = 'visita' and random() < 0.18;

insert into public.eventos (negocio_id, tipo, origem, item, criado_em)
select e.negocio_id, 'item', e.origem,
       c.itens[1 + floor(power(random(), 1.6) * array_length(c.itens, 1))::int],
       e.criado_em + interval '1 minute'
from public.eventos e
join public.negocios n on n.id = e.negocio_id and n.nome like 'Cliente Teste %'
join auth.users u on u.id = n.dono_id
join contas_teste c on lower(u.email) = c.email
cross join generate_series(1, 2) as k
where e.tipo = 'visita' and random() < 0.75;

-- 5. Nada no futuro (hoje só até agora)
delete from public.eventos
where criado_em > now()
  and negocio_id in (select id from public.negocios where nome like 'Cliente Teste %');

drop table contas_teste;

-- Conferência: deve mostrar 2 linhas, A com bem mais eventos que B
select n.nome,
       count(*) filter (where e.tipo = 'visita')   as visitas,
       count(*) filter (where e.tipo = 'whatsapp') as whatsapp,
       count(*) filter (where e.tipo = 'item')     as itens_vistos
from public.negocios n
left join public.eventos e on e.negocio_id = n.id
where n.nome like 'Cliente Teste %'
group by n.nome
order by n.nome;
