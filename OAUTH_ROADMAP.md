# OAuth Roadmap — habits-dashboard + habits-api

Este documento descreve as mudanças necessárias para implementar login social real (Google, GitHub, Apple) no ecossistema habits.

> **Status atual:** Os botões de social login na tela de login são apenas visuais e exibem um toast "Em breve 🚀". Este roadmap descreve o que implementar quando OAuth for priorizado.

---

## Visão Geral do Fluxo OAuth

```
[Usuário clica "Google"] → [Frontend redireciona para API /auth/google]
  → [API redireciona para Google OAuth] → [Usuário autoriza]
  → [Google redireciona para API /auth/google/callback]
  → [API troca code por token, busca/cria usuário, gera JWT]
  → [API redireciona para frontend /auth/callback?token=JWT]
  → [Frontend lê token da URL, salva no storage, redireciona para /]
```

---

## 1. Mudanças na `habits-api`

### 1.1 Dependências

```bash
npm install passport passport-google-oauth20 passport-github2
npm install --save-dev @types/passport @types/passport-google-oauth20 @types/passport-github2
```

### 1.2 Variáveis de Ambiente (`.env`)

```env
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GITHUB_CLIENT_ID=seu_github_client_id
GITHUB_CLIENT_SECRET=seu_github_client_secret
OAUTH_CALLBACK_URL=http://localhost:3333
FRONTEND_URL=http://localhost:3000
```

### 1.3 Schema Prisma (`prisma/schema.prisma`)

Adicionar campos opcionais ao modelo `User`:

```prisma
model User {
  id        String    @id @default(cuid())
  name      String
  email     String    @unique
  password  String?   // Opcional para usuários sociais
  googleId  String?   @unique
  githubId  String?   @unique
  appleId   String?   @unique
  habits    Habit[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

Após alterar o schema:
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 1.4 Novos Endpoints

```
GET /auth/google              → redireciona ao Google OAuth
GET /auth/google/callback     → callback do Google, gera JWT
GET /auth/github              → redireciona ao GitHub OAuth
GET /auth/github/callback     → callback do GitHub, gera JWT
```

### 1.5 Exemplo de implementação (Google)

```typescript
// src/routes/auth.routes.ts (adições)
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID,
  clientSecret: env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${env.OAUTH_CALLBACK_URL}/api/v1/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails?.[0].value;
  let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

  if (!user && email) {
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
    } else {
      user = await prisma.user.create({
        data: { name: profile.displayName, email, googleId: profile.id },
      });
    }
  }
  return done(null, user);
}));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    const user = req.user as User;
    const token = generateJWT(user);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);
```

---

## 2. Mudanças no `habits-dashboard`

### 2.1 Variável de Ambiente (`.env`)

```env
VITE_API_URL=http://localhost:3333/api/v1
```

Já existente, nenhuma mudança necessária.

### 2.2 Botões de Social Login

Em `src/components/SocialLoginButtons.tsx`, substituir `showToast()` pelo redirect:

```typescript
function handleGoogle() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
}

function handleGithub() {
  window.location.href = `${import.meta.env.VITE_API_URL}/auth/github`;
}
```

### 2.3 Nova Rota de Callback

Criar `src/pages/OAuthCallbackPage.tsx`:

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api/auth';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      authApi.saveToken(token, true);
      navigate('/', { replace: true });
    } else {
      navigate('/login?error=' + (error ?? 'oauth_failed'), { replace: true });
    }
  }, [navigate]);

  return <div className="min-h-screen flex items-center justify-center">Autenticando...</div>;
}
```

Registrar em `src/App.tsx`:
```typescript
<Route path="/auth/callback" element={<OAuthCallbackPage />} />
```

---

## 3. Apple Sign In

Apple é mais complexo que Google/GitHub e requer:

- **Conta Apple Developer** ($99/ano)
- **Service ID** configurado no portal Apple Developer
- **Domínio verificado** (não funciona em localhost sem HTTPS e domínio real)
- **Private Key** (.p8) para assinar JWTs do lado servidor
- **`Sign in with Apple` JS SDK** no frontend

### Recomendação

Implementar Apple por último, após Google e GitHub estarem funcionando em produção. A complexidade de configuração é significativamente maior e exige infraestrutura de produção (HTTPS, domínio verificado).

---

## 4. Ordem de Implementação Sugerida

1. **Google OAuth** — Maior base de usuários, documentação excelente
2. **GitHub OAuth** — Relevante para portfólio técnico, dev-friendly
3. **Apple Sign In** — Requerido se publicar app iOS na App Store; opcional para web

---

## 5. Considerações de Segurança

- O JWT gerado pelo OAuth deve ter o mesmo tempo de expiração dos JWTs de email/senha
- Nunca expor `GOOGLE_CLIENT_SECRET` e `GITHUB_CLIENT_SECRET` no frontend
- Usar `state` parameter no OAuth para prevenção de CSRF (Passport gerencia isso automaticamente)
- Em produção, usar HTTPS obrigatoriamente; redirect URIs sem HTTPS são rejeitados pela maioria dos providers
