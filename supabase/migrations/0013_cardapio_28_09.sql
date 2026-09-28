-- Cardapio novo do cliente (recebido 28/09/2026, imagem em cardapio/).
-- Precos das carnes/burgers/porcoes/drinks/bebidas nao mudaram; mudam
-- nomes de categoria (iguais aos titulos do cardapio), descricoes (carnes
-- agora 200g, burgers com ingredientes novos) e entram Combos e Sobremesas.

-- categorias: nomes e ordem iguais ao cardapio
update categorias set nome = 'Prime na Brasa', ordem = 1 where nome = 'Espetos na Brasa';
update categorias set ordem = 2 where nome = 'Acompanhamentos';
update categorias set nome = 'Vulcan Burguers', ordem = 3 where nome = 'Burguers';
update categorias set ordem = 4 where nome = 'Porções';
update categorias set nome = 'Vulcan Drinks', ordem = 7 where nome = 'Drinks';
update categorias set ordem = 8 where nome = 'Bebidas';

insert into categorias (nome, ordem) values
  ('Combos', 5),
  ('Sobremesas', 6);

-- descricoes dos produtos que ja existem
update produtos p set descricao = v.descricao
from (values
  ('Denver Prime', '200g de Denver Steak, preparado na brasa com leve toque de fumaça.'),
  ('Ancho Vulcan', '200g de Ancho, suculento e macio, finalizado na brasa.'),
  ('Cupim Prime', '200g de Cupim, preparado lentamente para alcançar maciez e sabor marcante.'),
  ('Pernil Fire', 'Linguiça de pernil levemente defumada e dourada na brasa.'),
  ('Arroz Prime', 'Arroz soltinho, para acompanhar sua carne.'),
  ('Farofa de Banana', 'Farofa crocante com toque adocicado de banana.'),
  ('Batata Frita', 'Batata palito real, crocante e sequinha.'),
  ('Vinagrete Vulcan', 'Vinagrete fresco da casa.'),
  ('Vulcan Original', 'Blend artesanal, queijo cheddar, bacon, molho Vulcan, alface e tomate.'),
  ('Vulcan BBQ', 'Blend artesanal, queijo cheddar, bacon, cebola caramelizada e molho barbecue.'),
  ('Vulcan Fire', '2 Blends artesanais, queijo cheddar, bacon, pimenta, alface, tomate e molho especial defumado.'),
  ('Batata Vulcan', 'Batata frita, cheddar cremoso e bacon.'),
  ('Batata Prime', 'Batata frita com cheddar e molho especial Vulcan.'),
  ('Vulcan Tropical', 'Abacaxi, maracujá e hortelã.')
) as v(nome, descricao)
where p.nome = v.nome;

-- produtos novos
insert into produtos (nome, descricao, preco, ordem, categoria_id)
select v.nome, v.descricao, v.preco, v.ordem, c.id
from (values
  ('Combos', 'Combo Vulcan Prime',
   '1 Refrigerante de 2L e 4 carnes (Ancho, linguiça de pernil, cupim e Denver Steak) levemente defumadas e finalizadas na brasa, acompanhadas de: arroz, farofa de banana, batata frita, vinagrete e legumes grelhados.',
   139.90, 1),
  ('Sobremesas', 'Pudim Gourmet', 'Fatia de pudim gourmet com calda caramelizada.', 12.00, 1),
  ('Sobremesas', 'Brownie Gourmet', 'Brownie gourmet com uma bola de sorvete e calda de chocolate.', 18.00, 2),
  ('Sobremesas', 'Adicional Chantilly', null, 4.00, 3)
) as v(categoria_nome, nome, descricao, preco, ordem)
join categorias c on c.nome = v.categoria_nome;
