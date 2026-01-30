# 👁️ De Olho No Jogo

Sistema completo para acompanhamento de jogos de futebol com planejamento automático de viagens.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2-blue.svg)

## 🎯 Funcionalidades

### ⚽ Acompanhamento de Jogos
- Busca automática de jogos (próximos e passados) via web scraping
- Informações completas: data, horário, local, competição
- Cache inteligente no banco de dados
- Atualização sob demanda

### 📖 Diário Pessoal
- Salve jogos que pretende assistir ou já assistiu
- Adicione notas e avaliações
- Histórico completo vinculado ao seu perfil
- Sincronização automática

### ✈️ Planejamento de Viagens
- **Cálculo automático de distância** entre sua cidade e o local do jogo
- **Recomendação inteligente de transporte**:
  - Até 300km: Carro (Google Maps)
  - 300-600km: Ônibus (ClickBus)
  - Acima de 600km: Avião
- **Links diretos para compra**:
  - Skyscanner (voos)
  - Google Flights (voos)
  - ClickBus (ônibus)
- **Suporte a 40+ cidades brasileiras** com códigos IATA
- **Fallback automático** para aeroportos mais próximos

### 🔐 Sistema de Autenticação
- Registro e login seguros
- Senhas criptografadas (bcrypt)
- JWT para sessões
- Perfil personalizável com cidade

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express** - Servidor REST API
- **SQLite** - Banco de dados relacional
- **Puppeteer** - Web scraping de jogos
- **bcrypt** - Criptografia de senhas
- **JWT** - Autenticação

### Frontend
- **React** 18 + **Vite** - Interface moderna
- **Axios** - Comunicação com API
- **CSS Glassmorphism** - Design moderno
- **Responsive Design** - Mobile-friendly

## 📦 Instalação Rápida

```bash
# Clonar repositório
git clone https://github.com/viniciusmoutinhodev/de-olho-no-jogo.git
cd de-olho-no-jogo

# Tornar script executável
chmod +x start.sh

# Iniciar aplicação (instala dependências automaticamente)
./start.sh
```

Acesse: **http://localhost:5173**

## 📖 Instalação Detalhada

Veja o [guia completo de instalação](INSTALL.md) para mais detalhes.

## 🏗️ Arquitetura

```
de-olho-no-jogo/
├── backend/
│   ├── server.js                # Servidor Express
│   ├── database/
│   │   ├── db.js               # Conexão SQLite
│   │   ├── schema.sql          # Schema das tabelas
│   │   └── iata_data.sql       # Códigos IATA
│   ├── controllers/
│   │   ├── authController.js   # Lógica de autenticação
│   │   └── gamesController.js  # Lógica de jogos
│   ├── middleware/
│   │   └── auth.js             # Middleware JWT
│   ├── routes/
│   │   └── api.js              # Rotas da API
│   └── services/
│       ├── scraper.js          # Web scraping
│       └── flightService.js    # Lógica de voos
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Dashboard.jsx   # Tela principal
    │   │   ├── Login.jsx       # Tela de login
    │   │   └── Register.jsx    # Tela de registro
    │   ├── services/
    │   │   └── api.js          # Cliente API
    │   └── App.jsx             # Componente raiz
    └── public/
```

## 📊 Modelo de Dados

### Tabelas Principais

**users** - Usuários do sistema
- id, username, password, email, city, iata_code

**teams** - Times de futebol
- id, name, slug, logo_url, stadium, city

**games** - Jogos (próximos e passados)
- id, team_id, opponent, date, time, location, city, competition, status, score

**user_games** - Diário (relacionamento many-to-many)
- id, user_id, game_id, watched, saved, notes, rating

**iata_codes** - Códigos de aeroportos
- id, city, state, iata_code, airport_name, latitude, longitude

## 🔧 API Endpoints

### Autenticação
```http
POST   /api/auth/register    # Criar conta
POST   /api/auth/login       # Login
GET    /api/auth/me          # Perfil
PUT    /api/auth/profile     # Atualizar perfil
```

### Jogos
```http
GET    /api/games/:teamName           # Buscar jogos
GET    /api/games/:gameId/travel      # Info de viagem
POST   /api/games/:gameId/save        # Salvar no diário
DELETE /api/games/:gameId/diary       # Remover do diário
```

### Diário
```http
GET    /api/diary              # Listar jogos salvos
```

### Utilidades
```http
GET    /api/cities?search=     # Buscar cidades
GET    /api/health             # Health check
```

## 🎮 Como Usar

### 1. Criar Conta
- Acesse http://localhost:5173
- Clique em "Criar Conta"
- Preencha username, senha e **sua cidade** (importante para viagens)

### 2. Buscar Jogos
- Digite o nome do time (ex: "Corinthians", "Flamengo")
- Visualize próximos jogos e jogos passados
- Clique em "Atualizar" para buscar dados novos

### 3. Ver Informações de Viagem
- Clique em "✈️ Ver Viagem" em qualquer jogo
- Veja distância, tipo de transporte recomendado
- Acesse links diretos para Skyscanner, Google Flights ou ClickBus

### 4. Salvar no Diário
- Clique em "💾 Salvar" em jogos de interesse
- Acesse a aba "📖 Meu Diário"
- Veja seu histórico de jogos salvos

## 🧪 Testes

```bash
# Testar API
curl http://localhost:3001/api/health

# Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"teste","password":"123","city":"São Paulo"}'

# Buscar jogos
curl http://localhost:3001/api/games/Corinthians
```

## 🐛 Troubleshooting

### Erro "Port already in use"
```bash
# Matar processos
kill -9 $(lsof -t -i:3001)
kill -9 $(lsof -t -i:5173)
```

### Puppeteer não funciona (Linux)
```bash
sudo apt-get install chromium-browser libnss3 libatk-bridge2.0-0
```

### Banco de dados corrompido
```bash
rm backend/futebol.db
# Reiniciar aplicação (criará novo banco)
```

## 🔐 Segurança

- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ JWT com expiração de 7 dias
- ✅ CORS configurado
- ✅ SQL preparado (anti-injection)
- ✅ Validação de entrada
- ✅ Headers de segurança

## 📈 Roadmap

- [ ] Notificações push para jogos próximos
- [ ] Integração com calendário (Google Calendar, iCal)
- [ ] Estatísticas de jogos (API Football-Data.org)
- [ ] Compartilhamento de diário (público/privado)
- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Integração com redes sociais
- [ ] Chatbot para busca de jogos

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit (`git commit -m 'Adiciona MinhaFeature'`)
4. Push (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

## 👨‍💻 Autor

Desenvolvido com ⚽ e ☕

## 📞 Suporte

- 📧 Email: viniciusmoutinho.vm@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/viniciusmoutinhodev/de-olho-no-jogo/issues)
- 📖 Docs: [Documentação Completa](INSTALL.md)

---

**⚽ Acompanhe seu time com estilo! ✈️**