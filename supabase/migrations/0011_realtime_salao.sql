-- Liga o Supabase Realtime nas tabelas que o Salao e a Comanda escutam
-- (ver src/components/RealtimeRefresh.tsx), pra tela do computador
-- atualizar sozinha quando o garcom lanca um item pelo celular.
-- So passa a transmitir mudanca - nao altera nenhum dado nem RLS existente.
alter publication supabase_realtime add table mesas;
alter publication supabase_realtime add table comandas;
alter publication supabase_realtime add table itens_comanda;
