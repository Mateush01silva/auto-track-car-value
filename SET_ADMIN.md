# Como se tornar Administrador

Este arquivo contém instruções para marcar seu usuário como administrador no Vybo.

## Passo a Passo

1. Acesse o **Supabase Dashboard** do seu projeto
2. Vá em **SQL Editor** (no menu lateral)
3. Clique em **New Query**
4. Cole o seguinte SQL (substitua `SEU_EMAIL@exemplo.com` pelo seu email real):

```sql
-- Marcar seu usuário como administrador
UPDATE public.profiles
SET is_admin = true
WHERE email = 'SEU_EMAIL@exemplo.com';
```

5. Clique em **Run** para executar a query
6. Faça logout e login novamente no Vybo
7. Pronto! Agora você tem acesso a todas as funcionalidades sem restrições 🎉

## O que muda quando você é Admin?

Como administrador, você terá:
- ✅ Acesso ilimitado a todas as funcionalidades Pro
- ✅ Sem limite de veículos
- ✅ Sem limite de manutenções por mês
- ✅ Gerar QR Code e compartilhar links
- ✅ Exportar para Excel
- ✅ Todos os recursos premium desbloqueados

## Verificar se você é Admin

Execute este SQL para verificar:

```sql
SELECT email, is_admin
FROM public.profiles
WHERE email = 'SEU_EMAIL@exemplo.com';
```

Se `is_admin` for `true`, você é um administrador!

## Remover Admin (opcional)

Se quiser remover o acesso de admin:

```sql
UPDATE public.profiles
SET is_admin = false
WHERE email = 'SEU_EMAIL@exemplo.com';
```

---

**Nota de Segurança:** Mantenha esta informação segura e não compartilhe com usuários finais. Apenas você e desenvolvedores autorizados devem ter acesso de administrador.
