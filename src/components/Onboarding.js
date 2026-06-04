// src/components/Onboarding.js
// Smooth, adaptive 4-step onboarding wizard.

import { stateManager } from '../state.js';
import { isClerkConfigured, initClerk, openSignIn, fetchProfile, syncProfileToSupabase } from '../lib/auth.js';

const ONBOARDING_KEY = 'iturned20today_onboarding_complete';
const TOTAL_STEPS = 4;

let currentStep = 1;

function freshData() {
  return {
    displayName:         '',
    avatarEmoji:         '⚡',
    birthDate:           '',
    // Step 2 — situation
    situation:           '',  // 'student' | 'working' | 'both' | 'other'
    // Step 3 — adaptive details
    degreeTitle:         '',
    institution:         '',
    yearOfStudy:         '1',
    graduationYear:      String(new Date().getFullYear() + 3),
    jobTitle:            '',
    company:             '',
    industry:            '',
    otherDescription:    '',
    // Step 4 — goals & money
    currencySymbol:      '₹',
    monthlyBudget:       '',
    primaryGoal:         '',
    weeklyStudyHours:    '20',
    // internal
    clerkUserId:         null,
  };
}

let od = freshData(); // onboarding data

// ─── Public API ────────────────────────────────────────────────────────────────

export function isOnboardingComplete() {
  return localStorage.getItem(ONBOARDING_KEY) === 'true';
}
export function markOnboardingComplete() {
  localStorage.setItem(ONBOARDING_KEY, 'true');
}
export function resetOnboarding() {
  localStorage.removeItem(ONBOARDING_KEY);
}



// ─── Step rendering ────────────────────────────────────────────────────────────

function renderStep(step) {
  const content = document.getElementById('ob-content');
  const fill    = document.getElementById('ob-progress-fill');
  const lbl     = document.getElementById('ob-step-lbl');
  const back    = document.getElementById('ob-back');
  const next    = document.getElementById('ob-next');
  if (!content) return;

  fill.style.width = `${(step / TOTAL_STEPS) * 100}%`;
  lbl.textContent  = `Step ${step} of ${TOTAL_STEPS}`;
  back.style.visibility = step === 1 ? 'hidden' : 'visible';
  next.textContent = step === TOTAL_STEPS ? '🚀 Launch Dashboard' : 'Next →';

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const d = document.getElementById(`ob-dot-${i}`);
    if (d) d.className = `ob-dot ${i < step ? 'completed' : ''} ${i === step ? 'active' : ''}`;
  }

  // Animate
  content.style.cssText += 'opacity:0;transform:translateY(14px);';
  content.innerHTML = html(step);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    content.style.cssText += 'transition:opacity .35s ease,transform .35s cubic-bezier(.4,0,.2,1);opacity:1;transform:translateY(0);';
  }));

  bind(step);
}

// ─── HTML per step ─────────────────────────────────────────────────────────────

function html(step) {
  switch (step) {
    case 1: {
      const age = calcAge(od.birthDate);
      return `
        <div class="ob-step-wrap">
          <div class="ob-big-emoji" id="ob-avatar-preview">${od.avatarEmoji}</div>
          <h2>Welcome to your<br><span class="neon-gradient">Life Repository</span></h2>
          <p class="ob-sub">Let's build your personal workspace. Everything can be changed later.</p>

          <div class="ob-avatar-row">
            <p class="field-label">Your avatar</p>
            <div class="ob-avatar-grid">
              ${['⚡','🚀','🎯','🧠','🌙','🔥','🌊','🎹','💎','🦋','⭐','🌿','🐉','🦁','🌈','🎸'].map(e =>
                `<button type="button" class="ob-avatar-btn ${od.avatarEmoji===e?'selected':''}" data-emoji="${e}">${e}</button>`
              ).join('')}
            </div>
          </div>

          <div class="ob-field-row">
            <div class="form-group">
              <label class="field-label">Your name</label>
              <input id="ob-name" class="glass-input" type="text"
                placeholder="e.g. Arjun Sharma" value="${esc(od.displayName)}" autocomplete="off" />
            </div>
            <div class="form-group">
              <label class="field-label">Date of birth</label>
              <div class="ob-dob-wrap">
                <input id="ob-dob" class="glass-input" type="date" value="${od.birthDate}" />
                ${age ? `<span class="ob-age-badge" id="ob-age-badge">${age} years old 🎂</span>` : `<span class="ob-age-badge muted" id="ob-age-badge">Age auto-calculated</span>`}
              </div>
            </div>
          </div>
        </div>`;
    }

    case 2: return `
      <div class="ob-step-wrap">
        <div class="ob-step-icon">🧭</div>
        <h2>What's your <span class="neon-gradient">situation?</span></h2>
        <p class="ob-sub">This helps us customize your dashboard for how you actually live.</p>

        <div class="ob-situation-grid">
          ${[
            { id:'student',  icon:'🎓', title:'Student',              desc:'Enrolled in a degree, course, or bootcamp' },
            { id:'working',  icon:'💼', title:'Working Professional',  desc:'Full-time or part-time job / freelancing'  },
            { id:'both',     icon:'🔄', title:'Student + Working',     desc:'Juggling studies and work at the same time' },
            { id:'other',    icon:'🌱', title:'Building my own path',  desc:'Self-learning, entrepreneurship, or other'  },
          ].map(s => `
            <button type="button"
              class="ob-situation-card ${od.situation===s.id?'selected':''}"
              data-situation="${s.id}">
              <span class="ob-sit-icon">${s.icon}</span>
              <span class="ob-sit-title">${s.title}</span>
              <span class="ob-sit-desc">${s.desc}</span>
            </button>
          `).join('')}
        </div>
      </div>`;

    case 3: {
      const showStudy   = od.situation === 'student' || od.situation === 'both';
      const showWork    = od.situation === 'working'  || od.situation === 'both';
      const showOther   = od.situation === 'other';

      return `
        <div class="ob-step-wrap">
          <div class="ob-step-icon">${showStudy && showWork ? '🔄' : showStudy ? '📚' : showWork ? '💼' : '🌱'}</div>
          <h2>${showStudy && showWork ? 'Your Study <span class="neon-gradient">&amp; Work Life</span>' :
               showStudy ? 'Your Academic <span class="neon-gradient">Journey</span>' :
               showWork  ? 'Your Work <span class="neon-gradient">Life</span>' :
               'What are you <span class="neon-gradient">building?</span>'}</h2>
          <p class="ob-sub">Fill in what's relevant — we'll set up your trackers accordingly.</p>

          ${showStudy ? `
            <div class="ob-section-label">🎓 Academic</div>
            <div class="ob-field-row">
              <div class="form-group">
                <label class="field-label">Degree / Program</label>
                <input id="ob-degree" class="glass-input" type="text"
                  placeholder="e.g. BSc Computer Science" value="${esc(od.degreeTitle)}" />
              </div>
              <div class="form-group">
                <label class="field-label">College / University</label>
                <input id="ob-inst" class="glass-input" type="text"
                  placeholder="e.g. VIT University" value="${esc(od.institution)}" />
              </div>
            </div>
            <div class="ob-field-row">
              <div class="form-group">
                <label class="field-label">Year of study</label>
                <div class="segmented-control ob-year-seg">
                  ${['1','2','3','4','5'].map(y =>
                    `<button type="button" class="segment-btn ${od.yearOfStudy===y?'active':''}" data-year="${y}">Y${y}</button>`
                  ).join('')}
                </div>
              </div>
              <div class="form-group">
                <label class="field-label">Expected graduation</label>
                <input id="ob-grad" class="glass-input" type="number"
                  value="${od.graduationYear}" min="2024" max="2040" />
              </div>
            </div>
          ` : ''}

          ${showWork ? `
            <div class="ob-section-label" style="margin-top:${showStudy?'16px':'0'}">💼 Work</div>
            <div class="ob-field-row">
              <div class="form-group">
                <label class="field-label">Job title / Role</label>
                <input id="ob-jobtitle" class="glass-input" type="text"
                  placeholder="e.g. Frontend Developer" value="${esc(od.jobTitle)}" />
              </div>
              <div class="form-group">
                <label class="field-label">Company <span class="field-optional">(optional)</span></label>
                <input id="ob-company" class="glass-input" type="text"
                  placeholder="e.g. Google, or Freelance" value="${esc(od.company)}" />
              </div>
            </div>
            <div class="form-group">
              <label class="field-label">Industry</label>
              <div class="ob-industry-grid">
                ${['Tech','Finance','Design','Healthcare','Education','Marketing','Research','Other'].map(ind =>
                  `<button type="button" class="ob-industry-btn ${od.industry===ind?'selected':''}" data-industry="${ind}">${ind}</button>`
                ).join('')}
              </div>
            </div>
          ` : ''}

          ${showOther ? `
            <div class="form-group">
              <label class="field-label">What keeps you busy?</label>
              <textarea id="ob-other" class="glass-input ob-textarea"
                placeholder="e.g. Self-teaching ML, building a startup, creating content..."
                rows="3">${esc(od.otherDescription)}</textarea>
            </div>
          ` : ''}
        </div>`;
    }

    case 4: return `
      <div class="ob-step-wrap">
        <div class="ob-step-icon">🎯</div>
        <h2>Goals <span class="neon-gradient">&amp; Money</span></h2>
        <p class="ob-sub">Set your currency and plant your first life goal in the tracker.</p>

        <div class="form-group">
          <label class="field-label">Preferred currency</label>
          <div class="ob-currency-grid">
            ${[
              {symbol:'₹', name:'INR', flag:'🇮🇳'},
              {symbol:'$', name:'USD', flag:'🇺🇸'},
              {symbol:'€', name:'EUR', flag:'🇪🇺'},
              {symbol:'£', name:'GBP', flag:'🇬🇧'},
              {symbol:'¥', name:'JPY', flag:'🇯🇵'},
              {symbol:'A$',name:'AUD', flag:'🇦🇺'},
            ].map(c => `
              <button type="button"
                class="ob-currency-btn ${od.currencySymbol===c.symbol?'selected':''}"
                data-symbol="${c.symbol}">
                <span class="ob-c-flag">${c.flag}</span>
                <span class="ob-c-sym">${c.symbol}</span>
                <span class="ob-c-name">${c.name}</span>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="ob-field-row">
          <div class="form-group">
            <label class="field-label">Monthly budget <span class="field-optional">(optional)</span></label>
            <input id="ob-budget" class="glass-input" type="number"
              placeholder="e.g. 15000" value="${esc(od.monthlyBudget)}" />
          </div>
          <div class="form-group">
            <label class="field-label">Weekly productivity target</label>
            <div class="ob-slider-row">
              <input type="range" id="ob-hours" class="glass-slider"
                min="5" max="80" step="5" value="${od.weeklyStudyHours}" />
              <span class="ob-slider-val font-accent" id="ob-hours-val">${od.weeklyStudyHours}h</span>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="field-label">Your #1 goal right now <span class="field-optional">(optional)</span></label>
          <input id="ob-goal" class="glass-input" type="text"
            placeholder="e.g. Get a software internship at a top company"
            value="${esc(od.primaryGoal)}" maxlength="140" />
        </div>
      </div>`;

    case 5: return `
      <div class="ob-step-wrap">
        <div class="ob-step-icon">🔐</div>
        <h2>Secure your <span class="neon-gradient">Account</span></h2>
        <p class="ob-sub">Sign in to sync your dashboard across devices and never lose your data.</p>

        <div class="ob-auth-options" id="ob-auth-options">
          ${isClerkConfigured ? `
            <div id="ob-clerk-loading" class="ob-auth-loading">
              <div class="ob-spinner"></div>
              <span>Loading secure sign-in…</span>
            </div>
            <div id="ob-clerk-mount" class="ob-clerk-mount-zone"></div>
          ` : `
            <div class="ob-auth-setup-card">
              <div class="ob-auth-setup-icon">⚙️</div>
              <h4 class="font-accent">Auth Not Configured Yet</h4>
              <p class="ob-sub" style="margin-top:6px;">
                To enable Google/email sign-in, add your keys to <code>.env.local</code>:
              </p>
              <div class="ob-env-preview">
                <div class="ob-env-line"><span class="ob-env-key">VITE_CLERK_PUBLISHABLE_KEY</span><span class="ob-env-eq">=</span><span class="ob-env-val">pk_test_…</span></div>
                <div class="ob-env-line"><span class="ob-env-key">VITE_SUPABASE_URL</span><span class="ob-env-eq">=</span><span class="ob-env-val">https://….supabase.co</span></div>
                <div class="ob-env-line"><span class="ob-env-key">VITE_SUPABASE_ANON_KEY</span><span class="ob-env-eq">=</span><span class="ob-env-val">eyJ…</span></div>
              </div>
              <p class="ob-sub" style="margin-top:10px;font-size:0.78rem;">
                Get keys from <strong>dashboard.clerk.com</strong> and <strong>supabase.com</strong>
              </p>
            </div>
          `}
        </div>
      </div>`;

    default: return '';
  }
}

// ─── Interactions per step ─────────────────────────────────────────────────────

function bind(step) {
  if (step === 1) {
    document.querySelectorAll('.ob-avatar-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.ob-avatar-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        od.avatarEmoji = btn.dataset.emoji;
        const prev = document.getElementById('ob-avatar-preview');
        if (prev) prev.textContent = btn.dataset.emoji;
      };
    });

    const nameEl = document.getElementById('ob-name');
    if (nameEl) nameEl.oninput = e => { od.displayName = e.target.value; };

    const dobEl = document.getElementById('ob-dob');
    if (dobEl) {
      dobEl.onchange = e => {
        od.birthDate = e.target.value;
        const badge = document.getElementById('ob-age-badge');
        const age = calcAge(e.target.value);
        if (badge) {
          badge.textContent = age ? `${age} years old 🎂` : 'Age auto-calculated';
          badge.classList.toggle('muted', !age);
        }
      };
    }
  }

  if (step === 2) {
    document.querySelectorAll('.ob-situation-card').forEach(card => {
      card.onclick = () => {
        document.querySelectorAll('.ob-situation-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        od.situation = card.dataset.situation;
      };
    });
  }

  if (step === 3) {
    const $  = id => document.getElementById(id);
    const si = (id, prop) => { const el = $(id); if (el) el.oninput = e => { od[prop] = e.target.value; }; };
    si('ob-degree',   'degreeTitle');
    si('ob-inst',     'institution');
    si('ob-grad',     'graduationYear');
    si('ob-jobtitle', 'jobTitle');
    si('ob-company',  'company');
    si('ob-other',    'otherDescription');

    document.querySelectorAll('.segment-btn[data-year]').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.segment-btn[data-year]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        od.yearOfStudy = btn.dataset.year;
      };
    });

    document.querySelectorAll('.ob-industry-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.ob-industry-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        od.industry = btn.dataset.industry;
      };
    });
  }

  if (step === 4) {
    document.querySelectorAll('.ob-currency-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.ob-currency-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        od.currencySymbol = btn.dataset.symbol;
      };
    });

    const hoursSlider = document.getElementById('ob-hours');
    const hoursVal    = document.getElementById('ob-hours-val');
    if (hoursSlider) {
      hoursSlider.oninput = e => {
        od.weeklyStudyHours = e.target.value;
        if (hoursVal) hoursVal.textContent = `${e.target.value}h`;
      };
    }

    const budgetEl = document.getElementById('ob-budget');
    if (budgetEl) budgetEl.oninput = e => { od.monthlyBudget = e.target.value; };

    const goalEl = document.getElementById('ob-goal');
    if (goalEl) goalEl.oninput = e => { od.primaryGoal = e.target.value; };
  }

  if (step === 5) {
    // Mount Clerk sign-in if configured
    if (isClerkConfigured) {
      initClerk().then(clerk => {
        const loadingEl = document.getElementById('ob-clerk-loading');
        const mountEl   = document.getElementById('ob-clerk-mount');
        
        if (!clerk) {
          if (loadingEl) {
            loadingEl.innerHTML = `
              <div style="color:var(--accent-danger);padding:18px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;text-align:left;font-size:0.85rem;line-height:1.5;width:100%;">
                <h4 class="font-accent" style="font-weight:600;margin-bottom:8px;color:#fca5a5;">⚠️ Clerk Authentication Blocked</h4>
                <p style="opacity:0.8;font-size:0.8rem;margin-bottom:6px;">The Clerk SDK could not load. Please check the following:</p>
                <ul style="margin:4px 0 0 18px;opacity:0.8;font-size:0.78rem;list-style-type:disc;">
                  <li><strong>Disable Ad Blockers</strong> / Brave Shields for <code>localhost</code> (they block Clerk accounts.dev connections by default).</li>
                  <li>Verify you have a working internet connection.</li>
                  <li>Make sure to <strong>hard refresh</strong> the page (Ctrl + F5) so Vite loads the new <code>.env.local</code> keys.</li>
                </ul>
              </div>`;
          }
          return;
        }
        if (!mountEl) return;

        if (loadingEl) loadingEl.style.display = 'none';

        // If already signed in skip
        if (clerk.user) {
          od.clerkUserId = clerk.user.id;
          completeOnboarding(clerk.user);
          return;
        }

        // Mount inline sign-in component
        try {
          clerk.mountSignIn(mountEl, { routing: 'virtual' });
        } catch (e) {
          console.warn('[Clerk] mountSignIn failed, trying openSignIn', e);
          mountEl.innerHTML = `
            <button type="button" class="btn btn-primary ob-clerk-signin-btn" id="ob-clerk-open">
              🔐 Sign in / Create account
            </button>`;
          document.getElementById('ob-clerk-open').onclick = async () => {
            try {
              const user = await openSignIn();
              if (user) { od.clerkUserId = user.id; completeOnboarding(user); }
            } catch {}
          };
        }

        // Poll for sign-in completion
        const poll = setInterval(() => {
          if (clerk.user) {
            clearInterval(poll);
            od.clerkUserId = clerk.user.id;
            completeOnboarding(clerk.user);
          }
        }, 800);
      }).catch((err) => {
        console.error('[Clerk] mount/load failed:', err);
        const loadingEl = document.getElementById('ob-clerk-loading');
        if (loadingEl) {
          loadingEl.innerHTML = `
            <div style="color:var(--accent-danger);padding:18px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:14px;text-align:left;font-size:0.85rem;line-height:1.5;width:100%;">
              <h4 class="font-accent" style="font-weight:600;margin-bottom:8px;color:#fca5a5;">⚠️ Clerk Authentication Blocked</h4>
              <p style="opacity:0.8;font-size:0.8rem;margin-bottom:6px;">The Clerk UI failed to load. Please check the following:</p>
              <ul style="margin:4px 0 0 18px;opacity:0.8;font-size:0.78rem;list-style-type:disc;">
                <li><strong>Disable Ad Blockers</strong> / Brave Shields for <code>localhost</code> (they block Clerk accounts.dev connections by default).</li>
                <li>Verify you have a working internet connection.</li>
                <li>Make sure to <strong>hard refresh</strong> the page (Ctrl + F5).</li>
              </ul>
            </div>`;
        }
      });
    }
  }
}

// ─── Data collection ────────────────────────────────────────────────────────────

function collect() {
  const g  = id => document.getElementById(id)?.value?.trim() || '';
  const gr = id => document.getElementById(id)?.value || '';

  if (currentStep === 1) {
    if (g('ob-name')) od.displayName = g('ob-name');
    if (gr('ob-dob')) od.birthDate   = gr('ob-dob');
  }
  if (currentStep === 3) {
    if (g('ob-degree'))   od.degreeTitle   = g('ob-degree');
    if (g('ob-inst'))     od.institution   = g('ob-inst');
    if (gr('ob-grad'))    od.graduationYear = gr('ob-grad');
    if (g('ob-jobtitle')) od.jobTitle      = g('ob-jobtitle');
    if (g('ob-company'))  od.company       = g('ob-company');
    if (g('ob-other'))    od.otherDescription = g('ob-other');
  }
  if (currentStep === 4) {
    if (gr('ob-budget')) od.monthlyBudget    = gr('ob-budget');
    if (g('ob-goal'))    od.primaryGoal      = g('ob-goal');
    if (gr('ob-hours'))  od.weeklyStudyHours = gr('ob-hours');
  }
}

// ─── Navigation ────────────────────────────────────────────────────────────────

function handleBack() {
  if (currentStep <= 1) return;
  collect();
  // Skip step 3 if situation is empty (shouldn't happen but guard)
  currentStep--;
  if (currentStep === 3 && !od.situation) currentStep--;
  renderStep(currentStep);
}

function handleNext(onComplete) {
  collect();

  // Step 2: if no situation selected, auto-select 'other' so step 3 shows something
  if (currentStep === 2 && !od.situation) {
    od.situation = 'other';
    document.querySelectorAll('.ob-situation-card').forEach(c => {
      c.classList.toggle('selected', c.dataset.situation === 'other');
    });
  }

  if (currentStep === TOTAL_STEPS) {
    // User clicked "Launch Dashboard" — complete in local mode
    completeOnboarding(null);
    return;
  }

  currentStep++;
  renderStep(currentStep);
}

// ─── Completion ────────────────────────────────────────────────────────────────

let _onComplete = null;

export function renderOnboarding(container, onComplete) {
  _onComplete = onComplete;
  currentStep = 1;
  od = freshData();

  container.innerHTML = `
    <div class="ob-overlay" id="ob-overlay">
      <div class="ob-particles" id="ob-particles"></div>
      <div class="ob-card" id="ob-card">
        <div class="ob-progress-row">
          <div class="ob-progress-track">
            <div class="ob-progress-fill" id="ob-progress-fill" style="width:${(1/TOTAL_STEPS)*100}%"></div>
          </div>
          <div class="ob-dots" id="ob-dots">
            ${Array.from({length:TOTAL_STEPS},(_,i)=>`<div class="ob-dot ${i===0?'active':''}" id="ob-dot-${i+1}"></div>`).join('')}
          </div>
        </div>
        <div class="ob-content" id="ob-content"></div>
        <div class="ob-footer">
          <button type="button" class="btn btn-secondary" id="ob-back" style="visibility:hidden">← Back</button>
          <span class="ob-step-lbl font-accent" id="ob-step-lbl">Step 1 of ${TOTAL_STEPS}</span>
          <button type="button" class="btn btn-primary" id="ob-next">Next →</button>
        </div>
      </div>
    </div>`;

  spawnParticles();
  renderStep(1);

  document.getElementById('ob-back').onclick = handleBack;
  document.getElementById('ob-next').onclick  = () => handleNext(_onComplete);
}

async function completeOnboarding(clerkUser) {
  collect();

  if (clerkUser) {
    // Try to fetch existing profile from Supabase first
    try {
      const { data, error } = await fetchProfile(clerkUser.id);
      if (data && !error) {
        // User already has a profile! Restore it to local state instead of overwriting
        stateManager.state.userProfile = {
          displayName:         data.display_name || clerkUser.fullName || 'User',
          avatarEmoji:         data.avatar_emoji || '⚡',
          birthDate:           data.birthday,
          situation:           data.situation,
          institution:         data.institution,
          yearOfStudy:         data.year_of_study ? String(data.year_of_study) : '1',
          degreeTitle:         data.degree_title,
          graduationYear:      data.graduation_year ? String(data.graduation_year) : String(new Date().getFullYear() + 3),
          jobTitle:            data.job_title,
          company:             data.company,
          industry:            data.industry,
          weeklyStudyHoursGoal: data.weekly_hours || 20,
          currencySymbol:      data.currency || '₹',
          primaryGoal:         data.primary_goal,
          clerkUserId:         clerkUser.id,
          supabaseUserId:      data.id,
        };
        if (data.birthday) stateManager.state.birthDate = data.birthday;
        if (data.currency) stateManager.state.currencySymbol = data.currency;
        if (data.monthly_budget) stateManager.state.monthlyBudget = data.monthly_budget;
        if (data.degree_title) stateManager.updateDegreeTitle(data.degree_title);
        
        stateManager.save();
        markOnboardingComplete();
        finishOnboardingAnimate();
        return;
      }
    } catch (err) {
      console.warn('[Onboarding] Error checking existing profile:', err);
    }
  }

  // Otherwise, apply newly collected onboarding data
  applyToState();
  markOnboardingComplete();

  if (clerkUser) {
    // Background sync to Supabase (non-blocking)
    syncProfileToSupabase(od).catch(console.warn);
  }

  finishOnboardingAnimate();
}

function finishOnboardingAnimate() {
  const card = document.getElementById('ob-card');
  if (card) {
    card.style.transition = 'all 0.5s cubic-bezier(.4,0,.2,1)';
    card.style.opacity    = '0';
    card.style.transform  = 'scale(.95) translateY(-16px)';
  }
  const overlay = document.getElementById('ob-overlay');
  if (overlay) {
    overlay.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => { if (_onComplete) _onComplete(od); }, 300);
    }, 350);
  } else {
    if (_onComplete) _onComplete(od);
  }
}

// ─── Apply to local state ──────────────────────────────────────────────────────

function applyToState() {
  if (od.birthDate) stateManager.updateProfile(od.birthDate, 80); // lifespan default
  stateManager.updateCurrency(od.currencySymbol);
  if (od.monthlyBudget) stateManager.updateBudget(parseFloat(od.monthlyBudget) || 0);
  if (od.degreeTitle)   stateManager.updateDegreeTitle(od.degreeTitle);
  if (od.primaryGoal)   stateManager.addGoal(od.primaryGoal, 'career');

  stateManager.state.userProfile = {
    displayName:         od.displayName || 'User',
    avatarEmoji:         od.avatarEmoji,
    birthDate:           od.birthDate,
    situation:           od.situation,
    institution:         od.institution,
    yearOfStudy:         od.yearOfStudy,
    degreeTitle:         od.degreeTitle,
    graduationYear:      od.graduationYear,
    jobTitle:            od.jobTitle,
    company:             od.company,
    industry:            od.industry,
    weeklyStudyHoursGoal: parseInt(od.weeklyStudyHours) || 20,
    currencySymbol:      od.currencySymbol,
    primaryGoal:         od.primaryGoal,
    onboardedAt:         new Date().toISOString(),
    clerkUserId:         od.clerkUserId,
    supabaseUserId:      null,
  };

  stateManager.save();
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function spawnParticles() {
  const box = document.getElementById('ob-particles');
  if (!box) return;
  for (let i = 0; i < 45; i++) {
    const d = document.createElement('div');
    d.className = 'ob-particle';
    const sz = Math.random() * 3 + 1;
    d.style.cssText = `width:${sz}px;height:${sz}px;top:${Math.random()*100}%;left:${Math.random()*100}%;animation-duration:${Math.random()*14+7}s;animation-delay:${Math.random()*6}s;opacity:${(Math.random()*.4+.1).toFixed(2)};`;
    box.appendChild(d);
  }
}

function calcAge(dateStr) {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth)) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
