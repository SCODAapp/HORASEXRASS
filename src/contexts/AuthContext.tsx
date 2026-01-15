import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextProps {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Escuchar cambios de sesión
  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      loadProfile(data.session?.user?.id || null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      loadProfile(session?.user?.id || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Cargar perfil desde Supabase
  const loadProfile = async (userId: string | null) => {
    if (!userId) return setProfile(null);
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
    } else {
      setProfile(data);
    }
  };

  // -------------------------
  // FUNCIONES DE AUTENTICACIÓN
  // -------------------------

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Actualizar full_name en profiles si existe
      if (fullName && data.user) {
        await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
      }

      return {
        success: true,
        message:
          'Usuario registrado correctamente. Revisa tu correo y confirma tu email antes de iniciar sesión.',
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return {
            success: false,
            message: 'Tu email no ha sido confirmado. Revisa tu correo y confirma antes de iniciar sesión.',
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

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
