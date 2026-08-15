// Modal de Cadastro e Login. Usado tanto pelo cabeçalho (acesso livre)
// quanto pelo motor de reservas (obrigatório antes do pagamento).

import { useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { formatCPF, formatPhone, isValidCPF, isValidEmail, isValidPassword, isValidPhone } from '@/lib/validators';

type Tab = 'login' | 'signup';

const inputClass = 'focus-ring w-full border bg-transparent px-3 py-3 text-sm outline-none';
function fieldBorder(touched: boolean, valid: boolean) {
  if (!touched) return 'border-[#243b30]/20';
  return valid ? 'border-[#4c7a5f]' : 'border-red-400';
}

export function AuthModal({ initialTab = 'login', reason, onClose, onSuccess }: {
  initialTab?: Tab;
  /** Mensagem opcional explicando por que o login é necessário agora (ex.: antes do pagamento). */
  reason?: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { login, signUp } = useAuth();
  const [tab, setTab] = useState<Tab>(initialTab);

  // --- Login ---
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTouched, setLoginTouched] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // --- Cadastro ---
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signupTouched, setSignupTouched] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const nameValid = name.trim().length >= 2;
  const emailValid = isValidEmail(email);
  const phoneValid = isValidPhone(phone);
  const cpfValid = isValidCPF(cpf);
  const passwordValid = isValidPassword(password);
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;
  const signupValid = nameValid && emailValid && phoneValid && cpfValid && passwordValid && confirmValid;

  const submitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched(true);
    setLoginError('');
    if (!isValidEmail(loginEmail) || loginPassword.length === 0) {
      setLoginError('Informe e-mail e senha válidos.');
      return;
    }
    setLoginLoading(true);
    const result = login(loginEmail, loginPassword);
    setLoginLoading(false);
    if (!result.ok) { setLoginError(result.error); return; }
    onSuccess?.();
    onClose();
  };

  const submitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupTouched(true);
    setSignupError('');
    if (!signupValid) { setSignupError('Confira os campos destacados antes de continuar.'); return; }
    setSignupLoading(true);
    const result = signUp({ name, email, phone, cpf, password });
    setSignupLoading(false);
    if (!result.ok) { setSignupError(result.error); return; }
    onSuccess?.();
    onClose();
  };

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#15231d]/80 p-4" role="dialog" aria-modal="true" aria-label="Cadastro e login">
    <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto bg-[#f7f4ee] p-6 shadow-2xl sm:p-8" data-testid="modal-auth">
      <div className="flex items-center justify-between">
        <div className="flex gap-6">
          <button onClick={() => setTab('login')} className={`pb-2 text-[11px] font-semibold uppercase tracking-[.14em] ${tab === 'login' ? 'border-b-2 border-[#b89b5e] text-[#243b30]' : 'text-[#706e67]'}`} data-testid="tab-login">Entrar</button>
          <button onClick={() => setTab('signup')} className={`pb-2 text-[11px] font-semibold uppercase tracking-[.14em] ${tab === 'signup' ? 'border-b-2 border-[#b89b5e] text-[#243b30]' : 'text-[#706e67]'}`} data-testid="tab-signup">Cadastrar</button>
        </div>
        <button onClick={onClose} aria-label="Fechar" className="focus-ring text-[#243b30]" data-testid="button-auth-close"><X size={20} /></button>
      </div>

      {reason && <p className="mt-4 flex items-start gap-2 border border-[#b89b5e]/50 bg-[#e8e0d2] p-3 text-xs leading-5 text-[#243b30]"><AlertCircle size={14} className="mt-0.5 shrink-0" /> {reason}</p>}

      {tab === 'login' && <form onSubmit={submitLogin} className="mt-6 space-y-4" data-testid="form-login" noValidate>
        <h2 className="font-display text-2xl text-[#243b30]">Bem-vindo de volta</h2>
        <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">E-mail</span>
          <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} onBlur={() => setLoginTouched(true)} className={`${inputClass} ${fieldBorder(loginTouched, isValidEmail(loginEmail))}`} data-testid="input-login-email" />
        </label>
        <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Senha</span>
          <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} onBlur={() => setLoginTouched(true)} className={`${inputClass} ${fieldBorder(loginTouched, loginPassword.length > 0)}`} data-testid="input-login-password" />
        </label>
        {loginError && <p className="flex items-center gap-2 text-xs text-red-700" role="alert" data-testid="text-login-error"><AlertCircle size={14} /> {loginError}</p>}
        <button type="submit" disabled={loginLoading} className="focus-ring flex w-full items-center justify-center gap-2 bg-[#b89b5e] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[#1d2b25] transition hover:bg-[#cfb777] disabled:opacity-60" data-testid="button-submit-login">{loginLoading && <Loader2 size={14} className="animate-spin" />} Entrar</button>
        <p className="text-center text-xs text-[#706e67]">Ainda não tem conta? <button type="button" onClick={() => setTab('signup')} className="font-semibold text-[#243b30] underline">Cadastre-se</button></p>
      </form>}

      {tab === 'signup' && <form onSubmit={submitSignup} className="mt-6 space-y-4" data-testid="form-signup" noValidate>
        <h2 className="font-display text-2xl text-[#243b30]">Criar minha conta</h2>
        <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Nome completo</span>
          <input value={name} onChange={e => setName(e.target.value)} onBlur={() => setSignupTouched(true)} className={`${inputClass} ${fieldBorder(signupTouched, nameValid)}`} data-testid="input-signup-name" />
        </label>
        <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">E-mail</span>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setSignupTouched(true)} className={`${inputClass} ${fieldBorder(signupTouched, emailValid)}`} data-testid="input-signup-email" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Telefone</span>
            <input value={phone} onChange={e => setPhone(formatPhone(e.target.value))} onBlur={() => setSignupTouched(true)} placeholder="(12) 90000-0000" className={`${inputClass} ${fieldBorder(signupTouched, phoneValid)}`} data-testid="input-signup-phone" />
          </label>
          <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">CPF</span>
            <input value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} onBlur={() => setSignupTouched(true)} placeholder="000.000.000-00" className={`${inputClass} ${fieldBorder(signupTouched, cpfValid)}`} data-testid="input-signup-cpf" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Senha</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} onBlur={() => setSignupTouched(true)} className={`${inputClass} ${fieldBorder(signupTouched, passwordValid)}`} data-testid="input-signup-password" />
          </label>
          <label className="flex flex-col gap-1"><span className="text-[9px] font-semibold uppercase tracking-[.16em] text-[#706e67]">Confirmar senha</span>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onBlur={() => setSignupTouched(true)} className={`${inputClass} ${fieldBorder(signupTouched, confirmValid)}`} data-testid="input-signup-confirm-password" />
          </label>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-[#706e67]">
          <li className={`flex items-center gap-1.5 ${nameValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> Nome completo</li>
          <li className={`flex items-center gap-1.5 ${emailValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> E-mail válido</li>
          <li className={`flex items-center gap-1.5 ${phoneValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> Telefone válido</li>
          <li className={`flex items-center gap-1.5 ${cpfValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> CPF válido</li>
          <li className={`flex items-center gap-1.5 ${passwordValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> 6+ caracteres</li>
          <li className={`flex items-center gap-1.5 ${confirmValid ? 'text-[#4c7a5f]' : ''}`}><Check size={11} /> Senhas iguais</li>
        </ul>
        {signupError && <p className="flex items-center gap-2 text-xs text-red-700" role="alert" data-testid="text-signup-error"><AlertCircle size={14} /> {signupError}</p>}
        <button type="submit" disabled={signupLoading} className="focus-ring flex w-full items-center justify-center gap-2 bg-[#b89b5e] px-5 py-4 text-[10px] font-semibold uppercase tracking-[.16em] text-[#1d2b25] transition hover:bg-[#cfb777] disabled:opacity-60" data-testid="button-submit-signup">{signupLoading && <Loader2 size={14} className="animate-spin" />} Criar conta</button>
        <p className="text-center text-xs text-[#706e67]">Já tem conta? <button type="button" onClick={() => setTab('login')} className="font-semibold text-[#243b30] underline">Entrar</button></p>
      </form>}
    </div>
  </div>;
}
