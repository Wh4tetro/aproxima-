-- ============================================================
-- ESTÚDIO APROXIMA · 01 · Estrutura do banco + segurança (RLS)
--
-- Onde rodar: Supabase → seu projeto → SQL Editor → New query.
-- Cole este arquivo inteiro e clique em "Run". Pode rodar de novo
-- sem problema: os comandos não duplicam nada.
--
-- O que é RLS (Row Level Security / segurança por linha):
-- uma regra dentro do próprio banco que decide, linha por linha,
-- quem pode ver o quê. Mesmo que alguém pegue a chave pública do
-- site, o banco só entrega a cada cliente as linhas do negócio dele.
-- ============================================================


-- ---------- 1. Negócios (um por cliente) ----------
-- dono_id liga o negócio à conta de login do cliente (auth.users).
create table if not exists public.negocios (
  id        uuid primary key default gen_random_uuid(),
  nome      text not null,
  dono_id   uuid not null unique references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);


-- ---------- 2. Eventos (cada visita, clique ou item visto) ----------
-- tipo:   'visita'   = alguém abriu o site do cliente
--         'whatsapp' = alguém clicou no botão do WhatsApp
--         'item'     = alguém abriu um item do cardápio (nome em "item")
-- origem: 'direto' = digitou o endereço, veio do Instagram, Google etc.
--         'nfc'    = encostou o celular na plaquinha
--         'qr'     = leu o QR Code da plaquinha
create table if not exists public.eventos (
  id         bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  tipo       text not null check (tipo in ('visita', 'whatsapp', 'item')),
  origem     text not null default 'direto' check (origem in ('direto', 'nfc', 'qr')),
  item       text check (item is null or char_length(item) <= 80),
  criado_em  timestamptz not null default now()
);

-- Índice: deixa rápida a busca "eventos deste negócio neste período"
create index if not exists eventos_negocio_data on public.eventos (negocio_id, criado_em);


-- ---------- 3. Ligar o RLS ----------
-- Com RLS ligado e SEM regra, ninguém vê nada. Depois liberamos só o necessário.
alter table public.negocios enable row level security;
alter table public.eventos  enable row level security;

-- Quem está logado vê APENAS o próprio negócio.
drop policy if exists "cliente ve o proprio negocio" on public.negocios;
create policy "cliente ve o proprio negocio"
  on public.negocios for select
  to authenticated
  using (dono_id = (select auth.uid()));

-- Quem está logado vê APENAS os eventos do próprio negócio.
drop policy if exists "cliente ve os eventos do proprio negocio" on public.eventos;
create policy "cliente ve os eventos do proprio negocio"
  on public.eventos for select
  to authenticated
  using (negocio_id in (select n.id from public.negocios n where n.dono_id = (select auth.uid())));

-- Ninguém de fora (nem cliente logado) pode criar, alterar ou apagar
-- negócios e eventos pelo site. Isso só se faz aqui no painel do Supabase.
-- (A gravação de visitas vindas dos sites dos clientes entra na Etapa 4.)
revoke insert, update, delete on public.negocios from anon, authenticated;
revoke insert, update, delete on public.eventos  from anon, authenticated;
revoke select on public.negocios from anon;
revoke select on public.eventos  from anon;

-- Quem está logado pode LER as duas tabelas. As regras acima (RLS)
-- continuam valendo: cada cliente só recebe as linhas do próprio negócio.
grant select on public.negocios to authenticated;
grant select on public.eventos  to authenticated;


-- ---------- 4. Resumo para o painel ----------
-- Junta os eventos em números prontos para o painel (por dia, por item,
-- por hora), no fuso de Brasília. "security invoker" quer dizer que a
-- função roda com as permissões de quem chamou: o RLS continua valendo,
-- então cada cliente só recebe o resumo do próprio negócio.
create or replace function public.resumo_painel(p_dias int default 7)
returns json
language sql
stable
security invoker
set search_path = ''
as $$
  with
  parametros as (
    select least(greatest(coalesce(p_dias, 7), 1), 90) as n,
           (now() at time zone 'America/Sao_Paulo')::date as hoje
  ),
  negocio as (
    select n.id from public.negocios n where n.dono_id = (select auth.uid()) limit 1
  ),
  -- todos os dias do período atual + o mesmo tanto de dias antes (para comparar)
  serie as (
    select d::date as dia
    from parametros p,
         generate_series(p.hoje - (2 * p.n - 1), p.hoje, interval '1 day') as d
  ),
  ev as (
    select e.tipo, e.origem, e.item,
           (e.criado_em at time zone 'America/Sao_Paulo') as local
    from public.eventos e, parametros p
    where e.negocio_id = (select id from negocio)
      and e.criado_em >= ((p.hoje - (2 * p.n - 1))::timestamp at time zone 'America/Sao_Paulo')
  ),
  atual as (
    select ev.* from ev, parametros p where ev.local::date > p.hoje - p.n
  ),
  por_dia as (
    select s.dia,
           count(ev.tipo) filter (where ev.tipo = 'visita')                            as visitas,
           count(ev.tipo) filter (where ev.tipo = 'visita' and ev.origem in ('nfc','qr')) as nfc,
           count(ev.tipo) filter (where ev.tipo = 'whatsapp')                          as whatsapp
    from serie s
    left join ev on ev.local::date = s.dia
    group by s.dia
  )
  select json_build_object(
    'negocio', (select n.nome from public.negocios n where n.id = (select id from negocio)),
    'dias', (select coalesce(json_agg(json_build_object(
                'dia', d.dia, 'visitas', d.visitas, 'nfc', d.nfc, 'whatsapp', d.whatsapp) order by d.dia), '[]'::json)
             from por_dia d),
    'itens', (select coalesce(json_agg(t), '[]'::json) from (
                select a.item as nome, count(*) as vistas
                from atual a where a.tipo = 'item' and a.item is not null
                group by a.item order by count(*) desc, a.item limit 6) t),
    'horas', (select json_agg(json_build_object('hora', h,
                'visitas', (select count(*) from atual a
                            where a.tipo = 'visita' and extract(hour from a.local) = h)) order by h)
              from generate_series(0, 23) as h)
  );
$$;

-- Só quem está logado pode pedir o resumo.
revoke execute on function public.resumo_painel(int) from public, anon;
grant  execute on function public.resumo_painel(int) to authenticated;
