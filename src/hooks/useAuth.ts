import { useState } from 'react';
import supabase from '../lib/supabase';
import { useAuthStore } from '../../store/authStore';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  async function signIn(email: string, password: string): Promise<string | null> {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return error.message;
    setUser(data.user);
    return null;
  }

  async function signUp(email: string, password: string, fullName: string): Promise<string | null> {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) return error.message;
    // No session = Supabase requires email confirmation before login
    if (!data.session) return '__confirm_email__';
    if (data.user) setUser(data.user);
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
  }

  return { user, loading, signIn, signUp, signOut };
}
