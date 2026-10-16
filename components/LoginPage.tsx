import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('Mohon isi username dan kata sandi.');
      return;
    }

    setIsLoading(true);

    // Verifikasi kredensial
    setTimeout(() => {
      if (trimmedUser === 'Teduhdalamcerita' && trimmedPass === 'belajarpintar') {
        localStorage.setItem('teduh_auth_user', trimmedUser);
        localStorage.setItem('teduh_auth_timestamp', Date.now().toString());
        setIsLoading(false);
        onLoginSuccess(trimmedUser);
      } else {
        setIsLoading(false);
        setError('Username atau kata sandi tidak valid. Silakan coba lagi.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden selection:bg-teal-500/30">
      {/* Background Decorative Glow (Subtle & Intentional) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-teal-500/10 via-emerald-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="p-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden border border-teal-500/30 bg-slate-900 shadow-md shadow-teal-500/10">
            <img 
              src="/logo.jpg" 
              alt="TeduhCeritaAI Logo" 
              className="w-full h-full object-cover" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
              TeduhCerita<span className="text-teal-400">AI</span>
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <ShieldCheck size={14} className="text-teal-400" />
          <span>Akses Terproteksi</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
          {/* Logo & Headline */}
          <div className="text-center mb-8 space-y-3">
            <div className="inline-block p-1 bg-gradient-to-br from-teal-500/20 to-slate-800 rounded-2xl border border-teal-500/30 shadow-lg shadow-teal-500/10">
              <img 
                src="/logo.jpg" 
                alt="TeduhCeritaAI" 
                className="w-20 h-20 rounded-xl object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Masuk ke Studio</h1>
              <p className="text-xs text-slate-400 mt-1">
                Studio Papan Cerita & Konten Sinematik Islami
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-xs animate-in fade-in">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="username" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User size={16} />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-teal-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Masuk ke Studio</span>
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center text-xs text-slate-600 relative z-10">
        TeduhCeritaAI &copy; {new Date().getFullYear()} — Generative Storyboard & Islamic Cinematic Studio
      </footer>
    </div>
  );
};

export default LoginPage;
