# ✅ MVP Checklist - VYBO

## 🔥 CRÍTICO (Fazer Primeiro)

- [ ] **Cache de Revisões API SUIV**
  - [ ] Testar busca nova placa (chama API)
  - [ ] Testar busca placa existente (usa cache)
  - [ ] Verificar logs de cache funcionando
  - [ ] Confirmar economia (zero chamadas duplicadas)
  - Arquivo: `src/services/vehicleRevisionsCache.ts`

- [ ] **Oportunidades - Receita Potencial**
  - [ ] Aba mostra clientes corretamente
  - [ ] Cálculos de receita corretos
  - [ ] Filtros funcionando
  - [ ] Preços customizados têm prioridade
  - Arquivo: `src/pages/workshop/Opportunities.tsx`

- [ ] **Planos - Regras e Restrições**
  - [ ] Enum de planos criado
  - [ ] Middleware de verificação
  - [ ] Usuário Free não acessa alertas
  - [ ] Starter limitado a 5 veículos
  - [ ] Professional liberado
  - [ ] Modal "Upgrade" ao atingir limite

---

## 💰 MONETIZAÇÃO (MVP)

- [ ] **Stripe - Produtos**
  - [ ] Criar "Oficina Starter" (R$ 99/mês)
  - [ ] Criar "Oficina Professional" (R$ 299/mês)
  - [ ] Atualizar "Proprietário Pro" (R$ 29,90/mês)
  - [ ] Documentar Price IDs no .env
  - [ ] Configurar webhooks

- [ ] **Trial**
  - [ ] Campo `trial_ends_at` em profiles
  - [ ] Oficina → 14 dias trial automático
  - [ ] Pro → 7 dias trial automático
  - [ ] Banner "X dias restantes"
  - [ ] Bloquear acesso após trial sem pagar
  - [ ] Webhook remove trial ao pagar

---

## 📧 INFRAESTRUTURA

- [ ] **SendGrid - Anti-SPAM**
  - [ ] Verificar domínio vybo.com.br
  - [ ] Configurar SPF, DKIM, DMARC no DNS
  - [ ] Criar sender: noreply@vybo.com.br
  - [ ] Testar Gmail, Outlook, Yahoo
  - [ ] Score > 95%

- [ ] **WhatsApp**
  - [ ] Corrigir formato do link
  - [ ] Testar em mobile e desktop
  - [ ] Número formatado corretamente

---

## 🎯 FUNCIONALIDADES ESSENCIAIS

- [ ] **Proprietário Free**
  - [x] Cadastrar 1 veículo
  - [x] Ver histórico de manutenções
  - [ ] ❌ Sem alertas (upgrade pra Pro)

- [ ] **Proprietário Pro (R$ 29,90/mês)**
  - [ ] Cadastrar até 3 veículos
  - [ ] Alertas de manutenção
  - [ ] Histórico completo
  - [ ] 7 dias trial

- [ ] **Oficina Starter (R$ 99/mês)**
  - [ ] Até 50 veículos/mês
  - [ ] Aba Oportunidades
  - [ ] Dashboard básico
  - [ ] ❌ Sem preços customizados
  - [ ] 14 dias trial

- [ ] **Oficina Professional (R$ 299/mês)**
  - [ ] Veículos ilimitados
  - [ ] Oportunidades avançadas
  - [ ] Preços customizados
  - [ ] Relatórios
  - [ ] Suporte prioritário
  - [ ] 14 dias trial

---

## 🧪 TESTES FINAIS

- [ ] Criar conta Free → verificar limitações
- [ ] Upgrade para Pro → testar pagamento
- [ ] Trial acabar → verificar bloqueio
- [ ] Buscar placa 2x → confirmar cache
- [ ] Email de boas-vindas → não no SPAM
- [ ] WhatsApp → abrir conversa
- [ ] Mobile → testar todas telas
- [ ] Oportunidades → calcular receita

---

## 🚀 PRONTO PARA LANÇAR

- [ ] ✅ API cache funcionando (economia 98%)
- [ ] ✅ Planos no Stripe configurados
- [ ] ✅ Restrições por plano ativas
- [ ] ✅ Trial funcionando
- [ ] ✅ Pagamentos processando
- [ ] ✅ Emails chegando (não SPAM)
- [ ] ✅ Oportunidades calculando corretamente
- [ ] ✅ Mobile responsivo
- [ ] ✅ Sem bugs críticos
- [ ] ✅ Documentação atualizada

---

## 📊 KPIs Pós-Lançamento

Acompanhar semanalmente:
- Cadastros novos (Free vs Paid)
- Taxa de conversão Trial → Pago
- Churn rate (cancelamentos)
- Chamadas de API SUIV (deve ser ~100/mês)
- Receita MRR (Monthly Recurring Revenue)
- NPS (Net Promoter Score)

---

**Data início:** ___/___/2024
**Meta lançamento:** ___/___/2024
**Dias restantes:** ___
