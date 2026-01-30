#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${BLUE}    De Olho No Jogo - Inicialização${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js 18+ primeiro.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js versão 18+ necessária. Versão atual: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detectado${NC}"
echo ""

# Verificar se dependências do backend estão instaladas
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do backend...${NC}"
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências do backend${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
    echo ""
fi

# Verificar se dependências do frontend estão instaladas
if [ ! -d "frontend/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências do frontend...${NC}"
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências do frontend${NC}"
        exit 1
    fi
    cd ..
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
    echo ""
fi

# Verificar arquivo .env do backend
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚙️  Criando arquivo .env do backend...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
    echo ""
fi

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}📴 Encerrando aplicação...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Aplicação encerrada${NC}"
    exit 0
}

trap cleanup INT TERM

# Iniciar backend
echo -e "${BLUE}🚀 Iniciando backend...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend iniciar
sleep 3

# Verificar se backend está rodando
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Erro ao iniciar backend. Verificar backend.log${NC}"
    cat backend.log
    exit 1
fi

echo -e "${GREEN}✅ Backend iniciado (PID: $BACKEND_PID)${NC}"
echo ""

# Iniciar frontend
echo -e "${BLUE}🚀 Iniciando frontend...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Aguardar frontend iniciar
sleep 3

# Verificar se frontend está rodando
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Erro ao iniciar frontend. Verificar frontend.log${NC}"
    cat frontend.log
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✅ Frontend iniciado (PID: $FRONTEND_PID)${NC}"
echo ""

# Exibir informações
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Aplicação iniciada com sucesso!${NC}"
echo ""
echo -e "${BLUE}📍 URLs:${NC}"
echo -e "   Frontend: ${YELLOW}http://localhost:5173${NC}"
echo -e "   Backend:  ${YELLOW}http://localhost:3001${NC}"
echo -e "   API:      ${YELLOW}http://localhost:3001/api${NC}"
echo ""
echo -e "${BLUE}📖 Logs:${NC}"
echo -e "   Backend:  tail -f backend.log"
echo -e "   Frontend: tail -f frontend.log"
echo ""
echo -e "${BLUE}⚙️  Controles:${NC}"
echo -e "   ${GREEN}Ctrl+C${NC} - Encerrar aplicação"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
echo ""

# Aguardar indefinidamente (até Ctrl+C)
while true; do
    # Verificar se processos ainda estão rodando
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Backend encerrado inesperadamente${NC}"
        cat backend.log
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend encerrado inesperadamente${NC}"
        cat frontend.log
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    
    sleep 5
done
