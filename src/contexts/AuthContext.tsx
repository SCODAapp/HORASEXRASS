import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Profile, Subscription } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

interface AuthContextProps {
  user: any | null;
  profile: Profile | null;
  subscription: Subscription | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('getSession error:', sessionError);

      const session: Session | null = sessionData?.session ?? null;
      setUser(session?.user ?? null);

      if (session?.user?.id) {
        await loadProfile(session.user.id);
        await loadSubscription(session.user.id);
      }

      setLoading(false);
    };

    initAuth();

    const { subscription: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        loadProfile(session.user.id);
        loadSubscription(session.user.id);
      }
    });

    return () => {
      authSub.unsubscribe();
    };
  }, []);

  // Cargar perfil
  const loadProfile = async (userId: string) => {
    const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileError) console.error('Error loading profile:', profileError);
    else setProfile(profileData);
  };

  // Cargar suscripción
  const loadSubscription = async (userId: string) => {
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId);

    if (error) console.error('Error loading subscription:', error);
    else setSubscription(subs?.[0] ?? null); // toma la primera suscripción si existe
  };

  // Registro de usuario
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data: _data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (fullName && _data?.user) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', _data.user.id);
      }

      return {
        success: true,
        message: 'Usuario registrado. Revisa tu correo para confirmar el email antes de iniciar sesión.',
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message };
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    try {
      const { data: _data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            message: 'Tu email no ha sido confirmado. Revisa tu correo antes de iniciar sesión.',
          };
        }
        throw error;
      }
      return { success: true, message: 'Login exitoso' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  };

  // Logout
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, subscription, loading, signUp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
