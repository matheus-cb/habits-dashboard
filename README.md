# 🎯 Habits Dashboard

Dashboard moderno para rastreamento de hábitos, conectado à [Habits API REST](../habits-api).

## 🚀 Tecnologias

- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool ultra-rápido
- **Tailwind CSS** - Styling
- **React Hooks** - State management
- **Date-fns** - Manipulação de datas
- **Recharts** - Gráficos

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── HabitCard.tsx
│   └── CreateHabitModal.tsx
├── pages/              # Páginas
│   ├── LoginPage.tsx
│   └── DashboardPage.tsx
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   └── useHabits.ts
├── lib/api/            # Cliente da API
│   ├── client.ts
│   ├── auth.ts
│   └── habits.ts
├── types/              # TypeScript types
│   └── index.ts
├── App.tsx             # Componente raiz
└── main.tsx            # Entry point
```

## ⚙️ Setup e Instalação

### Pré-requisitos

- Node.js 18+
- npm
- Habits API rodando em `http://localhost:3333`

### 1. Instalar Dependências

**IMPORTANTE**: Antes de instalar, você precisa corrigir as permissões do npm. Execute:

```bash
sudo chown -R $(id -u):$(id -g) ~/.npm
```

Depois instale:

```bash
cd ~/workspace/habits-dashboard
npm install
```

### 2. Configurar Variáveis de Ambiente

O arquivo `.env` já está criado com:

```env
VITE_API_URL=http://localhost:3333/api/v1
```

### 3. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔗 Conectando com a API

### 1. Certifique-se que a API está rodando

```bash
# Terminal 1 - API
cd ~/workspace/habits-api
docker-compose up -d postgres
npm run dev
# API: http://localhost:3333
```

### 2. Inicie o Dashboard

```bash
# Terminal 2 - Dashboard
cd ~/workspace/habits-dashboard
npm run dev
# Dashboard: http://localhost:3000
```

### 3. CORS na API

A API precisa permitir requests do dashboard. Verifique se o `.env` da API tem:

```env
CORS_ORIGIN=http://localhost:3000
```

Se não tiver, adicione e reinicie a API.

## 📚 Funcionalidades

### ✅ Autenticação
- [x] Registro de usuário
- [x] Login com JWT
- [x] Logout
- [x] Persistência de sessão (localStorage)

### ✅ Hábitos
- [x] Listar hábitos
- [x] Criar novo hábito
- [x] Deletar hábito
- [x] Check-in diário
- [x] Visualizar estatísticas (streak, total, completion rate)

### 📊 Dashboard
- [x] Overview de estatísticas
- [x] Grid de hábitos
- [x] Cards com stats individuais
- [x] Modal de criação

## 🎨 Design

- **UI moderna e responsiva** com Tailwind CSS
- **Animações suaves** e transições
- **Cards interativos** com hover effects
- **Gradientes e cores** consistentes (roxo como cor principal)
- **Mobile-first** design

## 🛠️ Scripts Disponíveis

```bash
npm run dev       # Servidor de desenvolvimento (porta 3000)
npm run build     # Build para produção
npm run preview   # Preview do build
npm run lint      # Lint com ESLint
```

## 📦 Build para Produção

```bash
npm run build
```

O build estará em `dist/` e pode ser deployado em:
- Vercel
- Netlify
- GitHub Pages
- Qualquer host estático

## 🔐 Fluxo de Autenticação

1. Usuário acessa o dashboard
2. Se não autenticado, vê tela de login
3. Faz login ou registro
4. API retorna JWT token
5. Token salvo no localStorage
6. Dashboard carrega dados do usuário
7. Todas as requests usam `Authorization: Bearer <token>`

## 🎯 Próximos Passos

- [ ] Adicionar gráficos de progresso (Recharts)
- [ ] Calendário visual de check-ins
- [ ] Edição de hábitos
- [ ] Filtros e ordenação
- [ ] Dark mode
- [ ] PWA (Progressive Web App)
- [ ] Notificações

## 🐛 Troubleshooting

### Erro de conexão com a API

**Problema**: "Failed to fetch" ou erro CORS

**Solução**:
1. Verifique se a API está rodando: `curl http://localhost:3333/health`
2. Verifique CORS na API (arquivo `.env` da API)
3. Verifique o console do browser para erros

### Token expirado

**Problema**: Sessão expira após 7 dias

**Solução**: Faça login novamente ou aumente `JWT_EXPIRES_IN` na API

### npm install falha

**Problema**: Erro de permissões

**Solução**: Execute `sudo chown -R $(id -u):$(id -g) ~/.npm`

## 📝 Licença

MIT

## 👨‍💻 Autor

Matheus Caitano Batista
- GitHub: [@matheus-cb](https://github.com/matheus-cb)
- Email: matheuscb@msn.com
