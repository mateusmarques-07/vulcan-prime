-- Decisao de 22/09/2026, apos o Mateus perguntar se o sistema ia ficar
-- lento com muito historico de recebimento acumulado ao longo do tempo.
-- Confirmado: sem indice, essas 3 colunas faziam o banco ler a tabela
-- inteira toda vez que o Salao carregava, mesmo so precisando de uma
-- fatia pequena (hoje, ou so o que esta aberto/pertence a 1 comanda).
-- Com o tempo (meses de operacao real), isso ficaria cada vez mais lento.
-- So acelera consulta - nao altera nenhum dado nem comportamento.

-- getSalaoData() filtra fechamentos so do dia de hoje (fechado_em) toda
-- vez que a tela carrega - cresce pra sempre com o uso real.
create index if not exists idx_fechamentos_fechado_em on fechamentos (fechado_em);

-- getSalaoData() filtra comandas com status = 'aberta' toda vez que a
-- tela carrega - a tabela acumula toda comanda ja fechada tambem.
create index if not exists idx_comandas_status on comandas (status);

-- getSalaoData() busca itens pelas comandas abertas (IN comanda_id) -
-- cresce a cada produto vendido, pra sempre.
create index if not exists idx_itens_comanda_comanda_id on itens_comanda (comanda_id);
