-- Decisao de 20/09/2026: Salao passa a ter 10 mesas numeradas + Balcao
-- (retirada, venda direta sem mesa) + Entrega, totalizando 12 "campos"
-- (era 12 mesas numeradas antes). Balcao e Entrega reaproveitam 100% do
-- fluxo de mesa existente (abrir/lancar/fechar/pagar) - so muda o rotulo
-- exibido e, no caso de Entrega, um campo a mais de taxa de entrega.

alter table mesas add column if not exists tipo text not null default 'mesa'
  check (tipo in ('mesa', 'balcao', 'entrega'));

-- rascunho da taxa de entrega, sobrevive a espera do entregador voltar
-- com o pagamento (mesmo padrao ja usado pra gorjeta_ativa/gorjeta_pct/
-- qtd_pessoas). 5.00 e' o valor mais comum, ja fica pre-preenchido.
alter table mesas add column if not exists taxa_entrega numeric(10,2) not null default 0;

update mesas set tipo = 'balcao', taxa_entrega = 0 where numero = 11;
update mesas set tipo = 'entrega', taxa_entrega = 5.00 where numero = 12;

-- snapshot da taxa de entrega no fechamento, igual gorjeta_valor
alter table fechamentos add column if not exists taxa_entrega numeric(10,2) not null default 0;
