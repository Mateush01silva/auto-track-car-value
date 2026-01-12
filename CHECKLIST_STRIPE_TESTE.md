# ✅ Checklist Rápido - Configuração Stripe Modo Teste

> Use este checklist para garantir que você completou todos os passos necessários.

---

## 📦 PARTE 1: Stripe Dashboard

### Passo 1: Ativar Modo Teste
- [ ] Acessei https://dashboard.stripe.com/test/dashboard
- [ ] Toggle "Modo de teste" está ATIVADO (canto superior esquerdo)
- [ ] Vejo a mensagem "Você está no modo de teste"

### Passo 2: Criar Produtos
- [ ] **Produto 1**: Vybo Oficina - Starter
  - [ ] Preço: R$ 114,90/mês
  - [ ] Trial: 14 dias ✅
  - [ ] Price ID copiado: `price_________________`
- [ ] **Produto 2**: Vybo Oficina - Professional
  - [ ] Preço: R$ 219,90/mês
  - [ ] Trial: 14 dias ✅
  - [ ] Price ID copiado: `price_________________`
- [ ] **Produto 3**: Vybo Proprietário - Pro
  - [ ] Preço: R$ 5,90/mês
  - [ ] Trial: 30 dias ✅
  - [ ] Price ID copiado: `price_________________`

### Passo 3: Obter API Keys
- [ ] Acessei https://dashboard.stripe.com/test/apikeys
- [ ] Copiei Publishable Key: `pk_test_________________`
- [ ] Copiei Secret Key (cliquei em "Reveal"): `sk_test_________________`

---

## ☁️ PARTE 2: Supabase

### Passo 4: Configurar Edge Functions
- [ ] Instalei Supabase CLI: `npm install supabase --save-dev`
- [ ] Fiz login: `npx supabase login`
- [ ] Linkei projeto: `npx supabase link --project-ref sqnoxtuzoccjstlzekhc`
- [ ] Deployei funções:
  - [ ] `npx supabase functions deploy create-checkout-session`
  - [ ] `npx supabase functions deploy create-customer-portal`
  - [ ] `npx supabase functions deploy stripe-webhook`
  - [ ] `npx supabase functions deploy check-subscription`

### Passo 5: Configurar Variáveis no Supabase
- [ ] Acessei https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/settings/secrets
- [ ] Adicionei:
  - [ ] `STRIPE_SECRET_KEY = sk_test_...`
  - [ ] `STRIPE_PUBLISHABLE_KEY = pk_test_...`
- [ ] Cliquei em **Save**

### Passo 6: Configurar Webhooks
- [ ] Acessei https://dashboard.stripe.com/test/webhooks
- [ ] Cliquei em "+ Add endpoint"
- [ ] Configurei URL: `https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/stripe-webhook`
- [ ] Selecionei eventos:
  - [ ] `customer.subscription.created`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `customer.subscription.trial_will_end`
  - [ ] `invoice.payment_succeeded`
  - [ ] `invoice.payment_failed`
  - [ ] `checkout.session.completed`
- [ ] Copiei Signing Secret: `whsec_________________`
- [ ] Adicionei no Supabase: `STRIPE_WEBHOOK_SECRET = whsec_...`

---

## 💻 PARTE 3: Código Local

### Passo 7: Configurar .env
- [ ] Abri o arquivo `.env` na raiz do projeto
- [ ] Adicionei/atualizei:
  ```bash
  VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."
  STRIPE_SECRET_KEY="sk_test_..."
  VITE_STRIPE_PRICE_WORKSHOP_STARTER="price_..."
  VITE_STRIPE_PRICE_WORKSHOP_PROFESSIONAL="price_..."
  VITE_STRIPE_PRICE_OWNER_PRO="price_..."
  STRIPE_WEBHOOK_SECRET="whsec_..."
  ```
- [ ] Salvei o arquivo
- [ ] Reiniciei o servidor: `npm run dev`

---

## 🧪 PARTE 4: Testes

### Passo 8: Teste Básico de Checkout
- [ ] Acessei https://www.vybo.com.br
- [ ] Registrei como Oficina
- [ ] Tentei criar mais de 10 atendimentos
- [ ] Modal de upgrade apareceu ✅
- [ ] Cliquei em "Assinar Plano Starter"
- [ ] Stripe Checkout abriu em nova aba ✅
- [ ] **NÃO completei o pagamento ainda** (apenas verifiquei que abre)

### Passo 9: Teste com Cartão de Teste
- [ ] No Stripe Checkout, usei:
  - Número: `4242 4242 4242 4242`
  - Data: `12/30` (qualquer futura)
  - CVV: `123` (qualquer)
  - Nome: `Teste`
- [ ] Completei o pagamento
- [ ] Redirecionou para dashboard ✅
- [ ] Apareceu banner: "Período de teste - X dias restantes" ✅

### Passo 10: Verificar no Supabase
- [ ] Acessei https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/editor
- [ ] Executei query:
  ```sql
  SELECT * FROM subscriptions
  WHERE user_id = 'MEU_USER_ID'
  ORDER BY created_at DESC;
  ```
- [ ] Verifiquei que:
  - [ ] `plan_id` está correto (workshop_starter, etc)
  - [ ] `status` = 'trialing' ou 'active'
  - [ ] `trial_end` está definido (14 ou 30 dias no futuro)
  - [ ] `stripe_customer_id` está preenchido
  - [ ] `stripe_subscription_id` está preenchido

### Passo 11: Teste de Limite de Uso
- [ ] Como Oficina Starter:
  - [ ] Criei 50 atendimentos
  - [ ] Modal de aviso apareceu em 70 atendimentos (70% do limite)
  - [ ] Modal de aviso apareceu em 90 atendimentos (90% do limite)
  - [ ] Não consegui criar o 101º atendimento ✅
- [ ] Como Proprietário Free:
  - [ ] Consegui adicionar 1 veículo
  - [ ] Modal de upgrade apareceu ao tentar adicionar 2º veículo ✅

### Passo 12: Teste de Gerenciamento de Assinatura
- [ ] No dashboard, cliquei em "Gerenciar Assinatura"
- [ ] Stripe Customer Portal abriu ✅
- [ ] Consegui ver:
  - [ ] Próxima cobrança
  - [ ] Histórico de faturas
  - [ ] Opção de cancelar
  - [ ] Opção de atualizar cartão

### Passo 13: Teste de Cancelamento
- [ ] No Customer Portal, cliquei em "Cancelar assinatura"
- [ ] Escolhi "Cancelar ao fim do período de teste"
- [ ] Confirmei cancelamento
- [ ] No Supabase, verifiquei que `cancel_at_period_end = true` ✅

---

## 🔍 PARTE 5: Verificações Finais

### Passo 14: Executar Queries de Verificação
- [ ] Copiei o arquivo `VERIFICACAO_PLANOS_E_LIMITES.sql`
- [ ] Executei queries 1-12 no Supabase SQL Editor
- [ ] Todas retornaram resultados esperados ✅

### Passo 15: Verificar Logs
- [ ] **Logs do Stripe**:
  - [ ] Acessei https://dashboard.stripe.com/test/logs
  - [ ] Vi eventos de checkout e webhooks ✅
  - [ ] Nenhum erro (status 200) ✅
- [ ] **Logs do Supabase**:
  - [ ] Acessei https://app.supabase.com/project/sqnoxtuzoccjstlzekhc/logs/edge-functions
  - [ ] Vi chamadas para `create-checkout-session` ✅
  - [ ] Vi chamadas para `stripe-webhook` ✅
  - [ ] Nenhum erro (status 200) ✅

### Passo 16: Verificar Feature Flags
- [ ] No `.env`, verifiquei:
  ```bash
  # Para usuários FREE
  VITE_VEHICLE_API_MODE="fipe"          # Cadastro manual
  VITE_MAINTENANCE_MODE="generic"       # Revisões genéricas

  # Para usuários PAGOS (Starter, Professional, Pro)
  VITE_VEHICLE_API_MODE="plate"         # Busca por placa
  VITE_MAINTENANCE_MODE="manufacturer"  # Revisões do fabricante
  ```
- [ ] Testei que:
  - [ ] Usuário FREE vê formulário manual de veículo ✅
  - [ ] Usuário PAGO vê campo de busca por placa ✅

---

## 🎯 PARTE 6: Testes de Cenários Específicos

### Cenário 1: Oficina Starter - Trial de 14 dias
- [ ] Registrei como oficina
- [ ] Assinei plano Starter
- [ ] Verifiquei banner: "Período de teste - 14 dias restantes"
- [ ] Criei 50 atendimentos (dentro do limite)
- [ ] Não vi nenhuma cobrança no Stripe (trial ativo)
- [ ] Após 14 dias (ou simulação), primeiro pagamento será cobrado ✅

### Cenário 2: Proprietário Pro - Trial de 30 dias
- [ ] Registrei como proprietário
- [ ] Assinei plano Pro
- [ ] Verifiquei banner: "Período de teste - 30 dias restantes"
- [ ] Adicionei 5 veículos (ilimitado)
- [ ] Acessei recursos avançados (alertas inteligentes, QR code)
- [ ] Não vi cobrança (trial ativo) ✅

### Cenário 3: Upgrade de Plano
- [ ] Como Oficina Starter (100/mês)
- [ ] Atingi 90 atendimentos
- [ ] Cliquei em "Fazer upgrade para Professional"
- [ ] Completei pagamento
- [ ] Plano mudou para Professional
- [ ] Limites foram removidos (agora ilimitado) ✅

### Cenário 4: Downgrade/Cancelamento
- [ ] Como usuário pago, cancelei assinatura
- [ ] Verifiquei que:
  - [ ] Ainda tenho acesso até fim do período pago
  - [ ] Banner mostra "Cancela em [data]"
  - [ ] Após fim do período, volto para plano Free ✅

### Cenário 5: Reembolso (se cancelar durante trial)
- [ ] Assinei plano
- [ ] Cancelei durante trial (antes dos 14/30 dias)
- [ ] Verifiquei que:
  - [ ] Nenhuma cobrança foi feita
  - [ ] Trial foi interrompido
  - [ ] Voltei para plano Free imediatamente ✅

---

## 📊 PARTE 7: Métricas e Monitoramento

### Passo 17: Dashboard de Métricas
- [ ] No Supabase, executei query #10 do arquivo de verificação
- [ ] Vi métricas:
  - [ ] Total de usuários
  - [ ] Usuários com assinatura paga
  - [ ] Usuários em trial
  - [ ] Revenue mensal estimado
  - [ ] Taxa de conversão trial → pago

---

## 🚨 PARTE 8: Troubleshooting (se houver problemas)

### Problema: Checkout não abre
- [ ] Verifiquei que Edge Function foi deployada:
  ```bash
  npx supabase functions list
  ```
- [ ] Verifiquei logs do Supabase Edge Functions
- [ ] Verifiquei que `STRIPE_SECRET_KEY` está no Supabase
- [ ] Testei manualmente a função:
  ```bash
  curl -X POST \
    https://sqnoxtuzoccjstlzekhc.supabase.co/functions/v1/create-checkout-session \
    -H "Content-Type: application/json" \
    -d '{"priceId":"price_test","userId":"user123","userEmail":"test@test.com"}'
  ```

### Problema: Assinatura não aparece após pagamento
- [ ] Verifiquei webhook no Stripe Dashboard
- [ ] Verifiquei logs do webhook (deve ter eventos enviados)
- [ ] Verifiquei que `STRIPE_WEBHOOK_SECRET` está correto
- [ ] Testei enviar webhook manualmente no Stripe

### Problema: Trial não está funcionando
- [ ] Verifiquei que produtos têm trial configurado no Stripe
- [ ] Verifiquei query:
  ```sql
  SELECT trial_start, trial_end FROM subscriptions
  WHERE user_id = 'MEU_ID';
  ```
- [ ] Verifiquei que `trial_end` está 14 ou 30 dias no futuro

### Problema: Limites não estão sendo respeitados
- [ ] Executei queries de verificação (#4 e #5 do arquivo SQL)
- [ ] Verifiquei que `monthly_usage` está sendo incrementado
- [ ] Testei função:
  ```sql
  SELECT can_create_more('USER_ID', 'workshop');
  ```

---

## ✅ CHECKLIST FINAL

Marque aqui quando TUDO estiver funcionando:

- [ ] ✅ Stripe em modo teste
- [ ] ✅ 3 produtos criados com trials corretos
- [ ] ✅ API Keys configuradas
- [ ] ✅ Edge Functions deployadas
- [ ] ✅ Webhooks configurados
- [ ] ✅ Checkout funcionando
- [ ] ✅ Pagamento com cartão teste OK
- [ ] ✅ Assinatura aparece no Supabase
- [ ] ✅ Trials de 14/30 dias funcionando
- [ ] ✅ Limites de uso respeitados
- [ ] ✅ Customer Portal funcionando
- [ ] ✅ Cancelamento funcionando
- [ ] ✅ Feature flags corretos (FIPE vs Placa)
- [ ] ✅ Logs sem erros

---

## 🎉 PARABÉNS!

Se você marcou TODAS as caixas acima, sua integração com Stripe está **100% funcional em modo teste**!

Agora você pode:
1. Testar à vontade com cartões de teste
2. Simular diferentes cenários
3. Quando estiver pronto, migrar para produção (veja `CONFIGURACAO_STRIPE_MODO_TESTE.md`)

---

## 📝 Próximos Passos

Quando estiver pronto para **produção**:
1. [ ] Criar produtos no Stripe em modo LIVE
2. [ ] Obter API keys de produção (pk_live_ e sk_live_)
3. [ ] Atualizar variáveis de ambiente
4. [ ] Configurar webhook de produção
5. [ ] Testar com cartão real (pequeno valor)
6. [ ] Pedir reembolso do teste
7. [ ] Ativar para clientes reais 🚀

---

**Dúvidas?** Consulte `CONFIGURACAO_STRIPE_MODO_TESTE.md` para instruções detalhadas de cada passo.
