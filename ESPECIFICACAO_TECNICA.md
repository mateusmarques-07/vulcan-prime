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

**Atualizado em 19/09/2026 (ver seção 35):** categoria deixou de ser texto livre gerado a partir dos produtos e virou cadastro próprio, com tela dedicada de criar/renomear/remover.

Exibir categorias como **menu lateral** (decisão de 19/09/2026, depois de o cliente ver a versão em abas horizontais e achar ruim — abas cortavam categoria e precisavam rolar).

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

**Atualizado em 19/09/2026 (ver seção 35):** Categoria não é mais texto livre — o produto escolhe (select) uma categoria já cadastrada na tela própria de Categorias. Evita duplicidade tipo "Espeto" e "Espetos" virando categorias diferentes por erro de digitação.

Exemplo:

Nome: Espeto de Picanha
Categoria: Espetos
Preço: R$ 18,00

## Ordem

Adicionar:

`ordem int default 0`

Usar esse campo para organizar a apresentação dos produtos dentro das categorias.

Categorias têm seu próprio campo de ordem (seção 35) e são exibidas nessa ordem, não mais alfabeticamente.

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

**Atualizado de novo em 19/09/2026 (mais tarde, ver seção 35):** nasceu a tabela `categorias`, e `produtos.categoria` (texto livre) virou `produtos.categoria_id` (uuid, `references categorias(id)`, sem `on delete cascade` — apagar uma categoria com produto vinculado é bloqueado pela FK de propósito).

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

**Todas as 9 etapas abaixo foram concluídas e testadas em 19/09/2026** (29 testes reais de ponta a ponta, ver seção 35). Mantendo o texto original de cada etapa como referência do que foi pedido.

Executar nesta ordem:

### ETAPA 1 - Autenticação e Banco ✅ concluída

* tela de login;
* proteção de rotas;
* criar migration;
* criar tabelas (incluindo `fechamento_pagamentos`);
* RLS com policies `authenticated`;
* seed das 12 mesas;
* seed das formas de pagamento.

### ETAPA 2 - Salão ✅ concluída

* grade das mesas;
* status;
* resumo superior;
* abertura da mesa.

### ETAPA 3 - Comanda ✅ concluída

* categorias;
* produtos;
* lançamento;
* quantidades;
* observações;
* total.

### ETAPA 4 - Fechamento ✅ concluída

* resumo;
* divisão por pessoas (opcional, informativa);
* gorjeta (com forma de pagamento própria);
* recibo (80mm, janela própria, sem impressão automática, incluindo divisão por pessoa quando informada);
* seleção de uma ou mais formas de pagamento pro subtotal, com validação de que a soma bate;
* seleção da forma de pagamento da gorjeta (única), quando aplicável;
* confirmação;
* encerramento.

### ETAPA 5 - Produtos ✅ concluída

* cadastro;
* edição;
* ativação/desativação;
* categorias;
* ordenação.

### ETAPA 6 - Pagamentos ✅ concluída

* cadastro;
* edição;
* ativação/desativação;
* impedir desativação da última forma ativa.

### ETAPA 7 - Recebimentos ✅ concluída

* Hoje;
* período;
* forma de pagamento;
* subtotal;
* gorjetas;
* total;
* fechamento individual.

### ETAPA 8 - Alterar senha ✅ concluída

* tela interna de alterar senha (dentro de configurações/perfil).

### ETAPA 9 - Revisão ✅ concluída

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

**19/09/2026 (mais tarde, Etapas 2-3 implementadas)** — ver seção 34 abaixo: descoberto e contornado um bug real do Next.js com Server Actions repetidas na mesma página.

**19/09/2026 (fim do dia, Etapas 4-9 implementadas em sequência):**

1. Cardápio virou menu lateral em vez de abas horizontais (pedido do cliente ao ver a tela pronta).
2. Categoria deixou de ser texto livre e virou cadastro próprio, com tela de criar/renomear/remover (ver seção 35) — pedido do cliente pensando em novos grupos de produto no futuro.
3. Qualquer remoção/desativação bloqueada por regra do sistema (categoria com produto, última forma de pagamento ativa) agora mostra um popup explicando o motivo, em vez de falhar silenciosamente ou travar numa mensagem genérica.
4. Etapas 4 a 9 completas e testadas (29 testes reais de ponta a ponta) — sistema fecha o V1 descrito neste documento.

---

# 34. NOTA TÉCNICA: SERVER ACTIONS x ROUTE HANDLERS

**Descoberta em 19/09/2026, ao implementar a Etapa 3 (Comanda).**

Nesta versão do Next.js (16.3.5, a mesma usada nos outros projetos deste workspace), Server Actions (`"use server"` + `<form action={fn}>`) apresentaram um bug real em `next dev`: a **primeira** chamada numa página funciona (grava no banco e redireciona certo), mas a partir da **segunda** chamada de uma Server Action feita sem sair da página (ex: clicar em 2 produtos diferentes do cardápio em sequência, ou clicar +/− duas vezes), o `redirect()` deixa de chegar no navegador — a requisição aparece nos logs do servidor com `⨯ Error: aborted / code: ECONNRESET`, o dado é gravado certo no banco, mas a tela trava mostrando o estado antigo até um F5 manual.

Foi confirmado com testes reais (Playwright) isolando a causa: trocar a Server Action por uma **Route Handler tradicional** (`src/app/api/.../route.ts` com `export async function POST` + `<form method="POST" action="/api/...">` + `NextResponse.redirect(..., 303)`) resolve o problema completamente, porque a submissão vira um POST nativo do navegador (sem JS por trás), imune a esse bug do runtime client-side do Next.

**Decisão de arquitetura para o resto do projeto:** qualquer tela onde a mesma ação (ou ações diferentes) pode ser disparada mais de uma vez sem navegação completa no meio — Comanda (Etapa 3, já feito, inclusive abrir mesa no Salão foi convertido por consistência), Fechamento (Etapa 4), CRUD de Produtos (Etapa 5), CRUD de Pagamentos (Etapa 6) — deve usar Route Handlers (`src/app/api/.../route.ts`) em vez de Server Actions. Login/logout continuam com Server Action normalmente porque só acontecem uma vez por carregamento de página (não expostos ao bug na prática).

---

# 35. CATEGORIAS (CADASTRO PRÓPRIO)

**Decisão de 19/09/2026**, depois da Etapa 3 pronta: o cliente vai ter mais grupos de produto além dos 5 iniciais (Espetos, Hambúrgueres, Defumados, Bebidas, Porções) e quer poder criar e remover esses grupos livremente pelo próprio sistema — não só implicitamente digitando texto num campo de produto (que era o desenho original da seção 15).

## Tabela

```sql
create table categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
```

`produtos.categoria_id` referencia `categorias(id)` **sem** `on delete cascade` — apagar uma categoria com produto vinculado (ativo ou não) é bloqueado pela própria constraint do banco.

## Tela

Acessível a partir de Produtos ("Gerenciar categorias"), não entra no menu principal (a seção 2 já definia só 4 itens de menu).

* Criar: nome + ordem.
* Editar: renomear e reordenar, inline.
* Remover: bloqueado com popup explicando o motivo quando ainda existe produto (de qualquer status) apontando pra ela — ver seção 36.

Diferente de Produtos e Formas de Pagamento, Categoria usa **remoção real** (não soft delete): não há necessidade de preservar histórico da categoria em si, já que o histórico de vendas (`itens_comanda`) guarda snapshot do nome e preço do produto, não da categoria.

---

# 36. POPUP DE BLOQUEIO (REGRA GERAL)

**Decisão de 19/09/2026**, pedida pelo cliente: sempre que o sistema impedir uma remoção/desativação por regra de negócio, mostrar um popup (modal) explicando o motivo, em vez de deixar o botão simplesmente não fazer nada ou estourar um erro cru.

Casos que já usam esse padrão:

* Remover categoria com produto(s) vinculado(s) (seção 35).
* Desativar a última forma de pagamento ativa (seção 17).

Implementação: a Route Handler que faz a checagem redireciona de volta pra mesma tela com `?erro=<mensagem>` na URL; a página lê esse parâmetro e renderiza um modal simples (componente `ErrorModal`, reaproveitável) com a mensagem e um botão "Entendi" que fecha o popup (navegando pra mesma URL sem o parâmetro). Qualquer bloqueio novo que o sistema precisar no futuro deve seguir esse mesmo padrão.

---

# 37. NOTA TÉCNICA: ACESSO PELO IP DO VPS EM DEV

**Descoberta em 19-20/09/2026**, testando com o Mateus acessando `http://187.77.55.239:3700` em vez de `http://localhost:3700` (acontece quando o encaminhamento de porta do VSCode cai ou ele testa direto pelo IP).

Dois bugs do Next.js em modo dev, não deste projeto especificamente:

1. **JavaScript da página inteira parava de funcionar** (abas de categoria "não saíam do lugar"). Causa: o Next.js dev bloqueia por padrão recursos internos (HMR) quando o `Host` do request é diferente de `localhost`. Fix: `allowedDevOrigins: ["187.77.55.239"]` em `next.config.ts`.
2. **Login caía sozinho no meio do uso** — mais grave. Dentro das Route Handlers, `new URL(caminho, request.url)` às vezes normalizava o host pra `localhost`, fazendo o navegador seguir o redirect pra uma origem diferente de onde a sessão foi criada — perde o cookie, cai no login. Fix: `src/lib/redirect.ts` monta a URL de redirect a partir do header `Host` da requisição (reflete o host real usado), nunca de `request.url`. Aplicado nas 18 Route Handlers do sistema.

`scripts/teste-via-ip.mjs` testa esse cenário especificamente. `scripts/revisao-etapa9.mjs` aceita `BASE_URL` como variável de ambiente pra rodar a suíte inteira contra qualquer host — os 29 testes passam tanto via `localhost` quanto via IP.

---

# 38. AJUSTES PÓS-TESTE REAL (20/09/2026)

Depois da V1 completa (etapas 1-9), o Mateus testou com dados reais e pediu os ajustes abaixo. Todos implementados e testados (29 testes, ver seção 34/37 pro histórico dos testes).

**Mesa aberta sem item lançado libera sozinha.** Antes, abrir mesa por engano deixava ela presa em "Ocupada" pra sempre. Agora, toda carga do Salão verifica mesas ocupadas cuja comanda não tem nenhum item e devolve pra "Livre" sozinha (descarta a comanda vazia). Isso substitui/relativiza o texto original da seção 3 ("Ocupada = existe uma comanda aberta") — na prática, "existe uma comanda aberta **com item**".

**Cor das mesas livres.** Viraram tom de verde (antes cinza neutro), acompanhando o mesmo padrão de ocupada (laranja) e conta (vermelho) já pedido na seção 3.

**Produtos:** preço nos campos de edição mostra 2 casas decimais ("18.00"). Campo "ordem" saiu do formulário de **cadastro** (o sistema calcula sozinho: próximo número dentro da própria categoria) — continua editável depois, linha a linha, pra reordenar manualmente. Atualiza a seção 15.

**Gorjeta não tem mais forma de pagamento própria** — reversão direta da decisão registrada nas seções 11/13/14/33 (19/09). Depois de usar o fluxo de verdade, ficou claro que perguntar "a gorjeta foi em qual forma" é atrito desnecessário. Gorjeta agora é só um valor à parte no relatório de Recebimentos, sem exigir forma de pagamento. Isso também corrigia um bug real: o botão "Confirmar pagamento" ficava travado mesmo com o subtotal batendo, porque faltava escolher a forma da gorjeta e a tela não avisava — removendo a exigência, o bug desaparece.

**Fechamento vira 2 momentos, não 1 contínuo.** O fluxo real do restaurante tem uma espera no meio: o garçom leva a conta impressa, o cliente paga, o garçom volta — só aí o operador confirma o pagamento de verdade. Por isso:
- O botão "Imprimir recibo" virou **"Fechar conta e imprimir recibo"**: continua abrindo o cupom numa aba nova, mas agora também **salva a gorjeta escolhida (ativa/percentual) e o número de pessoas direto na mesa** (`mesas.gorjeta_ativa`/`gorjeta_pct`, que já existiam desde a Etapa 1 sem uso até agora, e `mesas.qtd_pessoas`, novo).
- Se o operador sair da tela de fechamento e voltar depois (esperando o garçom), a gorjeta e o número de pessoas continuam preenchidos — só falta preencher o pagamento de verdade, que só existe quando o garçom volta com o dinheiro/cartão.
- Ao confirmar o pagamento com sucesso, esses campos da mesa são resetados (`gorjeta_ativa=false`, `gorjeta_pct=10`, `qtd_pessoas=null`) pro próximo uso.

**Tela de fechamento mostra Itens + Gorjeta + Total separados** em vez de só um número de Total junto — pedido do Mateus pra ficar mais claro de onde vem cada parte.

**Recebimentos:** "Por forma de pagamento" agora soma só o subtotal (sem a gorjeta, que não tem forma própria). Cada fechamento na lista mostra a gorjeta separada (ex: "Pix R$ 54,00 + Gorjeta R$ 5,40") em vez de "(Gorjeta: Pix)".

**Menu:** "Pagamentos" saiu do menu principal (fica só Salão / Produtos / Recebimentos) e virou um link dentro de Configurações, junto de Alterar senha. Atualiza a seção 2.

**Performance ao lançar/ajustar item.** Cada clique fazia 2-3 idas sequenciais ao banco (select existência + insert/update). Viraram funções Postgres únicas (`lancar_produto_comanda`, `ajustar_quantidade_item`) fazendo tudo numa ida só. A carga da tela da comanda também foi paralelizada (cardápio não depende da mesa, busca os dois ao mesmo tempo). Nota: parte da lentidão percebida é inerente ao modo dev (Turbopack/HMR) — tende a melhorar ainda mais rodando em produção.

---

# 39. SALÃO EM 12 CAMPOS + CORREÇÃO DO FECHAMENTO (20/09/2026)

Segunda rodada de testes reais do Mateus achou um bug crítico de fechamento e pediu a reestruturação do Salão. Todos os itens abaixo implementados e testados (24 testes automatizados, ver seção 37 pro padrão de `BASE_URL`).

**Bug crítico corrigido: pagamento comparava com o subtotal, não com o total.** Ao ativar gorjeta (ex.: item R$28 + 10% = R$30,80) e tentar pagar em duas formas (R$28 no cartão + R$2,80 em dinheiro, ou até o R$30,80 inteiro numa forma só), o sistema recusava — a validação de "valor bate" comparava a soma digitada contra `subtotal` (R$28), nunca contra o total com gorjeta. Corrigido em `src/app/api/mesas/encerrar/route.ts` e no cálculo de `faltaCobrir` do `FechamentoForm.tsx`: agora tudo compara contra `total = subtotal + gorjeta + taxa de entrega`. Esse bug também afetava o card do Salão (mostrava só o subtotal pra mesa em "Conta", ex. R$28 em vez de R$30,80) — mesma causa, corrigida em `src/lib/data/salao.ts`.

**Salão vira 12 campos fixos: 10 mesas numeradas + Balcão + Entrega**, no lugar do grid solto de mesas. Balcão (venda de balcão/retirada) e Entrega (delivery) reaproveitam 100% do mecanismo de mesa/comanda existente — abrir, lançar produto, fechar, pagar — via uma coluna nova `mesas.tipo` (`'mesa' | 'balcao' | 'entrega'`, mesa 11 = Balcão, mesa 12 = Entrega). O rótulo exibido (`rotuloMesa()` em `src/lib/mesa-label.ts`) é a única coisa que muda visualmente: "Mesa 01", "Balcão", "Entrega". Migração `0008_balcao_entrega.sql`.

**Entrega tem campo de taxa de entrega editável**, pré-preenchido com R$5,00 (`mesas.taxa_entrega`, também gravado em `fechamentos.taxa_entrega` no fechamento pra ficar no histórico). Some do total junto com itens e gorjeta. Ao confirmar o pagamento, a mesa Entrega volta pro padrão de R$5,00 pra próxima venda; Balcão nunca mostra esse campo.

**Valores digitados formatam sozinhos.** Os campos de forma de pagamento no fechamento agora usam o mesmo `formatarInputMoeda()` que já existia em Produtos (`src/lib/format.ts`): digitou "30", saiu do campo, vira "30,00". Extraído num componente `<MoneyInput>` reaproveitado tanto em Produtos quanto no Fechamento.

**Gorjeta e nº de pessoas não se perdem mais ao sair da tela sem clicar em nada.** Antes só salvava ao clicar em "Fechar conta e imprimir recibo". Agora a tela de fechamento salva sozinha (debounce de 500ms) a cada mudança de gorjeta/pessoas/taxa de entrega, via `POST /api/mesas/salvar-parcial` — endpoint leve que só atualiza a mesa, sem navegar de página.

**Feedback visual de clique** (`src/app/(app)/LoadingBar.tsx`): barra de progresso animada no topo + botão clicado fica meio apagado, em qualquer envio de formulário do sistema. Medição feita nesta rodada: cada ida ao Supabase custa ~0,2s de rede (banco fica fora do Brasil); isso é fixo e não depende do código — já está no mínimo de idas possível desde a otimização da seção 38. A barra de progresso é o jeito de deixar essa espera visível/intencional em vez de parecer travado.

---

# 40. MÓDULO DE ENTREGAS + SALÃO VOLTA A SER SÓ MESA/BALCÃO (20/09/2026)

**Decisão do Mateus, terceira rodada do dia**: o campo único "Entrega" do Salão (seção 39) só suportava 1 pedido em aberto por vez — mas o restaurante normalmente manda **várias entregas ao mesmo tempo**, cada uma esperando o motoboy voltar pra confirmar o pagamento, de forma independente ("não posso marcar como recebido sem o retorno do motoboy, e às vezes saem 5 de uma vez"). A resposta foi tirar Entrega do mecanismo de mesa e criar um módulo próprio, com numeração contínua e quantas entregas simultâneas forem necessárias.

**Salão volta a ser só Mesa e Balcão**, agora **11 mesas numeradas + Balcão por último** (12 campos, igual antes). A mesa 11 (que era o Balcão) virou mesa de verdade; a mesa 12 (que era a Entrega) virou o novo Balcão. `mesas.tipo` perde o valor `'entrega'` (só `'mesa'`/`'balcao'` daqui pra frente) e a coluna `mesas.taxa_entrega` foi removida — não se aplica mais a mesa nenhuma. Toda a lógica de taxa de entrega que vivia no fechamento de mesa (campo no `FechamentoForm`, reset pra R$5 ao confirmar pagamento, linha no recibo) foi removida por ser código morto depois dessa mudança.

**"Balcão" virou "Balcão (Retirada)"** em todo lugar que aparece: Salão, comanda, Recebimentos (`rotuloMesa()` em `src/lib/mesa-label.ts`).

**Módulo de Entregas** (`/entregas`), acessível pelo menu principal:
- **Nova Entrega** (`/entregas/nova`): formulário com nome do cliente, endereço, produtos escolhidos do cardápio (com quantidade, preço vem sozinho), taxa de entrega (editável, pré-preenchida com R$5,00), forma de pagamento única (sem dividir — diferente da mesa) e observação opcional. Total calcula sozinho na tela (produtos + taxa). RPC `criar_entrega()` grava o cabeçalho + os itens numa transação só.
- **Numeração contínua**: cada entrega recebe um número sequencial (`entregas.numero`, coluna `identity`) que **nunca reinicia**, mesmo depois de anos de uso.
- **Várias entregas em aberto ao mesmo tempo**, sem limite — cada uma é uma linha independente na tabela `entregas`, não compete por um "campo" único como as mesas.
- **Status manual em 3 estados** (`entregas.status`): ABERTA → EM ROTA → FINALIZADA, trocado direto na tela de detalhe (`/entregas/[numero]`) por botão, sem regra automática.
- **Finalizar = confirmar o pagamento.** A RPC `finalizar_entrega()` congela um registro em `fechamentos` (com `tipo='entrega'`, sem mesa/comanda associada) + um em `fechamento_pagamentos` na forma escolhida na criação — isso faz a entrega **entrar automaticamente no caixa geral do dia**, junto com mesa e balcão, sem duplicar lógica de relatório.
- **Histórico** (`/entregas/historico`): lista as entregas finalizadas (Número | Cliente | Valor | Pagamento | Data/Hora), nunca some, dá pra abrir cada uma pra conferir os produtos.
- **Comprovante** (`/recibo/entrega/[numero]`): recibo térmico 80mm próprio, com nome/endereço do cliente, itens, taxa de entrega e forma de pagamento — disponível a qualquer momento (não só depois de finalizar), pra cada motoboy sair com o comprovante da entrega dele.

**Banco de dados** (migração `0009_entregas.sql`):
- `fechamentos` ganha a coluna `tipo` (`'mesa' | 'balcao' | 'entrega'`), **gravada explicitamente no momento do fechamento** em vez de derivada consultando a mesa atual — isso corrige um bug latente: antes, se uma mesa mudasse de tipo depois (como aconteceu agora, mesa 12 deixando de ser Entrega), os fechamentos antigos dela "trocariam de tipo" silenciosamente, porque o tipo era buscado pela mesa atual, não guardado no próprio registro histórico.
- `fechamentos.comanda_id` e `fechamentos.mesa_numero` viram opcionais (`nullable`) — uma entrega não tem mesa nem comanda.
- Tabelas novas `entregas` e `entrega_itens` (mesmo padrão de `comandas`/`itens_comanda`: item guarda nome/preço "fotografados" no momento do lançamento).

**Recebimentos ganha filtro por tipo** (Mesa / Balcão (Retirada) / Entrega / Todos) na lista de "Fechamentos individuais" — o pedido original do Mateus. Entregas aparecem na lista como "Entrega #NN" (buscando o número em `entregas` pelo `fechamento_id`, já que não têm `mesa_numero`).

---

# 41. TELA DE ENTREGAS EM 2 COLUNAS + FILTRO DO RECEBIMENTOS PRA TELA INTEIRA + DEPLOY (20/09/2026)

**Decisão do Mateus, quarta rodada do dia**, a partir de um mockup que ele mandou: a tela de Entregas virou uma view só, em 2 colunas — lista das entregas em andamento à esquerda, detalhe da selecionada à direita — em vez de navegar entre páginas separadas pra ver cada entrega. `/entregas/[numero]` foi removida; `/entregas` agora aceita `?numero=NN` pra escolher qual entrega mostrar no painel direito (a lista, o Histórico e as rotas de status/edição/criação redirecionam todas pra essa URL). Sem numero na URL, seleciona a primeira ativa automaticamente.

**Botão "Finalizar" continua separado dos de status Aberta/Em rota.** No mockup original os 3 apareciam como botões iguais lado a lado; como Finalizar não é reversível (já contabiliza o pagamento no caixa), o Mateus concordou em manter Aberta/Em rota como um par que alterna livremente (dá pra voltar de Em Rota pra Aberta), e Finalizar como ação separada, com destaque visual diferente — evita que um clique errado feche uma entrega que ainda não foi paga.

**Recebimentos: filtro por tipo (e por forma) agora vale pra tela inteira**, não só pra lista de baixo. Antes, trocar o filtro de Tipo só mudava a tabela "Fechamentos individuais" — os cards do topo (Subtotal/Gorjetas/Total) e o "Por forma de pagamento" continuavam mostrando o dia inteiro, o que confundia. Agora os três blocos respeitam o mesmo filtro (`getRecebimentos()` recebe `{ forma, tipo }` e filtra tudo internamente antes de calcular resumo/porForma/lista). Um fechamento com pagamento dividido conta inteiro se **alguma** das formas usadas bater com o filtro (não é rateado).

**Novo card "Taxa de entrega"** nos totais do topo, ao lado de Subtotal/Gorjetas/Total — mesma lógica de já separar a gorjeta.

**Logo da Vulcan no menu principal** (`Nav.tsx`), ao lado do nome, em todas as telas internas (login já tinha desde a Etapa 0).

**Segundo usuário de login criado**: `vulcan.prime` / senha `123456` (pra ser trocada depois), via `scripts/criar-usuario.mjs <usuario> <senha>` — usa a API REST do Supabase Auth direto (`/auth/v1/admin/users`) em vez do SDK, porque o SDK do `supabase-js` passou a exigir WebSocket nativo (só existe a partir do Node 22; este VPS roda Node 20).

**Numeração de Entregas resetada pra 001** antes do primeiro deploy de verdade (`alter table entregas alter column numero restart with 1`), já que os números tinham subido bastante só de tanto teste automatizado no dia.

**Deploy em produção (Vercel)** — URL e credenciais de acesso ficam na memória do projeto (fora deste repositório), não neste arquivo.
