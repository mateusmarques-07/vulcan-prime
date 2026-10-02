-- Cadastro de mesas em Configuracoes (01/10/2026, pedido do Mateus):
-- "+ Nova mesa" cria a proxima da sequencia e "Remover" so desativa a
-- ultima (se livre) - nunca apaga, porque comandas.mesa_id aponta pra
-- mesas e o historico de contas quebraria.
alter table mesas add column if not exists ativa boolean not null default true;

-- Balcao sai do numero 12 pra um numero interno alto, pra liberar a
-- sequencia das mesas (Mesa 12, 13...) e ficar sempre por ultimo no Salao.
-- Na tela continua aparecendo "Balcao (Retirada)".
update mesas set numero = 99 where tipo = 'balcao' and numero = 12;

-- abrir_mesa: mesma funcao de 0005, agora recusando mesa desativada.
create or replace function abrir_mesa(p_numero int)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mesa_id uuid;
  v_status text;
  v_ativa boolean;
  v_comanda_id uuid;
begin
  select id, status, ativa into v_mesa_id, v_status, v_ativa
  from mesas
  where numero = p_numero
  for update;

  if v_mesa_id is null or not v_ativa then
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
