-- 13/10/2026: cardapio novo (cardapio/cardápio.pdf, com rodizio e almoco
-- executivo) + envio pra cozinha durante o atendimento.
--
-- Categoria ganha 3 configuracoes:
--   vai_cozinha           - item dessa categoria sai no papel da cozinha
--                           (bebida nao: garcom pega direto). Pensado pra
--                           virar "setor" (cozinha/bar) no futuro.
--   qtd_acompanhamentos   - ao lancar, abre popup pra escolher N
--                           acompanhamentos (Executivos = 4, Rodizio = 1)
--   lista_acompanhamentos - os produtos dessa categoria viram os botoes
--                           do popup (Adicionais)
--
-- Item da comanda ganha:
--   vai_cozinha        - copia da categoria no momento do lancamento
--   acompanhamentos    - texto escolhido no popup ("Arroz, Feijão, ...")
--   enviado_cozinha_em - quando foi pro papel da cozinha (null = pendente).
--                        Todos os itens de um mesmo envio ficam com o
--                        mesmo horario - e assim que "Reimprimir" acha
--                        o ultimo envio, sem tabela nova.

alter table categorias
  add column if not exists vai_cozinha boolean not null default true,
  add column if not exists qtd_acompanhamentos int not null default 0
    check (qtd_acompanhamentos >= 0),
  add column if not exists lista_acompanhamentos boolean not null default false;

alter table itens_comanda
  add column if not exists vai_cozinha boolean not null default false,
  add column if not exists acompanhamentos text,
  add column if not exists enviado_cozinha_em timestamptz;

-- Lancar: so soma na mesma linha se ela ainda nao foi pra cozinha e nao tem
-- acompanhamento/observacao - senao a cozinha receberia de novo o que ja
-- saiu, ou um "2x" com observacao que so valia pra 1.
drop function if exists lancar_produto_comanda(uuid, uuid);

create or replace function lancar_produto_comanda(
  p_comanda_id uuid,
  p_produto_id uuid,
  p_acompanhamentos text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_acomp text := nullif(trim(p_acompanhamentos), '');
begin
  if v_acomp is null then
    select id into v_item_id
    from itens_comanda
    where comanda_id = p_comanda_id
      and produto_id = p_produto_id
      and enviado_cozinha_em is null
      and acompanhamentos is null
      and observacao is null
    limit 1;
  end if;

  if v_item_id is not null then
    update itens_comanda set quantidade = quantidade + 1 where id = v_item_id;
  else
    insert into itens_comanda
      (comanda_id, produto_id, nome_produto, preco_unit, quantidade, vai_cozinha, acompanhamentos)
    select p_comanda_id, p.id, p.nome, p.preco, 1, c.vai_cozinha, v_acomp
    from produtos p
    join categorias c on c.id = p.categoria_id
    where p.id = p_produto_id;
  end if;
end;
$$;

grant execute on function lancar_produto_comanda(uuid, uuid, text) to authenticated;

-- "+" num item que ja foi pra cozinha nao mexe nele: cria (ou soma numa)
-- linha nova pendente com o mesmo produto/acompanhamento/observacao, pro
-- proximo envio levar so o que e novo. "-" continua mexendo direto (a tela
-- pede confirmacao antes, avisando pra falar com a cozinha).
create or replace function ajustar_quantidade_item(p_item_id uuid, p_delta int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item itens_comanda%rowtype;
  v_pendente_id uuid;
begin
  select * into v_item from itens_comanda where id = p_item_id;

  if v_item.id is null then
    return;
  end if;

  if p_delta > 0 and v_item.enviado_cozinha_em is not null then
    select id into v_pendente_id
    from itens_comanda
    where comanda_id = v_item.comanda_id
      and produto_id is not distinct from v_item.produto_id
      and enviado_cozinha_em is null
      and acompanhamentos is not distinct from v_item.acompanhamentos
      and observacao is not distinct from v_item.observacao
    limit 1;

    if v_pendente_id is not null then
      update itens_comanda set quantidade = quantidade + p_delta where id = v_pendente_id;
    else
      insert into itens_comanda
        (comanda_id, produto_id, nome_produto, preco_unit, quantidade, observacao, vai_cozinha, acompanhamentos)
      values
        (v_item.comanda_id, v_item.produto_id, v_item.nome_produto, v_item.preco_unit, p_delta,
         v_item.observacao, v_item.vai_cozinha, v_item.acompanhamentos);
    end if;
    return;
  end if;

  if v_item.quantidade + p_delta <= 0 then
    delete from itens_comanda where id = p_item_id;
  else
    update itens_comanda set quantidade = v_item.quantidade + p_delta where id = p_item_id;
  end if;
end;
$$;

grant execute on function ajustar_quantidade_item(uuid, int) to authenticated;

-- Marca tudo que esta pendente pra cozinha com o mesmo horario e devolve
-- esse horario (null se nao tinha nada pendente).
create or replace function enviar_cozinha(p_comanda_id uuid)
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  v_agora timestamptz := now();
  v_qtd int;
begin
  update itens_comanda
  set enviado_cozinha_em = v_agora
  where comanda_id = p_comanda_id
    and vai_cozinha
    and enviado_cozinha_em is null;

  get diagnostics v_qtd = row_count;
  if v_qtd = 0 then
    return null;
  end if;
  return v_agora;
end;
$$;

grant execute on function enviar_cozinha(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Cardapio novo. O banco foi zerado antes (pedido do Mateus, 13/10), entao
-- nenhum item de comanda aponta pros produtos antigos.
-- ---------------------------------------------------------------------
delete from produtos;
delete from categorias;

insert into categorias (nome, ordem, vai_cozinha, qtd_acompanhamentos, lista_acompanhamentos) values
  ('Rodízio',            1, true,  1, false),
  ('Vulcan Executivos',  2, true,  4, false),
  ('Espetos Defumados',  3, true,  0, false),
  ('Vulcan Burgers',     4, true,  0, false),
  ('Porções',            5, true,  0, false),
  ('Adicionais',         6, true,  0, true),
  ('Bebidas',            7, false, 0, false),
  ('Chopp',              8, false, 0, false),
  ('Cervejas',           9, false, 0, false),
  ('Drinks',            10, false, 0, false),
  ('Sobremesa',         11, true,  0, false);

insert into produtos (nome, descricao, preco, ordem, categoria_id)
select v.nome, v.descricao, v.preco, v.ordem, c.id
from (values
  ('Rodízio', 'Rodízio', 'Espetos defumados à vontade + 1 acompanhamento (servido uma vez). Das 18h às 22h.', 49.90, 1),
  ('Rodízio', 'Rodízio infantil (até 12 anos)', 'Meia: espetos defumados à vontade + 1 acompanhamento (servido uma vez). Crianças abaixo de 12 anos.', 24.95, 2),

  ('Vulcan Executivos', 'Bife Ancho', 'Acompanha 4 adicionais à escolha do cliente.', 38.90, 1),
  ('Vulcan Executivos', 'Parmegiana de Frango', 'Acompanha 4 adicionais à escolha do cliente.', 33.90, 2),
  ('Vulcan Executivos', 'Filé de Tilápia', 'Acompanha 4 adicionais à escolha do cliente.', 35.90, 3),
  ('Vulcan Executivos', 'Frango grelhado', 'Acompanha 4 adicionais à escolha do cliente.', 29.90, 4),

  ('Espetos Defumados', 'Espeto de Carne', null, 14.90, 1),
  ('Espetos Defumados', 'Espeto de Frango com Bacon', null, 14.90, 2),
  ('Espetos Defumados', 'Espeto de Coração', null, 14.90, 3),
  ('Espetos Defumados', 'Espeto de Linguiça', null, 11.90, 4),

  ('Vulcan Burgers', 'Vulcan Original', 'Combo: acompanha batata e refri. Blend artesanal 150g, queijo cheddar, molho Vulcan, alface e tomate.', 39.90, 1),
  ('Vulcan Burgers', 'Vulcan BBQ', 'Combo: acompanha batata e refri. Blend artesanal 150g, queijo coalho, mel, bacon e molho especial.', 48.90, 2),
  ('Vulcan Burgers', 'Vulcan Fire', 'Combo: acompanha batata e refri. 2 blends artesanais 150g cada, queijo cheddar, bacon, alface, tomate e molho especial defumado.', 54.90, 3),
  ('Vulcan Burgers', 'Vulcan Cream', 'Combo: acompanha batata e refri. Blend artesanal 150g, catupiry maçaricado e bacon triturado.', 36.90, 4),

  ('Porções', 'Batata Vulcan', '400g de batata sequinha e crocante.', 25.00, 1),
  ('Porções', 'Batata Prime', '400g de batata com cheddar cremoso e bacon triturado.', 30.00, 2),
  ('Porções', 'Porção de Arroz', null, 8.00, 3),
  ('Porções', 'Feijão Tropeiro', null, 10.00, 4),
  ('Porções', 'Mandioca', null, 8.00, 5),
  ('Porções', 'Vinagrete', null, 6.90, 6),

  ('Adicionais', 'Batata frita (adicional)', null, 5.90, 1),
  ('Adicionais', 'Arroz (adicional)', null, 4.90, 2),
  ('Adicionais', 'Feijão (adicional)', null, 4.90, 3),
  ('Adicionais', 'Purê de batata (adicional)', null, 5.90, 4),
  ('Adicionais', 'Salada (adicional)', null, 3.90, 5),
  ('Adicionais', 'Legumes (adicional)', null, 3.90, 6),

  ('Bebidas', 'Água', null, 4.00, 1),
  ('Bebidas', 'Água com gás', null, 5.00, 2),
  ('Bebidas', 'Suco natural', null, 12.00, 3),
  ('Bebidas', 'Coca-Cola lata 310ml', null, 7.00, 4),
  ('Bebidas', 'Guaraná Antarctica', null, 7.00, 5),

  ('Chopp', 'Chopp Brahma', null, 12.00, 1),

  ('Cervejas', 'Original 600ml', null, 12.90, 1),
  ('Cervejas', 'Heineken 600ml', null, 15.90, 2),
  ('Cervejas', 'Brahma 600ml', null, 12.00, 3),
  ('Cervejas', 'Heineken Long Neck', null, 12.00, 4),
  ('Cervejas', 'Corona Long Neck', null, 12.00, 5),

  ('Drinks', 'Caipirinha de limão', null, 15.90, 1),
  ('Drinks', 'Caipiroska de frutas vermelhas', null, 22.90, 2),
  ('Drinks', 'Cozumel', 'Com Heineken ou Corona.', 16.90, 3),
  ('Drinks', 'Gin Vulcan', 'Morango fatiado, laranja Bahia, xarope de morango e energético.', 31.90, 4),
  ('Drinks', 'Vulcan Tropical', 'Xarope de frutas vermelhas, suco de limão, vodka, tabasco e pink lemonade.', 31.90, 5),

  ('Sobremesa', 'Pudim', null, 12.00, 1)
) as v(categoria_nome, nome, descricao, preco, ordem)
join categorias c on c.nome = v.categoria_nome;
