# Document Processing API - Backend

Backend da aplicação de processamento de documentos, construído com Node.js, Express, TypeScript e Prisma.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **TypeScript** - Linguagem de programação
- **Prisma** - ORM para banco de dados
- **PostgreSQL** - Banco de dados
- **JWT** - Autenticação
- **bcrypt** - Hash de senhas

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações (banco, constantes)
├── controllers/     # Controladores da aplicação
├── middlewares/     # Middlewares customizados
├── routes/          # Definição de rotas
├── services/        # Lógica de negócio
├── utils/           # Utilitários e helpers
└── app.ts           # Arquivo principal
```

## 🛠️ Instalação

1. **Clone o repositório**

   ```bash
   git clone <repository-url>
   cd text-insight/back-end
   ```

2. **Instale as dependências**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**

   ```bash
   cp .env.example .env
   # Edite o arquivo .env com suas configurações
   ```

4. **Configure o banco de dados**

   ```bash
   # Gere o cliente Prisma
   npm run db:generate

   # Execute as migrações
   npm run db:migrate
   ```

## 🚀 Executando o Projeto

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

## 📚 Scripts Disponíveis

- `npm run dev` - Executa em modo desenvolvimento com hot-reload
- `npm run build` - Compila o TypeScript para JavaScript
- `npm start` - Executa a versão compilada
- `npm run lint` - Executa o ESLint
- `npm run lint:fix` - Corrige automaticamente os problemas do ESLint
- `npm run db:generate` - Gera o cliente Prisma
- `npm run db:push` - Sincroniza o schema com o banco
- `npm run db:migrate` - Executa as migrações
- `npm run db:studio` - Abre o Prisma Studio

## 🔐 Autenticação

A API suporta dois tipos de autenticação:

1. **JWT Token** - Para usuários logados
2. **API Key** - Para integrações

### Rotas de Autenticação

- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login de usuário
- `GET /api/auth/profile` - Perfil do usuário (protegido)
- `POST /api/auth/api-keys` - Criar nova API Key (protegido)

## 🌐 Endpoints

### Health Check

- `GET /health` - Status da API

### Autenticação

- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login
- `GET /api/auth/profile` - Perfil (JWT)
- `POST /api/auth/api-keys` - Criar API Key (JWT)

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/text_insight_db"

# Server
PORT=3001

# Environment
NODE_ENV=development

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📊 Banco de Dados

O projeto usa PostgreSQL com Prisma como ORM. Os principais modelos são:

- **User** - Usuários da aplicação
- **ApiKey** - Chaves de API dos usuários
- **Document** - Documentos processados pelos usuários

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar testes em modo watch
npm run test:watch
```

## 📝 Licença

Este projeto está sob a licença ISC.
