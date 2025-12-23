# Diagnóstico: Por que os alertas não aparecem?

## 🎯 Objetivo

Descobrir se existem revisões salvas no banco de dados e por que elas não aparecem na aba Alertas.

## 📊 Passo 1: Verificar o Banco de Dados

Abra o **Supabase SQL Editor** e execute as queries do arquivo `migrations/verify-revisions-cache.sql`.

### Query 1: Visão Geral dos Veículos

```sql
SELECT
  v.id,
  v.brand,
  v.model,
  v.year,
  v.revisions_fetched,
  v.revisions_fetched_at,
  COUNT(vmr.id) as revision_count
FROM vehicles v
LEFT JOIN vehicle_manufacturer_revisions vmr ON vmr.vehicle_id = v.id
GROUP BY v.id, v.brand, v.model, v.year, v.revisions_fetched, v.revisions_fetched_at
ORDER BY v.created_at DESC;
```

**O que procurar:**
- Se `revision_count` > 0 → ✅ Revisões foram salvas!
- Se `revision_count` = 0 e `revisions_fetched` = true → ❌ Problema: marcado como buscado mas sem dados
- Se `revision_count` = 0 e `revisions_fetched` = false → ⚠️ Nunca tentou buscar da API

### Query 2: Total de Revisões no Sistema

```sql
SELECT COUNT(*) as total_revisions
FROM vehicle_manufacturer_revisions;
```

**Se total_revisions > 0:** Existem revisões salvas! O problema é na recuperação ou cálculo de alertas.

**Se total_revisions = 0:** Nenhuma revisão foi salva. Provavelmente todas as tentativas falharam.

### Query 3: Ver Todas as Revisões Salvas

```sql
SELECT
  v.brand,
  v.model,
  v.year,
  vmr.category,
  vmr.item,
  vmr.description,
  vmr.km_interval,
  vmr.time_interval,
  vmr.criticality,
  vmr.created_at
FROM vehicle_manufacturer_revisions vmr
JOIN vehicles v ON v.id = vmr.vehicle_id
ORDER BY v.brand, v.model, vmr.category, vmr.item;
```

**O que procurar:**
- Quais veículos têm revisões salvas?
- Que tipo de revisões foram salvas? (Troca de óleo, filtros, etc.)
- Quando foram salvas? (`created_at`)

## 🔍 Passo 2: Verificar os Logs do Console

Depois de fazer deploy das mudanças, abra o site e:

1. **Faça Ctrl + Shift + R** para limpar o cache
2. **Abra o DevTools (F12)** e vá na aba Console
3. **Navegue para a aba "Alertas"**

### Logs Esperados

#### ✅ Cenário 1: Revisões encontradas no banco

```
[CACHE] 🔍 getVehicleRevisions chamado para: CHEVROLET COBALT 2014 (ID: xxx)
[CACHE] 1️⃣ Verificando cache local...
[CACHE] 🔍 getCachedRevisions: Buscando do banco para vehicle_id = xxx
[CACHE] 📊 getCachedRevisions: Encontrou 15 revisões no banco
[CACHE] ✅ Revisões encontradas: ["Motor - Troca de óleo", "Filtros - Filtro de ar", ...]
[CACHE] ✅ Usando 15 revisões do cache para veículo xxx
[CACHE] 💰 API call economizado! 🎉
```

**Se você vê isso:** As revisões estão no banco e foram recuperadas! O problema está no cálculo dos alertas.

#### ⚠️ Cenário 2: Nenhuma revisão no banco

```
[CACHE] 🔍 getCachedRevisions: Buscando do banco para vehicle_id = xxx
[CACHE] 📊 getCachedRevisions: Encontrou 0 revisões no banco
[CACHE] ⚠️ Nenhuma revisão encontrada no banco para vehicle_id xxx
[CACHE] Cache vazio, verificando se já foi consultado antes...
```

**Se você vê isso:** Nenhuma revisão foi salva. Pode ser:
- API quota esgotada antes de salvar qualquer coisa
- Erro de RLS policies
- Erro ao salvar no banco

#### ❌ Cenário 3: Erro de RLS Policy

```
[CACHE] ❌ Error fetching cached revisions: {
  message: "permission denied for table vehicle_manufacturer_revisions",
  code: "42501"
}
```

**Se você vê isso:** O usuário não tem permissão para acessar os dados. Precisamos revisar as RLS policies.

### Logs do Cálculo de Alertas

```
[ALERTS] 🔄 Iniciando cálculo de alertas...
[ALERTS] Total de veículos: 1
[ALERTS] Total de manutenções: 0
[ALERTS] 🚗 Processando veículo: CHEVROLET COBALT 2014 (ID: xxx)
[ALERTS] 📋 Revisões obtidas para CHEVROLET COBALT: 15
[ALERTS] 📝 Convertidas 15 recomendações
[ALERTS] ✅ Cálculo concluído: 8 alertas gerados
[ALERTS] Alertas: ["CHEVROLET COBALT 2014 - Troca de óleo próxima — faltam 300 km", ...]
```

**Se você vê alertas gerados:** O sistema está funcionando! Se não aparecem na tela, o problema é no componente React.

## 🔧 Cenários Possíveis e Soluções

### Cenário A: Revisões no DB mas não aparecem alertas

**Sintomas:**
- Query 1 mostra `revision_count > 0`
- Logs mostram "Revisões encontradas" e "Usando X revisões do cache"
- Mas `[ALERTS] Cálculo concluído: 0 alertas gerados`

**Causa:** As revisões existem mas não atendem aos critérios de alerta (não estão atrasadas nem próximas).

**Solução:** Isso é normal! Alertas só aparecem se:
- Manutenção está atrasada (passou do KM ou tempo)
- Manutenção está próxima (faltam menos de 500 km ou 15 dias)

### Cenário B: Nenhuma revisão salva no DB

**Sintomas:**
- Query 2 mostra `total_revisions = 0`
- Logs mostram "Nenhuma revisão encontrada no banco"

**Causa:** A API quota foi atingida antes de salvar qualquer dado, ou todas as tentativas falharam.

**Solução:**
- Aguardar reset da quota da API SUIV
- OU usar outra chave de API
- OU resetar manualmente com `migrations/reset-revisions-cache.sql` e tentar novamente

### Cenário C: Erro de RLS Policy

**Sintomas:**
- Logs mostram erro "permission denied"

**Causa:** As políticas de segurança do Supabase estão bloqueando o acesso.

**Solução:** Revisar as RLS policies na tabela `vehicle_manufacturer_revisions`.

## 📝 Próximos Passos

1. ✅ Execute as queries SQL no Supabase
2. ✅ Faça deploy do código atualizado
3. ✅ Abra o Console e navegue para "Alertas"
4. ✅ Copie e cole os logs aqui
5. ✅ Me informe o que encontrou no banco de dados

Com essas informações, poderei identificar exatamente onde está o problema!
