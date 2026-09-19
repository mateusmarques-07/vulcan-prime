-- Vulcan Prime - seed inicial (ver ESPECIFICACAO_TECNICA.md secao 23)

insert into mesas (numero)
select g from generate_series(1, 12) g;

insert into formas_pagamento (nome)
values
('Dinheiro'),
('Cartão'),
('Pix');
