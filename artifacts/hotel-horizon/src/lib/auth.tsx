// Camada de autenticação do site.
//
// O backend atual (artifacts/api-server) ainda não expõe endpoints de
// cadastro/login de usuários — apenas reservas. Para não bloquear o
// fluxo de "só usuários autenticados reservam", este módulo implementa
// um provedor de autenticação no cliente, persistido em localStorage.
// Quando o backend de contas de usuário existir, basta trocar a
// implementação de signUp/login abaixo por chamadas reais à API,
// mantendo a mesma interface (useAuth) usada pelo resto do site.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isValidCPF, isValidEmail, isValidPassword, isValidPhone, onlyDigits } from './validators';

export type AuthUser = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
};

type StoredUser = AuthUser & { password: string };

type SignUpInput = { name: string; email: string; phone: string; cpf: string; password: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  signUp: (input: SignUpInput) => { ok: true } | { ok: false; error: string };
  login: (email: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const USERS_KEY = 'hotelhorizon_users';
const SESSION_KEY = 'hotelhorizon_session';

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function toPublicUser(user: StoredUser): AuthUser {
  const { password: _password, ...publicUser } = user;
  return publicUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  // Restaura a sessão salva ao carregar a página.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // sessão corrompida: ignora e segue deslogado
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,

    signUp: ({ name, email, phone, cpf, password }) => {
      if (name.trim().length < 2) return { ok: false, error: 'Informe seu nome completo.' };
      if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' };
      if (!isValidPhone(phone)) return { ok: false, error: 'Informe um telefone válido.' };
      if (!isValidCPF(cpf)) return { ok: false, error: 'Informe um CPF válido.' };
      if (!isValidPassword(password)) return { ok: false, error: 'A senha deve ter ao menos 6 caracteres.' };

      const users = loadUsers();
      const emailNormalized = email.trim().toLowerCase();
      const cpfDigits = onlyDigits(cpf);
      if (users.some(u => u.email.toLowerCase() === emailNormalized)) {
        return { ok: false, error: 'Já existe uma conta com este e-mail.' };
      }
      if (users.some(u => onlyDigits(u.cpf) === cpfDigits)) {
        return { ok: false, error: 'Já existe uma conta com este CPF.' };
      }

      const newUser: StoredUser = { name: name.trim(), email: emailNormalized, phone: phone.trim(), cpf: cpf.trim(), password };
      saveUsers([...users, newUser]);
      localStorage.setItem(SESSION_KEY, JSON.stringify(toPublicUser(newUser)));
      setUser(toPublicUser(newUser));
      return { ok: true };
    },

    login: (email, password) => {
      const users = loadUsers();
      const found = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || found.password !== password) {
        return { ok: false, error: 'E-mail ou senha incorretos.' };
      }
      localStorage.setItem(SESSION_KEY, JSON.stringify(toPublicUser(found)));
      setUser(toPublicUser(found));
      return { ok: true };
    },

    logout: () => {
      localStorage.removeItem(SESSION_KEY);
      setUser(null);
    },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
