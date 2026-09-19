# PROJETO — VULCAN PRIME

## Sistema de Comandas e Controle de Salão - V1 de Produção

> Este documento é a versão revisada do prompt original (19/09/2026), já incorporando 3 decisões
> tomadas em conversa com o Mateus antes de qualquer linha de código ser escrita. Ele substitui o
> prompt original como fonte de verdade — ver seção 33 (Histórico de revisão) no final.

Você vai construir a V1 de produção do sistema de comandas do restaurante Vulcan Prime, especializado em defumados, espetos e hambúrgueres.

Existe uma demo funcional que já foi validada com o cliente. O objetivo agora é transformar essa ideia em um sistema simples, rápido, confiável e adequado ao uso diário do restaurante.

IMPORTANTE: esta primeira versão NÃO deve se transformar em um PDV completo.

Priorize:

* simplicidade;
* velocidade;
* facilidade de uso;
* persistência correta dos dados;
* histórico confiável;
* facilidade de manutenção.

O sistema será utilizado principalmente pelo dono do estabelecimento em um único computador, portanto não é necessário criar arquitetura complexa para múltiplos operadores trabalhando simultaneamente.

---

# 1. STACK

Utilizar:

* Next.js com App Router
* TypeScript
* Supabase

  * PostgreSQL
  * Supabase Auth (já nesta V1, ver seção 25)
* Vercel para deploy
* Tailwind CSS
* Não utilizar biblioteca pesada de UI.

Manter estrutura de código limpa e consistente com outros projetos Next.js + Supabase + Vercel.

---

# 2. NAVEGAÇÃO PRINCIPAL

Criar menu simples com:

* Salão
* Produtos
* Pagamentos
* Recebimentos

Não criar item de menu separado para "Comandas" ou "Fechamento".

Essas telas fazem parte do fluxo iniciado pelo Salão.

---

# 3. SALÃO

Esta será a principal tela do sistema.

## Mesas

Criar grade de mesas com:

* numeração sequencial;
* quantidade configurável;
* iniciar com 12 mesas.

Cada mesa possui um dos seguintes status:

* `livre`
* `ocupada`
* `conta`

Significados:

**Livre**
Mesa disponível.

**Ocupada**
Existe uma comanda aberta.

**Conta**
Fechamento da conta está em andamento.

Os estados precisam ser visualmente fáceis de distinguir.

## Informações da mesa

Mesa livre:

Mesa 04
Livre

Mesa ocupada:

Mesa 04
Ocupada
R$ 87,50

Mesa em fechamento:

Mesa 04
Conta
R$ 87,50

O valor exibido deve ser calculado pelos itens da comanda atual.

## Abertura

Ao clicar em uma mesa livre:

1. criar uma nova comanda no Supabase;
2. gerar seu UUID;
3. associá-la à mesa;
4. definir status da comanda como `aberta`;
5. mudar a mesa para `ocupada`;
6. abrir a tela da comanda.

Não haverá cadastro de clientes.

Para o usuário, a comanda será identificada visualmente pelo número da mesa.

Internamente, entretanto, cada abertura gera uma nova comanda com UUID próprio.

Exemplo:

Mesa 04 hoje → Comanda A
Mesa 04 amanhã → Comanda B

Isso permite preservar corretamente todo o histórico.

---

# 4. RESUMO DO SALÃO

Na parte superior da tela do Salão, mostrar um resumo simples:

Mesas ocupadas: 4 / 12

Em aberto: R$ 387,50

Recebido hoje: R$ 2.450,00

Não criar uma tela separada de dashboard nesta versão.

Esses indicadores fazem parte da própria tela do Salão.

---

# 5. COMANDA

Ao entrar em uma mesa ocupada, abrir sua comanda atual.

Mostrar no cabeçalho:

Mesa 04

e o total atual da comanda.

Exemplo:

Mesa 04 - R$ 87,50

---

# 6. CARDÁPIO

Dividir os produtos por categoria.

Exemplos:

* Espetos
* Hambúrgueres
* Defumados
* Bebidas
* Porções

As categorias devem ser geradas automaticamente a partir dos produtos ativos cadastrados.

Exibir categorias como abas ou filtros.

Cada produto deve mostrar:

* nome;
* preço.

Exemplo:

Picanha
R$ 18,00

Ao clicar no produto:

* adicionar 1 unidade à comanda;
* se o produto já estiver lançado, aumentar a quantidade.

Todas as alterações precisam ser persistidas no Supabase.

Não depender apenas de estado local.

Dar F5 na página não pode apagar ou alterar a comanda.

---

# 7. ITENS DA COMANDA

Mostrar:

* produto;
* preço unitário;
* quantidade;
* subtotal do item;
* observação, quando existir.

Permitir:

* aumentar quantidade;
* diminuir quantidade;
* remover item;
* adicionar/editar observação.

Exemplo de observações:

* Sem cebola
* Bem passado
* Sem molho
* Tirar tomate

Não implementar sistema complexo de adicionais ou modificadores nesta versão.

É apenas um campo opcional de texto.

Quando a quantidade chegar a zero, remover o item da comanda.

Mostrar o total atualizado em tempo real.

---

# 8. FECHAR CONTA

Exibir botão:

Fechar conta

O botão só fica habilitado quando existir pelo menos um item na comanda.

Ao clicar:

1. alterar status da mesa para `conta`;
2. abrir a tela/modal de fechamento.

Se o usuário cancelar o fechamento e voltar para a comanda:

* restaurar status da mesa para `ocupada`.

---

# 9. TELA DE FECHAMENTO

Mostrar:

* número da mesa;
* itens;
* quantidades;
* valores;
* subtotal.

Exemplo:

Subtotal: R$ 100,00

---

# 10. DIVISÃO POR PESSOAS (INFORMATIVO)

**Decisão de 19/09/2026.** Adicionar campo opcional "Nº de pessoas" na tela de fechamento (padrão vazio, sem valor mínimo forçado além de 1).

Ao preencher, calcular e exibir:

Total: R$ 110,00
Dividido por 4 pessoas: R$ 27,50 cada

Este cálculo é **puramente informativo**:

* não altera o lançamento de pagamento;
* não precisa bater com a soma de `fechamento_pagamentos` (seção 13/14);
* serve só pra o dono falar "dá R$ X por pessoa" pro cliente.

Se preenchido, o valor de `qtd_pessoas` pode ser salvo em `fechamentos` (seção 22) só pra referência/histórico — não é obrigatório pro funcionamento.

Se exibido, o recibo (seção 12) também mostra essa divisão.

**Isto NÃO é divisão real da conta.** Divisão real (associar item específico a pessoa específica, cada um pagando só o que pediu) continua fora do escopo — ver seção 30.

---

# 11. TAXA DE SERVIÇO / GORJETA

Adicionar:

☐ Incluir taxa de serviço do garçom

O checkbox deve iniciar DESMARCADO.

Quando marcado, permitir:

* 10%
* 15%
* Outra porcentagem

Ao escolher outra porcentagem, permitir digitação manual.

Exemplo:

Subtotal: R$ 100,00
Taxa de serviço (10%): R$ 10,00
Total: R$ 110,00

A gorjeta deve ser armazenada separadamente.

Guardar:

* percentual;
* valor calculado.

A forma de pagamento da gorjeta é escolhida separadamente das formas de pagamento do subtotal — ver seção 13 (Encerrar mesa / Pagamento) e seção 14 (Snapshot da forma de pagamento).

---

# 12. RECIBO

Adicionar botão:

Imprimir recibo

Gerar recibo simples NÃO FISCAL.

Formato preparado para impressora térmica de bobina: 80mm de largura.

Abrir o conteúdo em uma janela/página própria e disparar `window.print()`. Nesta fase NÃO é necessário imprimir automaticamente nem eliminar a caixa de diálogo de impressão do navegador, o usuário confirma a impressão normalmente ali. Impressão automática via agente local (ESC/POS) fica para uma fase futura, caso o cliente peça.

Zerar a margem de impressão via CSS `@page { margin: 0; }` para não cortar nem desperdiçar papel na bobina.

O recibo deve ter aparência de cupom térmico.

Mostrar:

VULCAN PRIME

Mesa 04

Data/hora

Itens

Quantidade × valor

Subtotal

Taxa de serviço, quando houver

Total

Divisão por pessoas, quando informada (ver seção 10)

E destacar:

RECIBO NÃO FISCAL

Não implementar NFC-e nesta versão.

---

# 13. ENCERRAR MESA / PAGAMENTO

Adicionar botão:

Encerrar mesa

IMPORTANTE:

Esse botão NÃO pode encerrar a mesa imediatamente.

Ao clicar, abrir modal "Confirmar pagamento".

## Pagamento do subtotal (múltiplas formas)

**Decisão de 19/09/2026.** O subtotal pode ser pago com **mais de uma forma de pagamento simultaneamente** (ex: parte em Pix, parte em dinheiro). Isso é necessário pra o relatório de Recebimentos (seções 18-20) refletir corretamente quanto entrou em cada forma no caixa do dia.

Interface:

* listar as formas de pagamento ativas, cada uma com um campo de valor (opcional, vazio por padrão);
* mostrar em tempo real "Falta cobrir: R$ X" (subtotal menos a soma já preenchida);
* quando a soma dos valores preenchidos for igual ao subtotal, "Falta cobrir" some/zera.

## Pagamento da gorjeta (forma única)

**Decisão de 19/09/2026.** Quando a gorjeta estiver ativa (seção 11), exibir uma seção separada: "Forma de pagamento da gorjeta", com seleção única (radio) entre as formas ativas. Não é dividida em múltiplas formas — reflete o caso comum de conta no cartão/Pix e gorjeta em dinheiro direto pro garçom.

## Regras de habilitação do botão "Confirmar pagamento"

O botão fica desabilitado até que:

1. a soma dos valores lançados nas formas do subtotal seja exatamente igual ao subtotal; **e**
2. se a gorjeta estiver ativa, uma forma de pagamento da gorjeta tenha sido selecionada.

## Ao confirmar

1. criar registro em `fechamentos` com: mesa, subtotal, gorjeta_pct, gorjeta_valor, gorjeta_forma_pagamento_id/nome (se houver), qtd_pessoas (se informado), total, fechado_em;
2. criar um registro em `fechamento_pagamentos` para cada forma usada no pagamento do subtotal (forma_pagamento_id, forma_pagamento_nome snapshot, valor);
3. alterar comanda para `fechada`;
4. preencher `fechada_em`;
5. limpar/resetar os dados operacionais da mesa;
6. resetar gorjeta e divisão por pessoas;
7. mudar mesa para `livre`;
8. retornar para o Salão.

Os itens históricos NÃO devem ser apagados.

Eles fazem parte do histórico daquela comanda.

---

# 14. SNAPSHOT DA FORMA DE PAGAMENTO

Para cada forma usada no pagamento do subtotal, guardar em `fechamento_pagamentos`:

* `forma_pagamento_id`
* `forma_pagamento_nome` (snapshot)
* `valor`

Se houver gorjeta, guardar também direto em `fechamentos`:

* `gorjeta_forma_pagamento_id`
* `gorjeta_forma_pagamento_nome` (snapshot)

Exemplo:

ID → UUID do cadastro
Nome → "Pix"

Isso garante que o histórico permaneça correto mesmo se posteriormente a forma for renomeada ou desativada.

---

# 15. CADASTRO DE PRODUTOS

Criar CRUD simples.

Campos:

* Nome
* Categoria
* Preço
* Ativo
* Ordem

Categoria será texto livre.

Ao digitar categoria, permitir reaproveitar categorias já existentes.

Exemplo:

Nome: Espeto de Picanha
Categoria: Espetos
Preço: R$ 18,00

## Ordem

Adicionar:

`ordem int default 0`

Usar esse campo para organizar a apresentação dos produtos dentro das categorias.

Categorias podem ser apresentadas alfabeticamente.

## Exclusão

Não excluir produtos fisicamente.

Quando o usuário escolher excluir/desativar:

`ativo = false`

Produtos inativos:

* não aparecem no cardápio;
* permanecem no banco;
* continuam disponíveis para preservar histórico.

Preferir o termo Desativar na interface.

---

# 16. SNAPSHOT DOS PRODUTOS

Ao lançar produto na comanda, salvar:

* `produto_id`
* `nome_produto`
* `preco_unit`

Nome e preço são snapshots.

Se futuramente:

Espeto Picanha
R$ 18

for alterado para:

Espeto Picanha
R$ 20

uma comanda antiga deve continuar mostrando R$ 18.

O histórico nunca deve depender do preço atual do produto.

---

# 17. FORMAS DE PAGAMENTO

Criar CRUD simples.

Campos:

* Nome
* Ativo

Exemplos:

* Dinheiro
* Cartão
* Pix
* Vale Refeição

Seed inicial:

* Dinheiro
* Cartão
* Pix

Utilizar soft delete.

Ao remover:

`ativo = false`

Nunca apagar fisicamente.

O sistema precisa ter pelo menos uma forma de pagamento ativa.

Bloquear a desativação da última forma ativa.

Somente formas ativas aparecem no fechamento da conta (tanto na divisão do subtotal quanto na forma da gorjeta).

---

# 18. RECEBIMENTOS

Criar tela:

Recebimentos

Essa tela será utilizada principalmente para conferência do caixa diário.

Filtros:

Data de

Data até

Adicionar atalho:

Hoje

Ao clicar em Hoje:

* preencher data inicial com hoje;
* preencher data final com hoje;
* carregar resultados.

---

# 19. RESUMO DOS RECEBIMENTOS

Mostrar no topo:

Subtotal vendido

Gorjetas

Total recebido

Exemplo:

Subtotal vendido
R$ 2.450,00

Gorjetas
R$ 180,00

Total recebido
R$ 2.630,00

Depois mostrar valores por forma de pagamento.

**Atualizado em 19/09/2026:** como um fechamento pode ter mais de uma forma de pagamento no subtotal, o total por forma agora é calculado somando:

* os valores de `fechamento_pagamentos` agrupados por `forma_pagamento_nome`; **mais**
* os valores de `gorjeta_valor` (em `fechamentos`) agrupados por `gorjeta_forma_pagamento_nome`, quando houver.

Exemplo:

Dinheiro
R$ 520,00

Pix
R$ 840,00

Cartão
R$ 1.270,00

Adicionar filtro opcional por forma de pagamento.

---

# 20. LISTA DE FECHAMENTOS

Abaixo do resumo mostrar os fechamentos individuais.

Colunas:

* Data/Hora
* Mesa
* Forma de pagamento
* Subtotal
* Gorjeta
* Total

Como o subtotal pode ter sido pago em mais de uma forma, a coluna "Forma de pagamento" deve listar todas as formas usadas (ex: "Pix R$ 60,00 + Dinheiro R$ 40,00"), e indicar a forma da gorjeta separadamente quando houver (ex: "Gorjeta: Dinheiro").

Ordenar inicialmente do fechamento mais recente para o mais antigo.

---

# 21. FUSO HORÁRIO

O banco deve utilizar `timestamptz`.

Para exibição e filtros do sistema considerar o fuso:

`America/Sao_Paulo`

Principalmente para:

* Recebido hoje
* filtro Hoje
* relatórios por período
* data/hora do recibo

Um fechamento realizado próximo da meia-noite não pode aparecer incorretamente no dia anterior ou seguinte.

---

# 22. BANCO DE DADOS

Utilizar Supabase/PostgreSQL.

**Schema atualizado em 19/09/2026** — em relação à primeira versão do prompt: a tabela `fechamentos` perdeu as colunas únicas `forma_pagamento_id`/`forma_pagamento_nome` (agora vivem em `fechamento_pagamentos`, que suporta N formas por fechamento) e ganhou `gorjeta_forma_pagamento_id`/`gorjeta_forma_pagamento_nome` (forma única, própria da gorjeta) e `qtd_pessoas` (informativo).

```sql
create extension if not exists "pgcrypto";

create table mesas (
  id uuid primary key default gen_random_uuid(),
  numero int not null unique,
  status text not null default 'livre'
    check (status in ('livre','ocupada','conta')),
  gorjeta_ativa boolean not null default false,
  gorjeta_pct numeric(5,2) not null default 10,
  created_at timestamptz not null default now()
);

create table produtos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null,
  preco numeric(10,2) not null check (preco >= 0),
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table formas_pagamento (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create table comandas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references mesas(id),
  status text not null default 'aberta'
    check (status in ('aberta','fechada')),
  aberta_em timestamptz not null default now(),
  fechada_em timestamptz
);

create table itens_comanda (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id) on delete cascade,
  produto_id uuid references produtos(id) on delete set null,
  nome_produto text not null,
  preco_unit numeric(10,2) not null,
  quantidade int not null check (quantidade > 0),
  observacao text,
  criado_em timestamptz not null default now()
);

create table fechamentos (
  id uuid primary key default gen_random_uuid(),
  comanda_id uuid not null references comandas(id),
  mesa_numero int not null,

  subtotal numeric(10,2) not null,

  gorjeta_pct numeric(5,2) not null default 0,
  gorjeta_valor numeric(10,2) not null default 0,
  gorjeta_forma_pagamento_id uuid references formas_pagamento(id),
  gorjeta_forma_pagamento_nome text,

  qtd_pessoas int,

  total numeric(10,2) not null,

  fechado_em timestamptz not null default now()
);

-- NOVO (19/09/2026): suporta múltiplas formas de pagamento por fechamento (só pro subtotal;
-- a gorjeta usa forma única, guardada direto em fechamentos acima).
create table fechamento_pagamentos (
  id uuid primary key default gen_random_uuid(),
  fechamento_id uuid not null references fechamentos(id) on delete cascade,
  forma_pagamento_id uuid not null references formas_pagamento(id),
  forma_pagamento_nome text not null,
  valor numeric(10,2) not null check (valor > 0)
);
```

Regra de validação a implementar na aplicação (não precisa ser constraint de banco na V1): a soma de `fechamento_pagamentos.valor` para um `fechamento_id` deve ser igual a `fechamentos.subtotal`.

---

# 23. SEED INICIAL

Criar 12 mesas:

1 até 12.

Criar formas de pagamento:

```sql
insert into formas_pagamento (nome)
values
('Dinheiro'),
('Cartão'),
('Pix');
```

Não é necessário inserir produtos fictícios em produção, a menos que sejam claramente identificados como dados de demonstração.

---

# 24. RLS

Habilitar RLS:

```sql
alter table mesas enable row level security;
alter table produtos enable row level security;
alter table formas_pagamento enable row level security;
alter table comandas enable row level security;
alter table itens_comanda enable row level security;
alter table fechamentos enable row level security;
alter table fechamento_pagamentos enable row level security;
```

Como o login já é implementado nesta V1 (ver seção 25), criar as policies direto para `authenticated`, sem etapa intermediária com `anon`:

```sql
create policy "staff_acesso_total" on mesas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on produtos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on formas_pagamento for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on comandas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on itens_comanda for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on fechamentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "staff_acesso_total" on fechamento_pagamentos for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
```

Evitar DELETE físico porque produtos e formas de pagamento utilizam soft delete.

---

# 25. AUTENTICAÇÃO - IMPLEMENTAR NA V1

Implementar login já nesta primeira versão, usando Supabase Auth com:

* email;
* senha.

Criar:

**Login**
Tela simples de email/senha via Supabase Auth.

**Proteção de rotas**
Todas as rotas do sistema exigem sessão ativa (middleware/guard). Usuário não autenticado é redirecionado para o login.

**Alterar senha**
Tela interna (dentro de configurações/perfil) usando:

`supabase.auth.updateUser({ password })`

Não é necessário criar papéis ou permissões diferenciadas nesta fase, qualquer usuário autenticado tem acesso completo ao sistema (é o próprio dono usando um único computador).

---

# 26. NFC-e - NÃO IMPLEMENTAR

Não implementar emissão fiscal.

Nesta versão existe apenas:

RECIBO NÃO FISCAL

Quando o cliente solicitar NFC-e futuramente, utilizar um provedor especializado como:

* Focus NFe
* eNotas

Não criar integração direta com SEFAZ nesta V1.

---

# 27. RESPONSIVIDADE

O ambiente principal será:

computador desktop/notebook com mouse.

Portanto desenvolver com abordagem:

desktop-first

A interface também deve continuar funcional e responsiva em:

* tablet;
* celular.

Porém não sacrificar a experiência desktop para priorizar mobile nesta versão.

---

# 28. EXPERIÊNCIA VISUAL

O sistema deve parecer uma aplicação profissional de restaurante, mas extremamente simples de operar.

Priorizar:

* botões grandes;
* informações claras;
* poucos cliques;
* valores em destaque;
* status das mesas facilmente identificáveis;
* boa legibilidade;
* feedback visual depois de ações;
* confirmação antes de operações importantes;
* estados de loading;
* estados vazios;
* mensagens de erro compreensíveis.

Evitar:

* excesso de animações;
* gradientes desnecessários;
* cards demais;
* interfaces com aparência genérica de template de IA;
* menus complexos.

Utilizar a identidade visual do Vulcan Prime quando os materiais da marca estiverem disponíveis.

---

# 29. PERSISTÊNCIA

REGRA IMPORTANTE:

O Supabase é a fonte de verdade do sistema.

Não utilizar `localStorage` como armazenamento principal das comandas.

Após:

* adicionar produto;
* alterar quantidade;
* remover produto;
* adicionar observação;
* alterar status;
* ativar gorjeta;
* fechar comanda;

os dados relevantes devem ser persistidos no Supabase.

Recarregar a página não pode fazer o sistema perder uma comanda.

---

# 30. FORA DO ESCOPO DA V1

NÃO implementar agora:

* NFC-e
* estoque
* ficha técnica
* controle de insumos
* delivery
* cadastro de clientes
* controle de garçons
* permissões por usuário
* múltiplos caixas
* **divisão real da conta por item/pessoa** (associar item específico a pessoa específica — diferente da divisão informativa por número de pessoas da seção 10, que está dentro do escopo)
* adicionais complexos
* integração com cozinha
* impressão automática (sem confirmação manual do navegador)
* KDS
* auditoria avançada
* comandas individuais por pessoa
* integração com maquininha
* integração bancária

> Removido do "fora do escopo" em 19/09/2026: "pagamento dividido entre múltiplas formas" — agora faz parte da V1 (seção 13), pois é necessário pra conferência correta do caixa em Recebimentos.

Não aumentar o escopo sem necessidade.

Deixar o código organizado para permitir evolução futura.

---

# 31. ORDEM DE IMPLEMENTAÇÃO

Executar nesta ordem:

### ETAPA 1 - Autenticação e Banco

* tela de login;
* proteção de rotas;
* criar migration;
* criar tabelas (incluindo `fechamento_pagamentos`);
* RLS com policies `authenticated`;
* seed das 12 mesas;
* seed das formas de pagamento.

### ETAPA 2 - Salão

* grade das mesas;
* status;
* resumo superior;
* abertura da mesa.

### ETAPA 3 - Comanda

* categorias;
* produtos;
* lançamento;
* quantidades;
* observações;
* total.

### ETAPA 4 - Fechamento

* resumo;
* divisão por pessoas (opcional, informativa);
* gorjeta (com forma de pagamento própria);
* recibo (80mm, janela própria, sem impressão automática, incluindo divisão por pessoa quando informada);
* seleção de uma ou mais formas de pagamento pro subtotal, com validação de que a soma bate;
* seleção da forma de pagamento da gorjeta (única), quando aplicável;
* confirmação;
* encerramento.

### ETAPA 5 - Produtos

* cadastro;
* edição;
* ativação/desativação;
* categorias;
* ordenação.

### ETAPA 6 - Pagamentos

* cadastro;
* edição;
* ativação/desativação;
* impedir desativação da última forma ativa.

### ETAPA 7 - Recebimentos

* Hoje;
* período;
* forma de pagamento;
* subtotal;
* gorjetas;
* total;
* fechamento individual.

### ETAPA 8 - Alterar senha

* tela interna de alterar senha (dentro de configurações/perfil).

### ETAPA 9 - Revisão

Testar fluxo completo:

Login → Mesa livre → Abrir → Adicionar produtos → Alterar quantidades → Observação → Fechar conta → Divisão por pessoas → Gorjeta (com forma própria) → Recibo (80mm) → Pagamento do subtotal em múltiplas formas → Encerrar → Mesa livre → Recebimentos (conferir totais por forma)

---

# 32. REGRA FINAL

Esta é uma V1 operacional, não um ERP e não um PDV completo.

Sempre que existir uma escolha entre:

mais funcionalidades

ou

um fluxo mais simples e confiável

priorize o fluxo simples.

O objetivo principal do Vulcan Prime nesta versão é:

abrir uma mesa rapidamente → lançar os produtos → acompanhar o valor → fechar a conta → registrar o pagamento → liberar a mesa → conferir os recebimentos do dia.

Antes de adicionar qualquer funcionalidade que não esteja descrita neste documento, considere-a fora do escopo.

---

# 33. HISTÓRICO DE REVISÃO

**19/09/2026** — Prompt original recebido e revisado em conversa antes de qualquer implementação. Três decisões incorporadas ao documento (nenhuma linha de código escrita ainda):

1. Subtotal pode ser pago com múltiplas formas de pagamento simultâneas (nova tabela `fechamento_pagamentos`) — necessário pra o caixa/Recebimentos bater certo quando o pagamento é misto.
2. Gorjeta usa forma de pagamento própria e única, separada do rateio do subtotal (`gorjeta_forma_pagamento_id`/`nome` em `fechamentos`) — reflete o padrão real de conta no cartão + gorjeta em dinheiro.
3. Divisão por número de pessoas é só informativa (exibida no fechamento/recibo), não uma divisão real por item — isso continua fora do escopo.
