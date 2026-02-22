import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import InteractiveEyes from '@/components/InteractiveEyes';
import SocialLoginButtons from '@/components/SocialLoginButtons';

function EyeOpenIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 1.5C5.5 1.5 1.5 7 1.5 7s4 5.5 8.5 5.5S18.5 7 18.5 7s-4-5.5-8.5-5.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="10" cy="7" r="2.5" fill="currentColor" />
    </svg>
  );
}

function EyeClosedIcon() {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 7C5 4 7.5 2.5 10 2.5S15 4 18 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 6.5L4 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M10 7.5L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M15 6.5L16 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, register, error } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isLogin) {
      const ok = await login({ email: formData.email, password: formData.password }, rememberMe);
      if (ok) navigate('/', { replace: true });
    } else {
      const ok = await register(formData);
      if (ok) navigate('/', { replace: true });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <InteractiveEyes
            passwordFocused={passwordFocused}
            passwordLength={formData.password.length}
            showPassword={showPassword}
            textFocused={emailFocused || nameFocused}
            textLength={emailFocused ? formData.email.length : nameFocused ? formData.name.length : 0}
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Entre para continuar' : 'Comece a rastrear seus hábitos'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                className="w-full px-4 py-2 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex items-center gap-2">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-sm text-gray-600 cursor-pointer select-none"
              >
                Lembre de mim
              </label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        {isLogin && (
          <>
            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500">ou continue com</span>
              </div>
            </div>
            <SocialLoginButtons />
          </>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            {isLogin ? 'Não tem conta? Registre-se' : 'Já tem conta? Entre'}
          </button>
        </div>
      </div>
    </div>
  );
}
