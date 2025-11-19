# 🧪 CHECKLIST: Configuração Test Mode

## 1. Stripe Dashboard - Verificar Modo
- [ ] No canto superior direito, está escrito "Viewing test data"?
- [ ] Se não, clique no toggle para mudar para Test mode

## 2. Verificar Chave Secreta (Test Mode)
No Stripe Dashboard (em Test mode):
- [ ] Vá em Developers > API keys
- [ ] Copie a "Secret key" que COMEÇA COM: sk_test_...
- [ ] No Supabase > Edge Functions > Secrets
- [ ] Atualize STRIPE_SECRET_KEY com essa chave de teste

## 3. Verificar Webhook (Test Mode)
No Stripe Dashboard (em Test mode):
- [ ] Vá em Developers > Webhooks
- [ ] Tem um webhook listado aqui?
- [ ] Se SIM: Copie o Signing secret (whsec_...)
- [ ] Se NÃO: Crie um novo webhook seguindo instruções abaixo

### Como criar webhook em Test Mode:
URL do endpoint:
```
https://[SEU-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

Eventos a selecionar:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed

Depois de criar:
- [ ] Copie o Signing secret (whsec_...)
- [ ] No Supabase > Edge Functions > Secrets
- [ ] Atualize STRIPE_WEBHOOK_SECRET com esse valor

## 4. Verificar IDs dos Produtos (Test Mode)
No Stripe Dashboard (em Test mode):
- [ ] Vá em Products
- [ ] Clique no produto WiseDrive Pro
- [ ] Copie o ID do preço MENSAL (price_...)
- [ ] Copie o ID do preço ANUAL (price_...)
- [ ] No Supabase > Edge Functions > Secrets
- [ ] Configure STRIPE_PRICE_MONTHLY_ID
- [ ] Configure STRIPE_PRICE_YEARLY_ID

## 5. Testar Pagamento com Cartão de Teste
Use estes dados de teste:
- Número: 4242 4242 4242 4242
- Data: qualquer data futura (ex: 12/25)
- CVC: qualquer 3 dígitos (ex: 123)
- Nome: Teste
- CEP: qualquer (ex: 12345)

## 6. Verificar Logs após Teste
### No Stripe:
- [ ] Developers > Webhooks > [seu webhook] > Eventos recentes
- [ ] Deve aparecer checkout.session.completed
- [ ] Status deve ser "succeeded" (verde)

### No Supabase:
- [ ] Edge Functions > stripe-webhook > Logs
- [ ] Procure por "[STRIPE-WEBHOOK] Event received"
- [ ] Procure por "SUCCESS - User upgraded to Pro"

## 7. Se ainda não funcionar, verifique:
- [ ] Migration ADD_STRIPE_FIELDS.sql foi executada?
- [ ] Tabela profiles tem as colunas stripe_customer_id e stripe_subscription_id?
- [ ] Edge function stripe-webhook foi deployada?
