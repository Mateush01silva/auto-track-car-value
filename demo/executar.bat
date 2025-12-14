@echo off
REM Script para executar atualizacao de veiculos e popular cache
REM Uso: executar.bat

setlocal enabledelayedexpansion

echo ======================================================
echo 🚀 VYBO - Configuracao de Ambiente Demo
echo ======================================================
echo.

REM Verificar se esta na pasta demo
if not exist "package.json" (
    echo ❌ ERRO: Execute este script dentro da pasta 'demo/'
    echo    cd demo
    echo    executar.bat
    pause
    exit /b 1
)

REM Verificar se Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js nao esta instalado
    echo    Baixe em: https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js encontrado: %NODE_VERSION%
echo.

REM Verificar se dependencias estao instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    call npm install
    echo.
)

REM Verificar variavel de ambiente
if "%SUPABASE_SERVICE_KEY%"=="" (
    echo ⚠️  SUPABASE_SERVICE_KEY nao esta configurada!
    echo.
    echo Por favor, configure a Service Role Key:
    echo 1. Acesse: https://supabase.com/dashboard
    echo 2. Va em Settings ^> API
    echo 3. Copie a 'service_role' key
    echo.
    echo Entao execute no mesmo terminal:
    echo   set SUPABASE_SERVICE_KEY=sua-chave-aqui
    echo   executar.bat
    echo.
    pause
    exit /b 1
)

echo ✅ SUPABASE_SERVICE_KEY configurada
echo.

REM Menu de opcoes
echo Escolha uma opcao:
echo 1) Atualizar veiculos com dados da API SUIV
echo 2) Popular cache de revisoes
echo 3) Executar ambos (recomendado)
echo 4) Sair
echo.
set /p opcao="Opcao [1-4]: "

if "%opcao%"=="1" goto opcao1
if "%opcao%"=="2" goto opcao2
if "%opcao%"=="3" goto opcao3
if "%opcao%"=="4" goto opcao4
goto invalido

:opcao1
echo.
echo ======================================================
echo 📋 Atualizando veiculos com dados da API SUIV
echo ======================================================
echo.
call npx tsx update-vehicles-from-api.ts
echo.
echo ✅ Atualizacao concluida!
echo.
echo Proximo passo: Execute novamente e escolha opcao 2
goto fim

:opcao2
echo.
echo ======================================================
echo 🔄 Populando cache de revisoes
echo ======================================================
echo.
echo ⚠️  ATENCAO: Este processo pode levar 8-10 minutos
echo    Nao interrompa o script!
echo.
set /p continuar="Continuar? [s/N]: "
if /i "%continuar%"=="s" (
    call npx tsx populate-revisions-cache.ts
    echo.
    echo ✅ Cache populado com sucesso!
) else (
    echo Operacao cancelada
)
goto fim

:opcao3
echo.
echo ======================================================
echo 🚀 Executando processo completo
echo ======================================================
echo.

REM Passo 1
echo 📋 [1/2] Atualizando veiculos...
call npx tsx update-vehicles-from-api.ts
if %errorlevel% neq 0 (
    echo ❌ Erro na atualizacao de veiculos
    pause
    exit /b 1
)
echo.
echo ✅ Veiculos atualizados!
echo.

REM Passo 2
echo 🔄 [2/2] Populando cache de revisoes...
echo ⚠️  Isso pode levar 8-10 minutos. Nao interrompa!
echo.
call npx tsx populate-revisions-cache.ts
if %errorlevel% neq 0 (
    echo ❌ Erro ao popular cache
    pause
    exit /b 1
)
echo.

echo ======================================================
echo ✅ PROCESSO COMPLETO!
echo ======================================================
echo.
echo Proximos passos:
echo 1. Abrir Supabase SQL Editor
echo 2. Executar queries do arquivo: link-vehicles-to-workshop.sql
echo 3. Fazer login em: https://www.vybo.com.br
echo    E-mail: silva.mateush01@gmail.com
echo 4. Verificar aba Oportunidades
echo.
goto fim

:opcao4
echo Saindo...
exit /b 0

:invalido
echo ❌ Opcao invalida
pause
exit /b 1

:fim
echo Concluido!
pause
