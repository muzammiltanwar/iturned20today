// auth.js - Authentication & Sync Manager
import { supabase, isSupabaseConfigured } from './supabase.js';
import { stateManager } from '../state.js';

// Export configuration status
export { isSupabaseConfigured as isClerkConfigured }; // Keeping this alias so main.js doesn't break instantly

// Check if there is an active session
export async function checkAuthSession() {
  if (!isSupabaseConfigured) return false;
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session && session.user) {
      if (!stateManager.state.userProfile) {
        stateManager.state.userProfile = {};
      }
      stateManager.state.userProfile.clerkUserId = session.user.id;
      stateManager.state.userProfile.displayName = session.user.user_metadata?.full_name || session.user.email;
      stateManager.state.localEmail = session.user.email;
      stateManager.saveLocal();
      return true;
    }
    return false;
  } catch (err) {
    console.error('[Auth] Session check failed:', err);
    return false;
  }
}

// Render Authentication UI
export async function renderAuthUI(container) {
  if (!isSupabaseConfigured) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 20px;">
        <i data-lucide="alert-circle" style="width: 32px; height: 32px; color: var(--accent-gold); margin-bottom: 12px;"></i>
        <p>Supabase API Keys are missing in .env</p>
        <p style="font-size: 0.85rem; margin-top: 8px;">Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable cloud sync.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  // Remove background from container if it was set previously
  container.style.background = 'transparent';

  container.innerHTML = `
    <div style="position: absolute; inset: 0; background: #0d0d12; z-index: -1;"></div>
    <div class="ob-step-wrap" style="text-align: center; max-width: 400px; margin: 0 auto; display: flex; flex-direction: column; justify-content: center; height: 100%;">
      <img src="/assets/iturned20today-logo.png" alt="Iturned20today Logo" style="height: 64px; width: auto; margin: 0 auto 20px auto; display: block;" />
      <h2>Welcome to <span class="neon-gradient">Iturned20today</span></h2>
      <p class="ob-sub" style="margin-bottom: 2rem;">Sign in or create an account to start tracking your life.</p>
      
      <div class="form-group" style="text-align: left;">
        <label class="field-label">Email</label>
        <input type="email" id="auth-email-input" class="glass-input" placeholder="you@email.com" />
      </div>
      <div class="form-group" style="text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <label class="field-label">Password</label>
          <a href="#" id="btn-forgot-password" style="font-size: 0.75rem; color: var(--accent-cyan); text-decoration: none;">Forgot Password?</a>
        </div>
        <input type="password" id="auth-password-input" class="glass-input" placeholder="••••••••" />
      </div>
      
      <div style="display: flex; gap: 12px; margin-top: 1rem;">
        <button class="btn btn-secondary" id="btn-auth-signin" style="flex: 1;">Sign In</button>
        <button class="btn btn-primary" id="btn-auth-signup" style="flex: 1;">Create Account</button>
      </div>
      <div id="auth-success-msg" class="text-success hidden" style="font-size: 0.85rem; margin-top: 16px;"></div>
      <div id="auth-error-msg" class="text-danger hidden" style="font-size: 0.85rem; margin-top: 16px;"></div>
    </div>
  `;

  const emailInput = document.getElementById('auth-email-input');
  const passwordInput = document.getElementById('auth-password-input');
  const errorMsg = document.getElementById('auth-error-msg');

  document.getElementById('btn-auth-signin').addEventListener('click', async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
      });
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    }
  });

  const forgotPasswordBtn = document.getElementById('btn-forgot-password');
  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const successMsg = document.getElementById('auth-success-msg');
      const email = emailInput.value.trim();
      
      errorMsg.classList.add('hidden');
      successMsg.classList.add('hidden');
      
      if (!email) {
        errorMsg.textContent = "Please enter your email address first to reset your password.";
        errorMsg.classList.remove('hidden');
        return;
      }
      
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
        
        successMsg.textContent = "Password reset email sent! Please check your inbox.";
        successMsg.classList.remove('hidden');
      } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.classList.remove('hidden');
      }
    });
  }

  document.getElementById('btn-auth-signup').addEventListener('click', async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
      });
      if (error) throw error;
      
      if (data.session) {
        window.location.reload();
      } else {
        alert("Sign up successful! Please check your email to verify your account.");
      }
    } catch (err) {
      errorMsg.textContent = err.message;
      errorMsg.classList.remove('hidden');
    }
  });
}

// Perform sign out
export async function signOut() {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[Auth] Sign out failed:', err);
  }
}

// Global Auth State Listener to handle Password Recovery
if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      const newPassword = prompt("Please enter your new password:");
      if (!newPassword || newPassword.length < 6) {
        alert("Password must be at least 6 characters long. Please refresh the page and try the recovery link again.");
        return;
      }
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        alert("There was an error updating your password: " + error.message);
      } else {
        alert("Your password has been updated successfully!");
        window.location.hash = ''; // Clear recovery hash
      }
    }
  });
}

// Function to pull remote state from Supabase
export async function pullRemoteState(userId) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('user_state')
      .select('state_json')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('[Sync] Error pulling state:', error);
      return null;
    }
    
    if (data && data.state_json) {
      return data.state_json;
    }
    return null;
  } catch (err) {
    console.error('[Sync] Pull failed:', err);
    return null;
  }
}

// Function to push local state to Supabase
export async function pushRemoteState(userId, stateObj) {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .from('user_state')
      .upsert({ 
        user_id: userId, 
        state_json: stateObj,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[Sync] Push failed:', err);
    return false;
  }
}
