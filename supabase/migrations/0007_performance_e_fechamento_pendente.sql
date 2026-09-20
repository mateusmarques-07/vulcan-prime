-- Decisao de 20/09/2026, apos teste real com o Mateus:
-- 1) lancar/ajustar quantidade de item viravam 2-3 idas ao banco (select +
--    insert/update) - agora e 1 funcao so, reduz o tempo percebido ao clicar.
-- 2) qtd_pessoas precisa sobreviver a mesa ficar em "conta" esperando o
--    garcom voltar com o pagamento (junto com gorjeta_ativa/gorjeta_pct que
--    ja existiam na tabela mesas desde o inicio, sem uso ate agora).

alter table mesas add column if not exists qtd_pessoas int;

create or replace function lancar_produto_comanda(p_comanda_id uuid, p_produto_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
begin
  select id into v_item_id
  from itens_comanda
  where comanda_id = p_comanda_id and produto_id = p_produto_id;

  if v_item_id is not null then
    update itens_comanda set quantidade = quantidade + 1 where id = v_item_id;
  else
    insert into itens_comanda (comanda_id, produto_id, nome_produto, preco_unit, quantidade)
    select p_comanda_id, id, nome, preco, 1 from produtos where id = p_produto_id;
  end if;
end;
$$;

grant execute on function lancar_produto_comanda(uuid, uuid) to authenticated;

create or replace function ajustar_quantidade_item(p_item_id uuid, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quantidade int;
begin
  select quantidade into v_quantidade from itens_comanda where id = p_item_id;

  if v_quantidade is null then
    return;
  end if;

  if v_quantidade + p_delta <= 0 then
    delete from itens_comanda where id = p_item_id;
  else
    update itens_comanda set quantidade = v_quantidade + p_delta where id = p_item_id;
  end if;
end;
$$;

grant execute on function ajustar_quantidade_item(uuid, int) to authenticated;
