import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface User {
    id: string;
    email?: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    checkSession: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    loading: true,

    setUser: (user) => set({ user }),

    checkSession: async () => {
        set({ loading: true });
        const { data: { session } } = await supabase.auth.getSession();
        set({ user: session?.user || null, loading: false });

        if (session?.user) {
            // Ensure public.users record exists
            await supabase.from('users').upsert({
                id: session.user.id,
                email: session.user.email
            }, { onConflict: 'id' });
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            set({ user: session?.user || null });
            if (session?.user) {
                await supabase.from('users').upsert({
                    id: session.user.id,
                    email: session.user.email
                }, { onConflict: 'id' });
            }
        });
    },

    signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error && data.user) {
            set({ user: data.user });
            // Ensure public.users record exists
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email
            }, { onConflict: 'id' });
        }
        return { error };
    },

    signUp: async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (!error && data.user) {
            set({ user: data.user });
            // Ensure public.users record exists
            await supabase.from('users').upsert({
                id: data.user.id,
                email: data.user.email
            }, { onConflict: 'id' });
        }
        return { error };
    },

    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    }
}));
