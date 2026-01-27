import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.id);
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (!mounted) return;

      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string, retries = 3) => {
    try {
      console.log('Loading profile for user:', userId, 'retries left:', retries);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);

        if (retries > 0) {
          console.log('Retrying profile load...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadProfile(userId, retries - 1);
        }

        setProfile(null);
        setLoading(false);
      } else if (data) {
        console.log('Profile loaded successfully:', data);
        setProfile(data);
        setLoading(false);
      } else {
        console.log('No profile found, will retry if attempts left');

        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadProfile(userId, retries - 1);
        }

        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Exception loading profile:', error);
      setProfile(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error?.message?.includes('Email not confirmed')) {
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
      return { success: false, message: error?.message ?? String(error) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      if (data.user && fullName) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName
        });
      }

      return {
        success: true,
        message: 'Cuenta creada exitosamente',
      };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { success: false, message: error?.message ?? String(error) };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
