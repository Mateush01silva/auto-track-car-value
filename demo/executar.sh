#!/bin/bash
# Script para executar atualização de veículos e popular cache
# Uso: ./executar.sh

set -e  # Para execução em caso de erro

echo "======================================================"
echo "🚀 VYBO - Configuração de Ambiente Demo"
echo "======================================================"
echo ""

# Verificar se está na pasta demo
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: Execute este script dentro da pasta 'demo/'"
    echo "   cd demo"
    echo "   ./executar.sh"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não está instalado"
    echo "   Baixe em: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"
echo ""

# Verificar se dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    echo ""
fi

# Verificar variável de ambiente
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "⚠️  SUPABASE_SERVICE_KEY não está configurada!"
    echo ""
    echo "Por favor, configure a Service Role Key:"
    echo "1. Acesse: https://supabase.com/dashboard"
    echo "2. Vá em Settings > API"
    echo "3. Copie a 'service_role' key"
    echo ""
    echo "Então execute:"
    echo "  export SUPABASE_SERVICE_KEY=\"sua-chave-aqui\""
    echo "  ./executar.sh"
    echo ""
    exit 1
fi

echo "✅ SUPABASE_SERVICE_KEY configurada"
echo ""

# Menu de opções
echo "Escolha uma opção:"
echo "1) Atualizar veículos com dados da API SUIV"
echo "2) Popular cache de revisões"
echo "3) Executar ambos (recomendado)"
echo "4) Sair"
echo ""
read -p "Opção [1-4]: " opcao

case $opcao in
    1)
        echo ""
        echo "======================================================"
        echo "📋 Atualizando veículos com dados da API SUIV"
        echo "======================================================"
        echo ""
        npx tsx update-vehicles-from-api.ts
        echo ""
        echo "✅ Atualização concluída!"
        echo ""
        echo "Próximo passo: Execute novamente e escolha opção 2"
        ;;
    2)
        echo ""
        echo "======================================================"
        echo "🔄 Populando cache de revisões"
        echo "======================================================"
        echo ""
        echo "⚠️  ATENÇÃO: Este processo pode levar 8-10 minutos"
        echo "   Não interrompa o script!"
        echo ""
        read -p "Continuar? [s/N]: " continuar
        if [[ $continuar =~ ^[Ss]$ ]]; then
            npx tsx populate-revisions-cache.ts
            echo ""
            echo "✅ Cache populado com sucesso!"
        else
            echo "Operação cancelada"
        fi
        ;;
    3)
        echo ""
        echo "======================================================"
        echo "🚀 Executando processo completo"
        echo "======================================================"
        echo ""

        # Passo 1
        echo "📋 [1/2] Atualizando veículos..."
        npx tsx update-vehicles-from-api.ts
        echo ""
        echo "✅ Veículos atualizados!"
        echo ""

        # Passo 2
        echo "🔄 [2/2] Populando cache de revisões..."
        echo "⚠️  Isso pode levar 8-10 minutos. Não interrompa!"
        echo ""
        npx tsx populate-revisions-cache.ts
        echo ""

        echo "======================================================"
        echo "✅ PROCESSO COMPLETO!"
        echo "======================================================"
        echo ""
        echo "Próximos passos:"
        echo "1. Abrir Supabase SQL Editor"
        echo "2. Executar queries do arquivo: link-vehicles-to-workshop.sql"
        echo "3. Fazer login em: https://www.vybo.com.br"
        echo "   E-mail: silva.mateush01@gmail.com"
        echo "4. Verificar aba Oportunidades"
        echo ""
        ;;
    4)
        echo "Saindo..."
        exit 0
        ;;
    *)
        echo "❌ Opção inválida"
        exit 1
        ;;
esac

echo "Concluído!"
