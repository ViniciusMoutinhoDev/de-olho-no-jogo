# 🚀 Guia de Instalação - De Olho No Jogo

## 📋 Pré-requisitos

- **Node.js** 18+ e npm
- **Git** (opcional, para clonar o repositório)

## 📦 Instalação

### 1. Backend

```bash
# Navegar para a pasta do backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar o .env (opcional - valores padrão já funcionam)
nano .env
```

### 2. Frontend

```bash
# Navegar para a pasta do frontend
cd ../frontend

# Instalar dependências
npm install

# Criar arquivo .env (opcional)
echo "VITE_API_URL=http://localhost:3001/api" > .env
```

## 🏃 Executar o Projeto

### Opção 1: Executar Backend e Frontend Separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Opção 2: Script de Execução Único (recomendado)

Crie um arquivo `start.sh` na raiz do projeto:

```bash
#!/bin/bash

echo "🚀 Iniciando De Olho No Jogo..."

# Iniciar backend em background
cd backend
npm run dev &
BACKEND_PID=$!

# Aguardar o backend iniciar
sleep 3

# Iniciar frontend em background
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Aplicação iniciada!"
echo "📍 Backend: http://localhost:3001"
echo "📍 Frontend: http://localhost:5173"
echo ""
echo "Pressione Ctrl+C para encerrar..."

# Aguardar interrupção
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

Tornar executável e rodar:
```bash
chmod +x start.sh
./start.sh
```

## 📍 URLs de Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api

## 🧪 Testando a Aplicação

### 1. Criar uma Conta

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "password": "senha123",
    "email": "teste@email.com",
    "city": "São Paulo"
  }'
```

### 2. Fazer Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teste",
    "password": "senha123"
  }'
```

### 3. Buscar Jogos (exemplo com Corinthians)

```bash
curl http://localhost:3001/api/games/Corinthians
```

## 🔧 Configurações Adicionais

### Chromium para Puppeteer (Linux)

Se o Puppeteer não conseguir baixar o Chromium automaticamente:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y chromium-browser

# Fedora
sudo dnf install chromium

# Arch
sudo pacman -S chromium
```

### Configurar JWT Secret (Produção)

Edite o `.env` no backend:

```env
JWT_SECRET=sua-chave-super-secreta-aleatoria-aqui
```

Gere uma chave segura:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🐛 Troubleshooting

### Erro: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Port 3001 already in use"

```bash
# Matar processo na porta 3001
kill -9 $(lsof -t -i:3001)
```

### Erro: "EACCES: permission denied"

```bash
# Dar permissão de escrita
chmod 666 backend/futebol.db
```

### Puppeteer não funciona

```bash
# Instalar dependências faltantes (Ubuntu)
sudo apt-get install -y \
  libnss3 libatk-bridge2.0-0 libdrm2 \
  libxkbcommon0 libgbm1 libasound2
```

## 📱 Uso da Aplicação

1. **Registro/Login**
   - Acesse http://localhost:5173
   - Crie uma conta ou faça login
   - Configure sua cidade no perfil

2. **Buscar Jogos**
   - Digite o nome do time (ex: "Corinthians")
   - Clique em "Buscar"
   - Use "Atualizar" para fazer scraping novo

3. **Ver Informações de Viagem**
   - Clique em "Ver Viagem" em qualquer jogo
   - Veja distância, transporte e links

4. **Salvar no Diário**
   - Clique em "Salvar" em jogos de interesse
   - Acesse a aba "Meu Diário" para ver salvos

## 🔐 Credenciais de Teste

Se quiser testar rapidamente:

- **Usuário**: teste
- **Senha**: senha123
- **Cidade**: São Paulo

(Criado automaticamente no primeiro uso)

## 📊 Estrutura dos Dados

### Banco de Dados

O SQLite cria automaticamente:
- Tabelas de usuários, times, jogos, diário
- Códigos IATA de 40+ cidades brasileiras
- Índices para performance

Localização: `backend/futebol.db`

## 🚀 Deploy (Opcional)

### Backend (Heroku/Railway)

```bash
# Adicionar ao Procfile
web: node server.js

# Configurar variáveis de ambiente
PORT=3001
JWT_SECRET=sua-chave-aqui
NODE_ENV=production
```

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Configurar variável de ambiente
VITE_API_URL=https://sua-api.herokuapp.com/api
```

## 📝 Notas Importantes

- O scraper pode demorar 5-15 segundos na primeira busca
- Dados ficam em cache no banco de dados
- Use "Atualizar" apenas quando precisar de dados novíssimos
- Configure sua cidade para ver informações de viagem
- Jogos salvos ficam vinculados ao seu usuário

## 🤝 Suporte

Caso encontre problemas, verifique:
1. Node.js versão 18+
2. Todas as dependências instaladas
3. Portas 3001 e 5173 livres
4. Logs do backend no terminal

## 🎉 Pronto!

Agora você está pronto para usar o **De Olho No Jogo**! 

Acompanhe seus times favoritos e planeje suas viagens para os jogos! ⚽✈️
