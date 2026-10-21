import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (token: string, user: { username: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = (await res.json()) as any;
      if (res.ok && data.success && data.token) {
        localStorage.setItem('xtra_auth_token', data.token);
        localStorage.setItem('xtra_auth_user', JSON.stringify(data.user));
        onLoginSuccess(data.token, data.user);
      } else {
        setError(data.error || 'Username emaw password a dik lo!');
      }
    } catch (err: any) {
      // Local fallback in case offline or API error
      if (username === 'lingtuka' && password === 'MAWLA1984@mala') {
        const fallbackToken = 'lingtuka.authenticated_local';
        localStorage.setItem('xtra_auth_token', fallbackToken);
        localStorage.setItem('xtra_auth_user', JSON.stringify({ username: 'lingtuka' }));
        onLoginSuccess(fallbackToken, { username: 'lingtuka' });
      } else {
        setError('Login a hlawhchham. Khawngaihin i internet check la han tum nawn leh rawh.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-neutral-100">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4 text-blue-400">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            XTRA Protected
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            He app hi private admin portal a ni a, luh nan login a ngai e.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username chhu rawh"
                className="w-full bg-neutral-950/70 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password chhu rawh"
                className="w-full bg-neutral-950/70 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] disabled:opacity-50 text-white font-medium text-sm py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Lut rawh (Log in)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-neutral-800/80 text-center text-[11px] text-neutral-500">
          Inkhel Xtra News Automation Engine &bull; Private
        </div>
      </div>
    </div>
  );
};
