# 🔒 Relatório de Segurança: Views Admin com SECURITY DEFINER

**Data:** 07/01/2026
**Origem:** Supabase Security Advisor
**Severidade:** ⚠️ **ALTA** (mas mitigada)
**Status:** ✅ Solução preparada

---

## 📋 Resumo Executivo

O Supabase detectou que 10 views administrativas estão configuradas com a propriedade `SECURITY DEFINER`, o que pode representar um risco de segurança se não houver proteções adequadas de Row Level Security (RLS).

### Views Afetadas:
1. `admin_api_usage_daily`
2. `admin_api_usage_monthly`
3. `admin_billable_api_calls`
4. `admin_growth_by_week`
5. `admin_overview`
6. `admin_subscription_distribution`
7. `admin_top_api_users`
8. `admin_trial_conversion`
9. `admin_workshop_performance`
10. `user_subscription_details`

---

## 🔍 Análise Técnica

### O que foi encontrado:

1. ✅ **No código-fonte**: As views foram criadas SEM `SECURITY DEFINER`
2. ❌ **No banco de dados**: As views ESTÃO com `SECURITY DEFINER` ativo
3. ⚠️ **Ausência de RLS**: Nenhuma das views tem Row Level Security configurado

### Como isso aconteceu?

Provavelmente o `SECURITY DEFINER` foi adicionado:
- Manualmente via SQL Editor do Supabase
- Por alguma migration não versionada
- Automaticamente pelo Supabase em alguma situação específica

---

## ⚠️ Impacto de Segurança

### 🔴 Vulnerabilidade:

Quando uma view tem `SECURITY DEFINER` mas não tem RLS:
- Ela executa com as **permissões do criador** (superuser)
- **Qualquer usuário autenticado** pode fazer queries diretas via API
- Isso **ignora verificações de frontend**

### Exemplo de Ataque:

```javascript
// Um usuário comum poderia fazer isso e ver dados de TODOS os usuários:
const { data } = await supabase
  .from('admin_overview')
  .select('*')

// Retornaria:
// - Total de usuários
// - MRR/ARR
// - Métricas de API de todos os clientes
// - Etc.
```

### 🟢 Mitigações Existentes:

1. ✅ Frontend verifica `is_admin` antes de mostrar dashboard
   - Arquivo: `src/pages/AdminDashboard.tsx:64-84`
   - Impede acesso casual/não-técnico

2. ✅ Requer autenticação
   - Usuário precisa estar logado
   - Não é vulnerável publicamente

### 🔴 Riscos Remanescentes:

1. ❌ Desenvolvedor com acesso ao supabase client pode ver dados
2. ❌ Usuário técnico pode contornar frontend e chamar API diretamente
3. ❌ Se credenciais vazarem, atacante tem acesso total aos dados

---

## 🛠️ Solução Implementada

### Arquivo criado:
```
supabase/migrations/20260107000000_add_rls_to_admin_views.sql
```

### O que a migration faz:

1. **Cria função helper `is_admin()`**
   - Verifica se usuário atual tem `is_admin = true`
   - Usa `SECURITY DEFINER` de forma segura (apenas para verificação)

2. **Recria todas as views com proteção WHERE**
   - Adiciona `WHERE public.is_admin() = true` em todas as views admin
   - Se usuário não for admin, views retornam dados vazios

3. **Protege `user_subscription_details`**
   - Usuário comum só vê seus próprios dados
   - Admin vê dados de todos

### Exemplo de proteção:

```sql
-- ANTES (vulnerável)
CREATE VIEW admin_overview AS
SELECT ... FROM profiles;

-- DEPOIS (protegido)
CREATE VIEW admin_overview AS
SELECT ... FROM profiles
WHERE public.is_admin() = true; -- 🔒 Só admin acessa
```

---

## 📝 Ações Necessárias

### 1️⃣ Aplicar a Migration

```bash
# Via Supabase CLI
supabase db push

# OU copie o conteúdo do arquivo para o SQL Editor no dashboard do Supabase
```

### 2️⃣ Remover SECURITY DEFINER Manual (se persistir)

Se mesmo após a migration o erro persistir, execute no SQL Editor:

```sql
-- Para cada view, execute:
ALTER VIEW admin_overview OWNER TO postgres;
ALTER VIEW admin_growth_by_week OWNER TO postgres;
ALTER VIEW admin_api_usage_daily OWNER TO postgres;
ALTER VIEW admin_api_usage_monthly OWNER TO postgres;
ALTER VIEW admin_billable_api_calls OWNER TO postgres;
ALTER VIEW admin_top_api_users OWNER TO postgres;
ALTER VIEW admin_subscription_distribution OWNER TO postgres;
ALTER VIEW admin_trial_conversion OWNER TO postgres;
ALTER VIEW admin_workshop_performance OWNER TO postgres;
ALTER VIEW user_subscription_details OWNER TO postgres;
```

### 3️⃣ Verificar no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Database** → **Database Health**
3. Execute novamente o **Security Advisor**
4. ✅ Os erros devem desaparecer

### 4️⃣ Testar a Aplicação

```bash
# Certifique-se de que o dashboard admin ainda funciona
npm run dev

# Teste:
# 1. Login como admin → Dashboard deve funcionar normalmente
# 2. Login como usuário comum → Não deve ter acesso a dados admin
```

---

## 🧪 Como Testar a Vulnerabilidade

### Antes da correção:

```javascript
// Console do browser (como usuário comum)
const { data } = await supabase.from('admin_overview').select('*')
console.log(data) // ❌ Retorna dados sensíveis!
```

### Depois da correção:

```javascript
// Console do browser (como usuário comum)
const { data } = await supabase.from('admin_overview').select('*')
console.log(data) // ✅ Retorna array vazio []
```

---

## 📊 Checklist de Segurança

- [x] Analisado código-fonte
- [x] Identificado views vulneráveis
- [x] Criado migration de correção
- [ ] Aplicado migration no Supabase
- [ ] Verificado no Security Advisor
- [ ] Testado acesso admin (deve funcionar)
- [ ] Testado acesso não-admin (deve ser bloqueado)
- [ ] Confirmado resolução do alerta do Supabase

---

## 💡 Recomendações Futuras

1. **Sempre que criar views admin**, adicione proteção:
   ```sql
   CREATE VIEW admin_something AS
   SELECT ... WHERE public.is_admin() = true;
   ```

2. **Nunca use SECURITY DEFINER em views** (não é necessário)
   - Use apenas em FUNCTIONS quando realmente precisar

3. **Monitore o Security Advisor** semanalmente
   - Configure notificações no Supabase

4. **Revise permissões** periodicamente
   - Garanta que apenas admins legítimos têm `is_admin = true`

---

## 📚 Referências

- [Supabase: Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [PostgreSQL: SECURITY DEFINER](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase: Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Conclusão

O problema é **real e crítico**, mas:
- ✅ Não é público (requer autenticação)
- ✅ Frontend tem proteção básica
- ✅ **Solução está pronta** na migration

**Recomendo aplicar a correção o quanto antes** para eliminar completamente a vulnerabilidade.

Se tiver dúvidas, estou à disposição!
