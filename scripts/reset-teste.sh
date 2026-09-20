#!/bin/bash
# Reseta o banco pro estado limpo (12 mesas livres, sem comandas/fechamentos
# de teste) antes de rodar a suite de testes de novo. Uso interno, nao entra
# no fluxo do sistema em producao.
set -e
cd "$(dirname "$0")/.."
set -a && source .env.local && set +a
SB_URL="$NEXT_PUBLIC_SUPABASE_URL"
SB_KEY="$SUPABASE_SECRET_KEY"
H_APIKEY="apikey: $SB_KEY"
H_AUTH="Authorization: Bearer $SB_KEY"

COMANDA_IDS=$(curl -s "$SB_URL/rest/v1/comandas?select=id&status=eq.aberta" -H "$H_APIKEY" -H "$H_AUTH" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

for ID in $COMANDA_IDS; do
  curl -s -X DELETE "$SB_URL/rest/v1/itens_comanda?comanda_id=eq.$ID" -H "$H_APIKEY" -H "$H_AUTH" -o /dev/null
  curl -s -X DELETE "$SB_URL/rest/v1/comandas?id=eq.$ID" -H "$H_APIKEY" -H "$H_AUTH" -o /dev/null
done

curl -s -X PATCH "$SB_URL/rest/v1/mesas?status=neq.livre" \
  -H "$H_APIKEY" -H "$H_AUTH" -H "Content-Type: application/json" \
  -d '{"status":"livre","gorjeta_ativa":false,"gorjeta_pct":0,"qtd_pessoas":null}' \
  -o /dev/null

ENTREGA_IDS=$(curl -s "$SB_URL/rest/v1/entregas?select=id&status=neq.finalizada" -H "$H_APIKEY" -H "$H_AUTH" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
for ID in $ENTREGA_IDS; do
  curl -s -X DELETE "$SB_URL/rest/v1/entrega_itens?entrega_id=eq.$ID" -H "$H_APIKEY" -H "$H_AUTH" -o /dev/null
  curl -s -X DELETE "$SB_URL/rest/v1/entregas?id=eq.$ID" -H "$H_APIKEY" -H "$H_AUTH" -o /dev/null
done

echo "reset ok - comandas fechadas: $(echo "$COMANDA_IDS" | grep -c . || true), entregas ativas apagadas: $(echo "$ENTREGA_IDS" | grep -c . || true)"
curl -s "$SB_URL/rest/v1/mesas?select=numero,tipo,status&order=numero" -H "$H_APIKEY" -H "$H_AUTH"
