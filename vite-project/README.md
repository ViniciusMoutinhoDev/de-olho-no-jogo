# Futebol Travel App - Java/Spring Boot

## 🏗️ Arquitetura

Esta é uma migração completa do projeto Python para Java, focando em escalabilidade e manutenibilidade.

### Stack Tecnológica

**Backend:**
- Java 17+
- Spring Boot 3.2+
- Spring Security (JWT Authentication)
- Spring Data JPA
- PostgreSQL (recomendado para produção) / H2 (desenvolvimento)
- RestTemplate/WebClient para APIs externas
- Lombok
- MapStruct
- Flyway (migrations)

**Frontend:**
- React 18+
- Vite
- Axios
- React Router
- Context API / Redux (gerenciamento de estado)

### Estrutura do Projeto

```
futebol-app-java/
├── backend/                    # Spring Boot Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── com/futebol/app/
│   │   │   │       ├── config/         # Configurações
│   │   │   │       ├── controller/     # REST Controllers
│   │   │   │       ├── dto/           # Data Transfer Objects
│   │   │   │       ├── entity/        # JPA Entities
│   │   │   │       ├── repository/    # Spring Data Repositories
│   │   │   │       ├── service/       # Business Logic
│   │   │   │       ├── security/      # JWT & Authentication
│   │   │   │       ├── exception/     # Exception Handlers
│   │   │   │       └── client/        # External API Clients
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/      # Flyway migrations
│   │   └── test/
│   └── pom.xml / build.gradle
│
└── frontend/                   # React Application (Vite)
    ├── src/
    │   ├── api/               # API client
    │   ├── components/        # React components
    │   ├── contexts/          # Context providers
    │   ├── pages/            # Page components
    │   ├── hooks/            # Custom hooks
    │   ├── utils/            # Utilities
    │   └── App.jsx
    ├── package.json
    └── vite.config.js
```

## 🚀 Melhorias em Relação ao Python

1. **Type Safety**: Java oferece tipagem forte em tempo de compilação
2. **Performance**: JVM otimiza código em runtime
3. **Escalabilidade**: Melhor suporte para microserviços e containers
4. **Ecossistema**: Spring Boot oferece soluções robustas out-of-the-box
5. **Segurança**: Spring Security é maduro e battle-tested
6. **Cache**: Fácil implementação de caching (Redis, Caffeine)
7. **Observabilidade**: Integração nativa com Micrometer, Prometheus

## 📦 Principais Funcionalidades

- ✅ Autenticação JWT
- ✅ CRUD de Usuários
- ✅ Diário de Jogos (multi-tenant)
- ✅ Integração com Sofascore API
- ✅ Cálculo de Logística e Custos
- ✅ Geolocalização
- ✅ Cache de requisições externas
- ✅ Rate limiting
- ✅ Validação robusta de dados

## 🔧 Como Executar

### Backend

```bash
cd backend
./mvnw spring-boot:run
# ou
./gradlew bootRun
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🌐 Endpoints da API

### Autenticação
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Usuário
- `GET /api/users/me` - Perfil do usuário
- `PUT /api/users/me` - Atualizar perfil

### Diário
- `GET /api/diario` - Listar jogos do diário
- `POST /api/diario` - Adicionar jogo
- `DELETE /api/diario/{id}` - Remover jogo

### Jogos (Sofascore)
- `GET /api/times/buscar?nome={nome}` - Buscar time
- `GET /api/jogos/{timeId}?tipo=next&limite=5` - Buscar jogos
- `GET /api/jogos/detalhes/{eventId}` - Detalhes do jogo

### Logística
- `POST /api/logistica/calcular` - Calcular custos e rotas

## 🔐 Segurança

- Senhas hasheadas com BCrypt
- JWT com refresh tokens
- Rate limiting por IP
- CORS configurável
- SQL Injection protection (JPA)
- XSS protection

## 📊 Banco de Dados

### Migrations (Flyway)

As migrations são executadas automaticamente no startup. Estrutura:

```sql
-- V1__initial_schema.sql
CREATE TABLE usuarios (...)
CREATE TABLE diario (...)
CREATE TABLE clubes (...)
```

## 🧪 Testes

```bash
# Backend
./mvnw test

# Frontend
npm run test
```

## 🐳 Docker

```bash
docker-compose up
```

## 📈 Monitoramento

- Actuator endpoints: `/actuator/health`, `/actuator/metrics`
- Prometheus: `/actuator/prometheus`
- Logs estruturados (JSON)

## 🔄 CI/CD

GitHub Actions configurado para:
- Testes automáticos
- Build e deploy
- Code quality (SonarQube)

## 📝 Licença

MIT