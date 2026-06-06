// Pricing.js
import { stateManager } from '../state.js';

export function renderPricing(container) {
  if (stateManager.state.isPro) {
    container.innerHTML = `
      <div class="pricing-container" style="max-width: 600px; margin: 0 auto; text-align: center; padding-top: 2rem;">
        <i data-lucide="crown" style="width: 64px; height: 64px; color: var(--accent-gold); margin-bottom: 1rem;"></i>
        <h2 class="neon-text-gold" style="font-size: 2.5rem; margin-bottom: 8px;">Manage Subscription</h2>
        <p class="text-secondary" style="margin-bottom: 2rem; font-size: 1.1rem;">
          You are currently subscribed to the <b>Hustler Plan</b>.
        </p>
        
        <div class="glass-card" style="padding: 2rem; text-align: left; margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem;">Plan Details</h3>
          <ul class="tier-features font-accent" style="margin-bottom: 2rem;">
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Unlimited</b> Tracks & Tasks</li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Daily Journal Log</b></li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Cloud Sync</b> Across Devices</li>
          </ul>
          
          <div style="padding: 1rem; background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.2); border-radius: 8px;">
            <h4 style="color: var(--accent-rose); margin-bottom: 0.5rem;">Danger Zone</h4>
            <p class="sub-text" style="margin-bottom: 1rem;">Canceling your subscription will revert your account to the Free Plan at the end of the billing cycle.</p>
            <button class="btn btn-danger" id="btn-cancel-sub">Cancel Subscription</button>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('btn-cancel-sub').addEventListener('click', async () => {
      if (confirm('Are you sure you want to cancel your Hustler Plan? You will lose access to premium features.')) {
        stateManager.state.isPro = false;
        stateManager.saveLocal(); // Save locally first without triggering async save
        
        try {
          if (stateManager.state.userProfile && stateManager.state.userProfile.clerkUserId) {
            const { pushRemoteState } = await import('../lib/auth.js');
            await pushRemoteState(stateManager.state.userProfile.clerkUserId, stateManager.state);
          }
        } catch (e) {
          console.log("No cloud sync available", e);
        }

        alert('Subscription canceled. You are now on the Free Plan.');
        window.location.reload();
      }
    });
    
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="pricing-container">
      <div class="pricing-header">
        <h2 class="neon-text-gold" style="font-size: 2.5rem; margin-bottom: 8px;">Level Up Iturned20today</h2>
        <p class="text-secondary" style="max-width: 600px; margin: 0 auto; font-size: 1.1rem;">
          Choose the tier that matches your ambition. Upgrade to Hustler to unlock your full potential.
        </p>
      </div>

      <div class="pricing-grid" style="grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); max-width: 900px; margin: 0 auto;">
        <!-- Tier 1: Free -->
        <div class="glass-card pricing-card tier-free">
          <div class="tier-header">
            <h3>Free Plan</h3>
            <div class="tier-price">₹0</div>
            <p class="tier-desc text-muted">The basics to get your life organized.</p>
          </div>
          <ul class="tier-features font-accent">
            <li><i data-lucide="check" class="text-success"></i> Basic Dashboard Analytics</li>
            <li><i data-lucide="check" class="text-success"></i> 1 Curriculum Track</li>
            <li><i data-lucide="check" class="text-success"></i> Local Storage Only</li>
            <li class="text-muted"><i data-lucide="x"></i> Daily Journal Log</li>
            <li class="text-muted"><i data-lucide="x"></i> Fitness & Finance Tracking</li>
            <li class="text-muted"><i data-lucide="x"></i> Cloud Sync</li>
          </ul>
          <button class="btn btn-secondary w-100 mt-auto" disabled>Current Plan</button>
        </div>

        <!-- Tier 2: Hustler -->
        <div class="glass-card pricing-card tier-hustler recommended">
          <div class="card-glow" style="background: radial-gradient(circle, rgba(0, 242, 254, 0.25) 0%, rgba(0,0,0,0) 70%); animation: pulseGlow 4s infinite alternate;"></div>
          <div class="recommended-badge" style="background: linear-gradient(135deg, var(--accent-gold), #ff8a00); color: #000; font-weight: 800; padding: 4px 16px; border-radius: 20px; font-size: 0.8rem; box-shadow: 0 4px 15px rgba(255, 138, 0, 0.4); border: 1px solid rgba(255,255,255,0.4); z-index: 10;">Intro Pricing</div>
          <div class="tier-header" style="position: relative; z-index: 2;">
            <h3 class="text-cyan" style="font-size: 1.8rem; text-shadow: 0 0 10px rgba(0,242,254,0.5); margin-bottom: 5px;">Hustler Plan</h3>
            <div class="tier-price" style="font-size: 2.8rem; font-weight: 900; background: -webkit-linear-gradient(45deg, #fff, #00f2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">₹199<span class="price-period" style="font-size: 1.2rem; -webkit-text-fill-color: var(--text-muted); font-weight: 500;">/mo</span></div>
            <p class="tier-desc" style="color: #a0aec0; margin-top: 10px; font-size: 1.05rem;">For serious aspirants aiming for the top 1%.</p>
          </div>
          <ul class="tier-features font-accent" style="position: relative; z-index: 2; margin-top: 20px;">
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Unlimited</b> Tracks & Tasks</li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Daily Journal Log</b></li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Unlock</b> Fitness & Finances</li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Full</b> Graph View Analytics</li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b class="neon-text-gold">⚡ Smart</b> Catch-Up Planner</li>
            <li style="padding: 10px; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px;"><i data-lucide="check" class="text-success"></i> <b>Cloud Sync</b> Across Devices</li>
          </ul>
          <button class="btn btn-primary w-100 mt-auto btn-checkout" data-plan="hustler">Upgrade to Hustler</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-checkout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const plan = e.target.dataset.plan;
      alert(`[Dev Mode] Payment successful for ${plan.toUpperCase()} plan! You are now a PRO user. Redirecting to Account Settings to set up your Cloud Sync...`);
      import('../state.js').then(({ stateManager }) => {
        stateManager.upgradeToPro();
        // Trigger a click on the account nav item to redirect
        const accountNav = document.querySelector('.nav-item[data-view="account"]');
        if (accountNav) accountNav.click();
      });
    });
  });
}
