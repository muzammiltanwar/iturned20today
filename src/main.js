// main.js - Application Orchestrator
import './style.css';
import { stateManager } from './state.js';
import { renderDashboard } from './components/ContributionGraph.js';
import { renderDegreeTracker } from './components/DegreeTracker.js';
import { renderStudyCalendar } from './components/StudyCalendar.js';
import { renderGoalTracker } from './components/GoalTracker.js';
import { renderFinanceTracker } from './components/FinanceTracker.js';
import { renderFitnessTracker } from './components/FitnessTracker.js';
import { renderPomodoroTimer } from './components/PomodoroTimer.js';
import { renderDailyJournal } from './components/DailyJournal.js';
import { renderOnboarding, isOnboardingComplete, resetOnboarding } from './components/Onboarding.js';
import { checkAuthSession, signOut, isClerkConfigured } from './lib/auth.js';

let currentView = 'dashboard';

// Mount view helper
function mountView(viewName) {
  const container = document.getElementById('main-view-container');
  if (!container) return;

  // Update active state in sidebar
  document.querySelectorAll('.nav-item').forEach(item => {
    if (item.dataset.view === viewName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  currentView = viewName;

  switch (viewName) {
    case 'dashboard':
      renderDashboard(container);
      break;
    case 'degree':
      renderDegreeTracker(container);
      break;
    case 'calendar':
      renderStudyCalendar(container);
      break;
    case 'goals':
      renderGoalTracker(container);
      break;
    case 'finances':
      renderFinanceTracker(container);
      break;
    case 'fitness':
      renderFitnessTracker(container);
      break;
    case 'pomodoro':
      renderPomodoroTimer(container);
      break;
    case 'journal':
      renderDailyJournal(container);
      break;
    default:
      renderDashboard(container);
  }

  // Ensure Lucide renders icons in the new DOM tree
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Sidebar Profile Chip ---
function updateSidebarProfile() {
  const profile = stateManager.state.userProfile;
  const chip = document.getElementById('sidebar-profile-chip');
  if (!chip || !profile) return;

  const avatarEl = document.getElementById('profile-avatar-chip');
  const nameEl = document.getElementById('profile-name-chip');
  const instEl = document.getElementById('profile-inst-chip');
  const logoutBtn = document.getElementById('profile-chip-logout');

  if (avatarEl) avatarEl.textContent = profile.avatarEmoji || '⚡';
  if (nameEl) nameEl.textContent = profile.displayName || 'User';
  if (instEl) instEl.textContent = profile.institution || stateManager.getActiveDegree()?.title || 'Life Repository';

  chip.style.display = 'flex';

  if (logoutBtn) {
    if (isClerkConfigured && profile.clerkUserId) {
      logoutBtn.style.display = 'flex';
    } else {
      logoutBtn.style.display = 'none';
    }
  }

  if (window.lucide) window.lucide.createIcons();
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Routing Setup
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = item.dataset.view;
      mountView(view);
    });
  });

  // 2. Settings Modal Setup
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('btn-open-settings');
  const closeSettingsBtn = document.getElementById('btn-close-settings-modal');
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  const dobInput = document.getElementById('settings-dob');
  const lifespanInput = document.getElementById('settings-lifespan');

  // Load current profile settings into input
  dobInput.value = stateManager.state.birthDate;
  lifespanInput.value = stateManager.state.expectedLifespan || 80;

  let selectedCurrency = stateManager.state.currencySymbol || '₹';
  const currencyBtns = document.querySelectorAll('#settings-currency-segmented .segment-btn');
  currencyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currencyBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedCurrency = btn.dataset.value;
    });
  });

  openSettingsBtn.addEventListener('click', () => {
    dobInput.value = stateManager.state.birthDate;
    lifespanInput.value = stateManager.state.expectedLifespan || 80;
    selectedCurrency = stateManager.state.currencySymbol || '₹';
    currencyBtns.forEach(btn => {
      if (btn.dataset.value === selectedCurrency) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    settingsModal.classList.remove('hidden');
  });

  const closeSettings = () => {
    settingsModal.classList.add('hidden');
  };

  closeSettingsBtn.addEventListener('click', closeSettings);

  saveSettingsBtn.addEventListener('click', () => {
    const dob = dobInput.value;
    const lifespan = lifespanInput.value;
    if (dob) {
      stateManager.updateProfile(dob, lifespan);
      stateManager.updateCurrency(selectedCurrency);
      closeSettings();
      mountView(currentView);
    } else {
      alert('Please select a valid date of birth.');
    }
  });

  // 3. Backup and Portability Actions
  const exportBtn = document.getElementById('btn-export-data');
  const triggerImportBtn = document.getElementById('btn-trigger-import');
  const fileInput = document.getElementById('import-file-input');

  exportBtn.addEventListener('click', () => {
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

  triggerImportBtn.addEventListener('click', () => {
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
        alert('Data successfully imported!');
        closeSettings();
        mountView(currentView);
      } else {
        alert('Failed to import data. Please check if the file format is valid JSON.');
      }
    };
    reader.readAsText(file);
  });

  // 4. Profile Chip — Edit button re-opens onboarding
  const profileChipEdit = document.getElementById('profile-chip-edit');
  if (profileChipEdit) {
    profileChipEdit.addEventListener('click', () => {
      // Re-open onboarding in edit mode by resetting the completion flag
      resetOnboarding();
      const portal = document.getElementById('onboarding-portal');
      if (portal) {
        portal.style.opacity = '1';
        portal.style.pointerEvents = 'all';
        renderOnboarding(portal, (data) => {
          portal.innerHTML = '';
          portal.style.pointerEvents = 'none';
          updateSidebarProfile();
          mountView(currentView);
        });
      }
    });
  }

  // 4b. Profile Chip Logout
  const profileChipLogout = document.getElementById('profile-chip-logout');
  if (profileChipLogout) {
    profileChipLogout.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        await signOut();
        stateManager.state.userProfile = null;
        resetOnboarding();
        localStorage.removeItem('iturned20today_onboarding_complete');
        location.reload();
      }
    });
  }

  // 5. Check Onboarding Status & Auth Session
  const portal = document.getElementById('onboarding-portal');
  
  const startApp = () => {
    updateSidebarProfile();
    mountView('dashboard');
  };

  if (isClerkConfigured) {
    checkAuthSession().then((hasSession) => {
      if (hasSession) {
        localStorage.setItem('iturned20today_onboarding_complete', 'true');
        if (portal) {
          portal.innerHTML = '';
          portal.style.pointerEvents = 'none';
        }
        startApp();
      } else {
        localStorage.removeItem('iturned20today_onboarding_complete');
        if (portal) {
          portal.style.opacity = '1';
          portal.style.pointerEvents = 'all';
          renderOnboarding(portal, (data) => {
            portal.innerHTML = '';
            portal.style.pointerEvents = 'none';
            startApp();
          });
        }
      }
    }).catch((err) => {
      console.warn('[Main] Auth session restore failed, forcing login:', err);
      localStorage.removeItem('iturned20today_onboarding_complete');
      if (portal) {
        portal.style.opacity = '1';
        portal.style.pointerEvents = 'all';
        renderOnboarding(portal, (data) => {
          portal.innerHTML = '';
          portal.style.pointerEvents = 'none';
          startApp();
        });
      }
    });
  } else {
    if (!isOnboardingComplete() && portal) {
      renderOnboarding(portal, (data) => {
        portal.innerHTML = '';
        portal.style.pointerEvents = 'none';
        startApp();
      });
    } else {
      startApp();
    }
  }
});
