-- Cardapio real do cliente (fotografado 21/09/2026), substituindo os
-- produtos de demonstracao. Categorias viram as 6 do cardapio; "Defumados"
-- nao existe no cardapio real e sai junto com seus produtos.

alter table produtos add column descricao text;

-- renomeia/reordena categorias existentes pra bater com a ordem do cardapio
update categorias set nome = 'Espetos na Brasa', ordem = 1 where nome = 'Espetos';
update categorias set nome = 'Burguers', ordem = 3 where nome = 'Hambúrgueres';
update categorias set ordem = 4 where nome = 'Porções';
update categorias set ordem = 6 where nome = 'Bebidas';

insert into categorias (nome, ordem) values
  ('Acompanhamentos', 2),
  ('Drinks', 5);

-- remove "Defumados" (nao existe no cardapio real) e seus produtos,
-- pra nao esbarrar na FK sem cascade
delete from produtos where categoria_id = (select id from categorias where nome = 'Defumados');
delete from categorias where nome = 'Defumados';

-- troca todo o catalogo de demonstracao pelo cardapio real
delete from produtos;

insert into produtos (nome, descricao, preco, ordem, categoria_id)
select v.nome, v.descricao, v.preco, v.ordem, c.id
from (values
  ('Espetos na Brasa', 'Denver Prime', '150g de Denver Steak, leve toque de fumaça', 39.00, 1),
  ('Espetos na Brasa', 'Ancho Vulcan', '150g de Ancho, suculento e macio', 49.00, 2),
  ('Espetos na Brasa', 'Cupim Prime', '150g de cupim, maciez e sabor marcante', 39.00, 3),
  ('Espetos na Brasa', 'Pernil Fire', 'Linguiça de pernil defumada e dourada na brasa', 29.00, 4),

  ('Acompanhamentos', 'Arroz Prime', 'Arroz soltinho pra acompanhar a carne', 8.00, 1),
  ('Acompanhamentos', 'Farofa de Banana', 'Farofa crocante com toque adocicado da banana', 10.00, 2),
  ('Acompanhamentos', 'Batata Frita', 'Batata frita crocante e sequinha', 15.00, 3),
  ('Acompanhamentos', 'Vinagrete Vulcan', 'Vinagrete fresco da casa', 7.00, 4),

  ('Burguers', 'Vulcan Original', 'Blend artesanal, queijo, bacon, molho Vulcan e pão brioche', 38.00, 1),
  ('Burguers', 'Vulcan BBQ', 'Blend artesanal, queijo, bacon, cebola caramelizada e molho barbecue', 42.00, 2),
  ('Burguers', 'Vulcan Fire', 'Blend artesanal, queijo, bacon crocante e molho especial defumado', 45.00, 3),

  ('Porções', 'Batata Vulcan', 'Batata frita, cheddar cremoso e bacon', 30.00, 1),
  ('Porções', 'Batata Prime', 'Batata frita com queijo, bacon e molho especial Vulcan', 35.00, 2),

  ('Drinks', 'Vulcan Tropical', 'Refrescante, frutado e tropical', 30.00, 1),
  ('Drinks', 'Caipiroska Limão', null, 15.00, 2),
  ('Drinks', 'Caipiroska Frutas Vermelhas', null, 20.00, 3),

  ('Bebidas', 'Coca-Cola', null, 7.00, 1),
  ('Bebidas', 'Guaraná', null, 7.00, 2),
  ('Bebidas', 'Suco Natural', null, 12.00, 3),
  ('Bebidas', 'Água', null, 5.00, 4),
  ('Bebidas', 'Long Neck', null, 12.00, 5),
  ('Bebidas', 'Chopp', null, 10.00, 6)
) as v(categoria_nome, nome, descricao, preco, ordem)
join categorias c on c.nome = v.categoria_nome;
