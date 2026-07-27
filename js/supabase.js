/* ==========================================================================
   Alcove Supabase Database Client & Authentication Interface Module
   ========================================================================== */

import { SUPABASE_CONFIG } from './config.js';

let supabaseInstance = null;

// Initialize Supabase Client dynamically from window namespace
export function getSupabase() {
    if (!supabaseInstance) {
        if (!window.supabase) {
            console.error("Supabase CDN script is not loaded yet.");
            return null;
        }
        
        try {
            supabaseInstance = window.supabase.createClient(
                SUPABASE_CONFIG.URL,
                SUPABASE_CONFIG.ANON_KEY
            );
        } catch (e) {
            console.error("Failed to initialize Supabase client:", e);
        }
    }
    return supabaseInstance;
}

/**
 * Register a new user and create their profile.
 * We store details in user_metadata (requires no tables) AND try to write to a profiles table.
 */
export async function signUpUser(email, password, fullName, schoolName) {
    const sb = getSupabase();
    if (!sb) throw new Error("Database client not initialized.");

    // 1. Sign up user via Supabase Auth (stores details in secure metadata)
    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                school_name: schoolName,
                avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`
            }
        }
    });

    if (error) throw error;

    // 2. Try writing to public.profiles table (fails gracefully if table is not created yet)
    if (data.user) {
        try {
            const { error: profileError } = await sb
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    full_name: fullName,
                    school_name: schoolName,
                    updated_at: new Date().toISOString()
                });
            
            if (profileError) {
                console.warn("Profiles table write failed (table might not exist yet):", profileError.message);
                // Safe to ignore since user_metadata works as fallback
            }
        } catch (e) {
            console.warn("Failed to write to profiles table:", e);
        }
    }

    return data;
}

/**
 * Sign in an existing user with email and password
 */
export async function signInUser(email, password) {
    const sb = getSupabase();
    if (!sb) throw new Error("Database client not initialized.");

    const { data, error } = await sb.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out the current user session
 */
export async function signOutUser() {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signOut();
}

/**
 * Fetch profiles database table fallback, otherwise return auth metadata details
 */
export async function getUserProfile(user) {
    if (!user) return null;
    
    // Default to metadata contents
    const profile = {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || "Alex Rivera",
        school: user.user_metadata?.school_name || "Stanford University",
        avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
    };

    const sb = getSupabase();
    if (!sb) return profile;

    // Try reading from public.profiles table
    try {
        const { data, error } = await sb
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data && !error) {
            profile.name = data.full_name || profile.name;
            profile.school = data.school_name || profile.school;
            if (data.avatar_url) profile.avatar = data.avatar_url;
        }
    } catch (e) {
        console.warn("Could not read profiles table, falling back to auth metadata:", e);
    }

    return profile;
}
