import { useState } from 'react';
import type { FormEvent } from 'react';

interface AdminLoginProps {
  onLogin: (password: string) => void;
  error?: string;
  onClearError?: () => void;
}

export function AdminLogin({ onLogin, error, onClearError }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.trim().length < 3) {
      setLocalError('Unesite ispravnu lozinku.');
      return;
    }
    setLocalError('');
    onLogin(password);
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-4 text-sm uppercase tracking-[0.24em] text-slate-500">Admin način rada</div>
      <p className="mb-4 text-slate-700">Prijavite se kao administrator kako biste mogli uređivati, brisati i završavati rezervacije.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">
          Lozinka
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setLocalError('');
              onClearError?.();
              setPassword(event.target.value);
            }}
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
            placeholder="Unesite lozinku"
          />
        </label>
        {(localError || error) && <p className="text-sm text-red-600">{localError || error}</p>}
        <button className="inline-flex w-full justify-center rounded-2xl bg-deep-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900">
          Prijavi se
        </button>
      </form>
    </div>
  );
}
