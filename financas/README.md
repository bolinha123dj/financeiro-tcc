# 💰 Controle Financeiro Pessoal — TCC

Sistema completo de controle financeiro pessoal com Node.js, Express, Supabase e JavaScript puro.

---

## 🏗️ Arquitetura

```
Frontend (HTML/CSS/JS)
       ↕ HTTP + JWT
Backend (Node.js + Express)
       ↕ Supabase JS SDK
Banco de Dados (Supabase / PostgreSQL)
```

---

## 🚀 Como Rodar — Passo a Passo

### 1️⃣ Configurar o Supabase (banco de dados)

1. Acesse [supabase.com](https://supabase.com) → crie conta gratuita
2. Clique em **New Project** → dê um nome → aguarde criar (~2 min)
3. Vá em **SQL Editor** → cole o conteúdo de `backend/schema.sql` → clique **Run**
4. Vá em **Project Settings → API** e copie:
   - **Project URL** → `https://xxxxx.supabase.co`
   - **service_role** (clique Reveal) → chave longa começando com `eyJ...`

---

### 2️⃣ Configurar o Backend

```bash
# Entre na pasta backend
cd backend

# Instale as dependências
npm install

# Crie o arquivo .env
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env
```

Abra o arquivo `.env` e preencha:

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...sua_chave_service_role...
JWT_SECRET=qualquer_texto_longo_e_secreto_aqui_12345
PORT=3001
```

```bash
# Rodar o servidor
npm run dev

# Você verá:
# 🚀 Servidor rodando em http://localhost:3001
```

> ⚠️ Deixe este terminal aberto enquanto usa o sistema!

---

### 3️⃣ Rodar o Frontend

**Opção A — VS Code com Live Server (recomendado):**
1. Instale a extensão **Live Server** no VS Code
2. Clique com botão direito em `frontend/index.html`
3. Clique em **"Open with Live Server"**
4. Acesse: `http://localhost:5500`

**Opção B — Terminal:**
```bash
npx serve frontend
```

---

## 📁 Estrutura de Arquivos

```
financeiro-tcc/
├── backend/
│   ├── server.js              ← Servidor Express principal
│   ├── package.json
│   ├── .env.example           ← Copie para .env e preencha
│   ├── schema.sql             ← Execute no Supabase SQL Editor
│   ├── config/
│   │   └── supabase.js        ← Conexão com o Supabase
│   ├── middleware/
│   │   └── auth.js            ← Validação do token JWT
│   └── routes/
│       ├── auth.js            ← /api/auth/*
│       ├── transactions.js    ← /api/transactions/*
│       └── goals.js           ← /api/goals/*
│
└── frontend/
    ├── index.html             ← Página de Login
    ├── cadastro.html          ← Página de Cadastro
    ├── dashboard.html         ← Dashboard principal ⭐
    ├── perfil.html            ← Perfil do usuário
    ├── configuracoes.html     ← Configurações
    ├── css/
    │   └── style.css          ← Estilos globais
    └── js/
        ├── api.js             ← Comunicação com o backend
        ├── app.js             ← Utilitários (toast, modal, formatação)
        └── dashboard.js       ← Lógica do dashboard
```

---

## 🔌 Endpoints da API

### Auth
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Dados do usuário logado |
| PUT | `/api/auth/profile` | Atualizar perfil |
| PUT | `/api/auth/password` | Alterar senha |

### Transações
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/transactions` | Listar transações |
| GET | `/api/transactions/summary` | Resumo financeiro |
| POST | `/api/transactions` | Criar transação |
| PUT | `/api/transactions/:id` | Editar transação |
| DELETE | `/api/transactions/:id` | Excluir transação |

### Metas
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/goals` | Listar metas |
| POST | `/api/goals` | Criar meta |
| PUT | `/api/goals/:id` | Editar meta |
| DELETE | `/api/goals/:id` | Excluir meta |

---

## 🔒 Segurança

- **bcryptjs** — senhas com hash (nunca texto puro)
- **JWT** — tokens com expiração de 7 dias
- **Row Level Security** — cada usuário acessa só os próprios dados
- **CORS** — apenas origens autorizadas
- **Validação** — todas as rotas validam os dados

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML5, CSS3, JavaScript ES2020 |
| Backend | Node.js 18+, Express.js |
| Banco de dados | Supabase (PostgreSQL) |
| Autenticação | JWT + bcryptjs |
| SDK | Supabase JS SDK v2 |

---

## ❗ Erros Comuns

| Problema | Solução |
|---|---|
| `Cannot connect to server` | Rode `npm run dev` na pasta backend |
| `Invalid API key` | Verifique SUPABASE_SERVICE_KEY no .env |
| Página sem CSS | Use Live Server, não abra o HTML direto |
| `CORS error` | Frontend deve rodar em localhost:5500 |
