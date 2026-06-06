import { stateManager } from '../state.js';
import { isClerkConfigured, signOut } from '../lib/auth.js';

export function renderAccountManager(container) {
  const profile = stateManager.state.userProfile || {};
  const currentDob = stateManager.state.birthDate || '';
  const currentLifespan = stateManager.state.expectedLifespan || 80;
  const currentCurrency = stateManager.state.currencySymbol || '₹';

  container.innerHTML = `
    <div class="account-page-container fade-in" style="display: flex; flex-direction: column; gap: 2rem; height: 100%; overflow-y: auto; padding-right: 10px; padding-bottom: 2rem;">
      <header class="view-header">
        <div>
          <h2>Account & <span class="neon-gradient">Settings</span></h2>
          <p class="sub-text">Manage your profile, security, and workspace preferences.</p>
        </div>
      </header>

      <div class="account-content-grid" id="account-content-area" style="display: flex; flex-direction: column; align-items: center; gap: 2rem;">
        
        <!-- Account / Security Section -->
        <div id="auth-section-container" style="width: 100%; max-width: 880px;">
          <div class="loading-state" style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
            <div class="ob-spinner" style="border-width: 3px; border-color: rgba(255,255,255,0.1) rgba(255,255,255,0.8) rgba(255,255,255,0.8) rgba(255,255,255,0.8);"></div>
            <p class="sub-text">Loading authentication...</p>
          </div>
        </div>

        <!-- Local Workspace Settings Section -->
        <div class="glass-card" style="max-width: 880px; width: 100%; padding: 2rem;">
          <h3 style="margin-bottom: 1.5rem;">Workspace Settings</h3>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
            <div class="form-group">
              <label>Display Name</label>
              <input type="text" id="settings-name" class="glass-input" value="${profile.displayName || ''}" placeholder="Your Name" />
            </div>
            <div class="form-group">
              <label>Avatar Emoji</label>
              <input type="text" id="settings-avatar" class="glass-input" value="${profile.avatarEmoji || '⚡'}" maxlength="2" />
            </div>
            <div class="form-group">
              <label>Date of Birth (Updates Age)</label>
              <input type="date" id="settings-dob" class="glass-input" value="${currentDob}" />
            </div>
            <div class="form-group" style="grid-column: 1 / -1;">
              <label>Currency Layout</label>
              <div class="segmented-control" id="settings-currency-segmented" style="margin-top: 0.5rem;">
                <button type="button" class="segment-btn ${currentCurrency === '₹' ? 'active' : ''}" data-value="₹">₹ INR</button>
                <button type="button" class="segment-btn ${currentCurrency === '$' ? 'active' : ''}" data-value="$">$ USD</button>
                <button type="button" class="segment-btn ${currentCurrency === '€' ? 'active' : ''}" data-value="€">€ EUR</button>
                <button type="button" class="segment-btn ${currentCurrency === '£' ? 'active' : ''}" data-value="£">£ GBP</button>
              </div>
            </div>
          </div>
          <button class="btn btn-primary" id="btn-save-settings">Save Configurations</button>
          
          <hr class="modal-separator" style="margin: 2rem 0; opacity: 0.2;" />
          
          <div class="backup-restore-section">
            <h4 style="margin-bottom: 0.5rem;">Data Backup & Portability</h4>
            <p class="sub-text" style="margin-bottom: 1.5rem;">Export your dashboard configuration to a local JSON file or import a previous backup.</p>
            <div class="backup-actions" style="display: flex; gap: 1rem; max-width: 400px;">
              <button class="btn btn-secondary w-100" id="btn-export-data">
                <i data-lucide="download"></i> Export JSON
              </button>
              <button class="btn btn-secondary w-100" id="btn-trigger-import">
                <i data-lucide="upload"></i> Import JSON
              </button>
              <input type="file" id="import-file-input" class="hidden" accept=".json" style="display:none;" />
            </div>
          </div>

          <hr class="modal-separator" style="margin: 2rem 0; opacity: 0.2;" />

          <div class="help-support-section">
            <h4 style="margin-bottom: 0.5rem;">Help & Support</h4>
            <p class="sub-text" style="margin-bottom: 1.5rem;">Need assistance? Check our FAQ or reach out to our team.</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <button class="btn btn-secondary" id="btn-faq-popup" style="flex: 1; min-width: 200px;">
                <i data-lucide="help-circle"></i> FAQ
              </button>
              <button class="btn btn-secondary" style="flex: 1; min-width: 200px;">
                <i data-lucide="message-square"></i> Contact Support
              </button>
              <button class="btn btn-secondary" style="flex: 1; min-width: 200px;">
                <i data-lucide="alert-triangle" class="text-danger"></i> Report Bug / Security Issue
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // --- Auth Section Rendering ---
  const authContainer = document.getElementById('auth-section-container');

  if (isClerkConfigured) {
    if (!stateManager.state.isPro) {
      authContainer.innerHTML = `
        <div class="glass-panel" style="padding: 3rem; text-align: center; max-width: 400px; margin: 0 auto; border: 1px solid var(--accent-gold);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚀</div>
          <h3 style="margin-bottom: 0.5rem;" class="text-gold">Cloud Sync is a Pro Feature</h3>
          <p class="sub-text" style="margin-bottom: 2rem;">Upgrade to the Hustler plan to unlock real-time cloud syncing across all your devices.</p>
          <button class="btn btn-primary w-100" id="btn-account-upgrade" style="background: var(--gradient-gold); color: #000;">Upgrade to Pro</button>
        </div>
      `;
      document.getElementById('btn-account-upgrade').onclick = () => {
        const upgradeBtn = document.getElementById('btn-upgrade-pro');
        if (upgradeBtn) upgradeBtn.click();
      };
    } else {
      // Show auth UI or logout based on session
      import('../lib/auth.js').then(({ checkAuthSession, renderAuthUI, signOut }) => {
        checkAuthSession().then(hasSession => {
          if (!hasSession) {
             renderAuthUI(authContainer);
          } else {
             authContainer.innerHTML = `
                <div class="glass-panel" style="padding: 3rem; text-align: center; max-width: 400px; margin: 0 auto;">
                  <div style="font-size: 3rem; margin-bottom: 1rem;">☁️</div>
                  <h3 style="margin-bottom: 0.5rem;">Cloud Sync Active</h3>
                  <p class="sub-text" style="margin-bottom: 2rem;">Your dashboard is safely synced to your Supabase cloud database.</p>
                  <button class="btn btn-danger w-100" id="btn-account-signout">Sign Out</button>
                </div>
             `;
             document.getElementById('btn-account-signout').onclick = async () => {
                await signOut();
                window.location.reload();
             };
          }
        });
      });
    }
  } else {
    // Local Fallback including dummy Email/Password fields
    authContainer.innerHTML = `
      <div class="glass-card" style="padding: 2rem;">
        <h3 style="margin-bottom: 1rem;">Local Account Profile</h3>
        <p class="sub-text" style="margin-bottom: 2rem; background: rgba(244, 63, 94, 0.1); padding: 1rem; border-radius: 8px; border: 1px solid rgba(244, 63, 94, 0.2);">
          Cloud sync is not configured. Email and password are saved locally for this session.
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
          <div class="form-group">
            <label>Display Name</label>
            <input type="text" id="local-name-input" class="glass-input" value="${profile.displayName || ''}">
          </div>
          <div class="form-group">
            <label>Avatar Emoji</label>
            <input type="text" id="local-avatar-input" class="glass-input" value="${profile.avatarEmoji || '⚡'}" maxlength="2">
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem;">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="local-email-input" class="glass-input" placeholder="your@email.com" value="${stateManager.state.localEmail || ''}">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="local-password-input" class="glass-input" placeholder="••••••••" value="${stateManager.state.localPassword || ''}">
          </div>
        </div>

        <button class="btn btn-primary" id="btn-save-local-profile" style="max-width: 200px;">Update Profile</button>
      </div>
    `;

    document.getElementById('btn-save-local-profile').onclick = () => {
      const newName = document.getElementById('local-name-input').value;
      const newAvatar = document.getElementById('local-avatar-input').value;
      const newEmail = document.getElementById('local-email-input').value;
      const newPassword = document.getElementById('local-password-input').value;
      
      if (stateManager.state.userProfile) {
        stateManager.state.userProfile.displayName = newName;
        stateManager.state.userProfile.avatarEmoji = newAvatar;
        stateManager.state.localEmail = newEmail;
        stateManager.state.localPassword = newPassword;
        stateManager.save();
        
        const chip = document.getElementById('user-profile-chip');
        if (chip) {
          const avatarEl = chip.querySelector('.profile-avatar');
          const nameEl = chip.querySelector('.profile-name');
          if (avatarEl) avatarEl.textContent = newAvatar || '⚡';
          if (nameEl) nameEl.textContent = newName || 'User';
        }
        
        alert('Account details updated successfully!');
      }
    };
  }

  // --- Workspace Settings Interactivity ---
  let selectedCurrency = currentCurrency;
  const currencyBtns = document.querySelectorAll('#settings-currency-segmented .segment-btn');
  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCurrency = btn.dataset.value;
    });
  });

  document.getElementById('btn-save-settings').addEventListener('click', () => {
    const dob = document.getElementById('settings-dob').value;
    const newName = document.getElementById('settings-name').value;
    const newAvatar = document.getElementById('settings-avatar').value;

    if (dob) {
      if (!stateManager.state.userProfile) stateManager.state.userProfile = {};
      stateManager.state.userProfile.displayName = newName;
      stateManager.state.userProfile.avatarEmoji = newAvatar;
      
      stateManager.updateProfile(dob, 80);
      stateManager.updateCurrency(selectedCurrency);

      const chip = document.getElementById('user-profile-chip');
      if (chip) {
        const avatarEl = chip.querySelector('.profile-avatar');
        const nameEl = chip.querySelector('.profile-name');
        if (avatarEl) avatarEl.textContent = newAvatar || '⚡';
        if (nameEl) nameEl.textContent = newName || 'User';
      }

      alert('Workspace settings saved successfully!');
    } else {
      alert('Please select a valid date of birth.');
    }
  });

  // --- FAQ Popup ---
  document.getElementById('btn-faq-popup').addEventListener('click', () => {
    const modal = document.createElement('div');
    modal.className = 'glass-modal-overlay';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0,0,0,0.6)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.zIndex = '9999';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.animation = 'fadeIn 0.3s ease';

    modal.innerHTML = `
      <div class="glass-card" style="max-width: 500px; width: 90%; padding: 2.5rem; position: relative; border: 1px solid rgba(0, 242, 254, 0.3); box-shadow: 0 10px 40px rgba(0,0,0,0.5); animation: slideUp 0.3s ease;">
        <button class="btn-icon" id="btn-close-faq" style="position: absolute; top: 1rem; right: 1rem;">
          <i data-lucide="x"></i>
        </button>
        
        <h3 class="text-cyan" style="margin-bottom: 1.5rem; font-size: 1.8rem; text-shadow: 0 0 10px rgba(0,242,254,0.3);">Frequently Asked Questions</h3>
        
        <div style="margin-bottom: 1.5rem;">
          <h4 style="margin-bottom: 0.5rem; color: #fff;">Q: Where is my data saved?</h4>
          <p class="text-secondary" style="font-size: 0.95rem; margin-bottom: 1rem;">A: On the Free Plan, data is saved locally in your browser. On the Hustler Plan, it is safely backed up to the cloud.</p>
          
          <h4 style="margin-bottom: 0.5rem; color: #fff;">Q: How do I upgrade to Pro?</h4>
          <p class="text-secondary" style="font-size: 0.95rem; margin-bottom: 1rem;">A: Click the blue "Manage Plan" button in the bottom left sidebar to view pricing and upgrade.</p>

          <h4 style="margin-bottom: 0.5rem; color: #fff;">Q: Can I use this on my phone?</h4>
          <p class="text-secondary" style="font-size: 0.95rem; margin-bottom: 1rem;">A: For now, we strongly advise using a PC for the best experience. We are currently working hard on optimizing the mobile and smaller screen layouts!</p>
        </div>

        <div style="background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
          <h4 class="text-danger" style="margin-bottom: 0.5rem;"><i data-lucide="alert-triangle" style="width: 18px; height: 18px; display: inline-block; vertical-align: middle;"></i> Under Development</h4>
          <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 0;">Iturned20today is actively under development! Please report any bugs or security issues to us, and contact us for any other assistance.</p>
        </div>
        
        <button class="btn btn-secondary w-100" id="btn-faq-ok">Got it</button>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();

    const closeModal = () => modal.remove();
    document.getElementById('btn-close-faq').addEventListener('click', closeModal);
    document.getElementById('btn-faq-ok').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  });

  // --- Backup / Restore ---
  const fileInput = document.getElementById('import-file-input');
  
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const jsonStr = stateManager.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `iturned20today_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-trigger-import').addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target.result;
      const success = stateManager.importData(contents);
      if (success) {
        alert('Data successfully imported! Page will reload.');
        location.reload();
      } else {
        alert('Failed to import data. Please check if the file format is valid JSON.');
      }
    };
    reader.readAsText(file);
  });

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
