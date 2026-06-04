// auth.js - Authentication & Sync Manager

let clerkInstance = null;
let supabaseClient = null;

// Determine if Clerk and Supabase are fully configured via Vite environment variables
export const isClerkConfigured = !!(
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY &&
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Dynamic Loader for Clerk JS SDK
export async function initClerk() {
  if (!isClerkConfigured) return null;
  if (clerkInstance) return clerkInstance;

  return new Promise((resolve, reject) => {
    if (window.Clerk) {
      clerkInstance = window.Clerk;
      resolve(clerkInstance);
      return;
    }

    const script = document.createElement('script');
    // Standard jsdelivr URL for @clerk/clerk-js bundle
    script.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    
    script.addEventListener('load', async () => {
      try {
        const clerk = new window.Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
        await clerk.load({
          appearance: {
            theme: 'dark' // Matches the obsidian / dark glassmorphic UI of the dashboard
          }
        });
        clerkInstance = clerk;
        resolve(clerkInstance);
      } catch (err) {
        console.error('[Auth] Failed to load/initialize Clerk instance:', err);
        reject(err);
      }
    });

    script.addEventListener('error', (err) => {
      console.error('[Auth] Clerk script load error:', err);
      reject(err);
    });

    document.body.appendChild(script);
  });
}

// Dynamic Loader for Supabase JS SDK
export async function initSupabase() {
  if (!isClerkConfigured) return null;
  if (supabaseClient) return supabaseClient;

  return new Promise((resolve, reject) => {
    if (window.supabase) {
      supabaseClient = window.supabase.createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      resolve(supabaseClient);
      return;
    }

    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.async = true;

    script.addEventListener('load', () => {
      try {
        supabaseClient = window.supabase.createClient(
          import.meta.env.VITE_SUPABASE_URL,
          import.meta.env.VITE_SUPABASE_ANON_KEY
        );
        resolve(supabaseClient);
      } catch (err) {
        console.error('[Auth] Failed to load/initialize Supabase client:', err);
        reject(err);
      }
    });

    script.addEventListener('error', (err) => {
      console.error('[Auth] Supabase script load error:', err);
      reject(err);
    });

    document.body.appendChild(script);
  });
}

// Check if there is an active session
export async function checkAuthSession() {
  if (!isClerkConfigured) return false;
  try {
    const clerk = await initClerk();
    return !!clerk.user;
  } catch (err) {
    console.warn('[Auth] checkAuthSession failed:', err);
    return false;
  }
}

// Sign out of the session
export async function signOut() {
  if (!isClerkConfigured) return true;
  try {
    const clerk = await initClerk();
    await clerk.signOut();
    return true;
  } catch (err) {
    console.error('[Auth] signOut failed:', err);
    return false;
  }
}

// Trigger inline/virtual Clerk Sign-in/Sign-up flow fallback
export async function openSignIn() {
  if (!isClerkConfigured) return null;
  try {
    const clerk = await initClerk();
    return new Promise((resolve) => {
      clerk.openSignIn({
        afterSignInUrl: '#',
        afterSignUpUrl: '#',
      });
      
      const interval = setInterval(() => {
        if (clerk.user) {
          clearInterval(interval);
          resolve(clerk.user);
        }
      }, 800);
    });
  } catch (err) {
    console.error('[Auth] openSignIn failed:', err);
    return null;
  }
}

// Fetch user profile from Supabase profiles table
export async function fetchProfile(clerkUserId) {
  if (!isClerkConfigured) return { data: null, error: null };
  try {
    const supabase = await initSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();
    return { data, error };
  } catch (err) {
    console.error('[Auth] fetchProfile exception:', err);
    return { data: null, error: err };
  }
}

// Sync the onboarding state to Supabase
export async function syncProfileToSupabase(od) {
  if (!isClerkConfigured || !od.clerkUserId) return { data: null, error: null };
  try {
    const supabase = await initSupabase();
    const payload = {
      clerk_user_id: od.clerkUserId,
      display_name: od.displayName,
      avatar_emoji: od.avatarEmoji,
      birthday: od.birthDate,
      situation: od.situation,
      institution: od.institution,
      year_of_study: parseInt(od.yearOfStudy) || 1,
      degree_title: od.degreeTitle,
      graduation_year: parseInt(od.graduationYear) || null,
      job_title: od.jobTitle,
      company: od.company,
      industry: od.industry,
      weekly_hours: parseInt(od.weeklyStudyHours) || 20,
      currency: od.currencySymbol,
      primary_goal: od.primaryGoal,
      monthly_budget: parseFloat(od.monthlyBudget) || null,
      updated_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'clerk_user_id' });
    return { data, error };
  } catch (err) {
    console.error('[Auth] syncProfileToSupabase exception:', err);
    return { data: null, error: err };
  }
}
