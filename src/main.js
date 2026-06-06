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
import { renderAccountManager } from './components/AccountManager.js';
import { renderPricing } from './components/Pricing.js';
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
      if (!stateManager.state.isPro) {
        renderUpgradePrompt(container, 'Finance Tracking', 'money-bag', 'Take control of your cashflow. Track expenses, monitor budgets, and achieve financial freedom.', 'finances');
      } else {
        renderFinanceTracker(container);
      }
      break;
    case 'fitness':
      if (!stateManager.state.isPro) {
        renderUpgradePrompt(container, 'Fitness & Habits', 'activity', 'Log your workouts, monitor daily steps, and build ironclad habits that compound over time.', 'fitness');
      } else {
        renderFitnessTracker(container);
      }
      break;
    case 'pomodoro':
      renderPomodoroTimer(container);
      break;
    case 'journal':
      if (!stateManager.state.isPro) {
        renderUpgradePrompt(container, 'Daily Journal', 'book-open', 'Clear your mind. A private space to reflect, log gratitude, and track your daily emotional state.', 'journal');
      } else {
        renderDailyJournal(container);
      }
      break;
    case 'account':
      renderAccountManager(container);
      break;
    case 'pricing':
      renderPricing(container);
      break;
    default:
      renderDashboard(container);
  }

  // Ensure Lucide renders icons in the new DOM tree
  if (window.lucide) window.lucide.createIcons();
}

function renderUpgradePrompt(container, featureName, iconName, description, mockType) {
  // Render a mock blurred background depending on the feature
  let mockHtml = '';
  if (mockType === 'finances') {
    mockHtml = `
      <div class="locked-demo-content">
        <div class="dashboard-grid">
          <div class="glass-card"><div style="height: 150px; background: rgba(0,242,254,0.1); border-radius: 10px;"></div></div>
          <div class="glass-card"><div style="height: 150px; background: rgba(16,185,129,0.1); border-radius: 10px;"></div></div>
          <div class="glass-card" style="grid-column: 1 / -1;"><div style="height: 300px; background: rgba(255,255,255,0.05); border-radius: 10px;"></div></div>
        </div>
      </div>
    `;
  } else if (mockType === 'fitness') {
    mockHtml = `
      <div class="locked-demo-content">
        <div style="display: flex; gap: 20px;">
          <div class="glass-card" style="flex: 1;"><div style="height: 200px; border-radius: 50%; width: 200px; background: rgba(239,68,68,0.1); margin: 0 auto;"></div></div>
          <div class="glass-card" style="flex: 2;"><div style="height: 60px; background: rgba(255,255,255,0.05); margin-bottom: 10px;"></div><div style="height: 60px; background: rgba(255,255,255,0.05);"></div></div>
        </div>
      </div>
    `;
  } else {
    mockHtml = `
      <div class="locked-demo-content">
        <div class="glass-card" style="height: 400px; width: 100%;">
          <div style="height: 40px; width: 30%; background: rgba(255,255,255,0.1); margin-bottom: 20px;"></div>
          <div style="height: 20px; width: 90%; background: rgba(255,255,255,0.05); margin-bottom: 10px;"></div>
          <div style="height: 20px; width: 85%; background: rgba(255,255,255,0.05); margin-bottom: 10px;"></div>
          <div style="height: 20px; width: 95%; background: rgba(255,255,255,0.05); margin-bottom: 10px;"></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="locked-feature-container">
      ${mockHtml}
      <div class="locked-overlay-panel glass-card">
        <div class="glow-orb"></div>
        <i data-lucide="${iconName}" style="width: 56px; height: 56px; color: var(--accent-cyan); margin-bottom: 1.5rem; position: relative; z-index: 2;"></i>
        <h2 class="font-accent" style="font-size: 2.2rem; margin-bottom: 1rem; position: relative; z-index: 2;">Unlock ${featureName}</h2>
        <p class="text-secondary" style="margin-bottom: 2rem; font-size: 1.1rem; line-height: 1.6; max-width: 400px; margin-left: auto; margin-right: auto; position: relative; z-index: 2;">
          ${description}
        </p>
        <button class="btn btn-primary" style="padding: 12px 32px; font-size: 1.1rem; border-radius: 30px; position: relative; z-index: 2; box-shadow: 0 0 20px rgba(0, 242, 254, 0.4);" onclick="document.getElementById('btn-upgrade-pro').click()">
          <i data-lucide="zap"></i> Upgrade to Hustler
        </button>
      </div>
    </div>
  `;
}


// --- Sidebar Profile Chip ---
function updateSidebarProfile() {
  const profile = stateManager.state.userProfile || {};
  const chip = document.getElementById('user-profile-chip');
  
  if (chip) {
    const avatarEl = chip.querySelector('.profile-avatar');
    const nameEl = chip.querySelector('.profile-name');
    const instEl = chip.querySelector('.profile-status');
    const logoutBtn = document.getElementById('btn-logout');

  if (avatarEl) avatarEl.textContent = profile.avatarEmoji || 'S';
  if (nameEl) nameEl.textContent = profile.displayName || 'Student User';
  
  if (instEl) {
    if (stateManager.state.isPro) {
      instEl.textContent = 'Overachiever (Pro)';
      instEl.style.color = 'var(--accent-gold)';
    } else {
      instEl.textContent = 'Hustler (Free)';
      instEl.style.color = 'var(--accent-cyan)';
    }
  }

    if (logoutBtn) {
      if (isClerkConfigured && profile.clerkUserId) {
        logoutBtn.classList.remove('hidden');
      } else {
        logoutBtn.classList.add('hidden');
      }
    }
  }

  const proBtn = document.getElementById('btn-upgrade-pro');
  if (proBtn) {
    if (stateManager.state.isPro) {
      proBtn.innerHTML = `<span style="margin-right: 4px; font-size: 1rem;">👑</span><span style="font-weight: 700;">Manage Plan</span>`;
      proBtn.disabled = false;
      proBtn.style.opacity = '1';
      proBtn.title = 'Manage your Hustler Plan';
    } else {
      proBtn.innerHTML = `<span style="margin-right: 4px; font-size: 1rem;">🚀</span><span style="font-weight: 700;">Upgrade</span>`;
      proBtn.disabled = false;
      proBtn.style.opacity = '1';
      proBtn.title = 'Upgrade to Pro';
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

  // 2. Account & Settings Button
  const openSettingsBtn = document.getElementById('btn-open-settings');
  if (openSettingsBtn) {
    openSettingsBtn.addEventListener('click', () => {
      mountView('account');
    });
  }

  // 3. Upgrade to Pro Button
  const upgradeProBtn = document.getElementById('btn-upgrade-pro');
  if (upgradeProBtn) {
    upgradeProBtn.addEventListener('click', () => {
      mountView('pricing');
    });
  }

  // 4. Profile Chip — Edit button navigates to Account page
  const profileChipEdit = document.getElementById('profile-chip-edit');
  if (profileChipEdit) {
    profileChipEdit.addEventListener('click', () => {
      mountView('account');
    });
  }

  // 4b. Profile Chip Logout
  const profileChipLogout = document.getElementById('btn-logout');
  if (profileChipLogout) {
    profileChipLogout.addEventListener('click', async () => {
      if (confirm('Are you sure you want to sign out?')) {
        await signOut();
        stateManager.state.userProfile = null;
        resetOnboarding();
        localStorage.clear();
        location.reload();
      }
    });
  }

  // 5. App Routing Logic (Auth -> Onboarding -> Dashboard)
  const portal = document.getElementById('onboarding-portal');
  
  const startApp = () => {
    const sidebar = document.getElementById('main-sidebar');
    if (sidebar) sidebar.style.display = 'flex';
    updateSidebarProfile();
    mountView('dashboard');
    
    // Tutorial Popup Logic (Driver.js)
    if (localStorage.getItem('iturned20today_tutorial_seen') !== 'true') {
      setTimeout(() => {
        if (window.driver) {
          const driverObj = window.driver.js.driver({
            showProgress: true,
            steps: [
              { element: '.sidebar-brand', popover: { title: 'Welcome to Iturned20today', description: 'Your new personal workspace to track everything that matters.', side: 'right', align: 'start' } },
              { element: '#nav-dashboard', popover: { title: 'The Dashboard', description: 'Your command center. Add widgets, log daily habits, and see your progress at a glance.', side: 'right', align: 'start' } },
              { element: '#nav-degree', popover: { title: 'Syllabus Track', description: 'Map out your college courses or online certifications here.', side: 'right', align: 'start' } },
              { element: '#nav-finances', popover: { title: 'Finance Tracker', description: 'Keep your budget and net worth in check.', side: 'right', align: 'start' } },
              { element: '.profile-chip', popover: { title: 'Profile & Settings', description: 'Manage your pro subscription, update your goals, and sign out here.', side: 'right', align: 'start' } }
            ]
          });
          driverObj.drive();
          localStorage.setItem('iturned20today_tutorial_seen', 'true');
        }
      }, 500);
    }
  };

  const checkRouting = async () => {
    if (!isClerkConfigured) {
      // Fallback if no Supabase configured
      if (!isOnboardingComplete() && portal) {
        renderOnboarding(portal, () => {
          portal.innerHTML = '';
          portal.style.pointerEvents = 'none';
          startApp();
        });
      } else {
        startApp();
      }
      return;
    }

    try {
      const hasSession = await checkAuthSession();
      if (!hasSession) {
        // Must Authenticate First
        if (portal) {
          portal.style.opacity = '1';
          portal.style.pointerEvents = 'all';
          const { renderAuthUI } = await import('./lib/auth.js');
          renderAuthUI(portal);
        }
      } else {
        // Authenticated! Check if onboarding is done.
        await stateManager.loadRemoteState();
        if (!isOnboardingComplete() && portal) {
          portal.style.opacity = '1';
          portal.style.pointerEvents = 'all';
          renderOnboarding(portal, () => {
            portal.innerHTML = '';
            portal.style.pointerEvents = 'none';
            startApp();
          });
        } else {
          // Both Auth and Onboarding are complete
          if (portal) {
            portal.innerHTML = '';
            portal.style.pointerEvents = 'none';
          }
          startApp();
        }
      }
    } catch (err) {
      console.error('[Routing] Error checking session:', err);
    }
  };

  checkRouting();
});
