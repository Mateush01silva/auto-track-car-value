# 📋 Estrutura Trello - VYBO (Auto Track Car Value)

## 🎯 Listas Recomendadas

```
📥 BACKLOG          → Ideias e tarefas futuras
🔵 TO DO            → Próximas tarefas priorizadas
🟡 IN PROGRESS      → Trabalho em andamento (limite: 3 cards)
🧪 TESTING          → Aguardando testes/validação
✅ DONE (Esta Semana) → Concluídas recentemente
📦 ARCHIVED         → Tarefas antigas (arquivar semanalmente)
```

---

## 🏷️ Labels Sugeridos

| Label | Cor | Uso |
|-------|-----|-----|
| 🔴 **CRÍTICO** | Vermelho | Bloqueadores, bugs graves |
| 🟠 **ALTA PRIORIDADE** | Laranja | Importante para MVP/lançamento |
| 🟡 **MÉDIA PRIORIDADE** | Amarelo | Melhorias significativas |
| 🟢 **BAIXA PRIORIDADE** | Verde | Nice to have |
| 🔵 **API** | Azul | Integrações de API |
| 🟣 **PAGAMENTO** | Roxo | Stripe, planos, billing |
| ⚫ **BACKEND** | Preto | Lógica de servidor, database |
| ⚪ **FRONTEND** | Branco | UI/UX, componentes visuais |
| 🟤 **DOCUMENTAÇÃO** | Marrom | Docs, guias, READMEs |
| 💰 **MONETIZAÇÃO** | Dourado | Conversão, planos, receita |

---

## 📌 Cards Detalhados - Prontos para Trello

### 🔥 LISTA: TO DO (ALTA PRIORIDADE)

---

#### Card 1: 🔴 [API] Validar e Otimizar Cache de Revisões SUIV

**Descrição:**
Garantir que a API SUIV é consultada apenas UMA VEZ por placa, usando o sistema de cache implementado.

**Checklist:**
- [ ] Testar busca de placa nova (deve chamar API)
- [ ] Testar busca de placa existente (deve usar cache)
- [ ] Validar logs: `[CACHE] Using cached revisions`
- [ ] Verificar tabela `vehicle_manufacturer_revisions` populada
- [ ] Confirmar flag `revisions_fetched = true` após primeira busca
- [ ] Testar em ambos perfis (Proprietário e Oficina)
- [ ] Medir economia: contar chamadas de API antes/depois

**Arquivos relacionados:**
- `src/services/vehicleRevisionsCache.ts`
- `src/hooks/useMaintenanceAlerts.ts`
- `supabase/migrations/20251213000001_add_vehicle_revisions_cache.sql`

**Critério de aceite:**
- Cache funciona 100% (zero chamadas duplicadas)
- Oportunidades aparecem corretamente
- Logs confirmam uso de cache

**Labels:** 🔴 CRÍTICO, 🔵 API

**Estimativa:** 4h

---

#### Card 2: 🟠 [Oportunidades] Corrigir Cálculo de Receita Potencial

**Descrição:**
Aba Oportunidades deve puxar revisões do cache e calcular receita potencial corretamente.

**Checklist:**
- [ ] Verificar se `useMaintenanceAlerts` usa cache
- [ ] Confirmar que preços customizados têm prioridade
- [ ] Validar cálculo de KM atrasado
- [ ] Testar filtros (criticidade, ordenação)
- [ ] Verificar indicador (*) quando usa preço customizado
- [ ] Testar com múltiplos clientes
- [ ] Validar soma de receita potencial no dashboard

**Arquivos relacionados:**
- `src/pages/workshop/Opportunities.tsx`
- `src/hooks/useMaintenanceAlerts.ts`

**Critério de aceite:**
- Oportunidades listam corretamente
- Receita potencial calculada com precisão
- Filtros funcionam

**Labels:** 🟠 ALTA PRIORIDADE, ⚫ BACKEND

**Estimativa:** 6h

---

#### Card 3: 💰 [Stripe] Criar Produtos e Preços - Planos Oficina

**Descrição:**
Configurar produtos no Stripe para planos de oficina (Starter e Professional).

**Checklist:**

**Stripe Dashboard:**
- [ ] Criar produto "VYBO Oficina - Starter"
  - Preço: R$ 99/mês (ou definir)
  - Limite: 50 veículos/mês
  - Trial: 14 dias
- [ ] Criar produto "VYBO Oficina - Professional"
  - Preço: R$ 299/mês (ou definir)
  - Limite: ilimitado
  - Funcionalidades extras
- [ ] Atualizar produto "VYBO Proprietário - Pro"
  - Novo preço: R$ 29,90/mês (ou definir)
  - Trial: 7 dias

**No Código:**
- [ ] Adicionar Price IDs no `.env`
- [ ] Atualizar constantes de planos
- [ ] Configurar webhooks do Stripe

**Arquivos relacionados:**
- `.env` (adicionar STRIPE_PRICE_ID_*)
- `src/config/plans.ts` (ou criar se não existir)

**Critério de aceite:**
- 3 produtos criados no Stripe
- Price IDs documentados
- Webhooks funcionando

**Labels:** 💰 MONETIZAÇÃO, 🟣 PAGAMENTO

**Estimativa:** 3h

---

#### Card 4: 🟣 [Planos] Definir Regras e Restrições por Plano

**Descrição:**
Implementar lógica de restrições conforme o plano do usuário (Starter, Professional, Pro).

**Checklist:**

**Tabela de Funcionalidades:**
| Funcionalidade | Free | Starter | Professional | Pro |
|----------------|------|---------|--------------|-----|
| Veículos | 1 | 5 | Ilimitado | 3 |
| Histórico de manutenções | ✅ | ✅ | ✅ | ✅ |
| Alertas | ❌ | ✅ | ✅ | ✅ |
| Oportunidades (Oficina) | - | ✅ | ✅ | - |
| Preços customizados | - | ❌ | ✅ | - |
| Relatórios avançados | - | ❌ | ✅ | ✅ |
| Suporte prioritário | - | ❌ | ✅ | ✅ |

**Implementação:**
- [ ] Criar enum de planos
- [ ] Criar função `canAccessFeature(user, feature)`
- [ ] Adicionar coluna `plan_type` em `profiles`
- [ ] Adicionar coluna `plan_expires_at` em `profiles`
- [ ] Implementar middleware de verificação
- [ ] Bloquear rotas/features conforme plano
- [ ] Mostrar modal "Upgrade" quando atingir limite

**Arquivos a criar/modificar:**
- `src/types/plans.ts`
- `src/hooks/usePlanLimits.ts`
- `src/components/UpgradeModal.tsx`
- `supabase/migrations/*_add_plan_fields.sql`

**Critério de aceite:**
- Usuário Free não acessa alertas
- Starter limitado a 5 veículos
- Professional tem tudo liberado
- Modal de upgrade aparece ao atingir limite

**Labels:** 🔴 CRÍTICO, 💰 MONETIZAÇÃO, ⚫ BACKEND

**Estimativa:** 12h

---

#### Card 5: 🟡 [Trial] Implementar Lógica de Período Trial

**Descrição:**
Período de teste gratuito: 14 dias (Oficinas) e 7 dias (Proprietários Pro).

**Checklist:**
- [ ] Adicionar campo `trial_ends_at` em `profiles`
- [ ] Ao criar conta Oficina → definir trial 14 dias
- [ ] Ao upgrade para Pro → definir trial 7 dias
- [ ] Criar função `isInTrial(user)`
- [ ] Criar função `trialDaysRemaining(user)`
- [ ] Mostrar banner "X dias restantes de trial"
- [ ] Ao fim do trial → redirecionar para página de pagamento
- [ ] Bloquear acesso se trial expirado e sem pagamento
- [ ] Webhook Stripe → marcar `trial_ends_at = null` ao pagar

**Arquivos relacionados:**
- `src/hooks/useTrial.ts` (criar)
- `src/components/TrialBanner.tsx` (criar)
- `supabase/migrations/*_add_trial_fields.sql`

**Critério de aceite:**
- Trial funciona automaticamente
- Banner aparece mostrando dias restantes
- Acesso bloqueado após trial sem pagamento
- Pagamento remove trial e libera acesso

**Labels:** 🟠 ALTA PRIORIDADE, 💰 MONETIZAÇÃO

**Estimativa:** 8h

---

#### Card 6: 📧 [SendGrid] Configurar Autenticação e Evitar SPAM

**Descrição:**
Configurar SendGrid corretamente para emails não caírem no SPAM.

**Checklist:**

**No SendGrid:**
- [ ] Verificar domínio (vybo.com.br)
- [ ] Configurar DNS: SPF, DKIM, DMARC
- [ ] Criar sender identity: noreply@vybo.com.br
- [ ] Habilitar link tracking
- [ ] Desabilitar click tracking (melhora deliverability)

**DNS Records (adicionar na Hostinger):**
```
Tipo: TXT
Nome: vybo.com.br
Valor: v=spf1 include:sendgrid.net ~all

Tipo: CNAME
Nome: s1._domainkey.vybo.com.br
Valor: s1.domainkey.u1234567.wl.sendgrid.net

Tipo: CNAME
Nome: s2._domainkey.vybo.com.br
Valor: s2.domainkey.u1234567.wl.sendgrid.net
```

**No Código:**
- [ ] Configurar `SENDGRID_API_KEY` no .env
- [ ] Configurar `FROM_EMAIL=noreply@vybo.com.br`
- [ ] Atualizar templates de email
- [ ] Testar envio para Gmail, Outlook, Yahoo

**Critério de aceite:**
- Emails chegam na caixa de entrada (não SPAM)
- Score de reputação > 95%
- DNS verificado no SendGrid

**Labels:** 🟠 ALTA PRIORIDADE, 🔵 API

**Estimativa:** 4h

---

#### Card 7: 💬 [WhatsApp] Corrigir Botão de Enviar Mensagem

**Descrição:**
Botão para enviar mensagem via WhatsApp não está funcionando.

**Checklist:**
- [ ] Identificar onde está o botão (qual página/componente)
- [ ] Verificar formato do link: `https://wa.me/5511999999999?text=Olá`
- [ ] Garantir que número está formatado corretamente
- [ ] Testar em mobile e desktop
- [ ] Adicionar tracking (opcional): Google Analytics event
- [ ] Verificar se telefone está sendo buscado do banco

**Formato correto:**
```typescript
const whatsappUrl = `https://wa.me/55${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
```

**Arquivos prováveis:**
- `src/components/workshop/ClientCard.tsx`
- `src/pages/workshop/Opportunities.tsx`

**Critério de aceite:**
- Botão abre WhatsApp Web/App
- Número e mensagem pré-preenchidos corretamente
- Funciona em todos os dispositivos

**Labels:** 🟢 BAIXA PRIORIDADE, ⚪ FRONTEND

**Estimativa:** 2h

---

### 📥 LISTA: BACKLOG

---

#### Card 8: 📊 [Dashboard] Gráficos de Receita Potencial

**Descrição:**
Adicionar gráficos visuais no dashboard da oficina mostrando evolução de oportunidades.

**Labels:** 🟡 MÉDIA PRIORIDADE, ⚪ FRONTEND

**Estimativa:** 6h

---

#### Card 9: 🔔 [Notificações] Sistema de Notificações Push

**Descrição:**
Notificar oficinas quando cliente atinge X dias de atraso.

**Labels:** 🟡 MÉDIA PRIORIDADE, 🔵 API

**Estimativa:** 8h

---

#### Card 10: 📄 [Relatórios] Exportar PDF de Oportunidades

**Descrição:**
Permitir oficina exportar lista de oportunidades em PDF.

**Labels:** 🟢 BAIXA PRIORIDADE, ⚪ FRONTEND

**Estimativa:** 4h

---

#### Card 11: 🎨 [UI/UX] Melhorar Responsividade Mobile

**Descrição:**
Ajustar componentes para melhor experiência em mobile.

**Labels:** 🟡 MÉDIA PRIORIDADE, ⚪ FRONTEND

**Estimativa:** 10h

---

#### Card 12: 🔐 [Segurança] Implementar Rate Limiting

**Descrição:**
Limitar requisições por IP para evitar abuso.

**Labels:** 🟡 MÉDIA PRIORIDADE, ⚫ BACKEND

**Estimativa:** 4h

---

#### Card 13: 📱 [PWA] Transformar em Progressive Web App

**Descrição:**
Adicionar suporte offline e instalação como app.

**Labels:** 🟢 BAIXA PRIORIDADE, ⚪ FRONTEND

**Estimativa:** 8h

---

#### Card 14: 🧪 [Testes] Adicionar Testes Automatizados

**Descrição:**
Implementar testes unitários e E2E com Jest/Playwright.

**Labels:** 🟡 MÉDIA PRIORIDADE, 🟤 DOCUMENTAÇÃO

**Estimativa:** 16h

---

## 📋 Template de Card Detalhado

Sempre que criar um card novo, usar este formato:

```markdown
**Título:** [Categoria] Descrição curta

**Descrição:**
Explicação detalhada do que precisa ser feito e por quê.

**Contexto:**
Link para issue, conversa, ou documentação relacionada.

**Checklist:**
- [ ] Subtarefa 1
- [ ] Subtarefa 2
- [ ] Subtarefa 3

**Arquivos relacionados:**
- `caminho/para/arquivo1.ts`
- `caminho/para/arquivo2.tsx`

**Critério de aceite:**
- Condição 1 para considerar pronto
- Condição 2 para considerar pronto

**Labels:** [labels aqui]

**Estimativa:** Xh

**Responsável:** Nome (opcional)

**Depende de:** Card #X (se houver dependência)
```

---

## 🎯 Regras do Quadro

### Limite WIP (Work In Progress)
- **Máximo 3 cards** em "IN PROGRESS" por vez
- Se já tem 3, não pode puxar mais (evita dispersão)

### Priorização
1. **CRÍTICO** → fazer primeiro
2. **ALTA PRIORIDADE** → necessário para MVP
3. **MÉDIA PRIORIDADE** → melhorias importantes
4. **BAIXA PRIORIDADE** → nice to have

### Daily/Weekly
- **Diário:** Mover cards que mudaram de status
- **Semanal:** Arquivar cards "DONE" antigos
- **Mensal:** Revisar BACKLOG e repriorizar

### Comunicação
- Comentar no card ao iniciar trabalho
- Adicionar screenshots de progresso
- Marcar o colaborador se precisar ajuda
- Usar @mentions para notificações

---

## 🔄 Fluxo de Trabalho

```
1. Card criado → BACKLOG
2. Priorizado → TO DO
3. Começou trabalho → IN PROGRESS (adicionar membro)
4. Código pronto → TESTING (adicionar checklist de testes)
5. Testado e aprovado → DONE
6. Após 1 semana → ARCHIVED
```

---

## 📊 Métricas para Acompanhar

### No Trello (usar Power-Ups):
- **Velocity Chart:** Cards concluídos por semana
- **Burn Down:** Tarefas restantes até MVP
- **Lead Time:** Tempo médio de conclusão

### Manualmente:
- % de cards DONE vs TO DO
- Bugs abertos vs fechados
- Tempo gasto vs estimado

---

## 🚀 Prioridade IMEDIATA (Esta Semana)

Ordem de execução sugerida:

1. **Card 1** - Cache de Revisões (4h) 🔴
2. **Card 2** - Oportunidades (6h) 🟠
3. **Card 6** - SendGrid (4h) 🟠
4. **Card 3** - Stripe Produtos (3h) 💰

**Total:** 17h (pode dividir em 2-3 dias)

---

## 📝 Notas Importantes

### Para o Programador Amigo:
- Acesso ao repositório: GitHub
- Acesso ao Supabase: Dashboard
- Acesso ao Stripe: Dashboard
- Documentação: `demo/` folder
- Ambiente local: instruções em README

### Onboarding Rápido:
1. Clonar repo
2. `npm install`
3. Configurar `.env` com credenciais
4. `npm run dev`
5. Ler `CACHE_API_ECONOMIA.md` (entender arquitetura)

---

## 🎉 Quando Terminar MVP

Definir como "pronto para lançamento" quando:
- ✅ Cache de API funcionando (economia confirmada)
- ✅ Planos configurados e restrições ativas
- ✅ Pagamentos via Stripe funcionando
- ✅ Trial funcionando
- ✅ Emails não caem no SPAM
- ✅ Oportunidades calculando corretamente
- ✅ Mobile responsivo
- ✅ Sem bugs críticos

---

**Criado em:** 2024-12-13
**Versão:** 1.0
**Projeto:** VYBO (Auto Track Car Value)
```
