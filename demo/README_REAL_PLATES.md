# 🎯 Ambiente de Demonstração - PLACAS REAIS

Este guia mostra como preparar o ambiente de demonstração usando **placas reais** que já existem no banco de dados.

## 📋 Pré-requisitos

- ✅ Node.js instalado
- ✅ Acesso ao Supabase
- ✅ Service Role Key do Supabase
- ✅ API SUIV configurada (.env com VITE_CAR_API_KEY)
- ✅ Migrations aplicadas:
  - `20251213000001_add_vehicle_revisions_cache.sql`
  - `20251213000002_add_year_fab_to_vehicles.sql`

## 🗂️ Arquivos Criados

1. **`cleanup-for-real-plates.sql`** - Remove veículos com placas não reais
2. **`update-vehicles-from-api.ts`** - Atualiza veículos consultando API SUIV
3. **`populate-revisions-cache.ts`** - Popula cache de revisões de fabricante
4. **`link-vehicles-to-workshop.sql`** - Vincula veículos à oficina demo

## 🚀 Passo a Passo

### Passo 1: Limpar Dados Não Reais

**Execute no Supabase SQL Editor:**

```sql
-- Abrir demo/cleanup-for-real-plates.sql e executar ETAPA 1
```

Isso vai deletar os 4 veículos com placas fictícias:
- `59005700-40b8-407a-8c7a-79cf461d623c`
- `5de40ee9-707b-410c-ba70-7538159f72cb`
- `8f789253-6a63-4a62-8703-633463b7f789`
- `ee92734e-7600-4c6c-9274-75b95ebd3157`

**Execute ETAPA 2 e 3:**

```sql
-- Buscar ID da oficina
SELECT id FROM workshops WHERE owner_id IN (
  SELECT id FROM profiles WHERE email = 'silva.mateush01@gmail.com'
);
```

Anote o `workshop_id` e substitua em ETAPA 3 para deletar as manutenções.

**Execute ETAPA 4 e 5** para verificar os veículos restantes.

---

### Passo 2: Atualizar Veículos com Dados da API

Este script busca cada placa real na API SUIV e atualiza:
- Marca (brand)
- Modelo (model)
- Versão (version)
- Ano modelo (year)
- Ano fabricação (year_fab)

**Configurar Service Role Key:**

```bash
export SUPABASE_SERVICE_KEY="sua-service-role-key-aqui"
```

**Executar script:**

```bash
npx tsx demo/update-vehicles-from-api.ts
```

**O que acontece:**
- ✅ Para cada veículo, consulta placa na API SUIV
- ✅ Atualiza dados do veículo no banco
- ✅ Marca `revisions_fetched = false` para forçar busca de revisões
- ⏱️ Aguarda 1 segundo entre cada requisição (respeita rate limit)

**Saída esperada:**
```
🚀 Iniciando atualização de veículos via API SUIV...

📊 Total de veículos a processar: 15

[1/15] Processando placa: ABC1234
  📋 Dados atuais: VOLKSWAGEN GOL (2020)
  ✅ Encontrado na API: VOLKSWAGEN GOL 1.0 FLEX (2019/2020)
  💾 Veículo atualizado com sucesso!

[2/15] Processando placa: DEF5678
  ...

✅ Sucesso: 15 veículos atualizados
⚠️ Não encontrados: 0 veículos
❌ Erros: 0 veículos
```

---

### Passo 3: Popular Cache de Revisões

Este script busca o plano de revisão de cada veículo na API SUIV e salva no banco.

**⚠️ IMPORTANTE:** Este passo faz MUITAS requisições à API SUIV:
- Para cada veículo: 4 requisições (Makers, Models, Versions, RevisionPlan)
- Exemplo: 15 veículos = 60 requisições
- **Aguarda 2 segundos entre cada veículo**
- Tempo total: ~8-10 minutos para 15 veículos

**Executar script:**

```bash
npx tsx demo/populate-revisions-cache.ts
```

**O que acontece:**
1. Busca ID da marca (Makers)
2. Busca ID do modelo (Models)
3. Busca ID da versão (Versions)
4. Busca plano de revisão (RevisionPlan)
5. Converte para formato do banco
6. Salva na tabela `vehicle_manufacturer_revisions`
7. Marca `revisions_fetched = true`

**Saída esperada:**
```
🚀 Iniciando população de cache de revisões...

📊 Total de veículos sem cache: 15

[1/15] Placa: ABC1234
📋 Processando: VOLKSWAGEN GOL (2020)
  🔍 Buscando ID da marca...
  ✅ Marca ID: 59
  🔍 Buscando ID do modelo...
  ✅ Modelo ID: 4828
  🔍 Buscando ID da versão...
  ✅ Versão ID: 6543
  🔍 Buscando plano de revisão...
  ✅ 12 itens de revisão encontrados
  💾 Inserindo 45 revisões no banco...
  ✅ Cache de revisões populado com sucesso!

[2/15] Placa: DEF5678
  ...

✅ Sucesso: 15 veículos
❌ Erros: 0 veículos
```

---

### Passo 4: Vincular Veículos à Oficina

**Execute no Supabase SQL Editor:**

Abrir `demo/link-vehicles-to-workshop.sql` e:

1. **ETAPA 1:** Buscar ID da oficina
2. **ETAPA 3:** Criar manutenções antigas (substituir `WORKSHOP_ID_AQUI`)
3. **ETAPA 4:** Vincular manutenções à oficina (substituir `WORKSHOP_ID_AQUI`)
4. **ETAPA 5:** Verificar vinculações

**Importante:** Substituir `WORKSHOP_ID_AQUI` pelo ID da oficina em todas as queries.

Isso vai:
- ✅ Criar manutenção antiga (12 meses atrás) para cada veículo
- ✅ Vincular todas as manutenções à oficina
- ✅ Permitir que oficina veja oportunidades

---

### Passo 5: Testar o Sistema

**1. Fazer login na oficina:**
- E-mail: silva.mateush01@gmail.com
- Senha: (a senha que você já usa)

**2. Ir para aba "Oportunidades"**
- Deve listar todos os veículos com manutenções atrasadas
- Deve calcular receita potencial
- Deve mostrar criticidade das manutenções

**3. Verificar detalhes:**
- Clicar em um cliente
- Ver lista de manutenções recomendadas
- Verificar se preços aparecem corretamente
- Testar filtros (criticidade, ordenação)

**4. Testar novo atendimento:**
- Ir para "Novo Atendimento"
- Buscar uma placa real
- Sistema deve encontrar automaticamente
- Mostrar marca, modelo, versão, ano

---

## 📊 Dados Esperados

### Veículos com Placas Reais
Após executar os scripts, você terá:
- ✅ Veículos com dados atualizados da API SUIV
- ✅ Cache de revisões populado (sem custo futuro de API!)
- ✅ Histórico de manutenções antigas
- ✅ Vinculação com oficina demo

### Oportunidades
A oficina deve ver:
- 🔴 Clientes com manutenções críticas (>18 meses)
- 🟡 Clientes com manutenções em breve
- 💰 Receita potencial calculada
- 📊 Estatísticas no dashboard

---

## 🔧 Troubleshooting

### Problema: Script de atualização falha com erro 401

**Causa:** API Key da SUIV inválida ou expirada

**Solução:**
1. Verificar `.env`: `VITE_CAR_API_KEY`
2. Testar API manualmente:
```bash
curl "https://api.suiv.com.br/api/v4/Makers?key=SUA_KEY"
```

### Problema: Script de revisões não encontra veículo

**Causa:** Marca/modelo não correspondem exatamente ao cadastro da SUIV

**Solução:**
- O script faz busca aproximada (substring)
- Verificar logs para ver qual etapa falhou
- Pode ser que modelo não exista na base SUIV

### Problema: Oportunidades não aparecem

**Causa:** Faltou vincular manutenções à oficina

**Solução:**
1. Verificar se manutenções existem:
```sql
SELECT COUNT(*) FROM maintenances WHERE vehicle_id IN (
  SELECT id FROM vehicles
);
```

2. Verificar vinculação:
```sql
SELECT COUNT(*) FROM workshop_maintenances WHERE workshop_id = 'SEU_WORKSHOP_ID';
```

3. Executar ETAPA 4 do `link-vehicles-to-workshop.sql`

### Problema: Rate limit da API

**Causa:** Muitas requisições em pouco tempo

**Solução:**
- Scripts já têm delay entre requisições
- Se falhar, aguardar alguns minutos e executar novamente
- Script retoma de onde parou (pula veículos com `revisions_fetched = true`)

---

## 📈 Custos da API

### Primeira Execução (Setup)
Para 15 veículos:
- Update de veículos: 15 requisições
- Popular cache: ~60 requisições (4 por veículo)
- **Total: ~75 requisições**

### Uso Contínuo
Após setup:
- ✅ **0 requisições** para consultar revisões (usa cache!)
- ✅ Nova placa: 5 requisições (1 VehicleInfo + 4 RevisionPlan)
- ✅ Economia de 98%

**Exemplo:**
- Sem cache: 1000 clientes × 50 acessos = 50.000 chamadas/mês
- Com cache: 1000 clientes × 1 chamada = 1.000 chamadas/mês
- **Economia: 49.000 chamadas (98%)**

---

## ✅ Checklist Final

Antes de apresentar:

- [ ] Todos os veículos atualizados com dados da API
- [ ] Cache de revisões populado para todos os veículos
- [ ] Manutenções antigas criadas
- [ ] Manutenções vinculadas à oficina
- [ ] Login na oficina funciona
- [ ] Aba Oportunidades mostra clientes
- [ ] Receita potencial calculada corretamente
- [ ] Busca por placa funciona
- [ ] Filtros de criticidade funcionam
- [ ] Modal de detalhes funciona

---

## 🎯 Próximos Passos

Após configurar o ambiente:

1. **Customizar preços** (opcional):
   - Login na oficina
   - Ir para "Tabela de Preços"
   - Definir preços customizados
   - Oportunidades usarão esses preços

2. **Adicionar mais manutenções** (opcional):
   - Variar datas (6, 12, 18, 24 meses atrás)
   - Criar diferentes níveis de atraso
   - Gerar mix de oportunidades

3. **Testar fluxo completo**:
   - Buscar cliente por placa
   - Registrar novo serviço
   - Verificar histórico atualizado
   - Ver como oportunidades mudam

---

## 📝 Notas Importantes

- **Placas reais:** Todas as placas devem ser válidas e existir na API SUIV
- **Rate limit:** Respeitar limite de requisições da API (scripts já incluem delays)
- **Cache permanente:** Uma vez populado, cache não expira (economia contínua)
- **Atualização futura:** Para atualizar cache, marcar `revisions_fetched = false` e executar script novamente

---

**Versão:** 2.0 (Placas Reais)
**Última atualização:** 2024-12-13
