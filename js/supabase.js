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
 * Storing demographic fields and school district settings.
 */
export async function signUpUser(email, password, fullName, schoolName, details = {}) {
    const sb = getSupabase();
    if (!sb) throw new Error("Database client not initialized.");

    // 1. Sign up user via Supabase Auth
    const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: window.location.origin,
            data: {
                full_name: fullName,
                school_name: schoolName,
                age: details.age || null,
                state: details.state || "",
                city: details.city || "",
                education_level: details.educationLevel || "college",
                school_district: details.schoolDistrict || "",
                major: details.major || "",
                grad_year: details.gradYear || "",
                avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`
            }
        }
    });

    if (error) throw error;

    // 2. Try writing to public.profiles table
    // With email confirmation enabled Supabase does not create a session yet,
    // so the profile trigger in schema.sql owns the initial record until login.
    if (data.user && data.session) {
        try {
            const { error: profileError } = await sb
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    full_name: fullName,
                    school_name: schoolName,
                    age: details.age || null,
                    state: details.state || "",
                    city: details.city || "",
                    education_level: details.educationLevel || "college",
                    school_district: details.schoolDistrict || "",
                    major: details.major || "",
                    grad_year: details.gradYear || "",
                    updated_at: new Date().toISOString()
                });
            
            if (profileError) {
                console.warn("Profiles table write failed:", profileError.message);
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
        avatar: user.user_metadata?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        age: user.user_metadata?.age || null,
        state: user.user_metadata?.state || "",
        city: user.user_metadata?.city || "",
        educationLevel: user.user_metadata?.education_level || "college",
        schoolDistrict: user.user_metadata?.school_district || "",
        major: user.user_metadata?.major || "",
        gradYear: user.user_metadata?.grad_year || ""
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
            profile.age = data.age || profile.age;
            profile.state = data.state || profile.state;
            profile.city = data.city || profile.city;
            profile.educationLevel = data.education_level || profile.educationLevel;
            profile.schoolDistrict = data.school_district || profile.schoolDistrict;
            profile.major = data.major || profile.major;
            profile.gradYear = data.grad_year || profile.gradYear;
            if (data.avatar_url) profile.avatar = data.avatar_url;
        }
    } catch (e) {
        console.warn("Could not read profiles table, falling back to auth metadata:", e);
    }

    return profile;
}
