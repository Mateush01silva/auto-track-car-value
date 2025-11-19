// 🧪 TESTE MANUAL DA EDGE FUNCTION
// Execute no terminal ou Postman

// 1. Primeiro, pegue seu Project ID do Supabase
// Vai em Supabase > Settings > General > Reference ID

// 2. Teste se a função responde (vai dar erro de signature, mas confirma que está acessível)
// Substitua [PROJECT-ID] pelo seu project ID

curl -X POST https://[PROJECT-ID].supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -d '{}'

// Resultado ESPERADO:
// {"error":"No signature provided"} com status 400
// Isso significa que a função ESTÁ funcionando!

// Resultado RUIM:
// {"code":401,"message":"Missing authorization header"}
// Isso significa que há um problema de configuração

// 3. Se der 401, tente verificar as configurações da Edge Function:
// No Supabase Dashboard, veja se há alguma opção de "Allow public access"
// ou configuração de autenticação na Edge Function
