-- Abrir mesa precisa ser atomico (criar comanda + mudar status da mesa
-- juntos), senao uma falha no meio deixa comanda orfa ou mesa com status
-- errado. "for update" tambem evita 2 comandas abertas se a mesma mesa
-- for clicada 2x rapido (dono clicando 2x sem querer).
create or replace function abrir_mesa(p_numero int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mesa_id uuid;
  v_status text;
  v_comanda_id uuid;
begin
  select id, status into v_mesa_id, v_status
  from mesas
  where numero = p_numero
  for update;

  if v_mesa_id is null then
    raise exception 'Mesa % não encontrada', p_numero;
  end if;

  if v_status <> 'livre' then
    select id into v_comanda_id
    from comandas
    where mesa_id = v_mesa_id and status = 'aberta'
    order by aberta_em desc
    limit 1;

    return v_comanda_id;
  end if;

  insert into comandas (mesa_id, status)
  values (v_mesa_id, 'aberta')
  returning id into v_comanda_id;

  update mesas set status = 'ocupada' where id = v_mesa_id;

  return v_comanda_id;
end;
$$;

grant execute on function abrir_mesa(int) to authenticated;
