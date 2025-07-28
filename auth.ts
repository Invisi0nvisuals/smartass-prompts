import { createServerComponentClient, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Database } from '@/types/supabase';

// Server-side auth client
export const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerComponentClient<Database>({ cookies: () => cookieStore });
};

// Client-side auth client
export const createClientSupabaseClient = () => {
  return createClientComponentClient<Database>();
};

// Get current user on server side
export async function getCurrentUser() {
  const supabase = createServerSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Get current session on server side
export async function getCurrentSession() {
  const supabase = createServerSupabaseClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
}

// Require authentication (redirect if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  return user;
}

// Redirect if already authenticated
export async function redirectIfAuthenticated() {
  const user = await getCurrentUser();
  
  if (user) {
    redirect('/prompts');
  }
}

// Sign up with email and password
export async function signUp(email: string, password: string, metadata?: Record<string, any>) {
  const supabase = createClientSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      data: metadata,
    },
  });
  
  return { data, error };
}

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const supabase = createClientSupabaseClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

// Sign out
export async function signOut() {
  const supabase = createClientSupabaseClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (!error) {
    // Redirect to home page after sign out
    window.location.href = '/';
  }
  
  return { error };
}

// Reset password
export async function resetPassword(email: string) {
  const supabase = createClientSupabaseClient();
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });
  
  return { data, error };
}

// Update password
export async function updatePassword(password: string) {
  const supabase = createClientSupabaseClient();
  
  const { data, error } = await supabase.auth.updateUser({
    password,
  });
  
  return { data, error };
}

// Update user profile
export async function updateProfile(updates: {
  email?: string;
  data?: Record<string, any>;
}) {
  const supabase = createClientSupabaseClient();
  
  const { data, error } = await supabase.auth.updateUser(updates);
  
  return { data, error };
}

// Get user profile from database
export async function getUserProfile(userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
}

// Create or update user profile
export async function upsertUserProfile(profile: {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
}) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(profile, { onConflict: 'id' })
    .select()
    .single();
  
  return { data, error };
}

// Check if user owns a prompt
export async function userOwnsPrompt(userId: string, promptId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('prompt_metadata')
    .select('id')
    .eq('id', promptId)
    .eq('owner_id', userId)
    .single();
  
  return { owns: !!data && !error, error };
}

// Get user's prompts
export async function getUserPrompts(userId: string, limit = 10, offset = 0) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('prompt_metadata')
    .select(`
      id,
      title,
      description,
      category,
      tags,
      overall_score,
      view_count,
      like_count,
      created_at,
      is_public,
      status
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return { data, error };
}

// Get user's liked prompts
export async function getUserLikedPrompts(userId: string, limit = 10, offset = 0) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('user_prompt_interactions')
    .select(`
      prompt_id,
      created_at,
      prompt_metadata (
        id,
        title,
        description,
        category,
        tags,
        overall_score,
        view_count,
        like_count,
        owner_id
      )
    `)
    .eq('user_id', userId)
    .eq('interaction_type', 'like')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  return { data, error };
}

// Auth state change handler for client components
export function useAuthStateChange(callback: (user: any) => void) {
  const supabase = createClientSupabaseClient();
  
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(session?.user ?? null);
      }
    );
    
    return () => subscription.unsubscribe();
  }, [callback, supabase.auth]);
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

