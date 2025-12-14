# 🎯 Configurar Ambiente Demo - SEM PROGRAMAR!

## ✅ O Que Você Precisa

- Acesso ao Supabase (você já tem)
- Navegador web
- 10 minutos

**NADA MAIS!** Sem Node.js, sem terminal, sem programação!

---

## 🚀 Passo a Passo Super Simples

### Passo 1: Abrir Supabase SQL Editor

1. Ir para: https://supabase.com/dashboard
2. Fazer login
3. Selecionar projeto "auto-track-car-value"
4. No menu lateral, clicar em **🔍 SQL Editor**
5. Clicar em **"New query"**

---

### Passo 2: Executar Limpeza (Copiar e Colar)

**Copiar TODO este bloco e colar no SQL Editor:**

```sql
-- ETAPA 1: Deletar veículos com placas não reais
DELETE FROM maintenances
WHERE vehicle_id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

DELETE FROM vehicle_manufacturer_revisions
WHERE vehicle_id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

DELETE FROM vehicles
WHERE id IN (
  '59005700-40b8-407a-8c7a-79cf461d623c',
  '5de40ee9-707b-410c-ba70-7538159f72cb',
  '8f789253-6a63-4a62-8703-633463b7f789',
  'ee92734e-7600-4c6c-9274-75b95ebd3157'
);

-- Ver quantos veículos restaram
SELECT COUNT(*) as total_veiculos FROM vehicles;
```

**Clicar em "Run" ou Ctrl+Enter**

✅ **Resultado esperado:** Mostra quantos veículos restaram (ex: 15)

---

### Passo 3: Buscar ID da Oficina

**Nova query (clicar "New query" novamente):**

```sql
SELECT
  w.id as workshop_id,
  w.name,
  p.email
FROM workshops w
JOIN profiles p ON p.id = w.owner_id
WHERE p.email = 'silva.mateush01@gmail.com';
```

**Clicar em "Run"**

✅ **Resultado:** Vai mostrar algo como:
```
workshop_id                           | name          | email
--------------------------------------|---------------|------------------------
a1b2c3d4-e5f6-7890-abcd-1234567890ab | Oficina Silva | silva.mateush01@gmail.com
```

**📝 COPIAR o `workshop_id` completo!** (vai usar nos próximos passos)

---

### Passo 4: Limpar Manutenções da Oficina

**Nova query, substituir `WORKSHOP_ID_AQUI` pelo ID que você copiou:**

```sql
-- SUBSTITUIR WORKSHOP_ID_AQUI pelo ID copiado acima!

DELETE FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI'::uuid;

DELETE FROM maintenances
WHERE created_by_workshop_id = 'WORKSHOP_ID_AQUI'::uuid;

-- Verificar
SELECT COUNT(*) as manutencoes_restantes FROM maintenances;
```

**Clicar em "Run"**

---

### Passo 5: Resetar Cache de Revisões

**Nova query:**

```sql
-- Resetar flag para forçar nova busca
UPDATE vehicles
SET
  revisions_fetched = false,
  revisions_fetched_at = null;

-- Verificar
SELECT COUNT(*) as veiculos_resetados FROM vehicles;
```

**Clicar em "Run"**

✅ **Resultado:** Número de veículos resetados

---

### Passo 6: Criar Manutenções Antigas

**Nova query, substituir `WORKSHOP_ID_AQUI`:**

```sql
-- SUBSTITUIR WORKSHOP_ID_AQUI pelo ID do Passo 3!

INSERT INTO maintenances (vehicle_id, date, service_type, description, cost, km, created_by_workshop_id)
SELECT
  v.id,
  (now() - interval '12 months'), -- 12 meses atrás
  'Troca de óleo',
  'Manutenção básica',
  25000, -- R$ 250,00
  GREATEST(v.current_km - 10000, 0),
  'WORKSHOP_ID_AQUI'::uuid
FROM vehicles v
WHERE NOT EXISTS (
  SELECT 1 FROM maintenances m WHERE m.vehicle_id = v.id
);

-- Verificar
SELECT COUNT(*) as manutencoes_criadas FROM maintenances;
```

**Clicar em "Run"**

✅ **Resultado:** "Success. X rows inserted."

---

### Passo 7: Vincular Manutenções à Oficina

**Nova query, substituir `WORKSHOP_ID_AQUI`:**

```sql
-- SUBSTITUIR WORKSHOP_ID_AQUI pelo ID do Passo 3!

INSERT INTO workshop_maintenances (workshop_id, maintenance_id)
SELECT
  'WORKSHOP_ID_AQUI'::uuid,
  m.id
FROM maintenances m
WHERE NOT EXISTS (
  SELECT 1
  FROM workshop_maintenances wm
  WHERE wm.maintenance_id = m.id
  AND wm.workshop_id = 'WORKSHOP_ID_AQUI'::uuid
)
ON CONFLICT DO NOTHING;

-- Verificar
SELECT COUNT(*) as vinculacoes FROM workshop_maintenances
WHERE workshop_id = 'WORKSHOP_ID_AQUI'::uuid;
```

**Clicar em "Run"**

✅ **Resultado:** "Success. X rows inserted."

---

### Passo 8: Verificar Clientes Vinculados

**Nova query, substituir `WORKSHOP_ID_AQUI`:**

```sql
-- SUBSTITUIR WORKSHOP_ID_AQUI pelo ID do Passo 3!

SELECT DISTINCT
  v.plate,
  v.brand,
  v.model,
  v.year,
  p.full_name as proprietario,
  COUNT(m.id) as total_manutencoes,
  MAX(m.date) as ultima_manutencao
FROM vehicles v
JOIN profiles p ON p.id = v.user_id
JOIN maintenances m ON m.vehicle_id = v.id
JOIN workshop_maintenances wm ON wm.maintenance_id = m.id
WHERE wm.workshop_id = 'WORKSHOP_ID_AQUI'::uuid
GROUP BY v.id, v.plate, v.brand, v.model, v.year, p.full_name
ORDER BY MAX(m.date) ASC;
```

**Clicar em "Run"**

✅ **Resultado:** Lista de todos os clientes da oficina

---

## 🎉 Passo 9: Testar o Sistema!

### 1. Fazer Login na Oficina

- Ir para: https://www.vybo.com.br
- Login: **silva.mateush01@gmail.com**
- Senha: (sua senha normal)

### 2. Ir para Aba "Oportunidades"

Deve mostrar:
- ✅ Lista de clientes
- ✅ Manutenções atrasadas
- ✅ Receita potencial

### 3. O Que Vai Acontecer Automaticamente

**🔄 Na primeira vez que você abrir Oportunidades:**

1. Sistema detecta que veículos não têm cache (`revisions_fetched = false`)
2. **Busca AUTOMATICAMENTE na API SUIV** para cada veículo
3. Salva revisões no cache
4. Calcula oportunidades
5. Mostra receita potencial

**⏱️ Primeira vez:** Pode demorar alguns segundos (buscando da API)

**💾 Próximas vezes:** Instantâneo (usa cache!)

---

## ❓ E a Atualização dos Dados dos Veículos?

### Opção 1: Deixar o Sistema Fazer Automaticamente (RECOMENDADO)

Quando você ou clientes buscarem por placa no sistema, ele vai:
1. Buscar na API SUIV
2. Atualizar marca, modelo, versão, ano automaticamente
3. Salvar no banco

**Não precisa fazer nada manual!**

### Opção 2: Buscar Placas Manualmente (Opcional)

Se quiser garantir que TODOS os veículos tenham dados atualizados ANTES:

1. **Listar placas:**
```sql
SELECT plate FROM vehicles ORDER BY created_at;
```

2. **Para cada placa, buscar no sistema:**
   - Login como oficina
   - Novo Atendimento > Buscar placa
   - Sistema atualiza automaticamente

3. **OU buscar via API e atualizar via SQL:**
   - Abrir: `https://api.suiv.com.br/api/v4/VehicleInfo/byplate?key=SUA_KEY&plate=ABC1234`
   - Copiar resposta
   - Atualizar via SQL:
   ```sql
   UPDATE vehicles
   SET
     brand = 'VOLKSWAGEN',
     model = 'GOL',
     version = '1.0 FLEX',
     year = 2020,
     year_fab = 2019
   WHERE plate = 'ABC1234';
   ```

---

## ✅ Checklist Final

Após executar todos os passos:

- [ ] Veículos não reais deletados (Passo 2)
- [ ] Workshop ID obtido (Passo 3)
- [ ] Manutenções antigas deletadas (Passo 4)
- [ ] Cache resetado (Passo 5)
- [ ] Manutenções criadas (Passo 6)
- [ ] Manutenções vinculadas (Passo 7)
- [ ] Clientes verificados (Passo 8)
- [ ] Login na oficina funciona (Passo 9)
- [ ] Oportunidades aparecem (Passo 9)
- [ ] Receita potencial calculada (Passo 9)

---

## 🆘 Problemas?

### "Oportunidades não aparecem"

**Causa:** Faltou executar Passo 6 ou 7

**Solução:** Executar novamente Passos 6 e 7

### "Receita está zerada"

**Causa:** Cache de revisões ainda não foi populado

**Solução:**
1. Aguardar alguns segundos
2. Recarregar página (F5)
3. Sistema busca da API automaticamente

### "Erro ao executar SQL"

**Causa:** Esqueceu de substituir `WORKSHOP_ID_AQUI`

**Solução:** Copiar workshop_id do Passo 3 e substituir

---

## 💡 Resumo

**Você NÃO precisa:**
- ❌ Programar nada
- ❌ Instalar Node.js
- ❌ Usar terminal
- ❌ Configurar ambiente
- ❌ Executar scripts TypeScript

**Você SÓ precisa:**
- ✅ Copiar SQL
- ✅ Colar no Supabase
- ✅ Clicar "Run"
- ✅ Substituir `WORKSHOP_ID_AQUI` quando pedir

**O sistema faz o resto automaticamente!** 🎉

---

## 🎯 Resultado Final

Após tudo isso:
- ✅ 15+ veículos com placas reais
- ✅ Oficina demo configurada
- ✅ Manutenções antigas criadas
- ✅ Sistema pronto para buscar da API automaticamente
- ✅ Oportunidades calculadas
- ✅ Ambiente pronto para demonstração!

**Sucesso!** 🚀
