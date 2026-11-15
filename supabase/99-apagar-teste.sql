-- ============================================================
-- ESTÚDIO APROXIMA · 99 · Apagar os dados de TESTE
-- Apaga os negócios "Cliente Teste A/B" e todos os eventos deles.
-- As contas de login (teste.a / teste.b) você apaga em
-- Authentication → Users (três pontinhos → Delete user).
-- ============================================================
delete from public.negocios where nome like 'Cliente Teste %';
